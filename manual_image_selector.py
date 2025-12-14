#!/usr/bin/env python3
"""
Manual Image Selector for Basketball Shooting Images
Samples images from training dataset and helps select the best ones
Uses OpenCV for basic quality checks
"""

import os
import cv2
import numpy as np
import random
import shutil
from pathlib import Path
from typing import List, Tuple
import json

def calculate_image_quality(image_path: str) -> dict:
    """
    Calculate basic image quality metrics
    
    Args:
        image_path: Path to image
        
    Returns:
        Dictionary with quality metrics
    """
    try:
        img = cv2.imread(image_path)
        if img is None:
            return {"error": "Could not load image"}
        
        # Calculate sharpness (Laplacian variance)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Calculate brightness
        brightness = np.mean(gray)
        
        # Calculate contrast
        contrast = np.std(gray)
        
        # Image dimensions
        height, width = img.shape[:2]
        
        # Check if image is too small
        min_dimension = min(height, width)
        
        # Quality scores
        sharpness_score = min(100, laplacian_var / 10)  # Higher is sharper
        brightness_score = 100 - abs(brightness - 128) / 1.28  # Closer to 128 is better
        contrast_score = min(100, contrast / 0.5)  # Higher contrast is better
        size_score = min(100, min_dimension / 5)  # At least 500px is good
        
        # Overall quality
        overall_quality = (sharpness_score + brightness_score + contrast_score + size_score) / 4
        
        return {
            "path": image_path,
            "width": width,
            "height": height,
            "sharpness": round(laplacian_var, 2),
            "brightness": round(brightness, 2),
            "contrast": round(contrast, 2),
            "sharpness_score": round(sharpness_score, 2),
            "brightness_score": round(brightness_score, 2),
            "contrast_score": round(contrast_score, 2),
            "size_score": round(size_score, 2),
            "overall_quality": round(overall_quality, 2)
        }
    except Exception as e:
        return {"error": str(e), "path": image_path}


def find_training_images(training_dir: str) -> List[str]:
    """
    Find all images in training directory
    
    Args:
        training_dir: Path to training directory
        
    Returns:
        List of image paths
    """
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif'}
    images = []
    
    for root, dirs, files in os.walk(training_dir):
        for file in files:
            if Path(file).suffix.lower() in image_extensions:
                images.append(os.path.join(root, file))
    
    return images


def sample_and_evaluate_images(training_dir: str, sample_size: int = 100, min_quality: float = 50.0) -> List[dict]:
    """
    Sample images and evaluate their quality
    
    Args:
        training_dir: Path to training directory
        sample_size: Number of images to sample
        min_quality: Minimum quality score to keep
        
    Returns:
        List of quality results sorted by overall quality
    """
    print(f"🔍 Finding training images in: {training_dir}")
    all_images = find_training_images(training_dir)
    print(f"📁 Found {len(all_images)} total images")
    
    # Sample images
    sample_size = min(sample_size, len(all_images))
    sampled_images = random.sample(all_images, sample_size)
    print(f"🎲 Sampled {sample_size} images for evaluation")
    
    # Evaluate quality
    print("\n⚙️  Evaluating image quality...")
    results = []
    for i, img_path in enumerate(sampled_images, 1):
        if i % 10 == 0:
            print(f"   Processed {i}/{sample_size} images...")
        
        quality = calculate_image_quality(img_path)
        if "error" not in quality:
            results.append(quality)
    
    # Filter by minimum quality
    filtered_results = [r for r in results if r['overall_quality'] >= min_quality]
    print(f"\n✅ {len(filtered_results)}/{len(results)} images passed quality threshold ({min_quality})")
    
    # Sort by quality
    filtered_results.sort(key=lambda x: x['overall_quality'], reverse=True)
    
    return filtered_results


