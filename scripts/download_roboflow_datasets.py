#!/usr/bin/env python3
"""
Download Basketball Datasets from RoboFlow Universe

Downloads pre-existing basketball datasets that can be used for training.
These are free, publicly available datasets.

Usage:
    python download_roboflow_datasets.py
"""

import os
import sys
import json
import zipfile
import requests
from pathlib import Path
import shutil

# Paths
BASE_DIR = Path(__file__).parent.parent
TRAINING_DIR = BASE_DIR / "training_data"
RAW_DIR = TRAINING_DIR / "raw"
DATASETS_DIR = TRAINING_DIR / "datasets"

# RoboFlow API key (optional for public datasets)
ROBOFLOW_API_KEY = os.environ.get("ROBOFLOW_API_KEY", "")

# Public basketball datasets on RoboFlow Universe
# These can be downloaded without API key using direct links
ROBOFLOW_DATASETS = [
    {
        "name": "basketball-players",
        "workspace": "roboflow-universe-projects",
        "project": "basketball-players-fy4c2",
        "version": 13,
        "format": "coco",
        "description": "Basketball players with ball detection",
    },
    {
        "name": "basketball-detection",
        "workspace": "baketball",  # Note: typo in original
        "project": "basketball-8gnzi",
        "version": 1,
        "format": "coco",
        "description": "Basketball object detection",
    },
    {
        "name": "basketball-w2xcw",
        "workspace": "ownprojects",
        "project": "basketball-w2xcw",
        "version": 1,
        "format": "coco",
        "description": "Basketball detection model dataset",
    },
]


