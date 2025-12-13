"""
Proxy Management Module
Handles proxy rotation, validation, and health checking
"""

import random
import time
from typing import List, Dict, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import requests
from loguru import logger


@dataclass
class ProxyInfo:
    """Information about a proxy"""
    url: str
    protocol: str  # http, https, socks4, socks5
    last_used: Optional[datetime] = None
    success_count: int = 0
    failure_count: int = 0
    response_time: float = 0.0
    is_healthy: bool = True
    last_check: Optional[datetime] = None


class ProxyManager:
    """
    Manages proxy rotation and health checking
    """
    
    def __init__(self, proxies: List[str] = None, health_check_interval: int = 300):
        """
        Initialize proxy manager
        
        Args:
            proxies: List of proxy URLs (format: protocol://ip:port or protocol://user:pass@ip:port)
            health_check_interval: Seconds between health checks (default: 5 minutes)
        """
        self.proxies: List[ProxyInfo] = []
        self.health_check_interval = health_check_interval
        self.enabled = False
        
        if proxies:
            self._load_proxies(proxies)
            self.enabled = True
            logger.info(f"ProxyManager initialized with {len(self.proxies)} proxies")
        else:
            logger.info("ProxyManager initialized without proxies (direct connection mode)")
    
    def _load_proxies(self, proxy_urls: List[str]):
        """Load proxies from list of URLs"""
        for url in proxy_urls:
            try:
                # Detect protocol
                if url.startswith("socks5://"):
                    protocol = "socks5"
                elif url.startswith("socks4://"):
                    protocol = "socks4"
                elif url.startswith("https://"):
                    protocol = "https"
                elif url.startswith("http://"):
                    protocol = "http"
                else:
                    # Default to http if no protocol specified
                    protocol = "http"
                    url = f"http://{url}"
                
                proxy_info = ProxyInfo(
                    url=url,
                    protocol=protocol,
                    is_healthy=True,
                )
                self.proxies.append(proxy_info)
                
            except Exception as e:
                logger.warning(f"Failed to load proxy {url}: {e}")
    
    def get_random_proxy(self) -> Optional[Dict[str, str]]:
        """
        Get a random healthy proxy
        
        Returns:
            Dictionary with proxy configuration or None if no proxies available
        """
        if not self.enabled or not self.proxies:
            return None
        
        # Filter healthy proxies
        healthy_proxies = [p for p in self.proxies if p.is_healthy]
        
        if not healthy_proxies:
            logger.warning("No healthy proxies available, using direct connection")
            return None
        
        # Select random proxy with weighted probability (prefer proxies with better success rate)
        proxy = random.choices(
            healthy_proxies,
            weights=[p.success_count + 1 for p in healthy_proxies],
            k=1
        )[0]
        
        proxy.last_used = datetime.now()
        
        # Return in requests format
        return {
            "http": proxy.url,
            "https": proxy.url,
        }
    
    def get_next_proxy(self) -> Optional[Dict[str, str]]:
        """
        Get next proxy in rotation (round-robin with health checking)
        
        Returns:
            Dictionary with proxy configuration or None if no proxies available
        """
        if not self.enabled or not self.proxies:
            return None
        
        # Find least recently used healthy proxy
        healthy_proxies = [p for p in self.proxies if p.is_healthy]
        
        if not healthy_proxies:
            logger.warning("No healthy proxies available")
            return None
        
        # Sort by last_used time (None values last)
        sorted_proxies = sorted(
            healthy_proxies,
            key=lambda p: p.last_used if p.last_used else datetime.min
        )
        
        proxy = sorted_proxies[0]
        proxy.last_used = datetime.now()
        
        return {
            "http": proxy.url,
            "https": proxy.url,
        }
    
    def report_success(self, proxy_dict: Dict[str, str], response_time: float):
        """
        Report successful proxy usage
        
        Args:
            proxy_dict: Proxy dictionary returned by get_random_proxy/get_next_proxy
            response_time: Response time in seconds
        """
        if not proxy_dict:
            return
        
        proxy_url = proxy_dict.get("http") or proxy_dict.get("https")
        
        for proxy in self.proxies:
            if proxy.url == proxy_url:
                proxy.success_count += 1
                proxy.response_time = response_time
                proxy.is_healthy = True
                break
    
    def report_failure(self, proxy_dict: Dict[str, str]):
        """
        Report failed proxy usage
        
        Args:
            proxy_dict: Proxy dictionary returned by get_random_proxy/get_next_proxy
        """
        if not proxy_dict:
            return
        
        proxy_url = proxy_dict.get("http") or proxy_dict.get("https")
        
        for proxy in self.proxies:
            if proxy.url == proxy_url:
                proxy.failure_count += 1
                
                # Mark as unhealthy if failure rate is high
                if proxy.failure_count > 3 and proxy.failure_count > proxy.success_count:
                    proxy.is_healthy = False
                    logger.warning(f"Proxy {proxy_url} marked as unhealthy")
                break
    
    def check_proxy_health(self, proxy: ProxyInfo, test_url: str = "https://httpbin.org/ip") -> bool:
        """
        Check if a proxy is working
        
        Args:
            proxy: ProxyInfo object
            test_url: URL to test proxy against
        
        Returns:
            True if proxy is working, False otherwise
        """
        try:
            proxies = {
                "http": proxy.url,
                "https": proxy.url,
            }
            
            start_time = time.time()
            response = requests.get(test_url, proxies=proxies, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                proxy.is_healthy = True
                proxy.response_time = response_time
                proxy.last_check = datetime.now()
                logger.debug(f"Proxy {proxy.url} is healthy (response time: {response_time:.2f}s)")
                return True
            else:
                proxy.is_healthy = False
                logger.warning(f"Proxy {proxy.url} returned status {response.status_code}")
                return False
                
        except Exception as e:
            proxy.is_healthy = False
            proxy.last_check = datetime.now()
            logger.warning(f"Proxy {proxy.url} health check failed: {e}")
            return False
    
    def check_all_proxies(self, test_url: str = "https://httpbin.org/ip"):
        """
        Check health of all proxies
        
        Args:
            test_url: URL to test proxies against
        """
        if not self.enabled or not self.proxies:
            return
        
        logger.info(f"Checking health of {len(self.proxies)} proxies...")
        
        healthy_count = 0
        for proxy in self.proxies:
            # Only check if not recently checked
            if proxy.last_check is None or \
               datetime.now() - proxy.last_check > timedelta(seconds=self.health_check_interval):
                if self.check_proxy_health(proxy, test_url):
                    healthy_count += 1
                time.sleep(1)  # Rate limiting
            elif proxy.is_healthy:
                healthy_count += 1
        
        logger.info(f"Proxy health check complete: {healthy_count}/{len(self.proxies)} healthy")
    
    def get_statistics(self) -> Dict:
        """
        Get proxy statistics
        
        Returns:
            Dictionary with proxy statistics
        """
        if not self.enabled or not self.proxies:
            return {
                "enabled": False,
                "total_proxies": 0,
                "healthy_proxies": 0,
            }
        
        healthy = [p for p in self.proxies if p.is_healthy]
        
        stats = {
            "enabled": True,
            "total_proxies": len(self.proxies),
            "healthy_proxies": len(healthy),
            "unhealthy_proxies": len(self.proxies) - len(healthy),
            "average_response_time": sum(p.response_time for p in healthy) / len(healthy) if healthy else 0,
            "total_successes": sum(p.success_count for p in self.proxies),
            "total_failures": sum(p.failure_count for p in self.proxies),
        }
        
        return stats
    
    def reset_proxy_stats(self):
        """Reset statistics for all proxies"""
        for proxy in self.proxies:
            proxy.success_count = 0
            proxy.failure_count = 0
            proxy.is_healthy = True
            proxy.last_check = None
        
        logger.info("Proxy statistics reset")
    
    @classmethod
    def from_file(cls, filepath: str, health_check_interval: int = 300) -> 'ProxyManager':
        """
        Load proxies from a file (one proxy per line)
        
        Args:
            filepath: Path to proxy file
            health_check_interval: Seconds between health checks
        
        Returns:
            ProxyManager instance
        """
        try:
            with open(filepath, 'r') as f:
                proxies = [line.strip() for line in f if line.strip() and not line.startswith('#')]
            
            return cls(proxies=proxies, health_check_interval=health_check_interval)
            
        except Exception as e:
            logger.error(f"Failed to load proxies from file {filepath}: {e}")
            return cls()
    
    @classmethod
    def from_env(cls, env_var: str = "PROXIES", health_check_interval: int = 300) -> 'ProxyManager':
        """
        Load proxies from environment variable (comma-separated)
        
        Args:
            env_var: Name of environment variable
            health_check_interval: Seconds between health checks
        
        Returns:
            ProxyManager instance
        """
        import os
        
        proxy_string = os.getenv(env_var, "")
        
        if not proxy_string:
            return cls()
        
        proxies = [p.strip() for p in proxy_string.split(',') if p.strip()]
        return cls(proxies=proxies, health_check_interval=health_check_interval)


# Example usage
if __name__ == "__main__":
    # Example proxy list (these are fake, just for demonstration)
    example_proxies = [
        "http://proxy1.example.com:8080",
        "http://user:pass@proxy2.example.com:3128",
        "socks5://proxy3.example.com:1080",
    ]
    
    manager = ProxyManager(proxies=example_proxies)
    
    print("=== Proxy Statistics ===")
    stats = manager.get_statistics()
    for key, value in stats.items():
        print(f"{key}: {value}")
    
    print("\n=== Getting Random Proxy ===")
    proxy = manager.get_random_proxy()
    if proxy:
        print(f"Selected proxy: {proxy}")
    else:
        print("No proxy available (direct connection)")
