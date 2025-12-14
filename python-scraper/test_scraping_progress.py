"""
Test Basketball Scraping with Enhanced Progress Monitoring
"""

import sys
from loguru import logger
from scrapers import scrape_nba_players, scrape_basketball_reference
from database import test_connection, get_all_shooters
import pandas as pd

# Configure logging
logger.remove()
logger.add(sys.stdout, level="INFO", 
          format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>")


def test_database_connection():
    """Test database connectivity"""
    logger.info("=" * 80)
    logger.info("TEST 1: Database Connection")
    logger.info("=" * 80)
    
    if test_connection():
        logger.info("✅ Database connection successful")
        
        # Check current shooters
        try:
            shooters = get_all_shooters()
            logger.info(f"✅ Current database has {len(shooters)} shooters")
            return True
        except Exception as e:
            logger.warning(f"⚠️  Could not fetch shooters: {e}")
            return True
    else:
        logger.error("❌ Database connection failed")
        return False


def test_nba_scraping():
    """Test NBA.com scraping with small limit"""
    logger.info("\n" + "=" * 80)
    logger.info("TEST 2: NBA.com Player Scraping (Limited to 20 players)")
    logger.info("=" * 80)
    
    try:
        logger.info("Starting NBA player scraping...")
        logger.info("This may take 1-2 minutes due to rate limiting...")
        
        df = scrape_nba_players(limit=20)
        
        if not df.empty:
            logger.info(f"✅ Successfully scraped {len(df)} NBA players")
            
            # Show sample data
            logger.info("\n📊 Sample of scraped players:")
            for idx, row in df.head(5).iterrows():
                logger.info(f"  {idx+1}. {row.get('full_name', 'Unknown')} - "
                          f"3PT%: {row.get('fg3_pct', 0):.1%}, "
                          f"FT%: {row.get('ft_pct', 0):.1%}")
            
            return True, df
        else:
            logger.warning("⚠️  No NBA data collected")
            return False, pd.DataFrame()
            
    except Exception as e:
        logger.error(f"❌ NBA scraping failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False, pd.DataFrame()


def test_basketball_reference_scraping():
    """Test Basketball-Reference scraping with small limit"""
    logger.info("\n" + "=" * 80)
    logger.info("TEST 3: Basketball-Reference Scraping (Limited to 10 players)")
    logger.info("=" * 80)
    
    try:
        logger.info("Starting Basketball-Reference scraping...")
        logger.info("This site has strong anti-bot protection, testing enhanced scraper...")
        
        df = scrape_basketball_reference(limit=10)
        
        if not df.empty:
            logger.info(f"✅ Successfully scraped {len(df)} historical players")
            
            # Show sample data
            logger.info("\n📊 Sample of scraped players:")
            for idx, row in df.head(5).iterrows():
                logger.info(f"  {idx+1}. {row.get('full_name', 'Unknown')} - "
                          f"3PT%: {row.get('fg3_pct', 0):.1%}")
            
            return True, df
        else:
            logger.warning("⚠️  No Basketball-Reference data collected")
            return False, pd.DataFrame()
            
    except Exception as e:
        logger.error(f"❌ Basketball-Reference scraping failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False, pd.DataFrame()


def main():
    """Run all tests"""
    logger.info("\n")
    logger.info("╔" + "=" * 78 + "╗")
    logger.info("║" + " " * 20 + "BASKETBALL SCRAPER TEST SUITE" + " " * 29 + "║")
    logger.info("╚" + "=" * 78 + "╝")
    logger.info("\n")
    
    results = {}
    
    # Test 1: Database
    results['database'] = test_database_connection()
    
    # Test 2: NBA Scraping
    if results['database']:
        results['nba'], nba_df = test_nba_scraping()
    else:
        logger.warning("Skipping NBA scraping due to database connection failure")
        results['nba'] = False
        nba_df = pd.DataFrame()
    
    # Test 3: Basketball-Reference Scraping
    results['bbref'], bbref_df = test_basketball_reference_scraping()
    
    # Summary
    logger.info("\n" + "=" * 80)
    logger.info("TEST SUMMARY")
    logger.info("=" * 80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        logger.info(f"{test_name.upper():.<50} {status}")
    
    # Data summary
    total_players = len(nba_df) + len(bbref_df)
    logger.info("=" * 80)
    logger.info(f"TOTAL PLAYERS SCRAPED: {total_players}")
    logger.info(f"  - NBA.com: {len(nba_df)}")
    logger.info(f"  - Basketball-Reference: {len(bbref_df)}")
    logger.info("=" * 80)
    
    if passed == total:
        logger.info("\n🎉 ALL TESTS PASSED! Scraper is working perfectly.")
    elif passed >= 2:
        logger.info(f"\n✅ {passed}/{total} tests passed. Some features working.")
    else:
        logger.info(f"\n⚠️  {passed}/{total} tests passed. Check errors above.")
    
    logger.info("\n")


if __name__ == "__main__":
    main()
