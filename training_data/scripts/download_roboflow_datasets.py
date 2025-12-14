#!/usr/bin/env python3
"""
Download basketball datasets from RoboFlow Universe
"""
import os
from roboflow import Roboflow

# Initialize RoboFlow with API key
ROBOFLOW_API_KEY = "rf_qisv7ZQd27SzKITWRc2blZZo5F83"  # Publishable key
rf = Roboflow(api_key=ROBOFLOW_API_KEY)

# Define datasets to download from RoboFlow Universe
# Format: (workspace, project, version)
DATASETS = [
    # Basketball detection and pose estimation
    ("basketball-tpgvy", "basketball-players-detection", 2),
    ("roboflow-100", "basketball-players", 2),
    ("team-roboflow", "basketball-shot-detection", 1),
    ("basketball-h0i7m", "basketball-shooting-form", 1),
]

output_dir = "/home/ubuntu/basketball_app/training_data/raw_downloads/roboflow"
os.makedirs(output_dir, exist_ok=True)

def download_dataset(workspace, project, version):
    """Download a dataset from RoboFlow Universe"""
    try:
        print(f"\n{'='*60}")
        print(f"Downloading: {workspace}/{project} v{version}")
        print(f"{'='*60}")
        
        # Get the project
        full_project_name = f"{workspace}/{project}"
        project_obj = rf.workspace(workspace).project(project)
        dataset = project_obj.version(version)
        
        # Download in COCO format for maximum compatibility
        dataset_path = os.path.join(output_dir, f"{workspace}_{project}_v{version}")
        dataset.download("coco", location=dataset_path)
        
        print(f"✓ Successfully downloaded to: {dataset_path}")
        return dataset_path
    except Exception as e:
        print(f"✗ Error downloading {workspace}/{project}: {str(e)}")
        # Try alternative public datasets
        try:
            print(f"  Trying alternative approach...")
            project_obj = rf.workspace().project(project)
            dataset = project_obj.version(version)
            dataset_path = os.path.join(output_dir, f"{project}_v{version}")
            dataset.download("coco", location=dataset_path)
            print(f"✓ Successfully downloaded to: {dataset_path}")
            return dataset_path
        except Exception as e2:
            print(f"✗ Alternative approach also failed: {str(e2)}")
            return None

if __name__ == "__main__":
    print("RoboFlow Basketball Dataset Downloader")
    print("="*60)
    
    successful_downloads = []
    failed_downloads = []
    
    for workspace, project, version in DATASETS:
        result = download_dataset(workspace, project, version)
        if result:
            successful_downloads.append((workspace, project, version))
        else:
            failed_downloads.append((workspace, project, version))
    
    # Summary
    print("\n" + "="*60)
    print("DOWNLOAD SUMMARY")
    print("="*60)
    print(f"Successful: {len(successful_downloads)}")
    print(f"Failed: {len(failed_downloads)}")
    
    if successful_downloads:
        print("\n✓ Successfully downloaded:")
        for ws, proj, ver in successful_downloads:
            print(f"  - {ws}/{proj} v{ver}")
    
    if failed_downloads:
        print("\n✗ Failed to download:")
        for ws, proj, ver in failed_downloads:
            print(f"  - {ws}/{proj} v{ver}")
