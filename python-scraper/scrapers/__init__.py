"""
Scraper modules for basketball shooter data
"""

from .nba_scraper import scrape_nba_players, get_top_shooters
from .basketball_reference_scraper import scrape_basketball_reference, get_historical_shooters
from .image_scraper import (
    download_player_images,
    batch_download_images,
    get_nba_headshot,
    search_youtube_shooting_videos,
    deduplicate_images,
)
from .video_frame_extractor import (
    download_and_extract_frames,
    extract_video_frames,
    search_youtube_videos,
    download_youtube_video,
    cleanup_temp_videos,
)

__all__ = [
    # Player data scrapers
    "scrape_nba_players",
    "get_top_shooters",
    "scrape_basketball_reference",
    "get_historical_shooters",
    # Image scrapers
    "download_player_images",
    "batch_download_images",
    "get_nba_headshot",
    "search_youtube_shooting_videos",
    "deduplicate_images",
    # Video frame extraction
    "download_and_extract_frames",
    "extract_video_frames",
    "search_youtube_videos",
    "download_youtube_video",
    "cleanup_temp_videos",
]







