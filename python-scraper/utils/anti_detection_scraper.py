"""
Advanced Anti-Detection Scraper
Combines all anti-detection techniques into a single, easy-to-use scraper class
"""

import asyncio
import time
from typing import Optional, Dict, List, Union
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from loguru import logger

from .user_agent_rotator import UserAgentRotator
from .proxy_manager import ProxyManager
from .human_behavior import HumanBehavior
from .browser_automation import StealthBrowser, StealthBrowserSync


class AntiDetectionScraper:
    """
    Production-grade scraper with advanced anti-detection capabilities
    """
    
    def __init__(
        self,
        # User agent settings
        rotate_user_agents: bool = True,
        use_fake_ua: bool = True,
        
        # Proxy settings
        proxies: Optional[List[str]] = None,
        rotate_proxies: bool = False,
        check_proxy_health: bool = True,
        
        # Human behavior settings
        min_delay: float = 1.0,
        max_delay: float = 5.0,
        enable_jitter: bool = True,
        
        # Session settings
        use_session: bool = True,
        persist_cookies: bool = True,
        
        # Browser automation settings
        use_browser: bool = False,
        headless: bool = True,
        
        # Retry settings
        max_retries: int = 3,
        backoff_factor: float = 2.0,
    ):
        """
        Initialize the anti-detection scraper
        
        Args:
            rotate_user_agents: Enable user agent rotation
            use_fake_ua: Use fake-useragent library for dynamic UAs
            proxies: List of proxy URLs
            rotate_proxies: Enable proxy rotation
            check_proxy_health: Check proxy health before use
            min_delay: Minimum delay between requests (seconds)
            max_delay: Maximum delay between requests (seconds)
            enable_jitter: Add random jitter to delays
            use_session: Use persistent session
            persist_cookies: Persist cookies across requests
            use_browser: Use browser automation (Playwright)
            headless: Run browser in headless mode
            max_retries: Maximum number of retry attempts
            backoff_factor: Exponential backoff factor
        """
        # Initialize components
        self.user_agent_rotator = UserAgentRotator(use_fake_ua=use_fake_ua) if rotate_user_agents else None
        self.proxy_manager = ProxyManager(proxies=proxies) if proxies and rotate_proxies else None
        self.human_behavior = HumanBehavior(min_delay=min_delay, max_delay=max_delay, enable_jitter=enable_jitter)
        
        # Settings
        self.rotate_user_agents = rotate_user_agents
        self.rotate_proxies = rotate_proxies and self.proxy_manager is not None
        self.check_proxy_health = check_proxy_health
        self.use_session = use_session
        self.persist_cookies = persist_cookies
        self.use_browser_automation = use_browser
        self.headless = headless
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        
        # Session management
        self.session = requests.Session() if use_session else None
        self.cookies_jar = {}
        
        # Browser (lazy initialization)
        self.browser: Optional[StealthBrowserSync] = None
        
        # Statistics
        self.stats = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "total_retries": 0,
            "browser_requests": 0,
            "direct_requests": 0,
        }
        
        logger.info(f"AntiDetectionScraper initialized: "
                   f"UA rotation={rotate_user_agents}, "
                   f"Proxy rotation={self.rotate_proxies}, "
                   f"Browser mode={'enabled' if use_browser else 'disabled'}")
    
    def _get_headers(self, custom_headers: Optional[Dict] = None) -> Dict:
        """
        Get request headers with user agent rotation
        
        Args:
            custom_headers: Custom headers to merge
        
        Returns:
            Headers dictionary
        """
        if self.rotate_user_agents and self.user_agent_rotator:
            # Get random browser profile
            profile = self.user_agent_rotator.get_browser_profile()
        else:
            # Use basic headers
            profile = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
            }
        
        # Merge with custom headers
        if custom_headers:
            profile.update(custom_headers)
        
        return profile
    
    def _get_proxy(self) -> Optional[Dict[str, str]]:
        """
        Get proxy for request
        
        Returns:
            Proxy dictionary or None
        """
        if not self.rotate_proxies or not self.proxy_manager:
            return None
        
        # Check proxy health if enabled
        if self.check_proxy_health:
            self.proxy_manager.check_all_proxies()
        
        return self.proxy_manager.get_random_proxy()
    
    def get(
        self,
        url: str,
        headers: Optional[Dict] = None,
        params: Optional[Dict] = None,
        timeout: int = 30,
        allow_redirects: bool = True,
        fallback_to_browser: bool = True,
    ) -> requests.Response:
        """
        Perform GET request with anti-detection features
        
        Args:
            url: URL to request
            headers: Custom headers
            params: Query parameters
            timeout: Request timeout
            allow_redirects: Follow redirects
            fallback_to_browser: Fallback to browser automation if request fails
        
        Returns:
            Response object
        """
        self.stats["total_requests"] += 1
        
        # Get headers and proxy
        request_headers = self._get_headers(headers)
        proxy = self._get_proxy()
        
        # Attempt with retries
        for attempt in range(self.max_retries):
            try:
                # Human-like delay before request
                if attempt > 0:
                    self.human_behavior.exponential_backoff(attempt, base_delay=self.backoff_factor)
                else:
                    self.human_behavior.random_delay()
                
                # Make request
                if self.use_session and self.session:
                    response = self.session.get(
                        url,
                        headers=request_headers,
                        params=params,
                        proxies=proxy,
                        timeout=timeout,
                        allow_redirects=allow_redirects,
                    )
                else:
                    response = requests.get(
                        url,
                        headers=request_headers,
                        params=params,
                        proxies=proxy,
                        timeout=timeout,
                        allow_redirects=allow_redirects,
                    )
                
                # Check response
                response.raise_for_status()
                
                # Success
                self.stats["successful_requests"] += 1
                self.stats["direct_requests"] += 1
                
                if proxy:
                    self.proxy_manager.report_success(proxy, response.elapsed.total_seconds())
                
                logger.info(f"GET {url}: {response.status_code} (attempt {attempt + 1})")
                
                # Store cookies
                if self.persist_cookies:
                    self.cookies_jar.update(response.cookies)
                
                return response
                
            except requests.exceptions.HTTPError as e:
                status_code = e.response.status_code if e.response else None
                logger.warning(f"GET {url}: HTTP {status_code} (attempt {attempt + 1}/{self.max_retries})")
                
                # Report proxy failure
                if proxy:
                    self.proxy_manager.report_failure(proxy)
                
                # Check if we should retry
                if status_code in [403, 429, 503] and attempt < self.max_retries - 1:
                    self.stats["total_retries"] += 1
                    
                    # Rotate user agent and proxy for next attempt
                    request_headers = self._get_headers(headers)
                    proxy = self._get_proxy()
                    continue
                
                # Last attempt failed - try browser if enabled
                if attempt == self.max_retries - 1 and fallback_to_browser:
                    logger.info("All direct attempts failed, falling back to browser automation")
                    return self._get_with_browser(url)
                
                raise
                
            except Exception as e:
                logger.error(f"GET {url}: {e} (attempt {attempt + 1}/{self.max_retries})")
                
                if proxy:
                    self.proxy_manager.report_failure(proxy)
                
                self.stats["total_retries"] += 1
                
                # Last attempt - try browser
                if attempt == self.max_retries - 1 and fallback_to_browser:
                    logger.info("All direct attempts failed, falling back to browser automation")
                    return self._get_with_browser(url)
                
                if attempt == self.max_retries - 1:
                    self.stats["failed_requests"] += 1
                    raise
    
    def _get_with_browser(self, url: str) -> requests.Response:
        """
        Fetch URL using browser automation
        
        Args:
            url: URL to fetch
        
        Returns:
            Response object (simulated from browser content)
        """
        try:
            # Initialize browser if not already done
            if not self.browser:
                proxy = self._get_proxy()
                self.browser = StealthBrowserSync(
                    headless=self.headless,
                    user_agent_rotator=self.user_agent_rotator,
                    human_behavior=self.human_behavior,
                    proxy=proxy,
                )
                self.browser.start()
            
            # Navigate to URL
            self.browser.goto(url)
            
            # Get content
            content = self.browser.get_content()
            
            # Create response object
            response = requests.Response()
            response.status_code = 200
            response._content = content.encode('utf-8')
            response.url = url
            response.headers = {"Content-Type": "text/html"}
            
            self.stats["successful_requests"] += 1
            self.stats["browser_requests"] += 1
            
            logger.info(f"Browser GET {url}: 200")
            
            return response
            
        except Exception as e:
            logger.error(f"Browser GET failed for {url}: {e}")
            self.stats["failed_requests"] += 1
            raise
    
    def post(
        self,
        url: str,
        data: Optional[Dict] = None,
        json: Optional[Dict] = None,
        headers: Optional[Dict] = None,
        timeout: int = 30,
    ) -> requests.Response:
        """
        Perform POST request with anti-detection features
        
        Args:
            url: URL to request
            data: Form data
            json: JSON data
            headers: Custom headers
            timeout: Request timeout
        
        Returns:
            Response object
        """
        self.stats["total_requests"] += 1
        
        # Get headers and proxy
        request_headers = self._get_headers(headers)
        proxy = self._get_proxy()
        
        # Attempt with retries
        for attempt in range(self.max_retries):
            try:
                # Human-like delay
                if attempt > 0:
                    self.human_behavior.exponential_backoff(attempt, base_delay=self.backoff_factor)
                else:
                    self.human_behavior.random_delay()
                
                # Make request
                if self.use_session and self.session:
                    response = self.session.post(
                        url,
                        data=data,
                        json=json,
                        headers=request_headers,
                        proxies=proxy,
                        timeout=timeout,
                    )
                else:
                    response = requests.post(
                        url,
                        data=data,
                        json=json,
                        headers=request_headers,
                        proxies=proxy,
                        timeout=timeout,
                    )
                
                response.raise_for_status()
                
                self.stats["successful_requests"] += 1
                self.stats["direct_requests"] += 1
                
                if proxy:
                    self.proxy_manager.report_success(proxy, response.elapsed.total_seconds())
                
                logger.info(f"POST {url}: {response.status_code}")
                
                return response
                
            except Exception as e:
                logger.error(f"POST {url}: {e} (attempt {attempt + 1}/{self.max_retries})")
                
                if proxy:
                    self.proxy_manager.report_failure(proxy)
                
                self.stats["total_retries"] += 1
                
                if attempt == self.max_retries - 1:
                    self.stats["failed_requests"] += 1
                    raise
    
    def get_soup(self, url: str, **kwargs) -> BeautifulSoup:
        """
        Get BeautifulSoup object for URL
        
        Args:
            url: URL to fetch
            **kwargs: Additional arguments for get()
        
        Returns:
            BeautifulSoup object
        """
        response = self.get(url, **kwargs)
        return BeautifulSoup(response.content, 'lxml')
    
    def download_file(self, url: str, filepath: str, chunk_size: int = 8192):
        """
        Download file with progress
        
        Args:
            url: URL to download
            filepath: Path to save file
            chunk_size: Chunk size for streaming
        """
        response = self.get(url, timeout=60)
        
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
        
        logger.info(f"Downloaded file to: {filepath}")
    
    def get_statistics(self) -> Dict:
        """
        Get scraping statistics
        
        Returns:
            Dictionary with statistics
        """
        stats = self.stats.copy()
        
        # Add success rate
        if stats["total_requests"] > 0:
            stats["success_rate"] = stats["successful_requests"] / stats["total_requests"]
        else:
            stats["success_rate"] = 0.0
        
        # Add proxy stats if available
        if self.proxy_manager:
            stats["proxy_stats"] = self.proxy_manager.get_statistics()
        
        # Add human behavior stats
        stats["behavior_stats"] = self.human_behavior.get_session_metrics()
        
        return stats
    
    def close(self):
        """
        Close scraper and cleanup resources
        """
        # Close session
        if self.session:
            self.session.close()
        
        # Close browser
        if self.browser:
            self.browser.close()
            self.browser = None
        
        logger.info("AntiDetectionScraper closed")
    
    def __enter__(self):
        """Context manager entry"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.close()


# Convenience function for quick scraping
def scrape_url(
    url: str,
    use_browser: bool = False,
    rotate_user_agents: bool = True,
    proxies: Optional[List[str]] = None,
    **kwargs
) -> str:
    """
    Quick scrape a URL and return HTML content
    
    Args:
        url: URL to scrape
        use_browser: Use browser automation
        rotate_user_agents: Rotate user agents
        proxies: List of proxies
        **kwargs: Additional arguments for AntiDetectionScraper
    
    Returns:
        HTML content as string
    """
    with AntiDetectionScraper(
        rotate_user_agents=rotate_user_agents,
        proxies=proxies,
        rotate_proxies=bool(proxies),
        use_browser=use_browser,
        **kwargs
    ) as scraper:
        response = scraper.get(url)
        return response.text


# Example usage
if __name__ == "__main__":
    print("=== Testing AntiDetectionScraper ===\n")
    
    # Test 1: Basic scraping
    print("Test 1: Basic GET request")
    with AntiDetectionScraper(rotate_user_agents=True) as scraper:
        response = scraper.get("https://httpbin.org/headers")
        print(f"Status: {response.status_code}")
        print(f"Content length: {len(response.content)} bytes")
    
    print("\n" + "="*50 + "\n")
    
    # Test 2: Get BeautifulSoup
    print("Test 2: Get BeautifulSoup object")
    with AntiDetectionScraper() as scraper:
        soup = scraper.get_soup("https://httpbin.org/html")
        print(f"Found {len(soup.find_all('p'))} paragraphs")
    
    print("\n" + "="*50 + "\n")
    
    # Test 3: Statistics
    print("Test 3: Statistics")
    with AntiDetectionScraper(rotate_user_agents=True, min_delay=0.5, max_delay=1.0) as scraper:
        scraper.get("https://httpbin.org/delay/1")
        scraper.get("https://httpbin.org/status/200")
        
        stats = scraper.get_statistics()
        print("Statistics:")
        for key, value in stats.items():
            if isinstance(value, dict):
                print(f"\n{key}:")
                for k, v in value.items():
                    print(f"  {k}: {v}")
            else:
                print(f"{key}: {value}")
    
    print("\n=== All tests completed ===")
