#!/usr/bin/env python3
"""
Scrape Basketball Shooting Images using Playwright

Uses browser automation to download images from various sources
that block direct requests.

Requirements:
    pip install playwright
    playwright install chromium
"""

import os
import sys
import time
import asyncio
import hashlib
from pathlib import Path
from urllib.parse import urlparse, urljoin
import json

# Paths
BASE_DIR = Path(__file__).parent.parent
TRAINING_DIR = BASE_DIR / "training_data"
RAW_DIR = TRAINING_DIR / "raw"
UNCLASSIFIED_DIR = RAW_DIR / "unclassified"

# Target: 100 images total
TARGET_IMAGES = 100

# Search queries
SEARCH_QUERIES = [
    "basketball player shooting form",
    "Stephen Curry shooting",
    "Klay Thompson shooting form",
    "basketball three point shot",
    "basketball layup shooting",
    "high school basketball shooting",
    "youth basketball shooting form",
    "basketball training shooting drill",
    "basketball player aiming shot",
    "professional basketball shooter",
]


async def download_google_images(page, query: str, max_images: int = 20) -> int:
    """Download images from Google Images search."""
    downloaded = 0
    
    try:
        # Navigate to Google Images
        search_url = f"https://www.google.com/search?q={query}&tbm=isch"
        await page.goto(search_url, wait_until="networkidle", timeout=30000)
        
        # Wait for images to load
        await page.wait_for_selector("img[data-src]", timeout=10000)
        
        # Scroll to load more images
        for _ in range(3):
            await page.evaluate("window.scrollBy(0, 1000)")
            await asyncio.sleep(1)
        
        # Get image elements
        images = await page.query_selector_all("img[data-src], img[src*='gstatic']")
        
        for i, img in enumerate(images[:max_images * 2]):  # Get extra in case some fail
            if downloaded >= max_images:
                break
            
            try:
                # Get image URL
                src = await img.get_attribute("data-src") or await img.get_attribute("src")
                
                if not src or "data:image" in src or len(src) < 20:
                    continue
                
                # Skip tiny thumbnails
                if "=s" in src and any(x in src for x in ["=s64", "=s92", "=s128"]):
                    continue
                
                # Download image
                response = await page.context.request.get(src)
                if response.ok:
                    content = await response.body()
                    
                    if len(content) > 15000:  # At least 15KB
                        hash_suffix = hashlib.md5(src.encode()).hexdigest()[:8]
                        filename = f"google_{downloaded:03d}_{hash_suffix}.jpg"
                        filepath = UNCLASSIFIED_DIR / filename
                        
                        with open(filepath, "wb") as f:
                            f.write(content)
                        
                        print(f"    ✅ {filename}")
                        downloaded += 1
                        
            except Exception as e:
                continue
        
    except Exception as e:
        print(f"    ⚠️ Google search error: {str(e)[:50]}")
    
    return downloaded


async def download_bing_images(page, query: str, max_images: int = 20) -> int:
    """Download images from Bing Images search."""
    downloaded = 0
    
    try:
        search_url = f"https://www.bing.com/images/search?q={query}&form=HDRSC2"
        await page.goto(search_url, wait_until="networkidle", timeout=30000)
        
        # Wait and scroll
        await asyncio.sleep(2)
        for _ in range(3):
            await page.evaluate("window.scrollBy(0, 1000)")
            await asyncio.sleep(1)
        
        # Get images
        images = await page.query_selector_all("img.mimg")
        
        for img in images[:max_images * 2]:
            if downloaded >= max_images:
                break
            
            try:
                src = await img.get_attribute("src")
                if not src or "data:image" in src:
                    continue
                
                response = await page.context.request.get(src)
                if response.ok:
                    content = await response.body()
                    
                    if len(content) > 15000:
                        hash_suffix = hashlib.md5(src.encode()).hexdigest()[:8]
                        filename = f"bing_{downloaded:03d}_{hash_suffix}.jpg"
                        filepath = UNCLASSIFIED_DIR / filename
                        
                        with open(filepath, "wb") as f:
                            f.write(content)
                        
                        print(f"    ✅ {filename}")
                        downloaded += 1
                        
            except:
                continue
                
    except Exception as e:
        print(f"    ⚠️ Bing search error: {str(e)[:50]}")
    
    return downloaded


