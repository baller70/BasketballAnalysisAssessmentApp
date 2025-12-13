#!/usr/bin/env python3
"""
Phase 4 Complete Integration Pipeline - Demo Script
Basketball Shooting Form Analysis System

This script demonstrates the complete end-to-end workflow:
1. RoboFlow - Keypoint detection and biomechanical analysis
2. Vision API - AI-powered coaching (Anthropic primary, OpenAI fallback)
3. ShotStack - Professional visual overlays and annotations

Usage:
    python demo_phase4.py
"""

import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
import logging

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

# Import configuration
from config.phase4_config import (
    ROBOFLOW_API_KEY,
    ROBOFLOW_WORKSPACE,
    SHOTSTACK_API_KEY,
    SHOTSTACK_ENVIRONMENT,
    ANTHROPIC_API_KEY,
    VISION_PRIMARY_PROVIDER,
    VISION_FALLBACK_PROVIDER
)

# Import pipeline
from phase4_pipeline import BasketballAnalysisPipeline
from integrations.vision_api_integration import UserProfile

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('demo_phase4.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def find_sample_images(training_data_dir: str, num_samples: int = 5) -> list:
    """
    Find sample basketball shooting images from training data
    
    Args:
        training_data_dir: Path to training data directory
        num_samples: Number of sample images to select
        
    Returns:
        List of image paths
    """
    logger.info(f"Searching for sample images in: {training_data_dir}")
    
    # Look for good form examples first
    good_form_dir = os.path.join(training_data_dir, "form_quality_classifier", "good_form")
    
    sample_images = []
    
    if os.path.exists(good_form_dir):
        logger.info(f"Found good_form directory: {good_form_dir}")
        
        # Get all jpg/png files
        for filename in os.listdir(good_form_dir):
            if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                sample_images.append(os.path.join(good_form_dir, filename))
                
                if len(sample_images) >= num_samples:
                    break
    
    # If not enough, search other directories
    if len(sample_images) < num_samples:
        logger.info("Searching additional directories for more samples...")
        for root, dirs, files in os.walk(training_data_dir):
            for filename in files:
                if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                    filepath = os.path.join(root, filename)
                    if filepath not in sample_images:
                        sample_images.append(filepath)
                        
                        if len(sample_images) >= num_samples:
                            break
            
            if len(sample_images) >= num_samples:
                break
    
    logger.info(f"Found {len(sample_images)} sample images")
    return sample_images[:num_samples]


def create_sample_user_profile() -> UserProfile:
    """Create a sample user profile for testing"""
    return UserProfile(
        height=74,  # 6'2"
        wingspan=76,
        experience_level="intermediate",
        body_type="mesomorph",
        age=25,
        shooting_hand="right"
    )


def save_results(results: dict, output_dir: str):
    """
    Save analysis results to files
    
    Args:
        results: Complete analysis results
        output_dir: Output directory path
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # Save complete JSON report
    report_path = os.path.join(output_dir, "complete_analysis_report.json")
    with open(report_path, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    logger.info(f"✅ Complete report saved: {report_path}")
    
    # Save summary
    summary_path = os.path.join(output_dir, "analysis_summary.txt")
    with open(summary_path, 'w') as f:
        f.write("=" * 80 + "\n")
        f.write("PHASE 4 BASKETBALL ANALYSIS - DEMO RESULTS\n")
        f.write("=" * 80 + "\n\n")
        
        f.write(f"Analysis Date: {results.get('analysis_date', 'N/A')}\n")
        f.write(f"User ID: {results.get('user_id', 'N/A')}\n")
        f.write(f"Images Analyzed: {len(results.get('images_analyzed', []))}\n\n")
        
        f.write("COMPONENT STATUS:\n")
        f.write("-" * 80 + "\n")
        f.write(f"RoboFlow Status: {results.get('roboflow_status', 'N/A')}\n")
        f.write(f"Vision API Provider: {results.get('vision_provider_used', 'N/A')}\n")
        f.write(f"ShotStack Status: {results.get('shotstack_status', 'N/A')}\n\n")
        
        # Individual image results
        for i, img_result in enumerate(results.get('image_results', []), 1):
            f.write(f"\nIMAGE {i} ANALYSIS:\n")
            f.write("-" * 80 + "\n")
            f.write(f"Image: {img_result.get('image_path', 'N/A')}\n")
            
            # RoboFlow results
            rf_data = img_result.get('roboflow_data', {})
            f.write(f"Keypoints Detected: {len(rf_data.get('keypoints', []))}\n")
            f.write(f"Shooting Phase: {rf_data.get('shooting_phase', 'N/A')}\n")
            f.write(f"Form Quality: {rf_data.get('form_quality', 'N/A')}\n")
            
            # Vision analysis
            vision_data = img_result.get('vision_analysis', {})
            f.write(f"\nCoaching Feedback:\n")
            if 'analysis' in vision_data:
                analysis = vision_data['analysis']
                f.write(f"  Assessment: {analysis.get('form_assessment', 'N/A')}\n")
                f.write(f"  Recommendations: {len(analysis.get('recommendations', []))}\n")
            
            f.write("\n")
        
        f.write("\n" + "=" * 80 + "\n")
        f.write("END OF SUMMARY\n")
        f.write("=" * 80 + "\n")
    
    logger.info(f"✅ Summary saved: {summary_path}")


def main():
    """Main demo execution"""
    parser = argparse.ArgumentParser(description='Phase 4 Integration Pipeline Demo')
    parser.add_argument('--num-samples', type=int, default=3, 
                        help='Number of sample images to analyze (default: 3)')
    parser.add_argument('--training-data-dir', type=str, 
                        default='/home/ubuntu/basketball_app/training_data',
                        help='Path to training data directory')
    parser.add_argument('--output-dir', type=str, 
                        default='/home/ubuntu/basketball_app/phase4_outputs/demo_results',
                        help='Output directory for results')
    parser.add_argument('--skip-visualizations', action='store_true',
                        help='Skip ShotStack visualizations (faster)')
    parser.add_argument('--vision-provider', type=str, default='auto',
                        choices=['auto', 'anthropic', 'openai'],
                        help='Vision API provider (default: auto with fallback)')
    
    args = parser.parse_args()
    
    logger.info("=" * 80)
    logger.info("PHASE 4 COMPLETE INTEGRATION PIPELINE - DEMO")
    logger.info("=" * 80)
    logger.info(f"Number of samples: {args.num_samples}")
    logger.info(f"Training data dir: {args.training_data_dir}")
    logger.info(f"Output dir: {args.output_dir}")
    logger.info(f"Skip visualizations: {args.skip_visualizations}")
    logger.info(f"Vision provider: {args.vision_provider}")
    logger.info("=" * 80)
    
    # Step 1: Find sample images
    logger.info("\n[STEP 1] Finding sample images...")
    sample_images = find_sample_images(args.training_data_dir, args.num_samples)
    
    if not sample_images:
        logger.error("❌ No sample images found!")
        return
    
    logger.info(f"✅ Found {len(sample_images)} sample images")
    for i, img_path in enumerate(sample_images, 1):
        logger.info(f"   {i}. {os.path.basename(img_path)}")
    
    # Step 2: Initialize pipeline
    logger.info("\n[STEP 2] Initializing complete pipeline...")
    
    try:
        pipeline = BasketballAnalysisPipeline(
            roboflow_api_key=ROBOFLOW_API_KEY,
            shotstack_api_key=SHOTSTACK_API_KEY,
            roboflow_workspace=ROBOFLOW_WORKSPACE,
            shotstack_environment=SHOTSTACK_ENVIRONMENT,
            vision_primary=VISION_PRIMARY_PROVIDER,
            vision_fallback=VISION_FALLBACK_PROVIDER,
            anthropic_api_key=ANTHROPIC_API_KEY
        )
        logger.info("✅ Pipeline initialized successfully!")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize pipeline: {e}")
        return
    
    # Step 3: Create user profile
    logger.info("\n[STEP 3] Creating sample user profile...")
    user_profile = create_sample_user_profile()
    logger.info(f"✅ User profile created: Height={user_profile.height}\", "
                f"Wingspan={user_profile.wingspan}\", "
                f"Experience={user_profile.experience_level}")
    
    # Step 4: Run complete analysis
    logger.info("\n[STEP 4] Running complete analysis on sample images...")
    logger.info("This may take several minutes depending on API response times...")
    
    try:
        results = pipeline.analyze_shooting_form(
            user_id="demo_user_001",
            uploaded_images=sample_images,
            user_profile=user_profile,
            enable_visualizations=not args.skip_visualizations,
            vision_provider=args.vision_provider
        )
        
        logger.info("✅ Analysis completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Step 5: Save results
    logger.info("\n[STEP 5] Saving results...")
    save_results(results, args.output_dir)
    
    # Step 6: Display summary
    logger.info("\n[STEP 6] Analysis Summary:")
    logger.info("=" * 80)
    logger.info(f"Total Images Analyzed: {len(results.get('image_results', []))}")
    logger.info(f"Vision Provider Used: {results.get('vision_provider_used', 'N/A')}")
    processing_time = results.get('total_processing_time', 0)
    if isinstance(processing_time, (int, float)):
        logger.info(f"Total Processing Time: {processing_time:.2f}s")
    else:
        logger.info(f"Total Processing Time: {processing_time}")
    logger.info("=" * 80)
    
    # Display individual results
    for i, img_result in enumerate(results.get('image_results', []), 1):
        logger.info(f"\nImage {i}: {os.path.basename(img_result.get('image_path', 'N/A'))}")
        
        rf_data = img_result.get('roboflow_data', {})
        logger.info(f"  - Keypoints: {len(rf_data.get('keypoints', []))}")
        logger.info(f"  - Phase: {rf_data.get('shooting_phase', 'N/A')}")
        logger.info(f"  - Form Quality: {rf_data.get('form_quality', 'N/A')}")
        
        vision_data = img_result.get('vision_analysis', {})
        if 'analysis' in vision_data:
            logger.info(f"  - Provider: {vision_data.get('provider', 'N/A')}")
            logger.info(f"  - Assessment: {vision_data['analysis'].get('form_assessment', 'N/A')}")
    
    logger.info("\n" + "=" * 80)
    logger.info("DEMO COMPLETED SUCCESSFULLY!")
    logger.info(f"Results saved to: {args.output_dir}")
    logger.info("=" * 80)


if __name__ == "__main__":
    main()
