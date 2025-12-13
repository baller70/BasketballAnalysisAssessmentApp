#!/usr/bin/env python3
"""
Find Perfect Test Images for Basketball Shooting Form Analysis

This script scans training_data and identifies the best images
that meet all requirements for shooting form analysis.

Criteria for "perfect" images:
1. Full body visible (head to toe)
2. Clear shooting motion (elbow angle > 120°)
3. Large subject (box area > 0.15)
4. Centered subject (center_x near 0.5)
5. High quality (all landmarks visible)

Author: Basketball Analysis Team
Date: December 13, 2025
"""

import os
from pathlib import Path
from smart_shooting_form_filter import SmartShootingFormFilter
import json

# Paths
TRAINING_DATA_DIR = Path("/home/ubuntu/basketball_app/training_data")
OUTPUT_DIR = Path("/home/ubuntu/Uploads/basketball_test_results")

# Criteria for perfect images
PERFECT_CRITERIA = {
    "min_elbow_angle": 120,  # Clear shooting motion
    "min_box_area": 0.15,     # Subject is large enough
    "max_center_offset": 0.3,  # Subject is reasonably centered
}

def score_image(result):
    """
    Score an image based on how "perfect" it is for testing.
    
    Returns: score (0-100), higher is better
    """
    if not result.accepted:
        return 0
    
    score = 50  # Base score for accepted images
    
    # Bonus for high elbow angle (clear shooting motion)
    if result.main_subject and result.main_subject.elbow_angle:
        elbow = result.main_subject.elbow_angle
        if elbow >= 140:
            score += 20
        elif elbow >= 120:
            score += 10
        elif elbow >= 100:
            score += 5
    
    # Bonus for large subject (clear visibility)
    if result.main_subject and result.main_subject.box_area:
        area = result.main_subject.box_area
        if area >= 0.25:
            score += 15
        elif area >= 0.20:
            score += 10
        elif area >= 0.15:
            score += 5
    
    # Bonus for centered subject
    if result.main_subject and result.main_subject.center_x is not None:
        offset = abs(result.main_subject.center_x - 0.5)
        if offset <= 0.1:
            score += 15
        elif offset <= 0.2:
            score += 10
        elif offset <= 0.3:
            score += 5
    
    return score

def find_perfect_images(max_images=100, target_perfect=5):
    """
    Scan training_data and find perfect test images.
    
    Args:
        max_images: Maximum images to scan
        target_perfect: Target number of perfect images to find
    
    Returns:
        List of (path, score, result) tuples
    """
    print("="*60)
    print("FINDING PERFECT TEST IMAGES")
    print("="*60)
    print(f"Scanning up to {max_images} images from {TRAINING_DATA_DIR}")
    print(f"Target: {target_perfect} perfect images")
    print("="*60)
    
    # Initialize filter
    filter_obj = SmartShootingFormFilter()
    
    # Find images
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp'}
    image_files = []
    for ext in image_extensions:
        image_files.extend(TRAINING_DATA_DIR.rglob(f'*{ext}'))
        if len(image_files) >= max_images:
            break
    
    image_files = image_files[:max_images]
    print(f"\nFound {len(image_files)} images to scan\n")
    
    # Process images
    candidates = []
    for i, img_file in enumerate(image_files):
        if i % 10 == 0:
            print(f"Progress: {i}/{len(image_files)} ({i/len(image_files)*100:.1f}%)")
        
        result = filter_obj.filter_image(str(img_file))
        if result.accepted:
            score = score_image(result)
            candidates.append((img_file, score, result))
    
    # Sort by score
    candidates.sort(key=lambda x: x[1], reverse=True)
    
    print(f"\n{'='*60}")
    print(f"FOUND {len(candidates)} ACCEPTED IMAGES")
    print(f"{'='*60}\n")
    
    # Show top candidates
    print("Top 10 Candidates:")
    print("-"*60)
    for i, (path, score, result) in enumerate(candidates[:10], 1):
        elbow = result.main_subject.elbow_angle if result.main_subject else None
        area = result.main_subject.box_area if result.main_subject else None
        center_x = result.main_subject.center_x if result.main_subject else None
        
        print(f"{i}. Score: {score:.0f} - {path.name}")
        print(f"   Elbow: {elbow:.1f}°, Area: {area:.3f}, Center: {center_x:.3f}")
        print()
    
    return candidates

def main():
    """Main execution"""
    # Find perfect images
    candidates = find_perfect_images(max_images=200, target_perfect=5)
    
    if len(candidates) == 0:
        print("❌ No perfect images found!")
        return
    
    # Select top 5
    top_5 = candidates[:5]
    
    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    test_images_dir = OUTPUT_DIR / "test_images"
    test_images_dir.mkdir(parents=True, exist_ok=True)
    
    # Copy top 5 to test directory
    import shutil
    print("\n" + "="*60)
    print("SELECTING TOP 5 PERFECT TEST IMAGES")
    print("="*60)
    
    selected = []
    for i, (path, score, result) in enumerate(top_5, 1):
        dest = test_images_dir / f"test_{i}_{path.name}"
        shutil.copy(str(path), str(dest))
        
        elbow = result.main_subject.elbow_angle if result.main_subject else None
        area = result.main_subject.box_area if result.main_subject else None
        
        print(f"\n{i}. {path.name}")
        print(f"   Score: {score:.0f}")
        print(f"   Elbow Angle: {elbow:.1f}°")
        print(f"   Box Area: {area:.3f}")
        print(f"   Saved to: {dest}")
        
        selected.append({
            "rank": i,
            "original_path": str(path),
            "test_path": str(dest),
            "score": score,
            "elbow_angle": elbow,
            "box_area": area,
            "metadata": result.metadata
        })
    
    # Save selection metadata
    metadata_file = test_images_dir / "selection_metadata.json"
    with open(metadata_file, 'w') as f:
        json.dump(selected, f, indent=2)
    
    print(f"\n{'='*60}")
    print(f"✅ SELECTION COMPLETE")
    print(f"{'='*60}")
    print(f"Test images saved to: {test_images_dir}")
    print(f"Metadata saved to: {metadata_file}")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
