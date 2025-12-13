#!/usr/bin/env python3
"""
RoboFlow API Exploration Script
Explores workspace, projects, and API capabilities
"""

import os
import sys
from roboflow import Roboflow
import json

# API Keys
PRIVATE_API_KEY = "rDWynPrytSysASUlyGvK"
PUBLISHABLE_API_KEY = "rf_qisv7ZQd27SzKITWRc2blZZo5F83"

def explore_workspace():
    """Explore workspace details and existing projects"""
    print("=" * 80)
    print("ROBOFLOW API EXPLORATION")
    print("=" * 80)
    
    try:
        # Initialize RoboFlow with private API key
        rf = Roboflow(api_key=PRIVATE_API_KEY)
        print(f"✅ Successfully authenticated with RoboFlow")
        
        # Get workspace information
        workspace = rf.workspace()
        print(f"\n📁 Workspace: {workspace.name}")
        print(f"   URL: {workspace.url}")
        
        # List existing projects
        print(f"\n📋 Existing Projects:")
        projects = workspace.projects()
        
        if len(projects) == 0:
            print("   No existing projects found")
        else:
            for i, project in enumerate(projects, 1):
                print(f"   {i}. {project.name} ({project.type})")
                print(f"      ID: {project.id}")
                print(f"      Version: {project.version}")
        
        # Show available project types
        print(f"\n🎯 Available Project Types:")
        print("   1. Object Detection - Detect and locate objects in images")
        print("   2. Classification - Classify entire images into categories")
        print("   3. Instance Segmentation - Detect objects with pixel-perfect masks")
        print("   4. Semantic Segmentation - Classify each pixel in an image")
        print("   5. Keypoint Detection - Detect specific points on objects (pose estimation)")
        
        return rf, workspace
        
    except Exception as e:
        print(f"❌ Error exploring workspace: {e}")
        import traceback
        traceback.print_exc()
        return None, None

if __name__ == "__main__":
    explore_workspace()