def create_preview_grid(image_paths: List[str], output_path: str, grid_size: Tuple[int, int] = (5, 4)):
    """
    Create a preview grid of images
    
    Args:
        image_paths: List of image paths
        output_path: Path to save grid
        grid_size: (rows, cols) for grid
    """
    rows, cols = grid_size
    max_images = rows * cols
    
    # Load and resize images
    preview_images = []
    cell_width, cell_height = 300, 300
    
    for i, img_path in enumerate(image_paths[:max_images]):
        img = cv2.imread(img_path)
        if img is not None:
            # Resize to cell size
            img_resized = cv2.resize(img, (cell_width, cell_height))
            
            # Add label
            label = f"#{i+1}: {Path(img_path).name[:20]}"
            cv2.putText(img_resized, label, (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
            cv2.putText(img_resized, label, (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
            
            preview_images.append(img_resized)
    
    # Fill remaining cells with black
    while len(preview_images) < max_images:
        preview_images.append(np.zeros((cell_height, cell_width, 3), dtype=np.uint8))
    
    # Create grid
    grid_rows = []
    for i in range(rows):
        row_images = preview_images[i*cols:(i+1)*cols]
        grid_rows.append(np.hstack(row_images))
    
    grid = np.vstack(grid_rows)
    
    # Save grid
    cv2.imwrite(output_path, grid)
    print(f"\n📸 Saved preview grid to: {output_path}")
    
    return grid


def copy_selected_images(selected_indices: List[int], quality_results: List[dict], output_dir: str) -> List[str]:
    """
    Copy selected images to output directory
    
    Args:
        selected_indices: List of indices to copy (1-based)
        quality_results: Quality results list
        output_dir: Output directory
        
    Returns:
        List of copied image paths
    """
    os.makedirs(output_dir, exist_ok=True)
    
    copied_paths = []
    for idx in selected_indices:
        if 1 <= idx <= len(quality_results):
            source = quality_results[idx-1]['path']
            filename = f"selected_{idx:02d}_{Path(source).name}"
            dest = os.path.join(output_dir, filename)
            
            shutil.copy2(source, dest)
            copied_paths.append(dest)
            print(f"✅ Copied: {filename}")
        else:
            print(f"⚠️  Invalid index: {idx}")
    
    return copied_paths


def main():
    """Main function for manual image selection"""
    
    print("=" * 80)
    print("🏀 BASKETBALL SHOOTING IMAGE SELECTOR")
    print("=" * 80)
    
    # Configuration
    training_dir = "/home/ubuntu/basketball_app/training_data/raw_images"
    output_dir = "/home/ubuntu/Uploads/basketball_test_results/verified_images"
    sample_size = 100
    min_quality = 60.0
    
    # Sample and evaluate images
    print(f"\n🔍 Sampling and evaluating images...")
    print(f"   Training directory: {training_dir}")
    print(f"   Sample size: {sample_size}")
    print(f"   Minimum quality: {min_quality}")
    
    quality_results = sample_and_evaluate_images(training_dir, sample_size, min_quality)
    
    # Save quality results
    results_file = os.path.join(output_dir, "quality_results.json")
    os.makedirs(output_dir, exist_ok=True)
    with open(results_file, 'w') as f:
        json.dump(quality_results, f, indent=2)
    print(f"\n💾 Saved quality results to: {results_file}")
    
    # Show top 20 results
    print("\n📊 TOP 20 IMAGES BY QUALITY:")
    print("-" * 80)
    print(f"{'#':<4} {'Quality':<8} {'Sharp':<7} {'Bright':<7} {'Contrast':<8} {'Filename':<40}")
    print("-" * 80)
    
    for i, result in enumerate(quality_results[:20], 1):
        filename = Path(result['path']).name
        print(f"{i:<4} {result['overall_quality']:<8.1f} {result['sharpness']:<7.1f} "
              f"{result['brightness']:<7.1f} {result['contrast']:<7.1f} {filename:<40}")
    
    # Create preview grid
    print("\n📸 Creating preview grid of top 20 images...")
    top_20_paths = [r['path'] for r in quality_results[:20]]
    preview_path = os.path.join(output_dir, "preview_grid.jpg")
    create_preview_grid(top_20_paths, preview_path, grid_size=(4, 5))
    
    print("\n" + "=" * 80)
    print("✅ ANALYSIS COMPLETE!")
    print("=" * 80)
    print(f"\n📁 Results saved to: {output_dir}")
    print(f"   - quality_results.json: Full quality analysis")
    print(f"   - preview_grid.jpg: Visual preview of top 20 images")
    print("\n💡 Next steps:")
    print("   1. Review preview_grid.jpg to see top candidates")
    print("   2. Use quality_results.json to find image paths")
    print("   3. Manually verify images show basketball shooting with ball visible")
    print("   4. Copy selected images for test suite")


if __name__ == "__main__":
    main()
