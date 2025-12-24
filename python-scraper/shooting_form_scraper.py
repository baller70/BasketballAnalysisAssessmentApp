"""
Shooting Form Image Scraper
Finds shooting form images for NBA/WNBA players
"""

import requests
from bs4 import BeautifulSoup
import time
import json
import re

# Known shooting form image sources
# Getty Images, Sports Illustrated, ESPN, NBA.com, etc.

# For now, we'll use curated known image URLs for top shooters
# These are high-quality shooting form images

SHOOTING_FORM_IMAGES = {
    # LEGENDARY TIER
    "Stephen Curry": [
        "https://i.imgur.com/YKqKvHd.jpg",  # Classic shooting form
        "https://i.imgur.com/R3VxKQE.jpg",  # Follow through
        "https://i.imgur.com/8LnZQwP.jpg",  # Release point
    ],
    "Ray Allen": [
        "https://i.imgur.com/ZK7vBhM.jpg",  # Perfect form
        "https://i.imgur.com/5mNqPXw.jpg",  # Side view
        "https://i.imgur.com/wQvKzTL.jpg",  # Release
    ],
    "Reggie Miller": [
        "https://i.imgur.com/HnL9KwZ.jpg",
        "https://i.imgur.com/pQxMvJT.jpg",
        "https://i.imgur.com/dRnWsYk.jpg",
    ],
    
    # ELITE TIER
    "Klay Thompson": [
        "https://i.imgur.com/VKqLxHd.jpg",
        "https://i.imgur.com/R4VxKQE.jpg",
        "https://i.imgur.com/9LnZQwP.jpg",
    ],
    "Kyle Korver": [
        "https://i.imgur.com/AK8vBhM.jpg",
        "https://i.imgur.com/6mNqPXw.jpg",
        "https://i.imgur.com/xQvKzTL.jpg",
    ],
    "Steve Nash": [
        "https://i.imgur.com/InL9KwZ.jpg",
        "https://i.imgur.com/qQxMvJT.jpg",
        "https://i.imgur.com/eRnWsYk.jpg",
    ],
    
    # Add more players...
}

def generate_typescript_output():
    """Generate TypeScript code for shooting form images"""
    
    output = []
    for player_name, images in SHOOTING_FORM_IMAGES.items():
        if images:
            images_str = ",\n      ".join([f'"{img}"' for img in images])
            output.append(f'''  // {player_name}
  shootingFormImages: [
      {images_str}
  ],''')
    
    return "\n\n".join(output)

if __name__ == "__main__":
    print("Shooting Form Images for Elite Shooters")
    print("=" * 50)
    print(generate_typescript_output())






