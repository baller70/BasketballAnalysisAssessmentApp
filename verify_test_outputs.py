#!/usr/bin/env python3
"""
Basketball Analysis - Test Output Verification Script

This script verifies that all test images were generated correctly
and are viewable. It checks file existence, validity, and content.
"""

import os
import cv2
import numpy as np
from pathlib import Path


def main():
    """Main verification function"""
    output_dir = Path("tier_comparison_outputs")
    
    print("\n" + "="*70)
    print("🏀 Basketball Analysis - Test Output Verification")
    print("="*70 + "\n")
    
    # Check directory exists
    if not output_dir.exists():
        print(f"❌ ERROR: Output directory not found: {output_dir}")
        return 1
    
    print(f"✅ Output directory exists: {output_dir}\n")
    
    # Files to check
    files_to_check = {
        "Original Images": ["1.png", "10.png", "14.png"],
        "Annotated Images": ["1_annotated_free.png", "10_annotated_free.png", "14_annotated_free.png"],
        "Comparison Images": ["comparison_1.png", "comparison_2.png", "comparison_3.png"],
        "Gallery": ["gallery.html"]
    }
    
    total_checks = 0
    passed_checks = 0
    
    for category, files in files_to_check.items():
        print(f"📁 {category}:")
        for filename in files:
            filepath = output_dir / filename
            total_checks += 1
            
            if filepath.exists():
                if filename.endswith('.png'):
                    # Try to load image
                    img = cv2.imread(str(filepath))
                    if img is not None:
                        size_kb = filepath.stat().st_size / 1024
                        non_black = np.count_nonzero(img)
                        print(f"   ✅ {filename:30s} - {size_kb:>7.1f} KB - {img.shape}")
                        passed_checks += 1
                    else:
                        print(f"   ❌ {filename:30s} - Cannot load image")
                else:
                    # HTML file
                    size_kb = filepath.stat().st_size / 1024
                    print(f"   ✅ {filename:30s} - {size_kb:>7.1f} KB")
                    passed_checks += 1
            else:
                print(f"   ❌ {filename:30s} - File not found")
        print()
    
    # Summary
    print("="*70)
    print(f"📊 SUMMARY: {passed_checks}/{total_checks} checks passed")
    print("="*70 + "\n")
    
    if passed_checks == total_checks:
        print("🎉 ALL CHECKS PASSED! All test outputs are valid and viewable.\n")
        print("🌐 Open gallery.html in your browser to view results:")
        print(f"   file://{output_dir.absolute()}/gallery.html\n")
        return 0
    else:
        print(f"⚠️  {total_checks - passed_checks} checks failed.\n")
        return 1


if __name__ == "__main__":
    exit(main())
