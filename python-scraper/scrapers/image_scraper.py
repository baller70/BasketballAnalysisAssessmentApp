"""
Image Scraper and Organizer
Downloads and organizes shooter images from various sources
"""

import os
import re
import requests
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
from loguru import logger
from ratelimit import limits, sleep_and_retry
import time
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import REQUEST_HEADERS, SCRAPE_DELAY_SECONDS, MAX_RETRIES

# Local storage directory (before upload to S3)
LOCAL_IMAGES_DIR = Path("downloaded_images")

# Image categories
IMAGE_CATEGORIES = {
    "form_front": "Front angle showing full body form",
    "form_side": "Side angle showing shooting motion",
    "release_point": "Ball at release point",
    "follow_through": "Follow-through after release",
}

# Shooting phases
SHOOTING_PHASES = {
    "setup": "Initial stance before shot",
    "dip": "Ball dip/gather phase",
    "rise": "Rising up with ball",
    "release": "Ball leaving hands",
    "follow_through": "After ball release",
}

# Shooting angles
SHOOTING_ANGLES = {
    "front": "Front-facing view",
    "side": "Side profile view",
    "45_degree": "45-degree angle view",
    "back": "Back view",
}


@sleep_and_retry
@limits(calls=1, period=SCRAPE_DELAY_SECONDS)
def download_image(url: str, save_path: Path) -> bool:
    """
    Download an image from URL and save locally
    """
    for attempt in range(MAX_RETRIES):
        try:
            response = requests.get(url, headers=REQUEST_HEADERS, timeout=30, stream=True)
            response.raise_for_status()
            
            # Check if it's actually an image
            content_type = response.headers.get('content-type', '')
            if 'image' not in content_type:
                logger.warning(f"URL is not an image: {url}")
                return False
            
            # Create directory if needed
            save_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Save image
            with open(save_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            logger.info(f"Downloaded: {save_path.name}")
            return True
            
        except Exception as e:
            logger.warning(f"Attempt {attempt + 1} failed for {url}: {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(SCRAPE_DELAY_SECONDS * (attempt + 1))
    
    return False


def get_nba_headshot(player_id: int, player_name: str) -> Optional[str]:
    """
    Get NBA.com official headshot URL
    """
    # NBA CDN headshot URL pattern
    url = f"https://cdn.nba.com/headshots/nba/latest/1040x760/{player_id}.png"
    
    try:
        response = requests.head(url, headers=REQUEST_HEADERS, timeout=10)
        if response.status_code == 200:
            return url
    except:
        pass
    
    return None


def get_nba_action_shots(player_name: str) -> List[str]:
    """
    Search for NBA action shots of a player
    """
    # NBA.com photo gallery search
    search_name = player_name.lower().replace(" ", "-")
    urls = []
    
    # Try NBA.com player page
    try:
        player_page_url = f"https://www.nba.com/player/{search_name}"
        response = requests.get(player_page_url, headers=REQUEST_HEADERS, timeout=30)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'lxml')
            
            # Find image tags
            for img in soup.find_all('img'):
                src = img.get('src', '')
                if 'action' in src.lower() or 'shot' in src.lower():
                    urls.append(src)
    except Exception as e:
        logger.warning(f"Error fetching NBA action shots: {e}")
    
    return urls[:10]  # Limit to 10 images


def get_getty_images_urls(player_name: str, query: str = "shooting") -> List[str]:
    """
    Get image URLs from Getty Images (for reference - actual download may require API)
    Note: These are preview URLs, full resolution requires Getty API subscription
    """
    search_query = f"{player_name} basketball {query}"
    urls = []
    
    # This is a placeholder - Getty requires API access for actual downloads
    # For production, you'd use Getty Images API or license images properly
    
    logger.info(f"Getty Images search would use query: {search_query}")
    return urls


def get_youtube_thumbnail(video_id: str) -> str:
    """
    Get YouTube video thumbnail (high quality)
    """
    # YouTube thumbnail URL patterns
    # maxresdefault = 1920x1080
    # hqdefault = 480x360
    # mqdefault = 320x180
    
    return f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"


def search_youtube_shooting_videos(player_name: str) -> List[Dict]:
    """
    Search YouTube for shooting form videos
    Returns list of video info with thumbnails
    """
    videos = []
    search_query = f"{player_name} shooting form"
    
    # Note: For production, use YouTube Data API
    # This is a simplified approach using web scraping
    
    try:
        search_url = f"https://www.youtube.com/results?search_query={search_query.replace(' ', '+')}"
        response = requests.get(search_url, headers=REQUEST_HEADERS, timeout=30)
        
        if response.status_code == 200:
            # Extract video IDs from page (simplified)
            video_ids = re.findall(r'"videoId":"([^"]+)"', response.text)
            unique_ids = list(dict.fromkeys(video_ids))[:5]  # First 5 unique
            
            for vid_id in unique_ids:
                videos.append({
                    "video_id": vid_id,
                    "thumbnail_url": get_youtube_thumbnail(vid_id),
                    "source": "youtube",
                })
    
    except Exception as e:
        logger.warning(f"YouTube search error: {e}")
    
    return videos


def get_espn_player_image(player_name: str) -> Optional[str]:
    """
    Get player image from ESPN
    """
    search_name = player_name.lower().replace(" ", "-")
    
    try:
        # ESPN player search
        search_url = f"https://www.espn.com/nba/player/_/name/{search_name}"
        response = requests.get(search_url, headers=REQUEST_HEADERS, timeout=30)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'lxml')
            
            # Find player headshot
            img = soup.find('img', class_=re.compile(r'Image'))
            if img and img.get('src'):
                return img['src']
    
    except Exception as e:
        logger.warning(f"ESPN image fetch error: {e}")
    
    return None


