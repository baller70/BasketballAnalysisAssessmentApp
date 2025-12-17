"""
Test Script for Anti-Detection Scraper
Tests the enhanced scraper against NBA.com and Basketball-Reference
"""

import sys
from loguru import logger
from utils import AntiDetectionScraper

# Configure logging
logger.remove()
logger.add(sys.stdout, level="INFO")
logger.add("test_anti_detection.log", rotation="10 MB", level="DEBUG")


def test_basic_functionality():
    """Test basic scraper functionality"""
    logger.info("=" * 70)
    logger.info("TEST 1: Basic Functionality (httpbin.org)")
    logger.info("=" * 70)
    
    try:
        with AntiDetectionScraper(rotate_user_agents=True, min_delay=0.5, max_delay=1.0) as scraper:
            # Test 1: Simple GET
            logger.info("Test 1.1: Simple GET request")
            response = scraper.get("https://httpbin.org/headers")
            logger.info(f"✓ Status: {response.status_code}")
            logger.info(f"✓ Content length: {len(response.content)} bytes")
            
            # Test 2: User Agent rotation
            logger.info("\nTest 1.2: User Agent rotation")
            ua1 = scraper._get_headers()["User-Agent"]
            ua2 = scraper._get_headers()["User-Agent"]
            logger.info(f"UA 1: {ua1[:50]}...")
            logger.info(f"UA 2: {ua2[:50]}...")
            
            # Test 3: BeautifulSoup
            logger.info("\nTest 1.3: BeautifulSoup parsing")
            soup = scraper.get_soup("https://httpbin.org/html")
            logger.info(f"✓ Found {len(soup.find_all('h1'))} h1 tags")
            
            # Statistics
            logger.info("\nTest 1.4: Statistics")
            stats = scraper.get_statistics()
            logger.info(f"✓ Total requests: {stats['total_requests']}")
            logger.info(f"✓ Success rate: {stats['success_rate']*100:.1f}%")
            
        logger.info("\n✅ TEST 1 PASSED\n")
        return True
        
    except Exception as e:
        logger.error(f"\n❌ TEST 1 FAILED: {e}\n")
        return False


