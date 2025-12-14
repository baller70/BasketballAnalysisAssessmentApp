#!/usr/bin/env python3
"""
Test script for Basketball-Reference scraper with Playwright browser automation
"""
import sys
import os

# Set Playwright browser path
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = os.path.expanduser('~/.cache/ms-playwright')

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scrapers.basketball_reference_scraper import scrape_basketball_reference, fetch_page
from loguru import logger

logger.info('='*60)
logger.info('Testing Basketball-Reference Scraper')
logger.info('Using: Playwright browser automation (headless)')
logger.info('='*60)

# Test 1: Fetch a simple page
logger.info('\n--- Test 1: Fetching player list page ---')
test_url = "https://www.basketball-reference.com/leagues/NBA_2024_per_game.html"

try:
    logger.info(f'Fetching: {test_url}')
    soup = fetch_page(test_url, use_anti_detection=True)
    
    if soup:
        print(f'\n✅ SUCCESS! Page fetched with browser automation')
        
        # Try to find the table
        table = soup.find('table', {'id': 'per_game_stats'})
        if table:
            print(f'✅ Found stats table')
            rows = table.find_all('tr')[1:6]  # Get first 5 players
            print(f'\nFirst 5 players:')
            for row in rows:
                cells = row.find_all(['th', 'td'])
                if len(cells) > 1:
                    player_name = cells[1].get_text(strip=True)
                    if player_name and player_name != 'Player':
                        print(f'  - {player_name}')
        else:
            print('⚠️  Stats table not found, but page was retrieved')
    else:
        print('❌ Failed to fetch page')
        
except Exception as e:
    print(f'❌ Error: {type(e).__name__}: {e}')
    import traceback
    traceback.print_exc()

# Test 2: Get historical shooters (just 2 for quick test)
logger.info('\n--- Test 2: Getting historical shooters (2 players) ---')

try:
    df_shooters = scrape_basketball_reference(limit=2)
    
    if not df_shooters.empty:
        print(f'\n✅ SUCCESS! Retrieved data for {len(df_shooters)} historical shooters')
        print(f'\nShooter data:')
        print(df_shooters[['name', 'position', 'height_inches', 'career_3pt_percentage']].to_string())
    else:
        print('❌ No shooter data retrieved')
except Exception as e:
    print(f'❌ Error in historical scraper: {type(e).__name__}: {e}')
    import traceback
    traceback.print_exc()

logger.info('\n' + '='*60)
logger.info('Test complete!')
logger.info('='*60)
