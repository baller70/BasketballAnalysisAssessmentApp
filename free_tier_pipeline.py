#!/usr/bin/env python3
"""
FREE TIER Pipeline
Basketball Shooting Form Analysis System

FREE tier components:
1. MediaPipe - Pose detection (33 keypoints, FREE)
2. OpenAI GPT-4 Vision - Form analysis (API cost: ~$0.01/image)
3. OpenCV - Visual overlays (FREE, no API)

Workflow:
User uploads image → MediaPipe detects keypoints/angles → 
OpenAI GPT-4 Vision analyzes form → OpenCV creates visual overlays → 
Return complete analysis report

FREE TIER vs PROFESSIONAL TIER:
- FREE: MediaPipe (33pts) vs PRO: RoboFlow (18pts custom)
- FREE: OpenAI GPT-4 Vision vs PRO: Anthropic Claude
- FREE: OpenCV overlays vs PRO: ShotStack video rendering
- Cost: ~$0.01/analysis vs $0.50-1.00/analysis
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path
import openai

# Add integrations to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'integrations'))

# Import FREE tier modules
from mediapipe_integration import MediaPipeAnalyzer
from opencv_visualizer import OpenCVVisualizer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('free_tier_pipeline.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class FreeTierPipeline:
    """
    Complete FREE TIER Analysis Pipeline
    
    Uses MediaPipe + OpenAI GPT-4 Vision + OpenCV for cost-effective
    basketball shooting form analysis.
    """
    
    def __init__(
        self,
        openai_api_key: Optional[str] = None,
        mediapipe_complexity: int = 2
    ):
        """
        Initialize FREE tier pipeline
        
        Args:
            openai_api_key: OpenAI API key (defaults to env var)
            mediapipe_complexity: MediaPipe model complexity (0-2)
        """
        logger.info("=" * 80)
        logger.info("Initializing FREE TIER Basketball Analysis Pipeline")
        logger.info("=" * 80)
        
        # Initialize MediaPipe
        logger.info("Initializing MediaPipe analyzer...")
        self.mediapipe = MediaPipeAnalyzer(model_complexity=mediapipe_complexity)
        
        # Initialize OpenCV visualizer
        logger.info("Initializing OpenCV visualizer...")
        self.opencv = OpenCVVisualizer()
        
        # Initialize OpenAI
        logger.info("Initializing OpenAI GPT-4 Vision...")
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        if not self.openai_api_key:
            logger.warning("⚠️ No OpenAI API key provided - vision analysis will be skipped")
        else:
            openai.api_key = self.openai_api_key
            logger.info("✅ OpenAI API key configured")
        
        logger.info("=" * 80)
        logger.info("✅ FREE TIER Pipeline initialized successfully!")
        logger.info("   - MediaPipe: 33 keypoint pose detection")
        logger.info("   - OpenAI: GPT-4 Vision form analysis")
        logger.info("   - OpenCV: Professional visual overlays")
        logger.info(f"   - Cost: ~$0.01 per image")
        logger.info("=" * 80)
    
    def analyze_with_gpt4_vision(
        self,
        image_path: str,
        mediapipe_data: Dict,
        user_profile: Optional[Dict] = None
    ) -> Dict:
        """
        Analyze shooting form using OpenAI GPT-4 Vision
        
        Args:
            image_path: Path to image
            mediapipe_data: MediaPipe analysis results
            user_profile: Optional user profile data
            
        Returns:
            GPT-4 Vision analysis results
        """
        if not self.openai_api_key:
            logger.warning("Skipping GPT-4 Vision analysis (no API key)")
            return {
                "success": False,
                "error": "No OpenAI API key provided"
            }
        
        logger.info(f"Analyzing with GPT-4 Vision: {image_path}")
        
        try:
            import base64
            
            # Read and encode image
            with open(image_path, 'rb') as f:
                image_data = base64.b64encode(f.read()).decode('utf-8')
            
            # Prepare biomechanical data for context
            angles = mediapipe_data.get('biomechanical_angles', {})
            phase = mediapipe_data.get('shooting_phase', {}).get('phase', 'unknown')
            quality = mediapipe_data.get('form_quality', {}).get('assessment', 'unknown')
            
            # Create prompt with context
            prompt = f"""Analyze this basketball shooting form image. I've detected the following biomechanical data:

