#!/usr/bin/env python3
"""
Monitor the progress of image collection from 4 APIs
"""

import os
import json
import time
from pathlib import Path
from datetime import datetime

BASE_DIR = Path("/home/ubuntu/basketball_app/training_data")
RAW_DIR = BASE_DIR / "raw_images"
METADATA_DIR = BASE_DIR / "metadata"

API_DIRS = {
    'pixabay': RAW_DIR / 'pixabay',
    'pexels': RAW_DIR / 'pexels',
    'unsplash': RAW_DIR / 'unsplash',
    'kaggle': RAW_DIR / 'kaggle'
}

TARGETS = {
    'pixabay': 400,
    'pexels': 400,
    'unsplash': 400,
    'kaggle': 300
}


def count_images(directory: Path) -> int:
    """Count images in a directory"""
    if not directory.exists():
        return 0
    return len(list(directory.glob('*.jpg'))) + len(list(directory.glob('*.png')))


def load_metadata(api_name: str) -> dict:
    """Load metadata for an API"""
    metadata_file = METADATA_DIR / f"{api_name}_metadata.json"
    if metadata_file.exists():
        with open(metadata_file, 'r') as f:
            return json.load(f)
    return {}


def print_progress():
    """Print current collection progress"""
    print("\n" + "="*80)
    print("🏀 BASKETBALL IMAGE COLLECTION - PROGRESS REPORT")
    print("="*80)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    total_downloaded = 0
    total_target = sum(TARGETS.values())
    
    print(f"{'API':<12} {'Downloaded':<12} {'Target':<10} {'Progress':<20} {'Status'}")
    print("-" * 80)
    
    for api_name, target in TARGETS.items():
        count = count_images(API_DIRS[api_name])
        total_downloaded += count
        
        percentage = (count / target * 100) if target > 0 else 0
        bar_length = int(percentage / 5)
        progress_bar = "█" * bar_length + "░" * (20 - bar_length)
        
        status = "✅" if count >= target else "🔄" if count > 0 else "⏳"
        
        print(f"{api_name:<12} {count:<12} {target:<10} {progress_bar} {percentage:5.1f}% {status}")
        
        # Show metadata info if available
        metadata = load_metadata(api_name)
        if metadata:
            failed = metadata.get('total_failed', 0)
            if failed > 0:
                print(f"             ⚠️  {failed} failed downloads")
    
    print("-" * 80)
    total_percentage = (total_downloaded / total_target * 100) if total_target > 0 else 0
    print(f"{'TOTAL':<12} {total_downloaded:<12} {total_target:<10} {'':<20} {total_percentage:5.1f}%")
    
    print("\n" + "="*80)
    print(f"Overall Progress: {total_downloaded} / {total_target} images")
    print(f"Target Achievement: {total_percentage:.1f}%")
    print("="*80 + "\n")
    
    # Check if collection is still running
    import subprocess
    try:
        result = subprocess.run(['pgrep', '-f', 'collect_basketball_images.py'], 
                              capture_output=True, text=True)
        if result.stdout.strip():
            print("✅ Collection script is RUNNING")
            print(f"   Process ID: {result.stdout.strip()}")
        else:
            print("⚠️  Collection script is NOT running")
            print("   Run: python3 collect_basketball_images.py")
    except Exception as e:
        print(f"Could not check process status: {e}")
    
    print()


def continuous_monitor(interval: int = 60):
    """Continuously monitor progress"""
    try:
        while True:
            os.system('clear' if os.name != 'nt' else 'cls')
            print_progress()
            print(f"📊 Refreshing every {interval} seconds... (Ctrl+C to stop)")
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\n\n👋 Monitoring stopped")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--watch':
        interval = int(sys.argv[2]) if len(sys.argv) > 2 else 60
        continuous_monitor(interval)
    else:
        print_progress()
        print("💡 Tip: Use --watch [seconds] for continuous monitoring")
        print("   Example: python3 monitor_collection.py --watch 30")
