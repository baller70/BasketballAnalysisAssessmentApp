"""
Browser Automation Module
Provides headless browser automation with Playwright for JavaScript-heavy sites
Includes stealth mode and anti-detection features
"""

import asyncio
import random
from typing import Optional, Dict, List
from playwright.async_api import async_playwright, Browser, BrowserContext, Page, Error as PlaywrightError
from loguru import logger
from .human_behavior import HumanBehavior
from .user_agent_rotator import UserAgentRotator


class StealthBrowser:
    """
    Playwright-based browser automation with stealth features
    """
    
    def __init__(
        self,
        headless: bool = True,
        user_agent_rotator: Optional[UserAgentRotator] = None,
        human_behavior: Optional[HumanBehavior] = None,
        proxy: Optional[Dict[str, str]] = None,
    ):
        """
        Initialize stealth browser
        
        Args:
            headless: Run browser in headless mode
            user_agent_rotator: UserAgentRotator instance
            human_behavior: HumanBehavior instance
            proxy: Proxy configuration
        """
        self.headless = headless
        self.user_agent_rotator = user_agent_rotator or UserAgentRotator()
        self.human_behavior = human_behavior or HumanBehavior()
        self.proxy = proxy
        
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        
        logger.info(f"StealthBrowser initialized (headless={headless})")
    
    async def start(self, browser_type: str = "chromium"):
        """
        Start the browser
        
        Args:
            browser_type: Browser type - 'chromium', 'firefox', or 'webkit'
        """
        try:
            self.playwright = await async_playwright().start()
            
            # Get browser profile
            profile = self.user_agent_rotator.get_browser_profile("chrome", "windows")
            
            # Browser launch options
            launch_options = {
                "headless": self.headless,
                "args": [
                    "--disable-blink-features=AutomationControlled",
                    "--disable-dev-shm-usage",
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-web-security",
                    "--disable-features=IsolateOrigins,site-per-process",
                    "--disable-infobars",
                    "--window-size=1920,1080",
                    "--start-maximized",
                ],
            }
            
            # Add proxy if provided
            if self.proxy:
                proxy_url = self.proxy.get("http") or self.proxy.get("https")
                if proxy_url:
                    # Parse proxy URL
                    if "@" in proxy_url:
                        # Format: http://user:pass@host:port
                        scheme, rest = proxy_url.split("://", 1)
                        auth, server = rest.split("@", 1)
                        username, password = auth.split(":", 1)
                        
                        launch_options["proxy"] = {
                            "server": f"{scheme}://{server}",
                            "username": username,
                            "password": password,
                        }
                    else:
                        launch_options["proxy"] = {"server": proxy_url}
            
            # Launch browser
            if browser_type == "chromium":
                self.browser = await self.playwright.chromium.launch(**launch_options)
            elif browser_type == "firefox":
                self.browser = await self.playwright.firefox.launch(**launch_options)
            elif browser_type == "webkit":
                self.browser = await self.playwright.webkit.launch(**launch_options)
            else:
                raise ValueError(f"Invalid browser type: {browser_type}")
            
            # Create context with stealth settings
            context_options = {
                "user_agent": profile["User-Agent"],
                "viewport": {"width": 1920, "height": 1080},
                "locale": "en-US",
                "timezone_id": "America/New_York",
                "permissions": ["geolocation"],
                "extra_http_headers": {k: v for k, v in profile.items() if k != "User-Agent"},
            }
            
            self.context = await self.browser.new_context(**context_options)
            
            # Apply anti-detection scripts
            await self._apply_stealth_scripts()
            
            # Create page
            self.page = await self.context.new_page()
            
            logger.info(f"{browser_type.capitalize()} browser started successfully")
            
        except Exception as e:
            logger.error(f"Failed to start browser: {e}")
            raise
    
    async def _apply_stealth_scripts(self):
        """
        Apply stealth scripts to avoid detection
        """
        if not self.context:
            return
        
        # Script to hide webdriver property
        stealth_script = """
        // Overwrite the `navigator.webdriver` property
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
        });
        
        // Overwrite the `plugins` property to add fake plugins
        Object.defineProperty(navigator, 'plugins', {
            get: () => [
                {
                    0: {type: "application/x-google-chrome-pdf", suffixes: "pdf", description: "Portable Document Format"},
                    description: "Portable Document Format",
                    filename: "internal-pdf-viewer",
                    length: 1,
                    name: "Chrome PDF Plugin"
                }
            ],
        });
        
        // Overwrite the `languages` property
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en'],
        });
        
        // Mock chrome runtime
        window.chrome = {
            runtime: {},
        };
        
        // Mock permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission }) :
                originalQuery(parameters)
        );
        
        // Add vendor-specific properties
        Object.defineProperty(navigator, 'vendor', {
            get: () => 'Google Inc.',
        });
        
        // Mock battery API
        Object.defineProperty(navigator, 'getBattery', {
            value: () => Promise.resolve({
                charging: true,
                chargingTime: 0,
                dischargingTime: Infinity,
                level: 1.0,
                addEventListener: () => {},
                removeEventListener: () => {},
            }),
        });
        """
        
        # Add initialization script to all new pages
        await self.context.add_init_script(stealth_script)
        
        logger.debug("Stealth scripts applied to browser context")
    
    async def goto(self, url: str, wait_until: str = "domcontentloaded", timeout: int = 30000):
        """
        Navigate to URL with human-like behavior
        
        Args:
            url: URL to navigate to
            wait_until: When to consider navigation complete ('load', 'domcontentloaded', 'networkidle')
            timeout: Timeout in milliseconds
        
        Returns:
            Response object
        """
        if not self.page:
            raise RuntimeError("Browser not started. Call start() first.")
        
        try:
            # Add random delay before navigation
            self.human_behavior.random_delay(0.5, 2.0)
            
            logger.info(f"Navigating to: {url}")
            response = await self.page.goto(url, wait_until=wait_until, timeout=timeout)
            
            # Wait for page to be fully interactive
            self.human_behavior.page_load_wait(1.0, 3.0)
            
            return response
            
        except PlaywrightError as e:
            logger.error(f"Navigation failed: {e}")
            raise
    
    async def get_content(self) -> str:
        """
        Get page HTML content
        
        Returns:
            HTML content as string
        """
        if not self.page:
            raise RuntimeError("Browser not started")
        
        return await self.page.content()
    
    async def screenshot(self, path: str, full_page: bool = True):
        """
        Take a screenshot
        
        Args:
            path: Path to save screenshot
            full_page: Capture full page or just viewport
        """
        if not self.page:
            raise RuntimeError("Browser not started")
        
        await self.page.screenshot(path=path, full_page=full_page)
        logger.info(f"Screenshot saved to: {path}")
    
    async def click(self, selector: str):
        """
        Click an element with human-like behavior
        
        Args:
            selector: CSS selector
        """
        if not self.page:
            raise RuntimeError("Browser not started")
        
        # Wait for element
        await self.page.wait_for_selector(selector, timeout=10000)
        
        # Scroll to element (humans scroll before clicking)
        await self.page.locator(selector).scroll_into_view_if_needed()
        self.human_behavior.scroll_delay(300)
        
        # Move mouse to element (simulate mouse movement)
        await self.page.hover(selector)
        self.human_behavior.mouse_movement_delay(300)
        
        # Click
        await self.page.click(selector)
        self.human_behavior.click_delay()
        
        logger.debug(f"Clicked element: {selector}")
    
    async def type_text(self, selector: str, text: str, delay_between_keys: int = 50):
        """
        Type text with human-like speed
        
        Args:
            selector: CSS selector
            text: Text to type
            delay_between_keys: Delay between keystrokes in milliseconds
        """
        if not self.page:
            raise RuntimeError("Browser not started")
        
        await self.page.wait_for_selector(selector, timeout=10000)
        await self.page.click(selector)
        
        # Add random variation to typing speed
        for char in text:
            char_delay = int(delay_between_keys * random.uniform(0.5, 1.5))
            await self.page.keyboard.type(char)
            await asyncio.sleep(char_delay / 1000)
        
        logger.debug(f"Typed text into {selector}")
    
    async def scroll(self, pixels: int = 500):
        """
        Scroll page with human-like behavior
        
        Args:
            pixels: Number of pixels to scroll
        """
        if not self.page:
            raise RuntimeError("Browser not started")
        
        await self.page.evaluate(f"window.scrollBy(0, {pixels})")
        self.human_behavior.scroll_delay(pixels)
        
        logger.debug(f"Scrolled {pixels}px")
    
    async def wait_for_selector(self, selector: str, timeout: int = 30000):
        """
        Wait for element to appear
        
        Args:
            selector: CSS selector
            timeout: Timeout in milliseconds
        """
        if not self.page:
            raise RuntimeError("Browser not started")
        
        await self.page.wait_for_selector(selector, timeout=timeout)
    
    async def evaluate(self, script: str):
        """
        Execute JavaScript in page context
        
        Args:
            script: JavaScript code to execute
        
        Returns:
            Result of script execution
        """
        if not self.page:
            raise RuntimeError("Browser not started")
        
        return await self.page.evaluate(script)
    
    async def get_cookies(self) -> List[Dict]:
        """
        Get all cookies
        
        Returns:
            List of cookie dictionaries
        """
        if not self.context:
            raise RuntimeError("Browser not started")
        
        return await self.context.cookies()
    
    async def set_cookies(self, cookies: List[Dict]):
        """
        Set cookies
        
        Args:
            cookies: List of cookie dictionaries
        """
        if not self.context:
            raise RuntimeError("Browser not started")
        
        await self.context.add_cookies(cookies)
        logger.debug(f"Set {len(cookies)} cookies")
    
    async def close(self):
        """
        Close browser and cleanup
        """
        try:
            if self.page:
                await self.page.close()
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
            
            logger.info("Browser closed successfully")
            
        except Exception as e:
            logger.error(f"Error closing browser: {e}")
    
    async def __aenter__(self):
        """Context manager entry"""
        await self.start()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        await self.close()