async def download_duckduckgo_images(page, query: str, max_images: int = 20) -> int:
    """Download images from DuckDuckGo Images."""
    downloaded = 0
    
    try:
        search_url = f"https://duckduckgo.com/?q={query}&iax=images&ia=images"
        await page.goto(search_url, wait_until="networkidle", timeout=30000)
        
        await asyncio.sleep(3)
        
        # Scroll to load
        for _ in range(3):
            await page.evaluate("window.scrollBy(0, 1000)")
            await asyncio.sleep(1)
        
        # Get thumbnail images and click to get full size
        tiles = await page.query_selector_all(".tile--img__img")
        
        for tile in tiles[:max_images]:
            if downloaded >= max_images:
                break
            
            try:
                src = await tile.get_attribute("src") or await tile.get_attribute("data-src")
                if not src:
                    continue
                
                # DDG uses proxy URLs, try to get actual image
                response = await page.context.request.get(src)
                if response.ok:
                    content = await response.body()
                    
                    if len(content) > 10000:
                        hash_suffix = hashlib.md5(src.encode()).hexdigest()[:8]
                        filename = f"ddg_{downloaded:03d}_{hash_suffix}.jpg"
                        filepath = UNCLASSIFIED_DIR / filename
                        
                        with open(filepath, "wb") as f:
                            f.write(content)
                        
                        print(f"    ✅ {filename}")
                        downloaded += 1
                        
            except:
                continue
                
    except Exception as e:
        print(f"    ⚠️ DDG search error: {str(e)[:50]}")
    
    return downloaded


async def download_unsplash_images(page, query: str, max_images: int = 15) -> int:
    """Download images from Unsplash."""
    downloaded = 0
    
    try:
        search_url = f"https://unsplash.com/s/photos/{query.replace(' ', '-')}"
        await page.goto(search_url, wait_until="networkidle", timeout=30000)
        
        await asyncio.sleep(3)
        
        # Scroll
        for _ in range(2):
            await page.evaluate("window.scrollBy(0, 1000)")
            await asyncio.sleep(1)
        
        # Get images
        images = await page.query_selector_all("img[srcset]")
        
        for img in images[:max_images * 2]:
            if downloaded >= max_images:
                break
            
            try:
                srcset = await img.get_attribute("srcset")
                if not srcset:
                    continue
                
                # Parse srcset to get largest image
                parts = srcset.split(",")
                urls = []
                for part in parts:
                    part = part.strip()
                    if " " in part:
                        url = part.split(" ")[0]
                        urls.append(url)
                
                if urls:
                    # Get the last (usually largest) URL
                    src = urls[-1] if len(urls) > 1 else urls[0]
                    
                    response = await page.context.request.get(src)
                    if response.ok:
                        content = await response.body()
                        
                        if len(content) > 20000:
                            hash_suffix = hashlib.md5(src.encode()).hexdigest()[:8]
                            filename = f"unsplash_{downloaded:03d}_{hash_suffix}.jpg"
                            filepath = UNCLASSIFIED_DIR / filename
                            
                            with open(filepath, "wb") as f:
                                f.write(content)
                            
                            print(f"    ✅ {filename}")
                            downloaded += 1
                            
            except:
                continue
                
    except Exception as e:
        print(f"    ⚠️ Unsplash error: {str(e)[:50]}")
    
    return downloaded


async def main():
    print("="*60)
    print("🏀 Automated Basketball Image Scraper (Playwright)")
    print("="*60)
    
    # Create directories
    UNCLASSIFIED_DIR.mkdir(parents=True, exist_ok=True)
    
    # Count existing images
    existing = len(list(UNCLASSIFIED_DIR.glob("*.*")))
    print(f"\n📁 Existing images: {existing}")
    print(f"🎯 Target: {TARGET_IMAGES} images")
    print(f"📥 Need to download: {max(0, TARGET_IMAGES - existing)} more")
    
    if existing >= TARGET_IMAGES:
        print("\n✅ Already have enough images!")
        return
    
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print("\n❌ Playwright not installed. Installing...")
        os.system("pip install playwright")
        os.system("playwright install chromium")
        from playwright.async_api import async_playwright
    
    total_downloaded = 0
    
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled"]
        )
        
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1920, "height": 1080}
        )
        
        page = await context.new_page()
        
        for query in SEARCH_QUERIES:
            current_count = len(list(UNCLASSIFIED_DIR.glob("*.*")))
            if current_count >= TARGET_IMAGES:
                break
            
            print(f"\n🔍 Searching: '{query}'")
            
            # Try multiple sources
            print("  📷 Google Images...")
            downloaded = await download_google_images(page, query, max_images=10)
            total_downloaded += downloaded
            
            await asyncio.sleep(2)
            
            print("  📷 Bing Images...")
            downloaded = await download_bing_images(page, query, max_images=8)
            total_downloaded += downloaded
            
            await asyncio.sleep(2)
            
            print("  📷 Unsplash...")
            downloaded = await download_unsplash_images(page, query, max_images=5)
            total_downloaded += downloaded
            
            await asyncio.sleep(2)
        
        await browser.close()
    
    # Final count
    final_count = len(list(UNCLASSIFIED_DIR.glob("*.*")))
    
    print("\n" + "="*60)
    print("📊 SCRAPING COMPLETE")
    print("="*60)
    print(f"  📥 Downloaded this session: {total_downloaded}")
    print(f"  📁 Total images: {final_count}")
    print(f"  📂 Location: {UNCLASSIFIED_DIR}")
    
    if final_count >= TARGET_IMAGES:
        print(f"\n✅ Target of {TARGET_IMAGES} images reached!")
    else:
        print(f"\n⚠️ Need {TARGET_IMAGES - final_count} more images")
    
    print("="*60)


if __name__ == "__main__":
    asyncio.run(main())




