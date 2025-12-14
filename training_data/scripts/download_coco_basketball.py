#!/usr/bin/env python3
"""
Download COCO dataset basketball/sports-related images
"""
import os
import json
import urllib.request
from pathlib import Path

# COCO 2017 annotations URL
COCO_ANNOTATIONS_URL = "http://images.cocodataset.org/annotations/annotations_trainval2017.zip"
COCO_IMAGES_URL = "http://images.cocodataset.org/zips/train2017.zip"

# Basketball-related COCO categories
BASKETBALL_CATEGORIES = [
    "person",          # ID: 1 - for pose detection
    "sports ball",     # ID: 37 - basketball detection
    # Note: COCO doesn't have specific "basketball" category, we'll filter manually
]

output_dir = "/home/ubuntu/basketball_app/training_data/raw_downloads/coco"
os.makedirs(output_dir, exist_ok=True)

print("COCO Basketball Dataset Downloader")
print("="*60)
print("\nNote: COCO dataset is very large (18GB+)")
print("We'll download a subset focused on sports and person images")
print("\nFor this training collection, we'll use existing basketball-specific")
print("datasets from Kaggle which are more targeted.")
print("="*60)

# Instead, let's use fiftyone library which has COCO subset capabilities
try:
    import fiftyone as fo
    import fiftyone.zoo as foz
    
    print("\n✓ FiftyOne library available")
    print("Downloading COCO validation subset with person and sports ball...")
    
    # Download only validation set (smaller) with specific classes
    dataset = foz.load_zoo_dataset(
        "coco-2017",
        split="validation",
        label_types=["detections"],
        classes=["person", "sports ball"],
        max_samples=500,  # Limit to 500 images
        dataset_name="coco_basketball_subset"
    )
    
    print(f"✓ Downloaded {len(dataset)} images from COCO")
    print(f"Dataset saved to FiftyOne database: coco_basketball_subset")
    
    # Export to disk
    export_dir = os.path.join(output_dir, "coco_basketball_subset")
    dataset.export(
        export_dir=export_dir,
        dataset_type=fo.types.COCODetectionDataset,
        label_field="ground_truth"
    )
    
    print(f"✓ Exported to: {export_dir}")
    
except ImportError:
    print("\n⚠ FiftyOne library not available")
    print("Installing fiftyone...")
    os.system("pip install fiftyone -q")
    print("✓ FiftyOne installed. Please run this script again.")
except Exception as e:
    print(f"\n✗ Error downloading COCO subset: {str(e)}")
    print("\nAlternative approach: Using Kaggle COCO dataset")
    print("Run: kaggle datasets download -d ultralytics/coco2017")