# Synchronous wrapper for easier use
class StealthBrowserSync:
    """
    Synchronous wrapper for StealthBrowser
    """
    
    def __init__(self, **kwargs):
        self.browser = StealthBrowser(**kwargs)
        self.loop = asyncio.new_event_loop()
    
    def start(self, browser_type: str = "chromium"):
        """Start browser"""
        return self.loop.run_until_complete(self.browser.start(browser_type))
    
    def goto(self, url: str, **kwargs):
        """Navigate to URL"""
        return self.loop.run_until_complete(self.browser.goto(url, **kwargs))
    
    def get_content(self) -> str:
        """Get page content"""
        return self.loop.run_until_complete(self.browser.get_content())
    
    def screenshot(self, path: str, full_page: bool = True):
        """Take screenshot"""
        return self.loop.run_until_complete(self.browser.screenshot(path, full_page))
    
    def click(self, selector: str):
        """Click element"""
        return self.loop.run_until_complete(self.browser.click(selector))
    
    def type_text(self, selector: str, text: str, delay_between_keys: int = 50):
        """Type text"""
        return self.loop.run_until_complete(self.browser.type_text(selector, text, delay_between_keys))
    
    def scroll(self, pixels: int = 500):
        """Scroll page"""
        return self.loop.run_until_complete(self.browser.scroll(pixels))
    
    def wait_for_selector(self, selector: str, timeout: int = 30000):
        """Wait for element"""
        return self.loop.run_until_complete(self.browser.wait_for_selector(selector, timeout))
    
    def evaluate(self, script: str):
        """Execute JavaScript"""
        return self.loop.run_until_complete(self.browser.evaluate(script))
    
    def get_cookies(self):
        """Get cookies"""
        return self.loop.run_until_complete(self.browser.get_cookies())
    
    def set_cookies(self, cookies: List[Dict]):
        """Set cookies"""
        return self.loop.run_until_complete(self.browser.set_cookies(cookies))
    
    def close(self):
        """Close browser"""
        self.loop.run_until_complete(self.browser.close())
        self.loop.close()
    
    def __enter__(self):
        """Context manager entry"""
        self.start()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.close()


# Example usage
if __name__ == "__main__":
    async def main():
        # Async usage
        async with StealthBrowser(headless=True) as browser:
            await browser.goto("https://httpbin.org/headers")
            content = await browser.get_content()
            print("Page loaded successfully!")
            print(f"Content length: {len(content)} chars")
    
    # Run async example
    asyncio.run(main())
    
    print("\n" + "="*50 + "\n")
    
    # Sync usage
    with StealthBrowserSync(headless=True) as browser:
        browser.goto("https://httpbin.org/headers")
        content = browser.get_content()
        print("Page loaded successfully (sync)!")
        print(f"Content length: {len(content)} chars")
