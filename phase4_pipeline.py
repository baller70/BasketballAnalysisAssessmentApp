"""
Phase 4 Complete Integration Pipeline
Basketball Shooting Form Analysis System

This is the main orchestration module that coordinates:
1. RoboFlow - Keypoint detection and biomechanical analysis
2. Vision API - AI-powered coaching (Anthropic primary, OpenAI fallback)
3. ShotStack - Professional visual overlays and annotations

Complete workflow:
User uploads image → RoboFlow detects keypoints/angles/phases → 
Vision API analyzes form → ShotStack creates visual overlays → 
Return complete analysis report
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path

# Add integrations to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'integrations'))

# Import integration modules
from roboflow_integration import RoboFlowAnalyzer, ShootingPhase, FormQuality
from vision_api_integration import VisionAPIAnalyzer, UserProfile, VisionProvider
from shotstack_integration import ShotStackVisualizer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('phase4_pipeline.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class BasketballAnalysisPipeline:
    """
    Complete Phase 4 Integration Pipeline
    
    Orchestrates the entire analysis workflow from image input to 
    professional annotated output with coaching feedback.
    """
    
    def __init__(
        self,
        roboflow_api_key: str,
        shotstack_api_key: str,
        roboflow_workspace: str = "tbf-inc",
        shotstack_environment: str = "sandbox",
        vision_primary: str = "anthropic",
        vision_fallback: str = "openai",
        anthropic_api_key: Optional[str] = None
    ):
        """
        Initialize the complete analysis pipeline
        
        Args:
            roboflow_api_key: RoboFlow API key
            shotstack_api_key: ShotStack API key
            roboflow_workspace: RoboFlow workspace name
            shotstack_environment: "sandbox" or "production"
            vision_primary: Primary vision provider
            vision_fallback: Fallback vision provider
            anthropic_api_key: Anthropic API key (required if using Anthropic)
        """
        logger.info("=" * 80)
        logger.info("Initializing Phase 4 Basketball Analysis Pipeline")
        logger.info("=" * 80)
        
        # Initialize RoboFlow
        logger.info("Initializing RoboFlow analyzer...")
        self.roboflow = RoboFlowAnalyzer(
            api_key=roboflow_api_key,
            workspace=roboflow_workspace
        )
        
        # Initialize Vision API
        logger.info("Initializing Vision API analyzer...")
        self.vision = VisionAPIAnalyzer(
            primary_provider=vision_primary,
            fallback_provider=vision_fallback,
            anthropic_api_key=anthropic_api_key
        )
        
        # Initialize ShotStack
        logger.info("Initializing ShotStack visualizer...")
        self.shotstack = ShotStackVisualizer(
            api_key=shotstack_api_key,
            environment=shotstack_environment
        )
        
        logger.info("✅ All components initialized successfully!")
        logger.info(f"   - RoboFlow: {roboflow_workspace}")
        logger.info(f"   - Vision API: {vision_primary} (primary), {vision_fallback} (fallback)")
        logger.info(f"   - ShotStack: {shotstack_environment} mode")
        logger.info("=" * 80)
    
    def analyze_shooting_form(
        self,
        user_id: str,
        uploaded_images: List[str],
        user_profile: Optional[UserProfile] = None,
        enable_visualizations: bool = True,
        vision_provider: str = "auto"
    ) -> Dict[str, Any]:
        """
        Main orchestration function - Complete shooting form analysis
        
        This is the primary entry point for the entire pipeline.
        
        Args:
            user_id: User identifier
            uploaded_images: List of image paths or URLs
            user_profile: User physical profile (optional)
            enable_visualizations: Whether to create ShotStack visualizations
            vision_provider: "auto" (fallback), "anthropic", or "openai"
            
        Returns:
            Complete analysis report with all data and visualizations
        """
        start_time = datetime.now()
        
        logger.info("")
        logger.info("=" * 80)
        logger.info(f"STARTING ANALYSIS FOR USER: {user_id}")
        logger.info(f"Images to analyze: {len(uploaded_images)}")
        logger.info(f"Visualizations enabled: {enable_visualizations}")
        logger.info("=" * 80)
        logger.info("")
        
        # Step 1: Get or create user profile
        if user_profile is None:
            logger.info("No user profile provided, using default profile")
            user_profile = self._get_default_profile()
        
        logger.info(f"User profile: {user_profile.to_dict()}")
        
        # Step 2: RoboFlow Analysis (for each image)
        logger.info("")
        logger.info("-" * 80)
        logger.info("STEP 2: ROBOFLOW ANALYSIS")
        logger.info("-" * 80)
        
        roboflow_results = []
        
        for idx, image_path in enumerate(uploaded_images, 1):
            logger.info(f"Analyzing image {idx}/{len(uploaded_images)}: {image_path}")
            
            try:
                analysis = self.roboflow.analyze_complete(image_path)
                
                if analysis["success"]:
                    roboflow_results.append({
                        "image_path": image_path,
                        "analysis": analysis,
                        "success": True
                    })
                    
                    logger.info(f"✅ Image {idx} analyzed successfully")
                    logger.info(f"   - Keypoints detected: {analysis['keypoints']['detected']}")
                    logger.info(f"   - Shooting phase: {analysis['shooting_phase']['phase']}")
                    logger.info(f"   - Form quality: {analysis['form_quality']['assessment']}")
                else:
                    logger.error(f"❌ Image {idx} analysis failed: {analysis.get('error')}")
                    roboflow_results.append({
                        "image_path": image_path,
                        "error": analysis.get("error"),
                        "success": False
                    })
                    
            except Exception as e:
                logger.error(f"❌ Exception analyzing image {idx}: {str(e)}")
                roboflow_results.append({
                    "image_path": image_path,
                    "error": str(e),
                    "success": False
                })
        
        successful_analyses = [r for r in roboflow_results if r["success"]]
        
        if not successful_analyses:
            logger.error("❌ No images analyzed successfully. Pipeline aborted.")
            return {
                "success": False,
                "error": "All RoboFlow analyses failed",
                "roboflow_results": roboflow_results
            }
        
        logger.info(f"✅ RoboFlow analysis complete: {len(successful_analyses)}/{len(uploaded_images)} successful")
        
        # Step 3: Vision API Analysis (Anthropic primary, OpenAI fallback)
        logger.info("")
        logger.info("-" * 80)
        logger.info("STEP 3: VISION API ANALYSIS (AI COACHING)")
        logger.info("-" * 80)
        
        # Find similar professional shooters for context
        logger.info("Finding similar professional shooters...")
        professional_comparisons = self.vision.compare_to_professionals(
            user_profile,
            successful_analyses[0]["analysis"]  # Use first successful analysis
        )
        
        if professional_comparisons:
            logger.info(f"Found {len(professional_comparisons)} similar professionals:")
            for comp in professional_comparisons[:3]:
                logger.info(f"   - {comp.player_name}: {comp.similarity_score*100:.1f}% similar")
        
        vision_feedback = []
        
        for idx, result in enumerate(successful_analyses, 1):
            image_path = result["image_path"]
            roboflow_data = result["analysis"]
            
            logger.info(f"Getting AI coaching for image {idx}/{len(successful_analyses)}...")
            logger.info(f"   Vision provider mode: {vision_provider}")
            
            try:
                feedback = self.vision.analyze_form(
                    image_path=image_path,
                    roboflow_data=roboflow_data,
                    user_profile=user_profile,
                    provider=vision_provider
                )
                
                vision_feedback.append({
                    "image_path": image_path,
                    "feedback": feedback,
                    "success": True
                })
                
                provider_used = feedback.get("metadata", {}).get("provider", "unknown")
                fallback_used = feedback.get("metadata", {}).get("fallback_used", False)
                
                logger.info(f"✅ AI coaching completed for image {idx}")
                logger.info(f"   - Provider used: {provider_used}")
                logger.info(f"   - Fallback triggered: {'YES' if fallback_used else 'NO'}")
                logger.info(f"   - Assessment: {feedback.get('result', {}).get('form_assessment', 'N/A')}")
                
            except Exception as e:
                logger.error(f"❌ Vision API failed for image {idx}: {str(e)}")
                vision_feedback.append({
                    "image_path": image_path,
                    "error": str(e),
                    "success": False
                })
        
        successful_feedback = [f for f in vision_feedback if f["success"]]
        
        logger.info(f"✅ Vision API analysis complete: {len(successful_feedback)}/{len(successful_analyses)} successful")
        
        # Step 4: ShotStack Visual Enhancement
        logger.info("")
        logger.info("-" * 80)
        logger.info("STEP 4: SHOTSTACK VISUALIZATION")
        logger.info("-" * 80)
        
        annotated_outputs = []
        
        if enable_visualizations and successful_feedback:
            for idx, (robo_result, vision_result) in enumerate(zip(successful_analyses, successful_feedback), 1):
                logger.info(f"Creating visual overlay for image {idx}/{len(successful_feedback)}...")
                
                try:
                    image_path = robo_result["image_path"]
                    roboflow_data = robo_result["analysis"]
                    feedback_data = vision_result["feedback"]
                    
                    # Convert feedback to format expected by ShotStack
                    feedback_formatted = self.vision.generate_feedback(feedback_data)
                    
                    # Create annotated output
                    output_url = self.shotstack.render_final_output(
                        image_url=image_path,
                        keypoints=roboflow_data["keypoints"]["data"],
                        angles=roboflow_data["biomechanical_angles"],
                        feedback=feedback_formatted,
                        comparisons=professional_comparisons
                    )
                    
                    annotated_outputs.append({
                        "original_image": image_path,
                        "annotated_url": output_url,
                        "success": True
                    })
                    
                    logger.info(f"✅ Visualization created for image {idx}")
                    logger.info(f"   Output URL: {output_url}")
                    
                except Exception as e:
                    logger.error(f"❌ ShotStack visualization failed for image {idx}: {str(e)}")
                    annotated_outputs.append({
                        "original_image": robo_result["image_path"],
                        "error": str(e),
                        "success": False
                    })
        else:
            logger.info("⚠️ Visualizations disabled or no successful feedback")
        
        logger.info(f"✅ ShotStack processing complete: {len([o for o in annotated_outputs if o.get('success')])} visualizations created")
        
        # Step 5: Compile Final Report
        logger.info("")
        logger.info("-" * 80)
        logger.info("STEP 5: COMPILING FINAL REPORT")
        logger.info("-" * 80)
        
        # Compile recommendations
        recommendations = self.vision.compile_recommendations(
            [f["feedback"] for f in vision_feedback if f["success"]]
        )
        
        # Calculate overall improvement score
        improvement_score = self._calculate_improvement_score(
            successful_analyses,
            successful_feedback
        )
        
        # Build final report
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        final_report = {
            "success": True,
            "user_id": user_id,
            "analysis_date": start_time.isoformat(),
            "processing_time_seconds": round(processing_time, 2),
            
            # Summary
            "summary": {
                "images_analyzed": len(uploaded_images),
                "successful_analyses": len(successful_analyses),
                "overall_score": improvement_score,
                "primary_focus": self._determine_primary_focus(successful_feedback),
                "estimated_improvement_potential": self._estimate_improvement_potential(successful_analyses)
            },
            
            # RoboFlow data
            "roboflow_analysis": {
                "total_images": len(roboflow_results),
                "successful": len(successful_analyses),
                "failed": len(roboflow_results) - len(successful_analyses),
                "results": roboflow_results
            },
            
            # Vision API feedback
            "vision_api_feedback": {
                "total_analyses": len(vision_feedback),
                "successful": len(successful_feedback),
                "failed": len(vision_feedback) - len(successful_feedback),
                "providers_used": list(set([
                    f["feedback"].get("metadata", {}).get("provider", "unknown")
                    for f in vision_feedback if f["success"]
                ])),
                "fallback_triggered": any([
                    f["feedback"].get("metadata", {}).get("fallback_used", False)
                    for f in vision_feedback if f["success"]
                ]),
                "results": vision_feedback
            },
            
            # Professional comparisons
            "professional_comparisons": [
                {
                    "player_name": comp.player_name,
                    "similarity_score": round(comp.similarity_score * 100, 1),
                    "height": comp.height,
                    "wingspan": comp.wingspan
                }
                for comp in professional_comparisons
            ],
            
            # ShotStack visualizations
            "annotated_outputs": annotated_outputs,
            
            # Recommendations
            "recommendations": recommendations[:10],  # Top 10
            
            # User profile
            "user_profile": user_profile.to_dict(),
            
            # Metadata
            "metadata": {
                "pipeline_version": "4.0",
                "roboflow_workspace": self.roboflow.workspace,
                "vision_primary": self.vision.primary_provider.value,
                "vision_fallback": self.vision.fallback_provider.value,
                "shotstack_environment": self.shotstack.environment
            }
        }
        
        logger.info("")
        logger.info("=" * 80)
        logger.info("✅ ANALYSIS COMPLETE!")
        logger.info("=" * 80)
        logger.info(f"Overall Score: {improvement_score}/100")
        logger.info(f"Processing Time: {processing_time:.2f}s")
        logger.info(f"Recommendations: {len(recommendations)}")
        logger.info(f"Visualizations: {len([o for o in annotated_outputs if o.get('success')])}")
        logger.info("=" * 80)
        logger.info("")
        
        return final_report
    
    def batch_analyze(
        self,
        user_data: List[Dict[str, Any]],
        enable_visualizations: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Batch analysis for multiple users
        
        Args:
            user_data: List of user analysis requests
            enable_visualizations: Whether to create visualizations
            
        Returns:
            List of analysis reports
        """
        logger.info(f"Starting batch analysis for {len(user_data)} users")
        
        results = []
        
        for idx, user_request in enumerate(user_data, 1):
            logger.info(f"Processing user {idx}/{len(user_data)}: {user_request.get('user_id')}")
            
            try:
                result = self.analyze_shooting_form(
                    user_id=user_request["user_id"],
                    uploaded_images=user_request["images"],
                    user_profile=user_request.get("profile"),
                    enable_visualizations=enable_visualizations
                )
                results.append(result)
                
            except Exception as e:
                logger.error(f"Batch analysis failed for user {idx}: {str(e)}")
                results.append({
                    "success": False,
                    "user_id": user_request.get("user_id"),
                    "error": str(e)
                })
        
        logger.info(f"Batch analysis complete: {len([r for r in results if r.get('success')])}/{len(user_data)} successful")
        
        return results
    
    def save_report(
        self,
        report: Dict[str, Any],
        output_dir: str = "phase4_outputs"
    ) -> str:
        """
        Save analysis report to JSON file
        
        Args:
            report: Analysis report
            output_dir: Output directory
            
        Returns:
            Path to saved report
        """
        # Create output directory
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        user_id = report.get("user_id", "unknown")
        filename = f"analysis_{user_id}_{timestamp}.json"
        
        file_path = output_path / filename
        
        # Save report
        with open(file_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"Report saved to: {file_path}")
        
        return str(file_path)
    
    # Helper methods
    
    def _get_default_profile(self) -> UserProfile:
        """Get default user profile"""
        return UserProfile(
            height=72,  # 6'0"
            wingspan=74,
            experience_level="intermediate",
            body_type="mesomorph"
        )
    
    def _calculate_improvement_score(
        self,
        roboflow_results: List[Dict],
        vision_feedback: List[Dict]
    ) -> int:
        """Calculate overall improvement score (0-100)"""
        if not roboflow_results or not vision_feedback:
            return 50
        
        # Average form quality from vision feedback
        assessments = []
        for feedback in vision_feedback:
            if feedback["success"]:
                assessment = feedback["feedback"].get("result", {}).get("form_assessment", "fair")
                
                score_map = {
                    "excellent": 95,
                    "good": 80,
                    "fair": 65,
                    "needs_improvement": 45,
                    "needs improvement": 45
                }
                
                assessments.append(score_map.get(assessment.lower(), 50))
        
        return round(sum(assessments) / len(assessments)) if assessments else 50
    
    def _determine_primary_focus(self, vision_feedback: List[Dict]) -> str:
        """Determine the #1 priority focus area"""
        all_improvements = []
        
        for feedback in vision_feedback:
            if feedback["success"]:
                improvements = feedback["feedback"].get("result", {}).get("habits_identified", {}).get("needs_improvement", [])
                all_improvements.extend(improvements)
        
        if not all_improvements:
            return "Maintain current form mechanics"
        
        # Return most common improvement
        from collections import Counter
        most_common = Counter(all_improvements).most_common(1)
        
        return most_common[0][0] if most_common else "Form refinement"
    
    def _estimate_improvement_potential(self, roboflow_results: List[Dict]) -> str:
        """Estimate improvement potential based on biomechanical data"""
        if not roboflow_results:
            return "Unable to estimate"
        
        # Analyze angle deviations from optimal
        total_deviation = 0
        count = 0
        
        for result in roboflow_results:
            if not result["success"]:
                continue
            
            angles = result["analysis"]["biomechanical_angles"]
            
            # Check deviations from optimal ranges
            optimal_ranges = self.shotstack.OPTIMAL_RANGES
            
            for angle_key, angle_value in angles.items():
                if angle_key in optimal_ranges:
                    min_val, max_val = optimal_ranges[angle_key]
                    
                    if angle_value < min_val:
                        total_deviation += min_val - angle_value
                        count += 1
                    elif angle_value > max_val:
                        total_deviation += angle_value - max_val
                        count += 1
        
        if count == 0:
            return "Excellent form - minimal improvement needed"
        
        avg_deviation = total_deviation / count
        
        if avg_deviation < 5:
            return "5-10% improvement potential with refinement"
        elif avg_deviation < 10:
            return "10-20% improvement potential with focused practice"
        elif avg_deviation < 20:
            return "20-30% improvement potential with form corrections"
        else:
            return "30%+ improvement potential with comprehensive form overhaul"


