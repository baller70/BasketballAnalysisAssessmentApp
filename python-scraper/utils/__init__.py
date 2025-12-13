"""
Utility modules for the scraping pipeline
"""

from .data_cleaner import (
    clean_player_data,
    height_string_to_inches,
    validate_shooter_data,
    deduplicate_with_merge,
)

# Anti-detection modules
from .user_agent_rotator import UserAgentRotator
from .proxy_manager import ProxyManager, ProxyInfo
from .human_behavior import HumanBehavior
from .browser_automation import StealthBrowser, StealthBrowserSync
from .anti_detection_scraper import AntiDetectionScraper, scrape_url

__all__ = [
    # Data cleaning
    "clean_player_data",
    "height_string_to_inches",
    "validate_shooter_data",
    "deduplicate_with_merge",
    
    # Anti-detection components
    "UserAgentRotator",
    "ProxyManager",
    "ProxyInfo",
    "HumanBehavior",
    "StealthBrowser",
    "StealthBrowserSync",
    "AntiDetectionScraper",
    "scrape_url",
]


