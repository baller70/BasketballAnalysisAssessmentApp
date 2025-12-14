#!/usr/bin/env python3
"""
Download basketball shooting images from web search results
"""

import requests
import hashlib
import time
from pathlib import Path
from tqdm import tqdm

# Image URLs from web search
IMAGE_URLS = [
    # Query 1: basketball shooting form images
    "https://i.ytimg.com/vi/wxpdmz2UoOA/sddefault.jpg",
    "https://i.ytimg.com/vi/3pqee47avhA/maxresdefault.jpg",
    "https://i.ytimg.com/vi/x7anDE7OEww/maxresdefault.jpg",
    "https://i.ytimg.com/vi/QZagyD4ofHc/maxresdefault.jpg",
    "https://i.ytimg.com/vi/bEhDuk265Mo/maxresdefault.jpg",
    "https://i.ytimg.com/vi/NPjLHKifkyY/maxresdefault.jpg",
    "https://i.ytimg.com/vi/OAARuEj1DsU/maxresdefault.jpg",
    "https://www.breakthroughbasketball.com/fundamentals/graphics/stephGraph.png",
    "https://miro.medium.com/0*E0RJB9q9sbdJCCC-.jpg",
    "https://proskillsbasketball.com/wp-content/uploads/2015/10/Screenshot-2025-05-29-at-1.52.41%E2%80%AFPM.png",
    
    # Query 2: basketball player shooting pose
    "https://i.pinimg.com/474x/dd/98/c1/dd98c1149ff7b442aa31f0b96c6d949c.jpg",
    "https://i.pinimg.com/736x/44/48/a9/4448a991fd044b671a9cea7180cfe46f.jpg",
    "https://media.gettyimages.com/id/534864947/photo/basketball-player-in-jump-shot.jpg?s=612x612&w=gi&k=20&c=0G4h5AHXbgE1tBLv0cbpG72J0l52_5FT0K3VSUh6Fas=",
    "https://media.gettyimages.com/id/113271197/photo/basketball-player-shooting-jump-shot-in-arena.jpg?s=612x612&w=gi&k=20&c=XgB5d-shdarEagtD7oqB3nUgc1kVZhdS1KTkfjLkAfQ=",
    "https://media.istockphoto.com/id/480237453/photo/african-man-basketball-player-free-throw-silhouette.jpg?s=612x612&w=0&k=20&c=bQUbaLxjEQnh8-sRCMccpeOUfITcwAz_poY5HExfG-Y=",
    "https://media.newyorker.com/photos/59097513c14b3c606c108738/master/pass/Malla-HowtheJumpShotBroughtIndividualismtoBasketball.jpg",
    "https://c8.alamy.com/comp/T72261/full-length-shot-of-a-male-basketball-player-shooting-a-ball-isolated-on-white-background-T72261.jpg",
    "https://media.istockphoto.com/id/490313359/photo/man-shooting-at-the-hoop.jpg?s=612x612&w=0&k=20&c=ZNgq3EHWgK7-Q1cThaL6iWjjoQGtC5cgwt2-3oMjD00=",
    "https://as2.ftcdn.net/jpg/05/41/16/27/1000_F_541162769_KMIOM5Ja3oTNBRkKIvOKUF2V4VJ1Cw0V.jpg",
    "https://media.gettyimages.com/id/91495680/photo/african-basketball-player-shooting-basketball.jpg?s=612x612&w=gi&k=20&c=INyMZDwD056rl51j2w4AQvkEF8230dibKBtOSWWvYf4=",
    
    # Query 3: basketball free throw technique
    "https://i.ytimg.com/vi/TI5MeQuMWqA/maxresdefault.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/0/0b/NBA_2021_-_Wizards_vs._Hawks%2C_Oct_29_2021_133_%2851637533444%29.jpg",
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhsDkkAIO0ltEif6qwyyHg7n5dD_quqKyXZ-EWitqofCBt34dYSjRHUPuMfgheq9goWN0Cx5ufJwnlwpUd31kSMvnfBy3ZZFnxLuI-WbA9Rf4qNGOWeQg9GtQB67toXtuqAuEKXkY9UpRc/s1600/Free+throw.png",
    "https://i.ytimg.com/vi/Krl14XmWs5I/hqdefault.jpg",
    "https://www.wikihow.com/images/thumb/2/23/Shoot-a-Free-Throw-Step-12-Version-4.jpg/v4-460px-Shoot-a-Free-Throw-Step-12-Version-4.jpg",
    "https://www.breakthroughbasketball.com/fundamentals/Graphics/free_throw.gif",
    "https://www.wikihow.com/images/thumb/8/86/Shoot-a-Free-Throw-Step-1-Version-5.jpg/v4-460px-Shoot-a-Free-Throw-Step-1-Version-5.jpg",
    "https://cdn.ussportscamps.com/craftcms/media/images/basketball/nike/tips/how-to-shoot-a-free-throw.jpg",
    
    # Query 4: basketball jump shot photos
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Stephen_Curry_%2833140701266%29.jpg/1200px-Stephen_Curry_%2833140701266%29.jpg",
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhvJDqwFISSQJwXg1HxQW0CyV6gAq13u9Kik9Wld03v6oNrXBqO1VNhDIHmAzdnIJEn9JVoyLmRMOceGkt1qx07m_Jl7M1uRUfZA7qw_fMBqQl3JQub7QOzLaMMLJ1avGSk6Hh9zhrh-M0/s640/s.curry.jpg",
    "https://i.ytimg.com/vi/PI4dQ85MZIE/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBQmYpFuhiWbV5hFX3K-Uoa4SHI_g",
    "https://static.owayo-cdn.com/newhp/img/magazin/jumpshotbasketball/jump-shot-basketball-670px.jpg",
    "https://content.instructables.com/F72/IO3Q/IM28WAPI/F72IO3QIM28WAPI.jpg?auto=webp&fit=bounds&frame=1&height=1024",
    "https://c8.alamy.com/comp/PANJ6W/kenneth-faried-usa-basketball-fiba-world-cup-spain-2014-PANJ6W.jpg",
    "https://legacymedia.sportsplatform.io/img/images/photos/003/358/979/hi-res-d92b6dc2e02c2456b4a8944aa8cb4003_crop_north.jpg?1429046995&w=630&h=420",
    "https://media.gettyimages.com/id/535044733/photo/basketball-player-in-jump-shot.jpg?s=612x612&w=gi&k=20&c=C4pKWOJiR13HLDFR8u9lovnUR7quxbNcsim_BwiWhvc=",
    "https://cdn.ussportscamps.com/craftcms/media/images/basketball/nike/tips/how-to-master-the-jump-shot.jpg",
    
    # Query 5: basketball shooting stance pictures
    "https://www.breakthroughbasketball.com/fundamentals/graphics/shooting-secret-stephen-curry-image-005.jpg",
    "https://news-archive-assets.ku.edu/data/9e/4c/01hh4y6qwampgakpevt5wvcv5p.jpg",
    "https://content.instructables.com/F1C/LE1U/KZCPHH0C/F1CLE1UKZCPHH0C.jpg?auto=webp",
]

