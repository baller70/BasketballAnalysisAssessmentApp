"""
Configuration for Basketball Shooter Scraping Pipeline
"""

import os
from dotenv import load_dotenv

# Load .env file but don't override existing environment variables
load_dotenv(override=False)

# Database Configuration (PostgreSQL on Abacus AI)
# Optional: Can deploy without DATABASE_URL (database operations will fail gracefully)
DATABASE_URL = os.getenv("DATABASE_URL", None)

# Debug: Log the DATABASE_URL status (mask password for security)
if DATABASE_URL:
    import re
    masked_url = re.sub(r'://([^:]+):([^@]+)@', r'://\1:****@', DATABASE_URL)
    print(f"[CONFIG] ✅ DATABASE_URL configured: {masked_url}")
else:
    print(f"[CONFIG] ⚠️  DATABASE_URL not configured (scraper will deploy but database operations will fail)")

# Next.js API URL (Abacus AI deployment)
NEXTJS_API_URL = os.getenv("NEXTJS_API_URL", "http://localhost:3000/api")
API_SECRET_KEY = os.getenv("API_SECRET_KEY", "")  # For authenticating with Next.js API

# Scraping Configuration
SCRAPE_DELAY_SECONDS = 3  # Delay between requests (be respectful, increased from 2 to 3)
MAX_RETRIES = 4  # Increased from 3 to 4
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"

# Headers for requests - More realistic browser headers
REQUEST_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
}

# NBA Stats API (official, more reliable than scraping) - Enhanced headers
NBA_STATS_API_BASE = "https://stats.nba.com/stats"
NBA_STATS_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Origin": "https://www.nba.com",
    "Referer": "https://www.nba.com/",
    "Connection": "keep-alive",
    "x-nba-stats-origin": "stats",
    "x-nba-stats-token": "true",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
}

# Target number of shooters to collect
TARGET_SHOOTERS = {
    "nba": 100,
    "wnba": 50,
    "historical": 50,
}

# Skill level mappings
SKILL_LEVELS = {
    "nba": "Professional",
    "wnba": "Professional",
    "college": "College",
    "high_school": "High School",
    "recreational": "Amateur",
}







