"""
Basketball-Reference.com Scraper - Historical Player Data
Great for historical shooters and detailed career stats
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime
import time
import re
from loguru import logger
from ratelimit import limits, sleep_and_retry
import sys
import os

# Set Playwright browser path before any other imports
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = os.path.expanduser('~/.cache/ms-playwright')

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import REQUEST_HEADERS, SCRAPE_DELAY_SECONDS, MAX_RETRIES
from utils import AntiDetectionScraper


BASE_URL = "https://www.basketball-reference.com"

# Create a session for persistent connections with cookies
session = requests.Session()
session.headers.update(REQUEST_HEADERS)

# Initialize anti-detection scraper with browser automation support
anti_detection_scraper = AntiDetectionScraper(
    rotate_user_agents=True,
    min_delay=SCRAPE_DELAY_SECONDS,
    max_delay=SCRAPE_DELAY_SECONDS + 2,
    max_retries=MAX_RETRIES,
    use_browser=True,  # Enable Playwright browser automation to bypass 403 errors
    headless=True,  # Run in headless mode for better performance
)


@sleep_and_retry
@limits(calls=1, period=SCRAPE_DELAY_SECONDS)
def fetch_page(url: str, use_anti_detection: bool = False) -> BeautifulSoup:
    """
    Fetch and parse a page with rate limiting and improved error handling
    
    Args:
        url: URL to fetch
        use_anti_detection: Use anti-detection scraper (fallback for blocked requests)
    
    Returns:
        BeautifulSoup object
    """
    # If explicitly requested to use anti-detection, use it directly
    if use_anti_detection:
        try:
            logger.info(f"Using anti-detection scraper for {url}")
            soup = anti_detection_scraper.get_soup(url, fallback_to_browser=True)
            return soup
        except Exception as e:
            logger.error(f"Anti-detection scraper failed for {url}: {e}")
            raise
    
    # Try normal session-based approach first
    for attempt in range(MAX_RETRIES):
        try:
            # Use session for persistent connections and cookie management
            response = session.get(url, timeout=30)
            
            # Log the status code for debugging
            logger.info(f"Request to {url}: Status {response.status_code}")
            
            response.raise_for_status()
            return BeautifulSoup(response.content, "lxml")
            
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code if e.response else None
            logger.warning(f"Attempt {attempt + 1}/{MAX_RETRIES} failed with HTTP {status_code}: {e}")
            
            # For 403/429 errors, wait longer before retrying
            if status_code in [403, 429, 503]:
                wait_time = SCRAPE_DELAY_SECONDS * (attempt + 2) * 3
                logger.info(f"Server blocking/rate limit {status_code}, waiting {wait_time}s before retry...")
                time.sleep(wait_time)
                
                # On last attempt, try anti-detection scraper
                if attempt == MAX_RETRIES - 1:
                    logger.info("Normal requests failed, trying anti-detection scraper with browser")
                    try:
                        soup = anti_detection_scraper.get_soup(url, fallback_to_browser=True)
                        return soup
                    except Exception as e2:
                        logger.error(f"Anti-detection scraper also failed: {e2}")
                        raise e
            elif attempt < MAX_RETRIES - 1:
                time.sleep(SCRAPE_DELAY_SECONDS * (attempt + 1))
            else:
                logger.error(f"All retry attempts exhausted for {url}")
                # Last resort: try anti-detection
                try:
                    soup = anti_detection_scraper.get_soup(url, fallback_to_browser=True)
                    return soup
                except:
                    raise e
                
        except requests.exceptions.RequestException as e:
            logger.warning(f"Attempt {attempt + 1}/{MAX_RETRIES} failed: {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(SCRAPE_DELAY_SECONDS * (attempt + 1))
            else:
                logger.error(f"All retry attempts exhausted for {url}")
                # Last resort: try anti-detection
                try:
                    soup = anti_detection_scraper.get_soup(url, fallback_to_browser=True)
                    return soup
                except:
                    raise
    
    return None


def height_to_inches(height_str: str) -> int:
    """
    Convert height string (e.g., "6-3" or "6'3\"") to inches
    """
    try:
        # Handle "6-3" format
        if "-" in height_str:
            feet, inches = height_str.split("-")
            return int(feet) * 12 + int(inches)
        # Handle "6'3\"" format
        match = re.match(r"(\d+)'(\d+)\"?", height_str)
        if match:
            return int(match.group(1)) * 12 + int(match.group(2))
        return 0
    except:
        return 0


def get_all_time_3pt_leaders(limit: int = 100) -> pd.DataFrame:
    """
    Scrape all-time 3-point percentage leaders
    """
    logger.info("Fetching all-time 3PT% leaders from Basketball-Reference...")
    
    url = f"{BASE_URL}/leaders/fg3_pct_career.html"
    soup = fetch_page(url)
    
    if not soup:
        return pd.DataFrame()
    
    players = []
    table = soup.find("table", {"id": "nba"})
    
    if not table:
        logger.error("Could not find leaders table")
        return pd.DataFrame()
    
    rows = table.find("tbody").find_all("tr")[:limit]
    
    for row in rows:
        try:
            # Skip header rows
            if row.get("class") and "thead" in row.get("class", []):
                continue
            
            cols = row.find_all(["td", "th"])
            if len(cols) < 4:
                continue
            
            # Extract player link for more details
            player_link = cols[1].find("a")
            player_url = player_link["href"] if player_link else None
            
            player_data = {
                "rank": cols[0].text.strip().replace(".", ""),
                "name": cols[1].text.strip(),
                "career_3pt_percentage": float(cols[2].text.strip()) * 100 if cols[2].text.strip() else 0,
                "three_pt_made": int(cols[3].text.strip().replace(",", "")) if cols[3].text.strip() else 0,
                "player_url": f"{BASE_URL}{player_url}" if player_url else None,
            }
            
            players.append(player_data)
            
        except Exception as e:
            logger.warning(f"Error parsing row: {e}")
            continue
    
    df = pd.DataFrame(players)
    logger.info(f"Found {len(df)} 3PT% leaders")
    
    return df


def get_player_details(player_url: str) -> dict:
    """
    Get detailed player info from their profile page
    """
    logger.info(f"Fetching details from: {player_url}")
    
    soup = fetch_page(player_url)
    
    if not soup:
        return {}
    
    details = {}
    
    try:
        # Get meta info (height, weight, position)
        meta_div = soup.find("div", {"id": "meta"})
        
        if meta_div:
            # Find all paragraphs in meta
            paragraphs = meta_div.find_all("p")
            
            for p in paragraphs:
                text = p.get_text()
                
                # Position
                if "Position:" in text:
                    pos_match = re.search(r"Position:\s*(\w+)", text)
                    if pos_match:
                        details["position"] = pos_match.group(1)
                
                # Height & Weight
                height_match = re.search(r"(\d+-\d+)", text)
                if height_match:
                    details["height_inches"] = height_to_inches(height_match.group(1))
                
                weight_match = re.search(r"(\d+)lb", text)
                if weight_match:
                    details["weight_lbs"] = int(weight_match.group(1))
                
                # Shooting hand
                if "Shoots:" in text:
                    shoots_match = re.search(r"Shoots:\s*(\w+)", text)
                    if shoots_match:
                        details["dominant_hand"] = shoots_match.group(1)
        
        # Get career stats from footer
        footer = soup.find("div", {"id": "info"})
        if footer:
            # Find career totals
            career_row = soup.find("tfoot")
            if career_row:
                stats = career_row.find_all("td")
                # Parse stats (structure varies by page)
        
        # Get profile image
        img = soup.find("img", {"class": "poptip"})
        if img and img.get("src"):
            details["profile_image_url"] = img["src"]
        
    except Exception as e:
        logger.warning(f"Error parsing player details: {e}")
    
    return details


def get_historical_shooters(limit: int = 50) -> pd.DataFrame:
    """
    Get historical great shooters with detailed info
    """
    logger.info(f"Collecting {limit} historical shooters...")
    
    # Get 3PT leaders
    leaders_df = get_all_time_3pt_leaders(limit)
    
    if leaders_df.empty:
        return pd.DataFrame()
    
    shooters = []
    
    for idx, row in leaders_df.iterrows():
        logger.info(f"Processing {idx + 1}/{len(leaders_df)}: {row['name']}")
        
        shooter_data = {
            "name": row["name"],
            "career_3pt_percentage": row["career_3pt_percentage"],
            "era": "Historical",
            "skill_level": "Professional",
            "scraped_at": datetime.now().isoformat(),
        }
        
        # Get detailed info if URL available
        if row.get("player_url"):
            details = get_player_details(row["player_url"])
            shooter_data.update(details)
        
        shooters.append(shooter_data)
        
        # Rate limiting
        time.sleep(SCRAPE_DELAY_SECONDS)
    
    result_df = pd.DataFrame(shooters)
    logger.info(f"Successfully collected {len(result_df)} historical shooters")
    
    return result_df


def scrape_basketball_reference(limit: int = 50) -> pd.DataFrame:
    """
    Main function to scrape Basketball-Reference
    """
    logger.info("Starting Basketball-Reference scrape...")
    
    try:
        return get_historical_shooters(limit)
    except Exception as e:
        logger.error(f"Scraping failed: {e}")
        return pd.DataFrame()


if __name__ == "__main__":
    # Test the scraper
    logger.add("bbref_scraper.log", rotation="10 MB")
    
    df = scrape_basketball_reference(limit=5)  # Test with 5 players
    
    if not df.empty:
        print(df.head())
        df.to_csv("historical_shooters_test.csv", index=False)
        logger.info("Test data saved to historical_shooters_test.csv")
    else:
        logger.error("No data collected")


