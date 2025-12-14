#!/usr/bin/env python3
"""
Upload basketball training dataset to RoboFlow

NOTE: Update API key before running!
"""
import os
from pathlib import Path
import time
from typing import Dict, List
import json

# RoboFlow API Configuration
ROBOFLOW_PRIVATE_API_KEY = "rDWynPrytSysASUlyGvK"  # Update with valid key
ROBOFLOW_PUBLISHABLE_KEY = "rf_qisv7ZQd27SzKITWRc2blZZo5F83"  # Update with valid key

# Dataset configuration
BASE_DIR = Path("/home/ubuntu/basketball_app/training_data")

PROJECTS = {
    "basketball-shooting-keypoints": {
        "path": "shooting_form_keypoints",
        "type": "instance-segmentation",
        "description": "Basketball player pose keypoint detection for shooting form analysis"
    },
    "basketball-form-quality": {
        "path": "form_quality_classifier",
        "type": "classification",
        "description": "Basketball shooting form quality classification"
    },
    "basketball-ball-tracking": {
        "path": "ball_trajectory",
        "type": "object-detection",
        "description": "Basketball ball detection and trajectory tracking"
    }
}

class RoboFlowUploader:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.uploaded_count = 0
        self.failed_count = 0
        self.upload_log = []
    
    def upload_batch(self, project_name: str, image_paths: List[Path], batch_size: int = 10):
        """Upload images in batches"""
        print(f"\nUploading to project: {project_name}")
        print(f"Total images: {len(image_paths)}")
        
        try:
            # Import roboflow here to check if installed
            from roboflow import Roboflow
            
            rf = Roboflow(api_key=self.api_key)
            workspace = rf.workspace()
            
            # Create or get project
            try:
                project = workspace.project(project_name)
            except:
                print(f"  Creating new project: {project_name}")
                # Note: Project creation requires proper workspace setup
                # For now, assume project exists or create manually
                return False
            
            # Upload images in batches
            for i in range(0, len(image_paths), batch_size):
                batch = image_paths[i:i+batch_size]
                
                for img_path in batch:
                    try:
                        project.upload(image_path=str(img_path))
                        self.uploaded_count += 1
                        self.upload_log.append({"file": str(img_path), "status": "success"})
                        
                    except Exception as e:
                        self.failed_count += 1
                        self.upload_log.append({"file": str(img_path), "status": "failed", "error": str(e)})
                        print(f"    Failed: {img_path.name} - {str(e)}")
                
                # Progress update
                progress = min(i + batch_size, len(image_paths))
                print(f"  Progress: {progress}/{len(image_paths)} ({progress/len(image_paths)*100:.1f}%)")
                
                # Rate limiting
                time.sleep(1)
            
            print(f"  ✓ Completed: {self.uploaded_count} uploaded, {self.failed_count} failed")
            return True
            
        except ImportError:
            print("  ✗ Error: roboflow package not installed")
            print("  Install with: pip install roboflow")
            return False
        except Exception as e:
            print(f"  ✗ Error: {str(e)}")
            return False
    
    def prepare_upload_manifest(self):
        """Create upload manifest for manual review"""
        manifest = {
            "upload_date": time.strftime("%Y-%m-%d %H:%M:%S"),
            "total_images": 0,
            "projects": {}
        }
        
        for project_name, config in PROJECTS.items():
            project_path = BASE_DIR / config["path"]
            
            if not project_path.exists():
                continue
            
            # Count images
            image_files = list(project_path.rglob("*.jpg")) + list(project_path.rglob("*.png"))
            
            manifest["projects"][project_name] = {
                "type": config["type"],
                "description": config["description"],
                "local_path": str(project_path),
                "image_count": len(image_files),
                "subcategories": {}
            }
            
            # Count by subcategory
            for subdir in project_path.iterdir():
                if subdir.is_dir():
                    subdir_images = list(subdir.glob("*.jpg")) + list(subdir.glob("*.png"))
                    manifest["projects"][project_name]["subcategories"][subdir.name] = len(subdir_images)
            
            manifest["total_images"] += len(image_files)
        
        return manifest
    
    def save_manifest(self, manifest: Dict, output_path: Path):
        """Save upload manifest to file"""
        with open(output_path, "w") as f:
            json.dump(manifest, f, indent=2)
        print(f"✓ Manifest saved to: {output_path}")

def main():
    print("="*60)
    print("ROBOFLOW UPLOAD PREPARATION")
    print("="*60)
    
    uploader = RoboFlowUploader(ROBOFLOW_PRIVATE_API_KEY)
    
    # Create upload manifest
    print("\nGenerating upload manifest...")
    manifest = uploader.prepare_upload_manifest()
    
    manifest_path = BASE_DIR / "roboflow_upload_manifest.json"
    uploader.save_manifest(manifest, manifest_path)
    
    # Display summary
    print("\n" + "="*60)
    print("UPLOAD MANIFEST SUMMARY")
    print("="*60)
    print(f"Total Images: {manifest['total_images']:,}")
    print(f"\nProjects:")
    for project_name, project_info in manifest["projects"].items():
        print(f"\n  {project_name}:")
        print(f"    Type: {project_info['type']}")
        print(f"    Images: {project_info['image_count']:,}")
        print(f"    Subcategories:")
        for subcat, count in project_info["subcategories"].items():
            print(f"      - {subcat}: {count}")
    
    print("\n" + "="*60)
    print("NEXT STEPS")
    print("="*60)
    print("\n1. Update API keys in this script if needed")
    print("2. Verify roboflow package is installed: pip install roboflow")
    print("3. Create projects in RoboFlow web interface:")
    for project_name in PROJECTS.keys():
        print(f"   - {project_name}")
    print("4. Run upload (WARNING: This may take hours for 7,280 images):")
    print("   python3 scripts/upload_to_roboflow.py --execute")
    print("\n5. Alternative: Upload manually via RoboFlow web interface")
    print("   - Export dataset as zip files")
    print("   - Upload via https://app.roboflow.com/")
    print("="*60)
    
    # Check for --execute flag
    import sys
    if "--execute" in sys.argv:
        print("\n⚠️  WARNING: Starting upload process...")
        response = input("This will upload 7,280 images. Continue? (yes/no): ")
        
        if response.lower() == "yes":
            for project_name, config in PROJECTS.items():
                project_path = BASE_DIR / config["path"]
                image_files = list(project_path.rglob("*.jpg")) + list(project_path.rglob("*.png"))
                uploader.upload_batch(project_name, image_files)
            
            # Save upload log
            log_path = BASE_DIR / "roboflow_upload_log.json"
            with open(log_path, "w") as f:
                json.dump(uploader.upload_log, f, indent=2)
            print(f"\n✓ Upload log saved to: {log_path}")
        else:
            print("Upload cancelled.")
    else:
        print("\n💡 TIP: Run with --execute flag to start upload")

if __name__ == "__main__":
    main()