# CLI Interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Phase 4 Basketball Analysis Pipeline")
    parser.add_argument("--user-id", required=True, help="User identifier")
    parser.add_argument("--images", nargs="+", required=True, help="Image paths or URLs")
    parser.add_argument("--height", type=float, default=72, help="User height in inches")
    parser.add_argument("--wingspan", type=float, default=74, help="User wingspan in inches")
    parser.add_argument("--experience", default="intermediate", help="Experience level")
    parser.add_argument("--body-type", default="mesomorph", help="Body type")
    parser.add_argument("--no-viz", action="store_true", help="Disable visualizations")
    parser.add_argument("--vision-provider", default="auto", choices=["auto", "anthropic", "openai"])
    parser.add_argument("--output-dir", default="phase4_outputs", help="Output directory")
    
    args = parser.parse_args()
    
    # Get API keys from environment
    roboflow_key = os.getenv("ROBOFLOW_API_KEY", "rDWynPrytSysASUlyGvK")
    shotstack_key = os.getenv("SHOTSTACK_API_KEY", "5I9pXTQbDLmcF6tvgjOzgYtDN5jyK2FnurBSU5oy")
    
    # Initialize pipeline
    pipeline = BasketballAnalysisPipeline(
        roboflow_api_key=roboflow_key,
        shotstack_api_key=shotstack_key
    )
    
    # Create user profile
    user_profile = UserProfile(
        height=args.height,
        wingspan=args.wingspan,
        experience_level=args.experience,
        body_type=args.body_type
    )
    
    # Run analysis
    report = pipeline.analyze_shooting_form(
        user_id=args.user_id,
        uploaded_images=args.images,
        user_profile=user_profile,
        enable_visualizations=not args.no_viz,
        vision_provider=args.vision_provider
    )
    
    # Save report
    output_path = pipeline.save_report(report, output_dir=args.output_dir)
    
    print("")
    print("=" * 80)
    print(f"Analysis complete! Report saved to: {output_path}")
    print("=" * 80)