def organize_image_path(
    player_name: str,
    skill_level: str = "professional",
    league: str = "nba",
    angle: str = "front",
    phase: str = "release",
    filename: str = None
) -> Path:
    """
    Generate organized file path for an image
    
    Structure: /professional-shooters/nba/stephen-curry/front-angle/release.jpg
    
    Args:
        player_name: Player name (e.g., "Stephen Curry")
        skill_level: "professional" or "amateur"
        league: "nba", "wnba", "college", etc.
        angle: "front", "side", or "45-degree"
        phase: "setup", "dip", "release", or "follow-through"
        filename: Optional custom filename (defaults to phase.jpg)
    """
    # Sanitize player name (stephen-curry)
    safe_name = re.sub(r'[^\w\s-]', '', player_name).strip().lower().replace(' ', '-')
    
    # Map skill level to folder name
    if skill_level.lower() in ['professional', 'pro']:
        skill_folder = "professional-shooters"
    else:
        skill_folder = "amateur-shooters"
    
    # Format angle folder name (front-angle, side-angle, 45-degree)
    angle_folder = f"{angle}-angle" if angle in ["front", "side"] else angle
    
    # Generate filename (default: phase.jpg)
    if not filename:
        filename = f"{phase}.jpg"
    
    # Build path: /professional-shooters/nba/stephen-curry/front-angle/release.jpg
    path = LOCAL_IMAGES_DIR / skill_folder / league.lower() / safe_name / angle_folder / filename
    
    return path


def download_player_images(
    player_name: str,
    player_id_nba: Optional[int] = None,
    skill_level: str = "professional",
    league: str = "nba",
    include_video_frames: bool = True
) -> List[Dict]:
    """
    Download all available images for a player
    
    Args:
        player_name: Player name
        player_id_nba: NBA player ID for headshot
        skill_level: professional/amateur
        league: nba/wnba/college
        include_video_frames: Whether to extract frames from YouTube videos
    
    Returns list of downloaded image info
    """
    logger.info(f"Downloading images for: {player_name}")
    downloaded = []
    
    # 1. NBA.com Headshot (if NBA player ID available)
    if player_id_nba:
        headshot_url = get_nba_headshot(player_id_nba, player_name)
        if headshot_url:
            save_path = organize_image_path(
                player_name, skill_level, league,
                angle="front", phase="headshot", filename="headshot.png"
            )
            if download_image(headshot_url, save_path):
                downloaded.append({
                    "local_path": str(save_path),
                    "source_url": headshot_url,
                    "category": "headshot",
                    "angle": "front",
                    "phase": None,
                    "is_primary": True,
                })
    
    # 2. ESPN Image
    espn_url = get_espn_player_image(player_name)
    if espn_url:
        save_path = organize_image_path(
            player_name, skill_level, league,
            angle="front", phase="profile", filename="espn_profile.jpg"
        )
        if download_image(espn_url, save_path):
            downloaded.append({
                "local_path": str(save_path),
                "source_url": espn_url,
                "category": "profile",
                "angle": "front",
                "phase": None,
                "is_primary": False,
            })
    
    # 3. YouTube Thumbnails (shooting form videos)
    youtube_videos = search_youtube_shooting_videos(player_name)
    for i, video in enumerate(youtube_videos[:3]):  # Max 3 YouTube thumbnails
        save_path = organize_image_path(
            player_name, skill_level, league,
            angle="side", phase="shooting",
            filename=f"youtube_{video['video_id']}.jpg"
        )
        if download_image(video['thumbnail_url'], save_path):
            downloaded.append({
                "local_path": str(save_path),
                "source_url": video['thumbnail_url'],
                "category": "form_side",
                "angle": "side",
                "phase": "shooting",
                "is_primary": False,
                "video_id": video['video_id'],
            })
    
    # 4. NBA Action Shots
    action_urls = get_nba_action_shots(player_name)
    for i, url in enumerate(action_urls[:3]):  # Max 3 action shots
        save_path = organize_image_path(
            player_name, skill_level, league,
            angle="45_degree", phase="action",
            filename=f"action_{i+1}.jpg"
        )
        if download_image(url, save_path):
            downloaded.append({
                "local_path": str(save_path),
                "source_url": url,
                "category": "action",
                "angle": "45_degree",
                "phase": "action",
                "is_primary": False,
            })
    
    # 5. Video Frame Extraction (shooting form analysis)
    if include_video_frames:
        try:
            from .video_frame_extractor import download_and_extract_frames
            
            logger.info(f"Extracting video frames for {player_name}...")
            video_frames = download_and_extract_frames(
                player_name=player_name,
                max_videos=1,  # Limit to 1 video to save time
                frames_per_video=5
            )
            
            for frame in video_frames:
                downloaded.append({
                    "local_path": frame.get("local_path"),
                    "source_url": f"youtube:{frame.get('video_id', 'unknown')}",
                    "category": frame.get("category", "form_side"),
                    "angle": frame.get("angle", "side"),
                    "phase": frame.get("phase"),
                    "is_primary": frame.get("is_primary", False),
                    "video_id": frame.get("video_id"),
                    "resolution": frame.get("resolution"),
                    "source": "video_frame",
                })
            
            logger.info(f"Extracted {len(video_frames)} video frames")
            
        except ImportError:
            logger.warning("Video frame extractor not available")
        except Exception as e:
            logger.warning(f"Video frame extraction failed: {e}")
    
    logger.info(f"Downloaded {len(downloaded)} total images for {player_name}")
    return downloaded


