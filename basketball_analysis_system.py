#!/usr/bin/env python3
"""
Unified Basketball Analysis System
Supports both FREE and PROFESSIONAL tiers

TIER COMPARISON:

FREE TIER:
- Pose Detection: MediaPipe (33 keypoints)
- Vision Analysis: OpenAI GPT-4 Vision
- Visualization: OpenCV
- Cost: ~$0.01/image
- Accuracy: 85-90%
- Use Case: Casual players, practice tracking

PROFESSIONAL TIER:
- Pose Detection: RoboFlow (18 custom keypoints)
- Vision Analysis: Anthropic Claude
- Visualization: ShotStack (professional video)
- Cost: ~$0.50-1.00/image
- Accuracy: 95%+
- Use Case: Elite athletes, professional coaching
"""

import os
import sys
import logging
from typing import Dict, List, Optional, Any
from pathlib import Path

# Add integrations to path
sys.path.insert(0, os.path.dirname(__file__))

# Import tier pipelines
from free_tier_pipeline import FreeTierPipeline
from phase4_pipeline import BasketballAnalysisPipeline

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class TierType:
    """Tier types"""
    FREE = "free"
    PROFESSIONAL = "professional"


class BasketballAnalysisSystem:
    """
    Unified Basketball Analysis System
    Supports both FREE and PROFESSIONAL tiers
    """
    
    def __init__(
        self,
        openai_api_key: Optional[str] = None,
        roboflow_api_key: Optional[str] = None,
        shotstack_api_key: Optional[str] = None,
        anthropic_api_key: Optional[str] = None
    ):
        """
        Initialize unified system
        
        Args:
            openai_api_key: OpenAI API key (for FREE tier)
            roboflow_api_key: RoboFlow API key (for PRO tier)
            shotstack_api_key: ShotStack API key (for PRO tier)
            anthropic_api_key: Anthropic API key (for PRO tier)
        """
        logger.info("="*80)
        logger.info("Initializing Unified Basketball Analysis System")
        logger.info("="*80)
        
        # Initialize FREE tier
        logger.info("Setting up FREE tier...")
        self.free_tier = FreeTierPipeline(
            openai_api_key=openai_api_key
        )
        logger.info("✅ FREE tier ready")
        
        # Initialize PROFESSIONAL tier (if keys provided)
        self.professional_tier = None
        if roboflow_api_key and shotstack_api_key:
            logger.info("Setting up PROFESSIONAL tier...")
            try:
                self.professional_tier = BasketballAnalysisPipeline(
                    roboflow_api_key=roboflow_api_key,
                    shotstack_api_key=shotstack_api_key,
                    anthropic_api_key=anthropic_api_key
                )
                logger.info("✅ PROFESSIONAL tier ready")
            except Exception as e:
                logger.warning(f"⚠️ PROFESSIONAL tier initialization failed: {e}")
        else:
            logger.info("⚠️ PROFESSIONAL tier not configured (missing API keys)")
        
        logger.info("="*80)
    
    def analyze(
        self,
        user_id: str,
        images: List[str],
        tier: str = TierType.FREE,
        user_profile: Optional[Dict] = None,
        enable_visualizations: bool = True
    ) -> Dict[str, Any]:
        """
        Analyze shooting form using specified tier
        
        Args:
            user_id: User identifier
            images: List of image paths
            tier: "free" or "professional"
            user_profile: Optional user profile data
            enable_visualizations: Whether to create visualizations
            
        Returns:
            Complete analysis report
        """
        logger.info(f"Analyzing with {tier.upper()} tier")
        
        if tier == TierType.FREE:
            return self.free_tier.analyze_shooting_form(
                user_id=user_id,
                uploaded_images=images,
                user_profile=user_profile,
                enable_visualizations=enable_visualizations
            )
        
        elif tier == TierType.PROFESSIONAL:
            if not self.professional_tier:
                logger.error("PROFESSIONAL tier not available")
                return {
                    "success": False,
                    "error": "PROFESSIONAL tier not configured"
                }
            
            # Convert user_profile dict to UserProfile object if needed
            from integrations.vision_api_integration import UserProfile
            profile_obj = None
            if user_profile:
                profile_obj = UserProfile(
                    height=user_profile.get('height', 72),
                    wingspan=user_profile.get('wingspan', 74),
                    experience_level=user_profile.get('experience_level', 'intermediate'),
                    body_type=user_profile.get('body_type', 'mesomorph')
                )
            
            return self.professional_tier.analyze_shooting_form(
                user_id=user_id,
                uploaded_images=images,
                user_profile=profile_obj,
                enable_visualizations=enable_visualizations
            )
        
        else:
            logger.error(f"Unknown tier: {tier}")
            return {
                "success": False,
                "error": f"Unknown tier: {tier}"
            }
    
    def compare_tiers(
        self,
        user_id: str,
        images: List[str],
        user_profile: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Run analysis on both tiers for comparison
        
        Args:
            user_id: User identifier
            images: List of image paths
            user_profile: Optional user profile data
            
        Returns:
            Comparison report with both tier results
        """
        logger.info("Running comparison analysis (FREE vs PROFESSIONAL)")
        
        # Run FREE tier
        free_result = self.analyze(
            user_id=user_id,
            images=images,
            tier=TierType.FREE,
            user_profile=user_profile
        )
        
        # Run PROFESSIONAL tier
        pro_result = self.analyze(
            user_id=user_id,
            images=images,
            tier=TierType.PROFESSIONAL,
            user_profile=user_profile
        )
        
        # Create comparison report
        comparison = {
            "user_id": user_id,
            "images_analyzed": len(images),
            "free_tier": {
                "success": free_result.get("success", False),
                "processing_time": free_result.get("processing_time_seconds", 0),
                "cost_estimate": free_result.get("summary", {}).get("cost_estimate", 0),
                "overall_score": free_result.get("summary", {}).get("overall_score", 0),
                "full_report": free_result
            },
            "professional_tier": {
                "success": pro_result.get("success", False),
                "processing_time": pro_result.get("processing_time_seconds", 0),
                "cost_estimate": pro_result.get("summary", {}).get("cost_estimate", 0) if pro_result.get("success") else "N/A",
                "overall_score": pro_result.get("summary", {}).get("overall_score", 0),
                "full_report": pro_result
            },
            "comparison": {
                "cost_difference": "~50-100x more expensive" if pro_result.get("success") else "N/A",
                "time_difference": f"{pro_result.get('processing_time_seconds', 0) - free_result.get('processing_time_seconds', 0):.2f}s" if pro_result.get("success") else "N/A",
                "recommendation": self._get_tier_recommendation(free_result, pro_result)
            }
        }
        
        return comparison
    
    def _get_tier_recommendation(self, free_result: Dict, pro_result: Dict) -> str:
        """
        Determine which tier to recommend
        
        Args:
            free_result: FREE tier analysis result
            pro_result: PROFESSIONAL tier analysis result
            
        Returns:
            Recommendation string
        """
        if not pro_result.get("success"):
            return "FREE tier (PROFESSIONAL tier not available)"
        
        # If both successful, recommend based on use case
        return """Recommendation:
        - FREE tier: Great for casual players, practice tracking, budget-conscious users
        - PROFESSIONAL tier: Best for elite athletes, professional coaching, competitive analysis
        """


# CLI Interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Unified Basketball Analysis System")
    parser.add_argument("--user-id", required=True, help="User identifier")
    parser.add_argument("--images", nargs="+", required=True, help="Image paths")
    parser.add_argument("--tier", choices=["free", "professional", "both"], default="free",
                       help="Tier to use (free/professional/both)")
    parser.add_argument("--output-dir", default="tier_comparison_outputs", help="Output directory")
    
    args = parser.parse_args()
    
    # Initialize system
    system = BasketballAnalysisSystem()
    
    # Run analysis
    if args.tier == "both":
        result = system.compare_tiers(
            user_id=args.user_id,
            images=args.images
        )
        print("\nCOMPARISON RESULTS:")
        print(f"  FREE tier: {result['free_tier']['overall_score']:.1f}/100 (${result['free_tier']['cost_estimate']:.2f})")
        print(f"  PROFESSIONAL tier: {result['professional_tier']['overall_score']}/100 (${result['professional_tier']['cost_estimate']})")
    else:
        result = system.analyze(
            user_id=args.user_id,
            images=args.images,
            tier=args.tier
        )
        print(f"\nANALYSIS COMPLETE ({args.tier.upper()} tier):")
        print(f"  Score: {result.get('summary', {}).get('overall_score', 0)}/100")
        print(f"  Cost: ${result.get('summary', {}).get('cost_estimate', 0):.2f}")
