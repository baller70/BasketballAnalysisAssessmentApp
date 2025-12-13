#!/usr/bin/env python3
"""
RoboFlow Project Creation Script
Creates 3 custom model projects for basketball shooting analysis
"""

import requests
import json
import time
from roboflow import Roboflow

# API Keys
PRIVATE_API_KEY = "rDWynPrytSysASUlyGvK"
PUBLISHABLE_API_KEY = "rf_qisv7ZQd27SzKITWRc2blZZo5F83"

# RoboFlow API Base URL
API_BASE_URL = "https://api.roboflow.com"

class RoboFlowProjectCreator:
    def __init__(self, api_key):
        self.api_key = api_key
        self.rf = Roboflow(api_key=api_key)
        self.workspace = self.rf.workspace()
        self.workspace_id = self.workspace.url
        self.headers = {
            "Content-Type": "application/json"
        }
        self.projects = {}
        
    def create_project(self, project_name, project_type, annotation_type, project_license="Private"):
        """
        Create a new RoboFlow project
        
        Args:
            project_name: Name of the project
            project_type: Type of project (object-detection, classification, instance-segmentation, keypoint-detection)
            annotation_type: Annotation type for the project
            project_license: License for the project (Private, MIT, CC BY 4.0, etc.)
        """
        print(f"\n{'='*80}")
        print(f"Creating Project: {project_name}")
        print(f"Type: {project_type}")
        print(f"License: {project_license}")
        print(f"{'='*80}")
        
        try:
            # Try SDK method first with all required parameters
            try:
                print(f"   Creating project via SDK...")
                project = self.workspace.create_project(
                    project_name=project_name,
                    project_type=project_type,
                    project_license=project_license,
                    annotation=annotation_type
                )
                print(f"✅ Project created successfully via SDK!")
                
                # Get project details
                project_data = {
                    "name": project_name,
                    "type": project_type,
                    "license": project_license,
                    "annotation": annotation_type,
                    "project_id": project_name.lower().replace("-", "_"),
                    "url": f"https://app.roboflow.com/{self.workspace_id}/{project_name.lower().replace(' ', '-')}"
                }
                
                self.projects[project_name] = project_data
                
                return project_data
                
            except Exception as e:
                print(f"   ⚠️  SDK method failed: {e}")
                
                # Try REST API as fallback
                print(f"   Attempting REST API creation...")
                url = f"{API_BASE_URL}/{self.workspace_id}/projects"
                
                payload = {
                    "name": project_name,
                    "type": project_type,
                    "annotation": annotation_type,
                    "license": project_license,
                    "api_key": self.api_key
                }
                
                response = requests.post(url, params={"api_key": self.api_key}, json=payload)
                
                if response.status_code == 200 or response.status_code == 201:
                    project_data = response.json()
                    print(f"✅ Project created via REST API!")
                    print(f"   Project ID: {project_data.get('id', 'N/A')}")
                    
                    self.projects[project_name] = project_data
                    return project_data
                else:
                    print(f"   ⚠️  REST API Response Status: {response.status_code}")
                    print(f"   Response: {response.text}")
                    return None
                
        except Exception as e:
            print(f"❌ Error creating project: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def configure_keypoint_project(self, project_name):
        """Configure keypoint detection project with 10 basketball shooting keypoints"""
        print(f"\n🔧 Configuring Keypoint Detection Project...")
        
        keypoints = [
            "shooting_wrist",
            "shooting_elbow", 
            "shooting_shoulder",
            "non_shooting_shoulder",
            "hip_center",
            "shooting_knee",
            "shooting_ankle",
            "ball_position",
            "release_point",
            "head_position"
        ]
        
        print(f"   Keypoints to configure:")
        for i, kp in enumerate(keypoints, 1):
            print(f"      {i}. {kp}")
        
        # Note: Keypoint configuration typically requires manual setup in UI
        # or uploading annotated data with keypoint labels
        print(f"\n   ℹ️  Keypoints will be configured when uploading first annotated dataset")
        print(f"   ℹ️  Use RoboFlow Annotate tool to label these keypoints on training images")
        
        return keypoints
    
    def configure_classification_project(self, project_name):
        """Configure multi-label classification project with 5 categories"""
        print(f"\n🔧 Configuring Multi-Label Classification Project...")
        
        categories = {
            "Overall Form": ["Excellent", "Good", "Needs Work", "Poor"],
            "Elbow Alignment": ["Correct", "Slightly Off", "Significantly Off"],
            "Release Height": ["Optimal", "Too Low", "Too High"],
            "Follow Through": ["Complete", "Incomplete", "None"],
            "Balance": ["Stable", "Unstable"]
        }
        
        print(f"   Categories and labels:")
        for category, labels in categories.items():
            print(f"      {category}: {', '.join(labels)}")
        
        print(f"\n   ℹ️  Classification labels will be configured when uploading training data")
        print(f"   ℹ️  Each image can have multiple labels (multi-label classification)")
        
        return categories
    
    def configure_detection_project(self, project_name):
        """Configure object detection project for basketball tracking"""
        print(f"\n🔧 Configuring Object Detection Project...")
        
        classes = [
            "basketball",
            "release_point",
            "basket"
        ]
        
        print(f"   Detection classes:")
        for i, cls in enumerate(classes, 1):
            print(f"      {i}. {cls}")
        
        print(f"\n   ℹ️  Detection classes will be configured when uploading annotated dataset")
        print(f"   ℹ️  Use RoboFlow Annotate or upload COCO/YOLO format annotations")
        
        return classes

def main():
    print("=" * 80)
    print("ROBOFLOW PROJECT CREATION")
    print("Basketball Shooting Analysis - 3 Custom Models")
    print("=" * 80)
    
    creator = RoboFlowProjectCreator(PRIVATE_API_KEY)
    
    # Project 1: Basketball Shooting Form Keypoints (Using Object Detection for keypoints)
    # Note: RoboFlow doesn't have dedicated keypoint-detection type
    # We'll use object-detection and detect keypoints as small objects
    print("\n\n🎯 PROJECT #1: Basketball Shooting Form Keypoints")
    print("   Note: Using object-detection type for keypoint detection")
    project1 = creator.create_project(
        project_name="Basketball-Shooting-Form-Keypoints",
        project_type="object-detection",
        annotation_type="bounding-box",
        project_license="MIT"  # Public project with MIT license
    )
    
    if project1:
        keypoints = creator.configure_keypoint_project("Basketball-Shooting-Form-Keypoints")
        time.sleep(2)  # Rate limiting
    
    # Project 2: Basketball Form Quality Classifier (Multi-Label Classification)
    print("\n\n🎯 PROJECT #2: Basketball Form Quality Classifier")
    project2 = creator.create_project(
        project_name="Basketball-Form-Quality-Classifier",
        project_type="multi-label-classification",
        annotation_type="classification",
        project_license="MIT"  # Public project with MIT license
    )
    
    if project2:
        categories = creator.configure_classification_project("Basketball-Form-Quality-Classifier")
        time.sleep(2)  # Rate limiting
    
    # Project 3: Basketball Ball Trajectory Tracker (Object Detection)
    print("\n\n🎯 PROJECT #3: Basketball Ball Trajectory Tracker")
    project3 = creator.create_project(
        project_name="Basketball-Ball-Trajectory-Tracker",
        project_type="object-detection",
        annotation_type="bounding-box",
        project_license="MIT"  # Public project with MIT license
    )
    
    if project3:
        classes = creator.configure_detection_project("Basketball-Ball-Trajectory-Tracker")
    
    # Summary
    print("\n\n" + "=" * 80)
    print("PROJECT CREATION SUMMARY")
    print("=" * 80)
    
    print(f"\n✅ Created {len([p for p in [project1, project2, project3] if p])} out of 3 projects")
    
    if project1:
        print(f"\n1. Basketball-Shooting-Form-Keypoints (Keypoint Detection)")
        print(f"   - 10 keypoints for shooting form analysis")
        print(f"   - Ready for annotated data upload")
    
    if project2:
        print(f"\n2. Basketball-Form-Quality-Classifier (Multi-Label Classification)")
        print(f"   - 5 categories with multiple labels")
        print(f"   - Ready for labeled training images")
    
    if project3:
        print(f"\n3. Basketball-Ball-Trajectory-Tracker (Object Detection)")
        print(f"   - 3 detection classes (basketball, release_point, basket)")
        print(f"   - Ready for annotated bounding boxes")
    
    # Save project information
    project_info = {
        "workspace": creator.workspace_id,
        "api_key_private": PRIVATE_API_KEY,
        "api_key_publishable": PUBLISHABLE_API_KEY,
        "projects": {
            "keypoint_detection": project1,
            "classification": project2,
            "object_detection": project3
        }
    }
    
    with open("/home/ubuntu/basketball_app/roboflow_projects.json", "w") as f:
        json.dump(project_info, f, indent=2)
    
    print(f"\n💾 Project information saved to: roboflow_projects.json")
    
    print("\n\n📋 NEXT STEPS:")
    print("1. Upload training images to each project via RoboFlow dashboard")
    print("2. Annotate images using RoboFlow Annotate tool")
    print("3. Generate dataset versions with preprocessing/augmentation")
    print("4. Train models on RoboFlow platform")
    print("5. Deploy models and integrate with basketball analysis app")
    
    print("\n🌐 RoboFlow Dashboard: https://app.roboflow.com/")
    print(f"   Workspace: {creator.workspace_id}")

if __name__ == "__main__":
    main()
