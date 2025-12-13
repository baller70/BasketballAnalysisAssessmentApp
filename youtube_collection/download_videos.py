#!/usr/bin/env python3
"""
YouTube Video Downloader for Basketball Shooting Tutorials
Downloads high-quality basketball shooting form videos
"""

import os
import json
import subprocess
from datetime import datetime

# Target YouTube video URLs
# These are carefully selected basketball shooting tutorial videos
YOUTUBE_VIDEOS = [
    {
        "url": "https://www.youtube.com/watch?v=xO6kYDEnHk4",
        "title": "Perfect Basketball Shooting Form Tutorial",
        "description": "Pro shooting form breakdown"
    },
    {
        "url": "https://www.youtube.com/watch?v=7pAyx-4X5rA",
        "title": "How to Shoot a Basketball Perfectly",
        "description": "Step-by-step shooting mechanics"
    },
    {
        "url": "https://www.youtube.com/watch?v=fHQGSFCJEVg",
        "title": "Basketball Shooting Drills and Form",
        "description": "Professional shooting coach tutorial"
    },
    {
        "url": "https://www.youtube.com/watch?v=Gp8xxSyySYw",
        "title": "Improve Your Shot - Basketball Shooting Form",
        "description": "Detailed shooting form analysis"
    }
]

OUTPUT_DIR = "/home/ubuntu/basketball_app/youtube_collection/youtube_videos"

def download_video(video_info, index):
    """Download a single video using yt-dlp"""
    print(f"\n{'='*60}")
    print(f"Downloading video {index + 1}/{len(YOUTUBE_VIDEOS)}")
    print(f"Title: {video_info['title']}")
    print(f"URL: {video_info['url']}")
    print(f"{'='*60}\n")
    
    # Output filename
    output_template = os.path.join(OUTPUT_DIR, f"video_{index + 1}_%(id)s.%(ext)s")
    
    # yt-dlp command with options for best quality under 1080p
    cmd = [
        "yt-dlp",
        "-f", "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best",
        "--merge-output-format", "mp4",
        "-o", output_template,
        "--no-playlist",
        video_info["url"]
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        
        if result.returncode == 0:
            print(f"✅ Successfully downloaded: {video_info['title']}")
            
            # Find the downloaded file
            downloaded_files = [f for f in os.listdir(OUTPUT_DIR) if f.startswith(f"video_{index + 1}_")]
            if downloaded_files:
                filepath = os.path.join(OUTPUT_DIR, downloaded_files[0])
                
                # Get video duration
                duration_cmd = [
                    "ffprobe", "-v", "error",
                    "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    filepath
                ]
                duration_result = subprocess.run(duration_cmd, capture_output=True, text=True)
                duration = float(duration_result.stdout.strip()) if duration_result.returncode == 0 else 0
                
                return {
                    "success": True,
                    "index": index + 1,
                    "url": video_info["url"],
                    "title": video_info["title"],
                    "description": video_info["description"],
                    "filepath": filepath,
                    "filename": downloaded_files[0],
                    "duration_seconds": duration,
                    "duration_formatted": f"{int(duration // 60)}m {int(duration % 60)}s",
                    "downloaded_at": datetime.now().isoformat()
                }
        else:
            print(f"❌ Failed to download: {video_info['title']}")
            print(f"Error: {result.stderr}")
            return {"success": False, "url": video_info["url"], "error": result.stderr}
            
    except subprocess.TimeoutExpired:
        print(f"⏰ Timeout downloading: {video_info['title']}")
        return {"success": False, "url": video_info["url"], "error": "Timeout after 10 minutes"}
    except Exception as e:
        print(f"❌ Exception downloading: {video_info['title']}")
        print(f"Error: {str(e)}")
        return {"success": False, "url": video_info["url"], "error": str(e)}

def main():
    """Main download function"""
    print("\n" + "="*60)
    print("🏀 BASKETBALL SHOOTING TUTORIAL VIDEO DOWNLOADER")
    print("="*60 + "\n")
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Download all videos
    results = []
    for index, video_info in enumerate(YOUTUBE_VIDEOS):
        result = download_video(video_info, index)
        results.append(result)
    
    # Save metadata
    metadata_file = os.path.join(OUTPUT_DIR, "download_metadata.json")
    with open(metadata_file, 'w') as f:
        json.dump({
            "downloaded_at": datetime.now().isoformat(),
            "total_videos": len(YOUTUBE_VIDEOS),
            "successful_downloads": len([r for r in results if r.get("success")]),
            "failed_downloads": len([r for r in results if not r.get("success")]),
            "videos": results
        }, f, indent=2)
    
    # Print summary
    print("\n" + "="*60)
    print("📊 DOWNLOAD SUMMARY")
    print("="*60)
    
    successful = [r for r in results if r.get("success")]
    failed = [r for r in results if not r.get("success")]
    
    print(f"\n✅ Successful: {len(successful)}/{len(YOUTUBE_VIDEOS)}")
    print(f"❌ Failed: {len(failed)}/{len(YOUTUBE_VIDEOS)}")
    
    if successful:
        print("\n📹 Downloaded Videos:")
        total_duration = 0
        for video in successful:
            print(f"  {video['index']}. {video['title']}")
            print(f"     Duration: {video['duration_formatted']}")
            print(f"     File: {video['filename']}")
            total_duration += video['duration_seconds']
        
        print(f"\n⏱️  Total Duration: {int(total_duration // 60)}m {int(total_duration % 60)}s")
        print(f"📁 Saved to: {OUTPUT_DIR}")
        print(f"📋 Metadata: {metadata_file}")
    
    if failed:
        print("\n❌ Failed Downloads:")
        for video in failed:
            print(f"  - {video['url']}")
            print(f"    Error: {video.get('error', 'Unknown error')}")
    
    print("\n" + "="*60 + "\n")
    
    return len(successful) > 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