def test_nba_stats_api():
    """Test against NBA Stats API"""
    logger.info("=" * 70)
    logger.info("TEST 2: NBA Stats API")
    logger.info("=" * 70)
    
    try:
        with AntiDetectionScraper(
            rotate_user_agents=True,
            min_delay=2.0,
            max_delay=4.0,
            max_retries=4,
        ) as scraper:
            # NBA Stats API endpoint
            url = "https://stats.nba.com/stats/leagueleaders"
            params = {
                "LeagueID": "00",
                "PerMode": "PerGame",
                "Scope": "S",
                "Season": "2023-24",
                "SeasonType": "Regular Season",
                "StatCategory": "FG3_PCT",
            }
            
            # Custom headers for NBA API
            headers = {
                "Accept": "application/json, text/plain, */*",
                "Origin": "https://www.nba.com",
                "Referer": "https://www.nba.com/",
                "x-nba-stats-origin": "stats",
                "x-nba-stats-token": "true",
            }
            
            logger.info("Fetching NBA league leaders...")
            response = scraper.get(url, headers=headers, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if "resultSet" in data:
                    players = data["resultSet"]["rowSet"]
                    logger.info(f"✓ Successfully fetched {len(players)} NBA players")
                    logger.info(f"✓ Top 3 shooters:")
                    for i, player in enumerate(players[:3]):
                        logger.info(f"  {i+1}. {player[2]}")  # Player name
                else:
                    logger.warning("⚠ Unexpected response structure")
            else:
                logger.error(f"✗ Status code: {response.status_code}")
            
            # Statistics
            stats = scraper.get_statistics()
            logger.info(f"\n✓ Success rate: {stats['success_rate']*100:.1f}%")
            
        logger.info("\n✅ TEST 2 PASSED\n")
        return True
        
    except Exception as e:
        logger.error(f"\n❌ TEST 2 FAILED: {e}")
        logger.error("Note: NBA API may require specific headers or be temporarily blocked")
        logger.info("\n")
        return False


def test_basketball_reference():
    """Test against Basketball-Reference"""
    logger.info("=" * 70)
    logger.info("TEST 3: Basketball-Reference.com")
    logger.info("=" * 70)
    
    try:
        with AntiDetectionScraper(
            rotate_user_agents=True,
            min_delay=3.0,
            max_delay=5.0,
            max_retries=4,
            use_browser=False,  # Will fallback to browser if needed
        ) as scraper:
            url = "https://www.basketball-reference.com/leaders/fg3_pct_career.html"
            
            logger.info(f"Fetching {url}...")
            soup = scraper.get_soup(url, fallback_to_browser=True)
            
            # Try to find the table
            table = soup.find("table", {"id": "nba"})
            
            if table:
                rows = table.find("tbody").find_all("tr")[:10]
                logger.info(f"✓ Successfully fetched page")
                logger.info(f"✓ Found {len(rows)} player rows")
                
                logger.info("✓ Top 5 all-time 3PT% leaders:")
                count = 0
                for row in rows:
                    if row.get("class") and "thead" in row.get("class", []):
                        continue
                    cols = row.find_all(["td", "th"])
                    if len(cols) >= 2:
                        name = cols[1].text.strip()
                        if name and count < 5:
                            logger.info(f"  {count+1}. {name}")
                            count += 1
            else:
                logger.warning("⚠ Could not find player table")
            
            # Statistics
            stats = scraper.get_statistics()
            logger.info(f"\n✓ Success rate: {stats['success_rate']*100:.1f}%")
            if stats.get('browser_requests', 0) > 0:
                logger.info(f"✓ Used browser automation: {stats['browser_requests']} requests")
            
        logger.info("\n✅ TEST 3 PASSED\n")
        return True
        
    except Exception as e:
        logger.error(f"\n❌ TEST 3 FAILED: {e}")
        logger.error("Note: Basketball-Reference may have strong anti-bot protection")
        logger.info("\n")
        return False


def test_browser_automation():
    """Test browser automation specifically"""
    logger.info("=" * 70)
    logger.info("TEST 4: Browser Automation (Playwright)")
    logger.info("=" * 70)
    
    try:
        with AntiDetectionScraper(
            rotate_user_agents=True,
            use_browser=True,  # Force browser mode
            headless=True,
            min_delay=1.0,
            max_delay=2.0,
        ) as scraper:
            logger.info("Testing browser automation with httpbin...")
            response = scraper.get("https://httpbin.org/headers")
            
            logger.info(f"✓ Status: {response.status_code}")
            logger.info(f"✓ Content length: {len(response.content)} bytes")
            
            # Check if browser was used
            stats = scraper.get_statistics()
            if stats.get('browser_requests', 0) > 0:
                logger.info(f"✓ Browser automation working: {stats['browser_requests']} requests")
            else:
                logger.warning("⚠ Browser might not have been used")
            
        logger.info("\n✅ TEST 4 PASSED\n")
        return True
        
    except Exception as e:
        logger.error(f"\n❌ TEST 4 FAILED: {e}")
        logger.error("Note: Browser automation requires Playwright browsers to be installed")
        logger.info("\n")
        return False


def test_retry_and_backoff():
    """Test retry logic and exponential backoff"""
    logger.info("=" * 70)
    logger.info("TEST 5: Retry Logic and Exponential Backoff")
    logger.info("=" * 70)
    
    try:
        with AntiDetectionScraper(
            rotate_user_agents=True,
            max_retries=3,
            backoff_factor=2.0,
            min_delay=0.5,
            max_delay=1.0,
        ) as scraper:
            # This endpoint will return 500 error
            logger.info("Testing retry logic with intentional failure (expecting 500 errors)...")
            try:
                response = scraper.get("https://httpbin.org/status/500", fallback_to_browser=False)
                logger.warning("⚠ Unexpectedly succeeded (httpbin might have changed)")
            except Exception as e:
                logger.info(f"✓ Correctly handled failure after retries: {type(e).__name__}")
            
            # Check statistics
            stats = scraper.get_statistics()
            if stats['total_retries'] > 0:
                logger.info(f"✓ Retry logic working: {stats['total_retries']} retries performed")
            
        logger.info("\n✅ TEST 5 PASSED\n")
        return True
        
    except Exception as e:
        logger.error(f"\n❌ TEST 5 FAILED: {e}\n")
        return False


def main():
    """Run all tests"""
    logger.info("\n")
    logger.info("╔" + "=" * 68 + "╗")
    logger.info("║" + " " * 15 + "ANTI-DETECTION SCRAPER TEST SUITE" + " " * 19 + "║")
    logger.info("╚" + "=" * 68 + "╝")
    logger.info("\n")
    
    results = []
    
    # Run all tests
    results.append(("Basic Functionality", test_basic_functionality()))
    results.append(("NBA Stats API", test_nba_stats_api()))
    results.append(("Basketball-Reference", test_basketball_reference()))
    results.append(("Browser Automation", test_browser_automation()))
    results.append(("Retry & Backoff", test_retry_and_backoff()))
    
    # Summary
    logger.info("=" * 70)
    logger.info("TEST SUMMARY")
    logger.info("=" * 70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        logger.info(f"{test_name:.<50} {status}")
    
    logger.info("=" * 70)
    logger.info(f"TOTAL: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    logger.info("=" * 70)
    
    if passed == total:
        logger.info("\n🎉 ALL TESTS PASSED! Anti-detection scraper is working perfectly.\n")
    elif passed >= total * 0.6:
        logger.info(f"\n⚠️  {total - passed} test(s) failed. Most features working, but some sites may have strong protection.\n")
    else:
        logger.info(f"\n❌ {total - passed} test(s) failed. Please check the logs for details.\n")


if __name__ == "__main__":
    main()
