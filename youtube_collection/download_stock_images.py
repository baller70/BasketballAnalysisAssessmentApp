#!/usr/bin/env python3
"""
Download Basketball Shooting Images from Stock Photo Sources
Alternative to YouTube video extraction
"""

import os
import json
import requests
from datetime import datetime
from urllib.parse import urlparse
import time

# Curated image URLs from web search (shooting form images only)
BASKETBALL_IMAGES = [
    # Full body shooting form
    "https://upload.wikimedia.org/wikipedia/commons/0/0b/NBA_2021_-_Wizards_vs._Hawks%2C_Oct_29_2021_133_%2851637533444%29.jpg",
    "https://wp.cavsnation.com/wp-content/uploads/2017/12/kyle-korver.jpg?w=1200",
    "https://pbs.twimg.com/media/Dxfn5woX4AASUcA.jpg",
    "https://i.pinimg.com/736x/df/ce/da/dfcedab251e5bfa5b6568b84ee20350a.jpg",
    "https://hezination.com/wp-content/uploads/2023/11/Steph-Curry-feet-placement-when-shooting-the-basketball-hezination-1.webp",
    "https://basketballforcoaches.com/wp-content/uploads/2017/07/set-up.jpg",
    
    # Free throw technique
    "https://content.instructables.com/FRU/M3F1/HDYZISZS/FRUM3F1HDYZISZS.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/e/eb/Shaquille_O%27Neal_Free_Throw.jpg",
    "http://www.shockdoctor.com/cdn/shop/articles/pexels-pnw-prod-8979936.jpg",
    "https://www.basketballforcoaches.com/wp-content/uploads/2013/02/free-throw-drill.jpeg",
    "https://pub.mdpi-res.com/biomechanics/biomechanics-02-00028/article_deploy/html/images/biomechanics-02-00028-g001.png",
    
    # Jump shot form
    "https://www.frontiersin.org/files/Articles/658102/fpsyg-12-658102-HTML/image_m/fpsyg-12-658102-g001.jpg",
    "https://youreachiteach.com/wp-content/uploads/2025/05/image-of-proper-jumpshot-form.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Nikola_Jokic_%2851915127158%29.jpg/250px-Nikola_Jokic_%2851915127158%29.jpg",
    
    # Shooting stance tutorials
    "https://basketballforcoaches.com/wp-content/uploads/2017/07/feet-turn.jpg",
    "https://basketballforcoaches.com/wp-content/uploads/2017/07/hand-flick.jpg",
    "https://basketballforcoaches.com/wp-content/uploads/2017/07/wrist-wrinkle.jpg",
    "https://basketballforcoaches.com/wp-content/uploads/2017/07/hand-placement.jpg",
]

OUTPUT_DIR = "/home/ubuntu/basketball_app/youtube_collection/extracted_frames"

def download_image(url, index):
    """Download a single image"""
    print(f"Downloading image {index + 1}/{len(BASKETBALL_IMAGES)}...")
    print(f"URL: {url}")
    
    try:
        # Set headers to mimic a browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=30)
        
        if response.status_code == 200:
            # Get file extension from URL or content type
            parsed_url = urlparse(url)
            ext = os.path.splitext(parsed_url.path)[1]
            if not ext or ext not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
                content_type = response.headers.get('content-type', '')
                if 'jpeg' in content_type or 'jpg' in content_type:
                    ext = '.jpg'
                elif 'png' in content_type:
                    ext = '.png'
                elif 'webp' in content_type:
                    ext = '.webp'
                else:
                    ext = '.jpg'  # default
            
            # Save image
            filename = f"stock_image_{index + 1:03d}{ext}"
            filepath = os.path.join(OUTPUT_DIR, filename)
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            # Get image size
            file_size = os.path.getsize(filepath)
            
            print(f"✅ Downloaded: {filename} ({file_size / 1024:.1f} KB)")
            
            return {
                "success": True,
                "index": index + 1,
                "url": url,
                "filename": filename,
                "filepath": filepath,
                "file_size_bytes": file_size,
                "downloaded_at": datetime.now().isoformat()
            }
        else:
            print(f"❌ Failed: HTTP {response.status_code}")
            return {"success": False, "url": url, "error": f"HTTP {response.status_code}"}
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {"success": False, "url": url, "error": str(e)}

def main():
    """Main download function"""
    print("\n" + "="*60)
    print("🏀 BASKETBALL SHOOTING IMAGE DOWNLOADER")
    print("="*60 + "\n")
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Download all images
    results = []
    for index, url in enumerate(BASKETBALL_IMAGES):
        result = download_image(url, index)
        results.append(result)
        time.sleep(0.5)  # Be polite to servers
        print()
    
    # Save metadata
    metadata_file = os.path.join(OUTPUT_DIR, "download_metadata.json")
    with open(metadata_file, 'w') as f:
        json.dump({
            "downloaded_at": datetime.now().isoformat(),
            "total_images": len(BASKETBALL_IMAGES),
            "successful_downloads": len([r for r in results if r.get("success")]),
            "failed_downloads": len([r for r in results if not r.get("success")]),
            "images": results
        }, f, indent=2)
    
    # Print summary
    print("="*60)
    print("📊 DOWNLOAD SUMMARY")
    print("="*60)
    
    successful = [r for r in results if r.get("success")]
    failed = [r for r in results if not r.get("success")]
    
    print(f"\n✅ Successful: {len(successful)}/{len(BASKETBALL_IMAGES)}")
    print(f"❌ Failed: {len(failed)}/{len(BASKETBALL_IMAGES)}")
    
    if successful:
        print(f"\n📁 Downloaded Images: {OUTPUT_DIR}")
        total_size = sum(r['file_size_bytes'] for r in successful)
        print(f"💾 Total Size: {total_size / 1024 / 1024:.2f} MB")
        print(f"📋 Metadata: {metadata_file}")
    
    if failed:
        print("\n❌ Failed Downloads:")
        for img in failed:
            print(f"  - {img['url'][:60]}...")
            print(f"    Error: {img.get('error', 'Unknown')}")
    
    print("\n" + "="*60 + "\n")
    
    return len(successful) > 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
