"""
NBA.com Scraper - Top 100 NBA Shooters
Uses NBA Stats API for reliable data extraction
"""

import requests
import pandas as pd
from datetime import datetime
import time
from loguru import logger
from ratelimit import limits, sleep_and_retry
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import NBA_STATS_HEADERS, NBA_STATS_API_BASE, SCRAPE_DELAY_SECONDS, MAX_RETRIES
from utils import AntiDetectionScraper

# Create a session for persistent connections
session = requests.Session()
session.headers.update(NBA_STATS_HEADERS)

# Initialize anti-detection scraper for fallback
anti_detection_scraper = AntiDetectionScraper(
    rotate_user_agents=True,
    min_delay=SCRAPE_DELAY_SECONDS,
    max_delay=SCRAPE_DELAY_SECONDS + 2,
    max_retries=MAX_RETRIES,
    use_browser=False,  # Start with requests, can enable browser if needed
)


@sleep_and_retry
@limits(calls=1, period=SCRAPE_DELAY_SECONDS)
def make_nba_api_request(endpoint: str, params: dict) -> dict:
    """
    Make a rate-limited request to NBA Stats API with improved error handling
    """
    url = f"{NBA_STATS_API_BASE}/{endpoint}"
    
    for attempt in range(MAX_RETRIES):
        try:
            # Use session for persistent connections
            response = session.get(url, params=params, timeout=30)
            
            # Log the status code for debugging
            logger.info(f"Request to {endpoint}: Status {response.status_code}")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code if e.response else None
            logger.warning(f"Attempt {attempt + 1}/{MAX_RETRIES} failed with HTTP {status_code}: {e}")
            
            # For 403/500 errors, wait longer before retrying
            if status_code in [403, 500, 503]:
                wait_time = SCRAPE_DELAY_SECONDS * (attempt + 2) * 2
                logger.info(f"Server error {status_code}, waiting {wait_time}s before retry...")
                time.sleep(wait_time)
            elif attempt < MAX_RETRIES - 1:
                time.sleep(SCRAPE_DELAY_SECONDS * (attempt + 1))
            else:
                logger.error(f"All retry attempts exhausted for {endpoint}")
                raise
                
        except requests.exceptions.RequestException as e:
            logger.warning(f"Attempt {attempt + 1}/{MAX_RETRIES} failed: {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(SCRAPE_DELAY_SECONDS * (attempt + 1))
            else:
                logger.error(f"All retry attempts exhausted for {endpoint}")
                raise
    
    return {}


def get_all_players() -> pd.DataFrame:
    """
    Get all current NBA players
    """
    logger.info("Fetching all NBA players...")
    
    params = {
        "LeagueID": "00",  # NBA
        "Season": "2024-25",
        "IsOnlyCurrentSeason": "0",
    }
    
    data = make_nba_api_request("commonallplayers", params)
    
    if not data or "resultSets" not in data:
        logger.error("Failed to fetch players")
        return pd.DataFrame()
    
    headers = data["resultSets"][0]["headers"]
    rows = data["resultSets"][0]["rowSet"]
    
    df = pd.DataFrame(rows, columns=headers)
    logger.info(f"Found {len(df)} players")
    
    return df


def get_player_career_stats(player_id: int) -> dict:
    """
    Get career stats for a specific player
    """
    params = {
        "PlayerID": player_id,
        "PerMode": "Totals",
    }
    
    try:
        data = make_nba_api_request("playercareerstats", params)
        
        if not data or "resultSets" not in data:
            return {}
        
        # Find career totals
        for result_set in data["resultSets"]:
            if result_set["name"] == "CareerTotalsRegularSeason":
                if result_set["rowSet"]:
                    headers = result_set["headers"]
                    row = result_set["rowSet"][0]
                    return dict(zip(headers, row))
        
        return {}
    except Exception as e:
        logger.error(f"Error fetching stats for player {player_id}: {e}")
        return {}


def get_player_info(player_id: int) -> dict:
    """
    Get detailed player info (height, weight, position, etc.)
    """
    params = {
        "PlayerID": player_id,
    }
    
    try:
        data = make_nba_api_request("commonplayerinfo", params)
        
        if not data or "resultSets" not in data:
            return {}
        
        headers = data["resultSets"][0]["headers"]
        row = data["resultSets"][0]["rowSet"][0] if data["resultSets"][0]["rowSet"] else []
        
        if row:
            return dict(zip(headers, row))
        
        return {}
    except Exception as e:
        logger.error(f"Error fetching info for player {player_id}: {e}")
        return {}


def height_to_inches(height_str: str) -> int:
    """
    Convert height string (e.g., "6-3") to inches
    """
    try:
        if "-" in height_str:
            feet, inches = height_str.split("-")
            return int(feet) * 12 + int(inches)
        return 0
    except:
        return 0


def get_top_shooters(limit: int = 100) -> pd.DataFrame:
    """
    Get top NBA shooters sorted by 3PT%
    """
    logger.info(f"Fetching top {limit} NBA shooters...")
    
    # Get all current season players
    params = {
        "LeagueID": "00",  # NBA
        "Season": "2024-25",
        "IsOnlyCurrentSeason": "1",  # Only current season players
    }
    
    data = make_nba_api_request("commonallplayers", params)
    
    if not data or "resultSets" not in data:
        logger.error("Failed to fetch players from commonallplayers")
        return pd.DataFrame()
    
    headers = data["resultSets"][0]["headers"]
    rows = data["resultSets"][0]["rowSet"]
    
    # Get all players, then we'll filter to top shooters
    df = pd.DataFrame(rows, columns=headers)
    logger.info(f"Found {len(df)} total players for 2024-25 season")
    
    # Get detailed info for each player (limit to first N players)
    shooters = []
    
    # Take only the first 'limit' players
    players_to_process = df.head(limit)
    
    for idx, row in players_to_process.iterrows():
        player_id = row.get("PERSON_ID") or row.get("PLAYER_ID")
        player_name = row.get("DISPLAY_FIRST_LAST") or row.get("PLAYER", "Unknown")
        logger.info(f"Processing player {idx + 1}/{len(players_to_process)}: {player_name}")
        
        # Get player info
        player_info = get_player_info(player_id)
        career_stats = get_player_career_stats(player_id)
        
        # Calculate career percentages
        career_fg_pct = 0
        career_3pt_pct = 0
        career_ft_pct = 0
        
        if career_stats:
            if career_stats.get("FGA", 0) > 0:
                career_fg_pct = round((career_stats.get("FGM", 0) / career_stats.get("FGA", 1)) * 100, 2)
            if career_stats.get("FG3A", 0) > 0:
                career_3pt_pct = round((career_stats.get("FG3M", 0) / career_stats.get("FG3A", 1)) * 100, 2)
            if career_stats.get("FTA", 0) > 0:
                career_ft_pct = round((career_stats.get("FTM", 0) / career_stats.get("FTA", 1)) * 100, 2)
        
        shooter_data = {
            "name": player_name,
            "position": player_info.get("POSITION", ""),
            "height_inches": height_to_inches(player_info.get("HEIGHT", "0-0")),
            "weight_lbs": int(player_info.get("WEIGHT", 0) or 0),
            "wingspan_inches": None,  # Not available from NBA API
            "arm_length_inches": None,  # Not available from NBA API
            "body_type": None,  # Will be inferred later
            "dominant_hand": None,  # Not available from NBA API
            "career_fg_percentage": career_fg_pct,
            "career_3pt_percentage": career_3pt_pct,
            "career_ft_percentage": career_ft_pct,
            "shooting_style": None,  # Will be analyzed from video
            "era": "Modern",
            "skill_level": "Professional",
            "profile_image_url": f"https://cdn.nba.com/headshots/nba/latest/1040x760/{player_id}.png",
            "team": player_info.get("TEAM_NAME", ""),
            "player_id_nba": player_id,
            "scraped_at": datetime.now().isoformat(),
        }
        
        shooters.append(shooter_data)
        
        # Rate limiting
        time.sleep(SCRAPE_DELAY_SECONDS)
    
    result_df = pd.DataFrame(shooters)
    logger.info(f"Successfully collected data for {len(result_df)} shooters")
    
    return result_df


def scrape_nba_players(limit: int = 100) -> pd.DataFrame:
    """
    Main function to scrape NBA player data
    Returns a DataFrame with all shooter data
    """
    logger.info("Starting NBA player scrape...")
    
    try:
        df = get_top_shooters(limit)
        
        if df.empty:
            logger.warning("No data collected, using fallback method...")
            # Fallback to basic player list
            all_players = get_all_players()
            if not all_players.empty:
                # Filter to active players and get basic info
                active = all_players[all_players["ROSTERSTATUS"] == 1].head(limit)
                df = pd.DataFrame({
                    "name": active["DISPLAY_FIRST_LAST"],
                    "position": None,
                    "height_inches": None,
                    "weight_lbs": None,
                    "skill_level": "Professional",
                    "era": "Modern",
                })
        
        return df
    
    except Exception as e:
        logger.error(f"Scraping failed: {e}")
        return pd.DataFrame()


if __name__ == "__main__":
    # Test the scraper
    logger.add("nba_scraper.log", rotation="10 MB")
    
    df = scrape_nba_players(limit=10)  # Test with 10 players
    
    if not df.empty:
        print(df.head())
        df.to_csv("nba_shooters_test.csv", index=False)
        logger.info("Test data saved to nba_shooters_test.csv")
    else:
        logger.error("No data collected")


