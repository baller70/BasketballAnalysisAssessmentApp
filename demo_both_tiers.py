#!/usr/bin/env python3
"""
Demo Script for Both Tiers
Generates test outputs for FREE and PROFESSIONAL tiers
Creates side-by-side comparisons and performance benchmarks

Usage:
    python demo_both_tiers.py --images test_images/*.png
"""

import os
import sys
import cv2
import numpy as np
import json
import time
from pathlib import Path
from typing import List, Dict, Any
import argparse

# Add project root to path
sys.path.insert(0, os.path.dirname(__file__))

# Import tier system
from basketball_analysis_system import BasketballAnalysisSystem, TierType
from config.tier_config import COMPARISON_MATRIX, get_cost_estimate

# Output directory
OUTPUT_DIR = Path("tier_comparison_outputs")
OUTPUT_DIR.mkdir(exist_ok=True)


def create_comparison_image(
    original_path: str,
    free_annotated_path: str,
    pro_annotated_path: str,
    output_path: str
) -> bool:
    """
    Create side-by-side comparison image
    
    Args:
        original_path: Path to original image
        free_annotated_path: Path to FREE tier annotated image
        pro_annotated_path: Path to PROFESSIONAL tier annotated image (or None)
        output_path: Path to save comparison
        
    Returns:
        True if successful
    """
    try:
        # Read images
        original = cv2.imread(original_path)
        free_annotated = cv2.imread(free_annotated_path)
        
        if original is None or free_annotated is None:
            print(f"  ❌ Could not read images for comparison")
            return False
        
        # Check if professional tier output exists
        if pro_annotated_path and os.path.exists(pro_annotated_path):
            pro_annotated = cv2.imread(pro_annotated_path)
            
            # Resize all to same height
            target_height = 600
            target_width_orig = int(original.shape[1] * (target_height / original.shape[0]))
            target_width_free = int(free_annotated.shape[1] * (target_height / free_annotated.shape[0]))
            target_width_pro = int(pro_annotated.shape[1] * (target_height / pro_annotated.shape[0]))
            
            original_resized = cv2.resize(original, (target_width_orig, target_height))
            free_resized = cv2.resize(free_annotated, (target_width_free, target_height))
            pro_resized = cv2.resize(pro_annotated, (target_width_pro, target_height))
            
            # Create 3-column comparison
            combined = np.hstack([original_resized, free_resized, pro_resized])
            
            # Add title bar
            title_height = 80
            title_bar = np.zeros((title_height, combined.shape[1], 3), dtype=np.uint8)
            
            # Add titles
            cv2.putText(title_bar, "Original", (20, 50),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 2)
            cv2.putText(title_bar, "FREE Tier", (target_width_orig + 20, 50),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 255), 2)
            cv2.putText(title_bar, "PROFESSIONAL Tier", (target_width_orig + target_width_free + 20, 50),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 2)
            
        else:
            # Only FREE tier available - create 2-column comparison
            target_height = 600
            target_width_orig = int(original.shape[1] * (target_height / original.shape[0]))
            target_width_free = int(free_annotated.shape[1] * (target_height / free_annotated.shape[0]))
            
            original_resized = cv2.resize(original, (target_width_orig, target_height))
            free_resized = cv2.resize(free_annotated, (target_width_free, target_height))
            
            # Create 2-column comparison
            combined = np.hstack([original_resized, free_resized])
            
            # Add title bar
            title_height = 80
            title_bar = np.zeros((title_height, combined.shape[1], 3), dtype=np.uint8)
            
            # Add titles
            cv2.putText(title_bar, "Original", (20, 50),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 2)
            cv2.putText(title_bar, "FREE Tier (MediaPipe + OpenAI + OpenCV)", (target_width_orig + 20, 50),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 255), 2)
        
        # Combine title with images
        final = np.vstack([title_bar, combined])
        
        # Save comparison
        cv2.imwrite(output_path, final)
        print(f"  ✅ Saved comparison: {output_path}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error creating comparison: {e}")
        return False


def benchmark_tier(
    system: BasketballAnalysisSystem,
    tier: str,
    images: List[str]
) -> Dict[str, Any]:
    """
    Benchmark a tier's performance
    
    Args:
        system: Analysis system
        tier: "free" or "professional"
        images: List of image paths
        
    Returns:
        Benchmark results
    """
    print(f"\n{'='*60}")
    print(f"BENCHMARKING {tier.upper()} TIER")
    print(f"{'='*60}")
    
    start_time = time.time()
    
    result = system.analyze(
        user_id="benchmark_user",
        images=images,
        tier=tier,
        enable_visualizations=True
    )
    
    end_time = time.time()
    total_time = end_time - start_time
    
    if result.get("success"):
        print(f"✅ {tier.upper()} tier analysis complete")
        print(f"  - Processing time: {total_time:.2f}s")
        print(f"  - Images analyzed: {result['summary']['images_analyzed']}")
        print(f"  - Overall score: {result['summary']['overall_score']:.1f}/100")
        print(f"  - Cost estimate: ${result['summary']['cost_estimate']:.2f}")
    else:
        print(f"❌ {tier.upper()} tier analysis failed")
        print(f"  - Error: {result.get('error')}")
    
    return {
        "tier": tier,
        "success": result.get("success", False),
        "total_time": total_time,
        "result": result
    }