def download_images():
    """Download all images"""
    raw_dir = Path('raw_images')
    raw_dir.mkdir(exist_ok=True)
    
    stats = {
        'success': 0,
        'failed': 0,
        'duplicates': 0
    }
    
    collected_hashes = set()
    
    print("🏀 Downloading Basketball Shooting Images")
    print("="*60)
    
    for idx, url in enumerate(tqdm(IMAGE_URLS, desc="Downloading")):
        try:
            response = requests.get(url, timeout=30, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            response.raise_for_status()
            
            # Check for duplicate
            image_hash = hashlib.md5(response.content).hexdigest()
            if image_hash in collected_hashes:
                stats['duplicates'] += 1
                continue
            
            collected_hashes.add(image_hash)
            
            # Determine file extension
            content_type = response.headers.get('content-type', '')
            if 'jpeg' in content_type or 'jpg' in content_type:
                ext = 'jpg'
            elif 'png' in content_type:
                ext = 'png'
            elif 'gif' in content_type:
                ext = 'gif'
            else:
                ext = 'jpg'  # default
            
            # Save image
            filename = f"web_img_{idx:03d}_{image_hash[:8]}.{ext}"
            filepath = raw_dir / filename
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            stats['success'] += 1
            time.sleep(0.2)  # Rate limiting
            
        except Exception as e:
            stats['failed'] += 1
            print(f"\n❌ Failed to download image {idx}: {e}")
    
    print("\n" + "="*60)
    print("📈 DOWNLOAD SUMMARY")
    print("="*60)
    print(f"✅ Success:      {stats['success']:3d} images")
    print(f"⏭️  Duplicates:   {stats['duplicates']:3d} skipped")
    print(f"❌ Failed:       {stats['failed']:3d} images")
    print("="*60)
    print(f"📁 Images saved to: {raw_dir.absolute()}")
    
    return stats

if __name__ == '__main__':
    download_images()
