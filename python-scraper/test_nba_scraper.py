#!/usr/bin/env python3
"""
Test script for NBA scraper with new endpoint
"""
import sys
import os

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scrapers.nba_scraper import get_all_players, scrape_nba_players
from loguru import logger

logger.info('='*60)
logger.info('Testing NBA Scraper with new commonallplayers endpoint')
logger.info('Season: 2024-25')
logger.info('='*60)

# Test 1: Get all players
logger.info('\n--- Test 1: Fetching all players ---')
df_all = get_all_players()

if not df_all.empty:
    print(f'\n✅ SUCCESS! Retrieved {len(df_all)} players from 2024-25 season')
    print(f'\nColumn names: {list(df_all.columns)}')
    print(f'\nFirst 10 players:')
    if 'DISPLAY_FIRST_LAST' in df_all.columns:
        print(df_all.head(10)[['DISPLAY_FIRST_LAST', 'PERSON_ID']].to_string())
    else:
        print(df_all.head(10).to_string())
    
    # Test 2: Get detailed shooter data (just 3 players for quick test)
    logger.info('\n--- Test 2: Getting detailed shooter data (3 players) ---')
    df_shooters = scrape_nba_players(limit=3)
    
    if not df_shooters.empty:
        print(f'\n✅ SUCCESS! Retrieved detailed data for {len(df_shooters)} shooters')
        print(f'\nShooter data:')
        print(df_shooters[['name', 'position', 'height_inches', 'weight_lbs', 'career_3pt_percentage']].to_string())
    else:
        print('❌ Failed to retrieve detailed shooter data')
else:
    print('❌ Failed to retrieve players from commonallplayers endpoint')
    print('This might indicate an API issue or rate limiting')

logger.info('\n' + '='*60)
logger.info('Test complete!')
logger.info('='*60)
