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
SCRAPE_DELAY_SECONDS = 2  # Delay between requests (be respectful)
MAX_RETRIES = 3
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Headers for requests
REQUEST_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
}

# NBA Stats API (official, more reliable than scraping)
NBA_STATS_API_BASE = "https://stats.nba.com/stats"
NBA_STATS_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Origin": "https://www.nba.com",
    "Referer": "https://www.nba.com/",
    "Connection": "keep-alive",
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