def main():
    parser = argparse.ArgumentParser(description="Demo script for both tiers")
    parser.add_argument("--images", nargs="+", help="Image paths to analyze")
    parser.add_argument("--test-images-dir", default="test_images", help="Directory with test images")
    
    args = parser.parse_args()
    
    # Get test images
    if args.images:
        test_images = args.images
    else:
        test_images_dir = Path(args.test_images_dir)
        test_images = list(test_images_dir.glob("*.png")) + list(test_images_dir.glob("*.jpg"))
        test_images = [str(p) for p in test_images[:3]]  # Limit to 3 images
    
    if not test_images:
        print("❌ No test images found!")
        return
    
    print("\n" + "="*80)
    print("BASKETBALL SHOOTING FORM ANALYSIS - TIER COMPARISON DEMO")
    print("="*80)
    print(f"\nTest images: {len(test_images)}")
    for img in test_images:
        print(f"  - {img}")
    
    # Initialize system
    print("\n" + "="*80)
    print("INITIALIZING ANALYSIS SYSTEM")
    print("="*80)
    
    system = BasketballAnalysisSystem()
    
    # Benchmark FREE tier
    free_benchmark = benchmark_tier(system, TierType.FREE, test_images)
    
    # Benchmark PROFESSIONAL tier (if available)
    pro_benchmark = benchmark_tier(system, TierType.PROFESSIONAL, test_images)
    
    # Create comparison images
    print("\n" + "="*80)
    print("CREATING COMPARISON IMAGES")
    print("="*80)
    
    if free_benchmark["success"]:
        free_outputs = free_benchmark["result"].get("opencv_visualizations", {}).get("outputs", [])
        
        for idx, output in enumerate(free_outputs, 1):
            if output.get("success"):
                original = output["original_image"]
                free_annotated = output["annotated_path"]
                
                # Check if professional tier output exists
                pro_annotated = None
                if pro_benchmark.get("success"):
                    pro_outputs = pro_benchmark["result"].get("annotated_outputs", [])
                    if idx <= len(pro_outputs) and pro_outputs[idx-1].get("success"):
                        pro_annotated = pro_outputs[idx-1].get("annotated_url")
                
                # Create comparison
                comparison_path = OUTPUT_DIR / f"comparison_{idx}.png"
                print(f"\nCreating comparison {idx}...")
                create_comparison_image(
                    original,
                    free_annotated,
                    pro_annotated,
                    str(comparison_path)
                )
    
    # Save benchmark results
    benchmark_data = {
        "free_tier": {
            "success": free_benchmark["success"],
            "processing_time": free_benchmark["total_time"],
            "cost_estimate": free_benchmark["result"].get("summary", {}).get("cost_estimate", 0),
            "overall_score": free_benchmark["result"].get("summary", {}).get("overall_score", 0),
        },
        "professional_tier": {
            "success": pro_benchmark.get("success", False),
            "processing_time": pro_benchmark.get("total_time", 0),
            "cost_estimate": pro_benchmark["result"].get("summary", {}).get("cost_estimate", 0) if pro_benchmark.get("success") else "N/A",
            "overall_score": pro_benchmark["result"].get("summary", {}).get("overall_score", 0),
        },
        "comparison_matrix": COMPARISON_MATRIX
    }
    
    benchmark_path = OUTPUT_DIR / "benchmark_results.json"
    with open(benchmark_path, 'w') as f:
        json.dump(benchmark_data, f, indent=2)
    
    print(f"\n✅ Benchmark results saved: {benchmark_path}")
    
    # Print summary
    print("\n" + "="*80)
    print("TIER COMPARISON SUMMARY")
    print("="*80)
    
    print("\nFREE TIER:")
    print(f"  Status: {'✅ SUCCESS' if free_benchmark['success'] else '❌ FAILED'}")
    if free_benchmark["success"]:
        print(f"  Processing Time: {free_benchmark['total_time']:.2f}s")
        print(f"  Cost: ${benchmark_data['free_tier']['cost_estimate']:.2f}")
        print(f"  Score: {benchmark_data['free_tier']['overall_score']:.1f}/100")
    
    print("\nPROFESSIONAL TIER:")
    print(f"  Status: {'✅ SUCCESS' if pro_benchmark.get('success') else '⚠️ NOT AVAILABLE'}")
    if pro_benchmark.get("success"):
        print(f"  Processing Time: {pro_benchmark['total_time']:.2f}s")
        print(f"  Cost: ${benchmark_data['professional_tier']['cost_estimate']:.2f}")
        print(f"  Score: {benchmark_data['professional_tier']['overall_score']:.1f}/100")
    else:
        print(f"  Note: Professional tier requires RoboFlow and ShotStack API keys")
    
    print("\n" + "="*80)
    print(f"OUTPUT DIRECTORY: {OUTPUT_DIR}")
    print("="*80)
    print("\nGenerated files:")
    for file in sorted(OUTPUT_DIR.glob("*")):
        print(f"  - {file.name}")
    
    print("\n✅ Demo complete!")


if __name__ == "__main__":
    main()