def batch_download_images(
    players: List[Dict],
    max_per_player: int = 10
) -> Dict[str, List[Dict]]:
    """
    Download images for multiple players
    
    Args:
        players: List of player dicts with 'name', 'player_id_nba', 'skill_level', 'league'
        max_per_player: Maximum images per player
        
    Returns:
        Dict mapping player name to list of downloaded images
    """
    all_downloads = {}
    
    for i, player in enumerate(players):
        logger.info(f"Processing player {i+1}/{len(players)}: {player.get('name')}")
        
        try:
            images = download_player_images(
                player_name=player.get('name', ''),
                player_id_nba=player.get('player_id_nba'),
                skill_level=player.get('skill_level', 'professional'),
                league=player.get('league', 'nba'),
            )
            
            # Limit images per player
            all_downloads[player['name']] = images[:max_per_player]
            
        except Exception as e:
            logger.error(f"Error downloading images for {player.get('name')}: {e}")
            all_downloads[player.get('name', 'unknown')] = []
        
        # Rate limiting between players
        time.sleep(SCRAPE_DELAY_SECONDS)
    
    # Summary
    total_images = sum(len(imgs) for imgs in all_downloads.values())
    logger.info(f"Downloaded {total_images} total images for {len(players)} players")
    
    return all_downloads


def get_image_hash(image_path: Path) -> str:
    """
    Calculate hash of image for deduplication
    """
    with open(image_path, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()


def deduplicate_images(image_dir: Path) -> int:
    """
    Remove duplicate images based on hash
    """
    hashes = {}
    removed = 0
    
    for img_path in image_dir.rglob('*.jpg'):
        img_hash = get_image_hash(img_path)
        
        if img_hash in hashes:
            # Duplicate found, remove it
            img_path.unlink()
            removed += 1
            logger.debug(f"Removed duplicate: {img_path}")
        else:
            hashes[img_hash] = img_path
    
    for img_path in image_dir.rglob('*.png'):
        img_hash = get_image_hash(img_path)
        
        if img_hash in hashes:
            img_path.unlink()
            removed += 1
        else:
            hashes[img_hash] = img_path
    
    logger.info(f"Removed {removed} duplicate images")
    return removed


if __name__ == "__main__":
    # Test image download for a single player
    from loguru import logger
    logger.add("image_scraper.log", rotation="10 MB")
    
    test_player = {
        "name": "Stephen Curry",
        "player_id_nba": 201939,
        "skill_level": "professional",
        "league": "nba",
    }
    
    images = download_player_images(**test_player)
    
    print(f"\nDownloaded {len(images)} images:")
    for img in images:
        print(f"  - {img['local_path']}")