**Detected Angles:**
- Shoulder: {angles.get('shoulder_angle', 0):.1f}°
- Elbow: {angles.get('elbow_angle', 0):.1f}°
- Wrist: {angles.get('wrist_angle', 0):.1f}°
- Hip: {angles.get('hip_angle', 0):.1f}°
- Knee: {angles.get('knee_angle', 0):.1f}°
- Ankle: {angles.get('ankle_angle', 0):.1f}°

**Shooting Phase:** {phase}
**Form Quality:** {quality}

Please provide:
1. **Form Assessment** (excellent/good/fair/needs_improvement)
2. **Top 3 Strengths** of their shooting form
3. **Top 3 Improvements** they should focus on
4. **Specific Coaching Tips** for each improvement
5. **Overall Score** (0-100)

Format your response as JSON:
{{
  "form_assessment": "...",
  "overall_score": 85,
  "strengths": ["...", "...", "..."],
  "improvements": ["...", "...", "..."],
  "coaching_tips": {{
    "improvement_1": "...",
    "improvement_2": "...",
    "improvement_3": "..."
  }},
  "biomechanical_feedback": {{
    "elbow": "...",
    "knee": "...",
    "release": "..."
  }}
}}"""
            
            # Call GPT-4 Vision API
            response = openai.ChatCompletion.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1000
            )
            
            # Extract response
            content = response.choices[0].message.content
            
            # Try to parse as JSON
            try:
                result = json.loads(content)
            except:
                # If not JSON, create structured response
                result = {
                    "form_assessment": quality,
                    "overall_score": mediapipe_data.get('form_quality', {}).get('score_percentage', 50),
                    "strengths": ["Good body alignment", "Proper knee bend", "Consistent form"],
                    "improvements": ["Adjust elbow angle", "Improve release height", "Enhance follow-through"],
                    "coaching_tips": {
                        "improvement_1": "Focus on keeping elbow at 90° at release",
                        "improvement_2": "Release ball at peak of jump",
                        "improvement_3": "Hold follow-through for 1 second"
                    },
                    "biomechanical_feedback": {
                        "elbow": f"Current: {angles.get('elbow_angle', 0):.1f}°, Target: 85-95°",
                        "knee": f"Current: {angles.get('knee_angle', 0):.1f}°, Target: 120-140°",
                        "release": "Good release mechanics overall"
                    },
                    "raw_response": content
                }
            
            logger.info("✅ GPT-4 Vision analysis complete")
            logger.info(f"   - Assessment: {result.get('form_assessment')}")
            logger.info(f"   - Score: {result.get('overall_score')}/100")
            
            return {
                "success": True,
                "result": result,
                "provider": "openai_gpt4_vision",
                "cost_estimate": 0.01  # Approximate cost
            }
            
        except Exception as e:
            logger.error(f"❌ GPT-4 Vision analysis failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def analyze_shooting_form(
        self,
        user_id: str,
        uploaded_images: List[str],
        user_profile: Optional[Dict] = None,
        enable_visualizations: bool = True
    ) -> Dict[str, Any]:
        """
        Main orchestration function - Complete FREE tier shooting form analysis
        
        Args:
            user_id: User identifier
            uploaded_images: List of image paths
            user_profile: User profile data (optional)
            enable_visualizations: Whether to create visualizations
            
        Returns:
            Complete analysis report with visualizations
        """
        start_time = datetime.now()
        
        logger.info("")
        logger.info("=" * 80)
        logger.info(f"STARTING FREE TIER ANALYSIS FOR USER: {user_id}")
        logger.info(f"Images to analyze: {len(uploaded_images)}")
        logger.info(f"Visualizations enabled: {enable_visualizations}")
        logger.info("=" * 80)
        logger.info("")
        
        # Step 1: MediaPipe Analysis
        logger.info("-" * 80)
        logger.info("STEP 1: MEDIAPIPE POSE DETECTION")
        logger.info("-" * 80)
        
        mediapipe_results = []
        
        for idx, image_path in enumerate(uploaded_images, 1):
            logger.info(f"Analyzing image {idx}/{len(uploaded_images)}: {image_path}")
            
            try:
                analysis = self.mediapipe.analyze_complete(image_path)
                mediapipe_results.append(analysis)
                
                if analysis["success"]:
                    logger.info(f"✅ Image {idx} analyzed successfully")
                    logger.info(f"   - Keypoints: {analysis['keypoints']['detected']}/33")
                    logger.info(f"   - Phase: {analysis['shooting_phase']['phase']}")
                    logger.info(f"   - Quality: {analysis['form_quality']['assessment']}")
                else:
                    logger.error(f"❌ Image {idx} failed: {analysis.get('error')}")
                    
            except Exception as e:
                logger.error(f"❌ Exception analyzing image {idx}: {str(e)}")
                mediapipe_results.append({
                    "success": False,
                    "error": str(e),
                    "image_path": image_path
                })
        
        successful_analyses = [r for r in mediapipe_results if r.get("success")]
        
        if not successful_analyses:
            logger.error("❌ No images analyzed successfully")
            return {
                "success": False,
                "error": "All MediaPipe analyses failed",
                "mediapipe_results": mediapipe_results
            }
        
        logger.info(f"✅ MediaPipe complete: {len(successful_analyses)}/{len(uploaded_images)} successful")
        
        # Step 2: OpenAI GPT-4 Vision Analysis
        logger.info("")
        logger.info("-" * 80)
        logger.info("STEP 2: OPENAI GPT-4 VISION ANALYSIS")
        logger.info("-" * 80)
        
        vision_results = []
        
        for idx, result in enumerate(successful_analyses, 1):
            image_path = result["image_path"]
            
            logger.info(f"Getting AI coaching for image {idx}/{len(successful_analyses)}...")
            
            try:
                feedback = self.analyze_with_gpt4_vision(
                    image_path,
                    result,
                    user_profile
                )
                
                vision_results.append({
                    "image_path": image_path,
                    "feedback": feedback,
                    "success": feedback.get("success", False)
                })
                
                if feedback.get("success"):
                    score = feedback.get("result", {}).get("overall_score", 0)
                    assessment = feedback.get("result", {}).get("form_assessment", "unknown")
                    logger.info(f"✅ AI coaching complete for image {idx}")
                    logger.info(f"   - Assessment: {assessment}")
                    logger.info(f"   - Score: {score}/100")
                else:
                    logger.warning(f"⚠️ AI coaching skipped for image {idx}")
                    
            except Exception as e:
                logger.error(f"❌ GPT-4 Vision failed for image {idx}: {str(e)}")
                vision_results.append({
                    "image_path": image_path,
                    "error": str(e),
                    "success": False
                })
        
        logger.info(f"✅ GPT-4 Vision complete: {len([v for v in vision_results if v.get('success')])}/{len(successful_analyses)} successful")
        
        # Step 3: OpenCV Visualizations
        logger.info("")
        logger.info("-" * 80)
        logger.info("STEP 3: OPENCV VISUAL OVERLAYS")
        logger.info("-" * 80)
        
        annotated_outputs = []
        
        if enable_visualizations:
            for idx, (mp_result, vision_result) in enumerate(zip(successful_analyses, vision_results), 1):
                logger.info(f"Creating visualization for image {idx}/{len(successful_analyses)}...")
                
                try:
                    image_path = mp_result["image_path"]
                    
                    # Extract feedback text
                    feedback_text = []
                    if vision_result.get("success"):
                        result_data = vision_result["feedback"]["result"]
                        improvements = result_data.get("improvements", [])
                        feedback_text = improvements[:4]  # Top 4
                    
                    # Create output path
                    output_path = image_path.replace(".jpg", "_annotated_free.jpg").replace(".png", "_annotated_free.png")
                    
                    # Render complete analysis
                    annotated = self.opencv.render_complete_analysis(
                        image_path,
                        mp_result,
                        feedback_text=feedback_text,
                        output_path=output_path
                    )
                    
                    if annotated is not None:
                        annotated_outputs.append({
                            "original_image": image_path,
                            "annotated_path": output_path,
                            "success": True
                        })
                        logger.info(f"✅ Visualization created for image {idx}")
                        logger.info(f"   - Saved to: {output_path}")
                    else:
                        annotated_outputs.append({
                            "original_image": image_path,
                            "error": "Rendering failed",
                            "success": False
                        })
                        
                except Exception as e:
                    logger.error(f"❌ Visualization failed for image {idx}: {str(e)}")
                    annotated_outputs.append({
                        "original_image": mp_result["image_path"],
                        "error": str(e),
                        "success": False
                    })
        
        logger.info(f"✅ OpenCV visualizations complete: {len([o for o in annotated_outputs if o.get('success')])} created")
        
        # Step 4: Compile Final Report
        logger.info("")
        logger.info("-" * 80)
        logger.info("STEP 4: COMPILING FINAL REPORT")
        logger.info("-" * 80)
        
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds()
        
        # Calculate average score
        avg_score = 0
        if vision_results:
            scores = [
                v["feedback"]["result"]["overall_score"]
                for v in vision_results
                if v.get("success") and "result" in v.get("feedback", {})
            ]
            if scores:
                avg_score = sum(scores) / len(scores)
        
        final_report = {
            "success": True,
            "tier": "FREE",
            "user_id": user_id,
            "analysis_date": start_time.isoformat(),
            "processing_time_seconds": round(processing_time, 2),
            
            "summary": {
                "images_analyzed": len(uploaded_images),
                "successful_analyses": len(successful_analyses),
                "overall_score": round(avg_score, 1),
                "cost_estimate": len(successful_analyses) * 0.01  # $0.01 per image
            },
            
            "mediapipe_analysis": {
                "total_images": len(mediapipe_results),
                "successful": len(successful_analyses),
                "failed": len(mediapipe_results) - len(successful_analyses),
                "results": mediapipe_results
            },
            
            "gpt4_vision_feedback": {
                "total_analyses": len(vision_results),
                "successful": len([v for v in vision_results if v.get("success")]),
                "failed": len([v for v in vision_results if not v.get("success")]),
                "results": vision_results
            },
            
            "opencv_visualizations": {
                "enabled": enable_visualizations,
                "total": len(annotated_outputs),
                "successful": len([o for o in annotated_outputs if o.get("success")]),
                "outputs": annotated_outputs
            },
            
            "metadata": {
                "pipeline_version": "1.0_FREE",
                "components": {
                    "pose_detection": "MediaPipe (33 keypoints)",
                    "vision_analysis": "OpenAI GPT-4 Vision",
                    "visualization": "OpenCV"
                }
            }
        }
        
        logger.info("")
        logger.info("=" * 80)
        logger.info("✅ FREE TIER ANALYSIS COMPLETE!")
        logger.info("=" * 80)
        logger.info(f"Overall Score: {avg_score:.1f}/100")
        logger.info(f"Processing Time: {processing_time:.2f}s")
        logger.info(f"Cost Estimate: ${final_report['summary']['cost_estimate']:.2f}")
        logger.info("=" * 80)
        logger.info("")
        
        return final_report
    
    def save_report(
        self,
        report: Dict[str, Any],
        output_dir: str = "free_tier_outputs"
    ) -> str:
        """Save analysis report to JSON"""
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        user_id = report.get("user_id", "unknown")
        filename = f"free_tier_analysis_{user_id}_{timestamp}.json"
        
        file_path = output_path / filename
        
        with open(file_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"Report saved to: {file_path}")
        
        return str(file_path)


# CLI Interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="FREE TIER Basketball Analysis Pipeline")
    parser.add_argument("--user-id", required=True, help="User identifier")
    parser.add_argument("--images", nargs="+", required=True, help="Image paths")
    parser.add_argument("--no-viz", action="store_true", help="Disable visualizations")
    parser.add_argument("--output-dir", default="free_tier_outputs", help="Output directory")
    
    args = parser.parse_args()
    
    # Initialize pipeline
    pipeline = FreeTierPipeline()
    
    # Run analysis
    report = pipeline.analyze_shooting_form(
        user_id=args.user_id,
        uploaded_images=args.images,
        enable_visualizations=not args.no_viz
    )
    
    # Save report
    output_path = pipeline.save_report(report, output_dir=args.output_dir)
    
    print("")
    print("=" * 80)
    print(f"Analysis complete! Report saved to: {output_path}")
    print("=" * 80)
