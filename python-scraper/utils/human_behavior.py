"""
Human-Like Behavior Simulation Module
Implements delays, patterns, and behaviors that mimic real human browsing
"""

import random
import time
from typing import Optional, Tuple
from datetime import datetime
import math
from loguru import logger


class HumanBehavior:
    """
    Simulates human-like behavior for web scraping
    """
    
    def __init__(
        self,
        min_delay: float = 1.0,
        max_delay: float = 5.0,
        typing_speed_wpm: int = 40,
        enable_jitter: bool = True,
    ):
        """
        Initialize human behavior simulator
        
        Args:
            min_delay: Minimum delay between requests (seconds)
            max_delay: Maximum delay between requests (seconds)
            typing_speed_wpm: Typing speed in words per minute
            enable_jitter: Add random jitter to delays
        """
        self.min_delay = min_delay
        self.max_delay = max_delay
        self.typing_speed_wpm = typing_speed_wpm
        self.enable_jitter = enable_jitter
        self.request_count = 0
        self.last_request_time = None
        
        logger.info(f"HumanBehavior initialized: delays {min_delay}-{max_delay}s, typing {typing_speed_wpm}wpm")
    
    def random_delay(self, min_override: Optional[float] = None, max_override: Optional[float] = None):
        """
        Wait for a random human-like delay
        
        Args:
            min_override: Override minimum delay for this call
            max_override: Override maximum delay for this call
        """
        min_d = min_override if min_override is not None else self.min_delay
        max_d = max_override if max_override is not None else self.max_delay
        
        # Use a more natural distribution (slightly biased toward lower values)
        delay = self._natural_delay(min_d, max_d)
        
        if self.enable_jitter:
            # Add small random jitter
            jitter = random.uniform(-0.3, 0.3)
            delay = max(min_d, delay + jitter)
        
        logger.debug(f"Human delay: {delay:.2f}s")
        time.sleep(delay)
        
        self.last_request_time = datetime.now()
        self.request_count += 1
    
    def _natural_delay(self, min_val: float, max_val: float) -> float:
        """
        Generate a more natural delay using beta distribution
        (slightly biased toward lower values, like real human behavior)
        """
        # Beta distribution parameters (alpha=2, beta=5 creates a left-skewed distribution)
        beta_value = random.betavariate(2, 5)
        return min_val + beta_value * (max_val - min_val)
    
    def exponential_backoff(self, attempt: int, base_delay: float = 1.0, max_delay: float = 60.0):
        """
        Implement exponential backoff with jitter (for retries)
        
        Args:
            attempt: Current attempt number (0-indexed)
            base_delay: Base delay in seconds
            max_delay: Maximum delay in seconds
        """
        # Calculate exponential delay: base * 2^attempt
        delay = min(base_delay * (2 ** attempt), max_delay)
        
        # Add full jitter (random value between 0 and calculated delay)
        jittered_delay = random.uniform(0, delay)
        
        logger.info(f"Exponential backoff: attempt {attempt + 1}, delay {jittered_delay:.2f}s")
        time.sleep(jittered_delay)
    
    def typing_delay(self, text: str):
        """
        Simulate human typing delay
        
        Args:
            text: Text being typed
        """
        # Calculate delay based on text length and typing speed
        # Average word length is 5 characters
        words = len(text) / 5
        minutes = words / self.typing_speed_wpm
        base_delay = minutes * 60
        
        # Add variation (humans don't type at constant speed)
        variation = random.uniform(0.8, 1.2)
        delay = base_delay * variation
        
        # Add thinking pauses for longer texts
        if len(text) > 50:
            thinking_pause = random.uniform(0.5, 2.0)
            delay += thinking_pause
        
        logger.debug(f"Typing delay for {len(text)} chars: {delay:.2f}s")
        time.sleep(delay)
    
    def reading_delay(self, word_count: int, words_per_minute: int = 200):
        """
        Simulate human reading delay
        
        Args:
            word_count: Number of words to read
            words_per_minute: Reading speed (average adult: 200-300 wpm)
        """
        if word_count <= 0:
            return
        
        # Calculate base reading time
        minutes = word_count / words_per_minute
        base_delay = minutes * 60
        
        # Add variation and skimming behavior
        # Humans often skim content, so reduce delay by 30-70%
        skim_factor = random.uniform(0.3, 0.7)
        delay = base_delay * skim_factor
        
        # Minimum delay of 1 second (even for short content)
        delay = max(1.0, delay)
        
        logger.debug(f"Reading delay for {word_count} words: {delay:.2f}s")
        time.sleep(delay)
    
    def mouse_movement_delay(self, distance_pixels: float = 500):
        """
        Simulate delay for mouse movement
        
        Args:
            distance_pixels: Distance in pixels to move mouse
        """
        # Fitts's Law: MT = a + b * log2(D/W + 1)
        # where MT = movement time, D = distance, W = target width
        # Simplified: longer distances take more time
        
        # Base time + distance factor
        base_time = 0.1
        distance_factor = 0.0003 * distance_pixels
        
        delay = base_time + distance_factor
        
        # Add jitter
        if self.enable_jitter:
            delay *= random.uniform(0.8, 1.2)
        
        logger.debug(f"Mouse movement delay ({distance_pixels}px): {delay:.2f}s")
        time.sleep(delay)
    
    def scroll_delay(self, scroll_amount: int = 500):
        """
        Simulate human scrolling delay
        
        Args:
            scroll_amount: Number of pixels to scroll
        """
        # Humans scroll in chunks and pause to read
        chunks = max(1, scroll_amount // 300)
        
        for i in range(chunks):
            # Scroll delay
            chunk_delay = random.uniform(0.3, 0.8)
            time.sleep(chunk_delay)
            
            # Reading pause (random chance)
            if random.random() < 0.4:  # 40% chance to pause and read
                reading_pause = random.uniform(1.0, 3.0)
                logger.debug(f"Scroll reading pause: {reading_pause:.2f}s")
                time.sleep(reading_pause)
    
    def click_delay(self):
        """
        Simulate delay for clicking (mouse down + mouse up)
        """
        # Human click duration: 50-200ms
        delay = random.uniform(0.05, 0.2)
        logger.debug(f"Click delay: {delay:.3f}s")
        time.sleep(delay)
    
    def page_load_wait(self, min_wait: float = 2.0, max_wait: float = 5.0):
        """
        Wait for page to load (simulate human waiting for page)
        
        Args:
            min_wait: Minimum wait time
            max_wait: Maximum wait time
        """
        delay = self._natural_delay(min_wait, max_wait)
        logger.debug(f"Page load wait: {delay:.2f}s")
        time.sleep(delay)
    
    def random_pause(self, pause_probability: float = 0.1):
        """
        Randomly pause (humans take breaks)
        
        Args:
            pause_probability: Probability of taking a pause (0.0-1.0)
        """
        if random.random() < pause_probability:
            pause_duration = random.uniform(5.0, 15.0)
            logger.info(f"Random pause: {pause_duration:.2f}s")
            time.sleep(pause_duration)
    
    def calculate_bezier_point(self, t: float, p0: Tuple[float, float], p1: Tuple[float, float], 
                                p2: Tuple[float, float], p3: Tuple[float, float]) -> Tuple[float, float]:
        """
        Calculate point on a cubic Bezier curve (for natural mouse movements)
        
        Args:
            t: Parameter (0.0 to 1.0)
            p0, p1, p2, p3: Control points
        
        Returns:
            (x, y) coordinates
        """
        x = (1-t)**3 * p0[0] + 3*(1-t)**2*t * p1[0] + 3*(1-t)*t**2 * p2[0] + t**3 * p3[0]
        y = (1-t)**3 * p0[1] + 3*(1-t)**2*t * p1[1] + 3*(1-t)*t**2 * p2[1] + t**3 * p3[1]
        return (x, y)
    
    def generate_mouse_path(self, start: Tuple[int, int], end: Tuple[int, int], 
                           num_points: int = 20) -> list:
        """
        Generate a natural mouse movement path using Bezier curves
        
        Args:
            start: Starting (x, y) position
            end: Ending (x, y) position
            num_points: Number of intermediate points
        
        Returns:
            List of (x, y) coordinates
        """
        # Generate control points for Bezier curve
        # Add some randomness to make it look natural
        dx = end[0] - start[0]
        dy = end[1] - start[1]
        
        # Control points
        p0 = start
        p3 = end
        
        # Random control points (offset from direct path)
        offset1_x = random.uniform(-abs(dx)*0.3, abs(dx)*0.3)
        offset1_y = random.uniform(-abs(dy)*0.3, abs(dy)*0.3)
        offset2_x = random.uniform(-abs(dx)*0.3, abs(dx)*0.3)
        offset2_y = random.uniform(-abs(dy)*0.3, abs(dy)*0.3)
        
        p1 = (start[0] + dx*0.33 + offset1_x, start[1] + dy*0.33 + offset1_y)
        p2 = (start[0] + dx*0.66 + offset2_x, start[1] + dy*0.66 + offset2_y)
        
        # Generate points along the curve
        path = []
        for i in range(num_points + 1):
            t = i / num_points
            point = self.calculate_bezier_point(t, p0, p1, p2, p3)
            path.append((int(point[0]), int(point[1])))
        
        return path
    
    def adaptive_delay(self, content_complexity: str = "medium"):
        """
        Adaptive delay based on content complexity
        
        Args:
            content_complexity: 'simple', 'medium', or 'complex'
        """
        if content_complexity == "simple":
            delay = random.uniform(0.5, 2.0)
        elif content_complexity == "complex":
            delay = random.uniform(5.0, 10.0)
        else:  # medium
            delay = random.uniform(2.0, 5.0)
        
        logger.debug(f"Adaptive delay ({content_complexity}): {delay:.2f}s")
        time.sleep(delay)
    
    def get_session_metrics(self) -> dict:
        """
        Get metrics about the current scraping session
        
        Returns:
            Dictionary with session metrics
        """
        return {
            "request_count": self.request_count,
            "last_request": self.last_request_time.isoformat() if self.last_request_time else None,
            "avg_delay": (self.min_delay + self.max_delay) / 2,
            "typing_speed_wpm": self.typing_speed_wpm,
        }


# Example usage
if __name__ == "__main__":
    behavior = HumanBehavior(min_delay=1.0, max_delay=3.0)
    
    print("=== Testing Human Behavior Simulation ===\n")
    
    print("1. Random delay...")
    behavior.random_delay()
    
    print("2. Typing delay (simulating typing 'Hello, World!')...")
    behavior.typing_delay("Hello, World!")
    
    print("3. Reading delay (simulating reading 100 words)...")
    behavior.reading_delay(word_count=100)
    
    print("4. Exponential backoff (attempt 2)...")
    behavior.exponential_backoff(attempt=2)
    
    print("5. Mouse movement path...")
    path = behavior.generate_mouse_path(start=(0, 0), end=(500, 300), num_points=10)
    print(f"Generated {len(path)} points in mouse path")
    
    print("\n=== Session Metrics ===")
    metrics = behavior.get_session_metrics()
    for key, value in metrics.items():
        print(f"{key}: {value}")