def download_roboflow_dataset(dataset_info: dict, api_key: str = "") -> bool:
    """
    Download a dataset from RoboFlow Universe.
    """
    name = dataset_info["name"]
    workspace = dataset_info["workspace"]
    project = dataset_info["project"]
    version = dataset_info["version"]
    fmt = dataset_info["format"]
    
    print(f"\n📦 Downloading: {name}")
    print(f"   Project: {workspace}/{project} v{version}")
    
    output_dir = DATASETS_DIR / name
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Try to download using RoboFlow API
    if api_key:
        try:
            url = f"https://api.roboflow.com/{workspace}/{project}/{version}/{fmt}"
            params = {"api_key": api_key}
            
            response = requests.get(url, params=params, timeout=60)
            response.raise_for_status()
            
            data = response.json()
            download_url = data.get("export", {}).get("link")
            
            if download_url:
                return download_and_extract(download_url, output_dir, name)
        except Exception as e:
            print(f"   ⚠️ API download failed: {e}")
    
    # Try alternative download method - direct export URL
    try:
        # RoboFlow public dataset URL format
        export_url = f"https://universe.roboflow.com/ds/{project}?key={api_key}" if api_key else None
        
        if not export_url:
            print(f"   ⚠️ Need API key for direct download")
            print(f"   📋 Manual download: https://universe.roboflow.com/{workspace}/{project}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    
    return False


def download_and_extract(url: str, output_dir: Path, name: str) -> bool:
    """Download and extract a zip file."""
    try:
        zip_path = output_dir / f"{name}.zip"
        
        print(f"   📥 Downloading from: {url[:50]}...")
        response = requests.get(url, stream=True, timeout=120)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        
        with open(zip_path, 'wb') as f:
            downloaded = 0
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                downloaded += len(chunk)
                if total_size:
                    pct = (downloaded / total_size) * 100
                    print(f"\r   📥 Progress: {pct:.1f}%", end="")
        
        print(f"\n   📂 Extracting...")
        with zipfile.ZipFile(zip_path, 'r') as zf:
            zf.extractall(output_dir)
        
        # Clean up zip
        zip_path.unlink()
        
        print(f"   ✅ Extracted to: {output_dir}")
        return True
        
    except Exception as e:
        print(f"   ❌ Download failed: {e}")
        return False


def download_github_dataset(url: str, name: str) -> bool:
    """Download dataset from GitHub."""
    output_dir = DATASETS_DIR / name
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n📦 Downloading from GitHub: {name}")
    
    try:
        # Clone or download
        import subprocess
        
        # Try git clone first
        result = subprocess.run(
            ["git", "clone", "--depth", "1", url, str(output_dir)],
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            print(f"   ✅ Cloned to: {output_dir}")
            return True
        else:
            print(f"   ⚠️ Git clone failed, trying direct download...")
            
            # Try downloading as zip
            if "github.com" in url:
                zip_url = url.replace("github.com", "codeload.github.com") + "/zip/refs/heads/main"
                return download_and_extract(zip_url, output_dir, name)
                
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    return False


def search_kaggle_datasets():
    """Search for basketball datasets on Kaggle."""
    print("\n🔍 Searching Kaggle for basketball datasets...")
    
    # Note: Requires kaggle API credentials
    try:
        import subprocess
        result = subprocess.run(
            ["kaggle", "datasets", "list", "-s", "basketball pose", "--csv"],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0 and result.stdout:
            print("   Found datasets:")
            for line in result.stdout.strip().split('\n')[1:5]:  # First 4 results
                parts = line.split(',')
                if parts:
                    print(f"   - {parts[0]}")
            return True
    except FileNotFoundError:
        print("   ⚠️ Kaggle CLI not installed (pip install kaggle)")
    except Exception as e:
        print(f"   ⚠️ Kaggle search failed: {e}")
    
    return False


def copy_images_to_training(dataset_dir: Path, phase: str = "unclassified"):
    """Copy images from dataset to training directory."""
    target_dir = RAW_DIR / phase
    target_dir.mkdir(parents=True, exist_ok=True)
    
    copied = 0
    
    # Find all images in dataset
    for ext in ["*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG"]:
        for img_path in dataset_dir.rglob(ext):
            # Skip very small images
            if img_path.stat().st_size < 10000:
                continue
            
            # Copy with unique name
            new_name = f"{phase}_{dataset_dir.name}_{copied:04d}{img_path.suffix}"
            target_path = target_dir / new_name
            
            shutil.copy2(img_path, target_path)
            copied += 1
    
    return copied


def main():
    print("="*60)
    print("🏀 Basketball Dataset Downloader")
    print("="*60)
    
    DATASETS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Check for API key
    if ROBOFLOW_API_KEY:
        print(f"✅ RoboFlow API key found")
    else:
        print("⚠️ No ROBOFLOW_API_KEY set")
        print("   Get a free key at: https://app.roboflow.com/settings/api")
        print("   export ROBOFLOW_API_KEY='your_key_here'")
    
    # Try to download from RoboFlow
    downloaded_datasets = []
    
    for dataset in ROBOFLOW_DATASETS:
        success = download_roboflow_dataset(dataset, ROBOFLOW_API_KEY)
        if success:
            downloaded_datasets.append(dataset["name"])
    
    # Try GitHub datasets
    github_datasets = [
        ("https://github.com/open-starlab/TrackID3x3", "trackid3x3"),
    ]
    
    for url, name in github_datasets:
        if download_github_dataset(url, name):
            downloaded_datasets.append(name)
    
    # Search Kaggle
    search_kaggle_datasets()
    
    # Copy downloaded images to training directory
    print("\n" + "="*60)
    print("📋 Processing Downloaded Datasets")
    print("="*60)
    
    total_images = 0
    
    for dataset_name in downloaded_datasets:
        dataset_dir = DATASETS_DIR / dataset_name
        if dataset_dir.exists():
            copied = copy_images_to_training(dataset_dir, "unclassified")
            print(f"   {dataset_name}: {copied} images copied")
            total_images += copied
    
    # Also check for any images already in datasets folder
    for dataset_dir in DATASETS_DIR.iterdir():
        if dataset_dir.is_dir() and dataset_dir.name not in downloaded_datasets:
            copied = copy_images_to_training(dataset_dir, "unclassified")
            if copied > 0:
                print(f"   {dataset_dir.name}: {copied} images copied")
                total_images += copied
    
    print("\n" + "="*60)
    print("📊 SUMMARY")
    print("="*60)
    print(f"   📁 Total images collected: {total_images}")
    print(f"   📂 Location: {RAW_DIR / 'unclassified'}")
    
    if total_images == 0:
        print("\n⚠️ No images downloaded automatically.")
        print("\n📋 To download RoboFlow datasets manually:")
        print("   1. Go to: https://universe.roboflow.com")
        print("   2. Search for 'basketball shooting'")
        print("   3. Click 'Download Dataset' → Select format → Download")
        print("   4. Extract to: training_data/datasets/")
        print("   5. Run this script again to copy images")
    
    print("="*60)


if __name__ == "__main__":
    main()
