"""
User Agent Rotation Module
Provides realistic and up-to-date user agents for anti-detection
"""

import random
from typing import List, Dict
from fake_useragent import UserAgent
from loguru import logger


class UserAgentRotator:
    """
    Manages a pool of realistic user agents with rotation capabilities
    """
    
    def __init__(self, use_fake_ua: bool = True):
        """
        Initialize the user agent rotator
        
        Args:
            use_fake_ua: Whether to use fake-useragent library for dynamic UAs
        """
        self.use_fake_ua = use_fake_ua
        
        if use_fake_ua:
            try:
                self.ua_generator = UserAgent(browsers=['chrome', 'firefox', 'safari', 'edge'])
            except Exception as e:
                logger.warning(f"Failed to initialize UserAgent: {e}. Using static pool.")
                self.use_fake_ua = False
        
        # Static pool of realistic, up-to-date user agents
        self.static_user_agents = self._get_static_user_agents()
        
        logger.info(f"UserAgentRotator initialized with {len(self.static_user_agents)} static UAs")
    
    def _get_static_user_agents(self) -> List[str]:
        """
        Get a pool of realistic, up-to-date user agents
        Updated: December 2025
        """
        return [
            # Chrome (Windows)
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            
            # Chrome (macOS)
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            
            # Chrome (Linux)
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            
            # Firefox (Windows)
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
            "Mozilla/5.0 (Windows NT 11.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
            
            # Firefox (macOS)
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.1; rv:122.0) Gecko/20100101 Firefox/122.0",
            
            # Firefox (Linux)
            "Mozilla/5.0 (X11; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0",
            "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0",
            
            # Safari (macOS)
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
            
            # Safari (iOS)
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
            "Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
            
            # Edge (Windows)
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
            
            # Edge (macOS)
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
            
            # Chrome Mobile (Android)
            "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
            "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
            "Mozilla/5.0 (Linux; Android 13; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
        ]
    
    def get_random_user_agent(self, device_type: str = "desktop") -> str:
        """
        Get a random user agent
        
        Args:
            device_type: Type of device - 'desktop', 'mobile', or 'any'
        
        Returns:
            Random user agent string
        """
        if self.use_fake_ua:
            try:
                if device_type == "mobile":
                    return self.ua_generator.random
                elif device_type == "desktop":
                    return self.ua_generator.random
                else:
                    return self.ua_generator.random
            except Exception as e:
                logger.warning(f"Failed to get user agent from fake-useragent: {e}")
        
        # Filter by device type
        if device_type == "mobile":
            mobile_uas = [ua for ua in self.static_user_agents if "Mobile" in ua or "Android" in ua or "iPhone" in ua or "iPad" in ua]
            return random.choice(mobile_uas) if mobile_uas else random.choice(self.static_user_agents)
        elif device_type == "desktop":
            desktop_uas = [ua for ua in self.static_user_agents if "Mobile" not in ua and "Android" not in ua and "iPhone" not in ua and "iPad" not in ua]
            return random.choice(desktop_uas) if desktop_uas else random.choice(self.static_user_agents)
        else:
            return random.choice(self.static_user_agents)
    
    def get_chrome_user_agent(self, os_type: str = "windows") -> str:
        """
        Get a Chrome user agent for specific OS
        
        Args:
            os_type: Operating system - 'windows', 'macos', 'linux', 'android'
        
        Returns:
            Chrome user agent for the specified OS
        """
        chrome_uas = [ua for ua in self.static_user_agents if "Chrome" in ua and not "Edg" in ua]
        
        if os_type == "windows":
            filtered = [ua for ua in chrome_uas if "Windows" in ua and "Mobile" not in ua]
        elif os_type == "macos":
            filtered = [ua for ua in chrome_uas if "Macintosh" in ua and "Mobile" not in ua]
        elif os_type == "linux":
            filtered = [ua for ua in chrome_uas if "Linux" in ua and "Android" not in ua]
        elif os_type == "android":
            filtered = [ua for ua in chrome_uas if "Android" in ua]
        else:
            filtered = chrome_uas
        
        return random.choice(filtered) if filtered else random.choice(chrome_uas)
    
    def get_firefox_user_agent(self, os_type: str = "windows") -> str:
        """
        Get a Firefox user agent for specific OS
        
        Args:
            os_type: Operating system - 'windows', 'macos', 'linux'
        
        Returns:
            Firefox user agent for the specified OS
        """
        firefox_uas = [ua for ua in self.static_user_agents if "Firefox" in ua]
        
        if os_type == "windows":
            filtered = [ua for ua in firefox_uas if "Windows" in ua]
        elif os_type == "macos":
            filtered = [ua for ua in firefox_uas if "Macintosh" in ua]
        elif os_type == "linux":
            filtered = [ua for ua in firefox_uas if "Linux" in ua]
        else:
            filtered = firefox_uas
        
        return random.choice(filtered) if filtered else random.choice(firefox_uas)
    
    def get_safari_user_agent(self, device: str = "macos") -> str:
        """
        Get a Safari user agent
        
        Args:
            device: Device type - 'macos', 'iphone', 'ipad'
        
        Returns:
            Safari user agent for the specified device
        """
        safari_uas = [ua for ua in self.static_user_agents if "Safari" in ua and "Chrome" not in ua]
        
        if device == "macos":
            filtered = [ua for ua in safari_uas if "Macintosh" in ua]
        elif device == "iphone":
            filtered = [ua for ua in safari_uas if "iPhone" in ua]
        elif device == "ipad":
            filtered = [ua for ua in safari_uas if "iPad" in ua]
        else:
            filtered = safari_uas
        
        return random.choice(filtered) if filtered else random.choice(safari_uas)
    
    def get_browser_profile(self, browser: str = "chrome", os_type: str = "windows") -> Dict[str, str]:
        """
        Get a complete browser profile with matching headers
        
        Args:
            browser: Browser type - 'chrome', 'firefox', 'safari', 'edge'
            os_type: Operating system - 'windows', 'macos', 'linux', 'android', 'ios'
        
        Returns:
            Dictionary with user agent and matching headers
        """
        # Select appropriate user agent
        if browser == "chrome":
            user_agent = self.get_chrome_user_agent(os_type)
        elif browser == "firefox":
            user_agent = self.get_firefox_user_agent(os_type)
        elif browser == "safari":
            device = "iphone" if os_type == "ios" else "macos"
            user_agent = self.get_safari_user_agent(device)
        elif browser == "edge":
            user_agent = random.choice([ua for ua in self.static_user_agents if "Edg" in ua])
        else:
            user_agent = self.get_random_user_agent()
        
        # Generate matching headers
        profile = {
            "User-Agent": user_agent,
            "Accept": self._get_accept_header(browser),
            "Accept-Language": self._get_random_language(),
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Cache-Control": "max-age=0",
            "DNT": str(random.choice([0, 1])),  # Do Not Track
        }
        
        # Add Sec-CH-UA headers for Chrome/Edge
        if browser in ["chrome", "edge"]:
            profile.update(self._get_sec_ch_headers(user_agent))
        
        return profile
    
    def _get_accept_header(self, browser: str) -> str:
        """Get browser-specific Accept header"""
        if browser == "firefox":
            return "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
        else:  # Chrome, Safari, Edge
            return "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
    
    def _get_random_language(self) -> str:
        """Get a random Accept-Language header"""
        languages = [
            "en-US,en;q=0.9",
            "en-GB,en;q=0.9",
            "en-US,en;q=0.9,es;q=0.8",
            "en-US,en;q=0.9,fr;q=0.8",
            "en-CA,en;q=0.9",
            "en-AU,en;q=0.9",
        ]
        return random.choice(languages)
    
    def _get_sec_ch_headers(self, user_agent: str) -> Dict[str, str]:
        """Generate Sec-CH-UA headers for Chrome/Edge"""
        # Extract version from user agent
        if "Chrome/" in user_agent:
            version = user_agent.split("Chrome/")[1].split(".")[0]
        elif "Edg/" in user_agent:
            version = user_agent.split("Edg/")[1].split(".")[0]
        else:
            version = "131"
        
        is_edge = "Edg" in user_agent
        
        if is_edge:
            brand = f'"Microsoft Edge";v="{version}", "Chromium";v="{version}", "Not=A?Brand";v="24"'
            full_version = f'"{version}.0.0.0"'
        else:
            brand = f'"Google Chrome";v="{version}", "Chromium";v="{version}", "Not=A?Brand";v="24"'
            full_version = f'"{version}.0.0.0"'
        
        # Detect platform
        if "Windows" in user_agent:
            platform = "Windows"
        elif "Macintosh" in user_agent:
            platform = "macOS"
        elif "Linux" in user_agent:
            platform = "Linux"
        elif "Android" in user_agent:
            platform = "Android"
        else:
            platform = "Windows"
        
        mobile = "?1" if "Mobile" in user_agent else "?0"
        
        return {
            "sec-ch-ua": brand,
            "sec-ch-ua-mobile": mobile,
            "sec-ch-ua-platform": f'"{platform}"',
            "sec-ch-ua-full-version-list": brand.replace(f'v="{version}"', f'v={full_version}'),
        }


# Example usage
if __name__ == "__main__":
    rotator = UserAgentRotator()
    
    print("=== Random User Agents ===")
    for i in range(3):
        print(f"{i+1}. {rotator.get_random_user_agent()}")
    
    print("\n=== Chrome Profile ===")
    profile = rotator.get_browser_profile("chrome", "windows")
    for key, value in profile.items():
        print(f"{key}: {value}")
    
    print("\n=== Firefox Profile ===")
    profile = rotator.get_browser_profile("firefox", "macos")
    for key, value in profile.items():
        print(f"{key}: {value}")