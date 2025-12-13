#!/usr/bin/env python3
"""
Enhanced RoboFlow Basketball Form Classifier Helper Functions

Provides comprehensive shooting form analysis with 18 categories,
scoring algorithms, and coaching recommendations.

Version: 2.0
Updated: 2024
"""

import os
import json
from typing import Dict, List, Optional, Tuple, Union
from roboflow import Roboflow
import numpy as np

# API Keys
PRIVATE_API_KEY = os.getenv("ROBOFLOW_API_KEY", "rDWynPrytSysASUlyGvK")
PUBLISHABLE_API_KEY = os.getenv("ROBOFLOW_PUBLISHABLE_KEY", "rf_qisv7ZQd27SzKITWRc2blZZo5F83")

# Project configuration
WORKSPACE_ID = "tbf-inc"
PROJECT_ID = "basketball-form-quality-classifier"

# Load configuration
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(SCRIPT_DIR, "roboflow_classifier_config.json")

with open(CONFIG_PATH, 'r') as f:
    CLASSIFIER_CONFIG = json.load(f)


class EnhancedFormAnalyzer:
    """
    Enhanced basketball shooting form analyzer with 18 comprehensive categories
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the enhanced analyzer
        
        Args:
            api_key: RoboFlow API key (defaults to PRIVATE_API_KEY)
        """
        self.api_key = api_key or PRIVATE_API_KEY
        self.rf = Roboflow(api_key=self.api_key)
        self.config = CLASSIFIER_CONFIG
        self.model = None
        
        # Category weights for scoring
        self.weights = self.config["scoring_algorithm"]["category_weights"]
        self.severity_scores = self.config["scoring_algorithm"]["severity_scores"]
        
        # Create category lookup
        self.category_lookup = {
            cat["name"]: cat for cat in self.config["categories"]
        }
    
    def load_model(self, version: int = 1):
        """
        Load the classifier model
        
        Args:
            version: Model version number (default: 1)
        """
        try:
            workspace = self.rf.workspace(WORKSPACE_ID)
            project = workspace.project(PROJECT_ID)
            self.model = project.version(version).model
            print(f"✅ Loaded Enhanced Form Classifier v{version}")
            return self.model
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            return None
    
    def analyze_form(self, image_path: str, confidence: float = 0.40) -> Dict:
        """
        Analyze shooting form from an image
        
        Args:
            image_path: Path to the image file
            confidence: Minimum confidence threshold (0.0-1.0)
            
        Returns:
            Comprehensive analysis results with scores and recommendations
        """
        if self.model is None:
            print("Loading model...")
            if self.load_model() is None:
                return {"error": "Model not available"}
        
        try:
            # Run inference
            prediction = self.model.predict(image_path, confidence=int(confidence * 100))
            raw_results = prediction.json()
            
            # Parse predictions
            predictions = self._parse_predictions(raw_results)
            
            # Calculate scores
            scores = self._calculate_scores(predictions)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(predictions, scores)
            
            # Create comprehensive analysis
            analysis = {
                "image": image_path,
                "predictions": predictions,
                "scores": scores,
                "recommendations": recommendations,
                "raw_response": raw_results
            }
            
            return analysis
            
        except Exception as e:
            return {"error": str(e)}
    
    def _parse_predictions(self, raw_results: Dict) -> Dict:
        """
        Parse raw RoboFlow predictions into structured categories
        
        Args:
            raw_results: Raw JSON response from RoboFlow
            
        Returns:
            Structured predictions organized by category
        """
        predictions = {}
        
        # Get predicted classes from multi-label classification
        predicted_classes = raw_results.get("predicted_classes", [])
        
        # Parse category__label format
        for prediction in predicted_classes:
            if "__" in prediction:
                category_name, label_name = prediction.split("__", 1)
                
                if category_name not in predictions:
                    predictions[category_name] = []
                
                # Get label details from config
                label_info = self._get_label_info(category_name, label_name)
                
                predictions[category_name].append({
                    "label": label_name,
                    "label_info": label_info,
                    "confidence": raw_results.get("confidence", 0.5)
                })
        
        return predictions
    
    def _get_label_info(self, category_name: str, label_name: str) -> Dict:
        """Get label information from configuration"""
        category = self.category_lookup.get(category_name, {})
        labels = category.get("labels", [])
        
        for label in labels:
            if label["name"] == label_name:
                return label
        
        return {}
    
    def _calculate_scores(self, predictions: Dict) -> Dict:
        """
        Calculate comprehensive scores from predictions
        
        Args:
            predictions: Structured predictions by category
            
        Returns:
            Dictionary with various score metrics
        """
        scores = {
            "category_scores": {},
            "composite_score": 0.0,
            "weighted_score": 0.0,
            "strengths": [],
            "weaknesses": []
        }
        
        total_weight = 0.0
        weighted_sum = 0.0
        
        # Calculate score for each category
        for category_name, preds in predictions.items():
            if not preds:
                continue
            
            # Get the best (highest severity) prediction for this category
            best_pred = max(preds, key=lambda p: self.severity_scores.get(
                p["label_info"].get("severity", "neutral"), 0
            ))
            
            severity = best_pred["label_info"].get("severity", "neutral")
            score = self.severity_scores.get(severity, 0)
            
            # Store category score
            scores["category_scores"][category_name] = {
                "score": score,
                "severity": severity,
                "label": best_pred["label"],
                "label_display": best_pred["label_info"].get("display", best_pred["label"])
            }
            
            # Add to weighted sum if category has weight
            weight = self.weights.get(category_name, 0)
            if weight > 0 and severity != "neutral":
                weighted_sum += score * weight
                total_weight += weight
            
            # Categorize as strength or weakness
            if score >= 85:
                scores["strengths"].append({
                    "category": category_name,
                    "score": score,
                    "label": best_pred["label_info"].get("display", best_pred["label"])
                })
            elif score < 70:
                scores["weaknesses"].append({
                    "category": category_name,
                    "score": score,
                    "label": best_pred["label_info"].get("display", best_pred["label"])
                })
        
        # Calculate composite score
        if total_weight > 0:
            scores["weighted_score"] = weighted_sum / total_weight
            scores["composite_score"] = scores["weighted_score"]
        
        # Sort strengths and weaknesses
        scores["strengths"].sort(key=lambda x: x["score"], reverse=True)
        scores["weaknesses"].sort(key=lambda x: x["score"])
        
        return scores
    
    def _generate_recommendations(self, predictions: Dict, scores: Dict) -> Dict:
        """
        Generate coaching recommendations based on analysis
        
        Args:
            predictions: Structured predictions
            scores: Calculated scores
            
        Returns:
            Personalized coaching recommendations
        """
        recommendations = {
            "priority_corrections": [],
            "maintenance_areas": [],
            "drill_suggestions": [],
            "overall_assessment": ""
        }
        
        composite_score = scores["composite_score"]
        
        # Overall assessment
        if composite_score >= 95:
            recommendations["overall_assessment"] = "Elite/Textbook Form - Maintain current mechanics and focus on consistency"
        elif composite_score >= 85:
            recommendations["overall_assessment"] = "Excellent Form - Minor refinements will take you to elite level"
        elif composite_score >= 75:
            recommendations["overall_assessment"] = "Good Solid Foundation - Focused work on key areas will elevate your game"
        elif composite_score >= 65:
            recommendations["overall_assessment"] = "Developing - Multiple corrections needed, prioritize fundamentals"
        elif composite_score >= 55:
            recommendations["overall_assessment"] = "Significant Flaws - Major mechanical overhaul recommended"
        else:
            recommendations["overall_assessment"] = "Needs Complete Rebuild - Work with a coach to rebuild from ground up"
        
        # Priority corrections (top 3-5 weaknesses)
        for weakness in scores["weaknesses"][:5]:
            correction = self._get_correction_for_category(
                weakness["category"],
                weakness["label"]
            )
            recommendations["priority_corrections"].append(correction)
        
        # Maintenance areas (top strengths to preserve)
        for strength in scores["strengths"][:3]:
            maintenance = {
                "category": self._format_category_name(strength["category"]),
                "current_status": strength["label"],
                "advice": "Maintain this excellent mechanic through consistent practice"
            }
            recommendations["maintenance_areas"].append(maintenance)
        
        # Drill suggestions based on weaknesses
        recommendations["drill_suggestions"] = self._suggest_drills(predictions, scores)
        
        return recommendations
    
    def _get_correction_for_category(self, category_name: str, current_label: str) -> Dict:
        """Get specific correction advice for a category"""
        
        category_display = self._format_category_name(category_name)
        
        # Map categories to specific correction advice
        corrections = {
            "shooting_hand_mechanics": {
                "focus": "Wrist Snap Development",
                "drill": "Wall flips - Practice wrist snaps against wall, focusing on finger control",
                "cue": "Snap your wrist like you're reaching into a cookie jar on a high shelf"
            },
            "guide_hand_placement": {
                "focus": "Guide Hand Position",
                "drill": "One-hand form shooting - Shoot with shooting hand only to eliminate guide hand interference",
                "cue": "Guide hand on side of ball, thumb should not push"
            },
            "elbow_alignment": {
                "focus": "Elbow Under Ball",
                "drill": "Elbow alignment drill - Shoot facing sideways to mirror, watch elbow position",
                "cue": "Elbow points to target, not out to the side"
            },
            "shoulder_position": {
                "focus": "Shoulder Level & Square",
                "drill": "Wall shooting - Stand close to wall, prevents shoulder drop",
                "cue": "Keep shoulders level and square to basket throughout shot"
            },
            "finger_release": {
                "focus": "Fingertip Control",
                "drill": "Ball spinning drill - Spin ball on finger, then shoot, feeling finger control",
                "cue": "Ball leaves fingertips, not palm. Follow through like putting hand in basket"
            },
            "follow_through": {
                "focus": "Full Extension & Hold",
                "drill": "Hold your follow through for 2 seconds after every shot",
                "cue": "Reach high, make a gooseneck, hold until ball hits net"
            },
            "lower_body_knee_bend": {
                "focus": "Leg Power Generation",
                "drill": "Feet together shooting - Forces proper knee bend and leg drive",
                "cue": "Bend knees to 90 degrees, explode upward through shot"
            },
            "hip_rotation": {
                "focus": "Hip Stability",
                "drill": "Core strength exercises and shooting off balance recovery",
                "cue": "Keep hips square and stable, rotate from shoulders only"
            },
            "foot_placement": {
                "focus": "Base Width & Stability",
                "drill": "Tape a box on ground matching shoulder width, always shoot from there",
                "cue": "Feet shoulder-width apart, balanced stance"
            },
            "balance_stability": {
                "focus": "Balance & Control",
                "drill": "Land on same spot drill - Mark your starting position, land there every time",
                "cue": "Jump straight up and down, no drift forward or backward"
            },
            "ball_positioning": {
                "focus": "Shot Pocket Consistency",
                "drill": "Catch and hold drill - Catch ball in perfect pocket position every time",
                "cue": "Ball starts at forehead level, in your power position"
            },
            "release_point_arc": {
                "focus": "Arc Angle Optimization",
                "drill": "Arc shooting drill - Use targets at different heights to practice arc",
                "cue": "Aim for a rainbow arc, 45-50 degree angle is optimal"
            }
        }
        
        default_correction = {
            "category": category_display,
            "current_issue": current_label,
            "focus": "Mechanical Improvement",
            "drill": "Work with a coach on proper mechanics for this area",
            "cue": "Focus on proper form and consistency"
        }
        
        correction_template = corrections.get(category_name, {})
        correction = {
            "category": category_display,
            "current_issue": current_label,
            **correction_template
        }
        
        return correction if correction_template else default_correction
    
    def _suggest_drills(self, predictions: Dict, scores: Dict) -> List[Dict]:
        """Suggest specific drills based on identified weaknesses"""
        
        drills = []
        weaknesses = scores["weaknesses"]
        
        # Progression-based drill suggestions
        if scores["composite_score"] < 60:
            # Beginner - fundamental rebuilding
            drills.append({
                "name": "Form Shooting Progression",
                "description": "Start 3 feet from basket, perfect form before moving back",
                "focus": "Fundamental mechanics",
                "sets": "5 sets of 10 makes at each distance (3ft, 5ft, 7ft, 10ft)",
                "priority": "high"
            })
        
        if scores["composite_score"] < 75:
            # Intermediate - targeted improvements
            if any(w["category"] in ["shooting_hand_mechanics", "finger_release", "follow_through"] for w in weaknesses):
                drills.append({
                    "name": "One-Hand Form Shooting",
                    "description": "Shoot with shooting hand only, focusing on wrist and finger control",
                    "focus": "Hand mechanics and release",
                    "sets": "3 sets of 15 makes from free throw line",
                    "priority": "high"
                })
            
            if any(w["category"] in ["lower_body_knee_bend", "balance_stability", "foot_placement"] for w in weaknesses):
                drills.append({
                    "name": "Lower Body Power Development",
                    "description": "Feet together shooting to force proper knee bend and balance",
                    "focus": "Leg drive and balance",
                    "sets": "3 sets of 10 makes from 10-15 feet",
                    "priority": "high"
                })
        
        if scores["composite_score"] >= 75:
            # Advanced - refinement drills
            drills.append({
                "name": "Game Speed Shooting",
                "description": "Incorporate movement and game-like scenarios",
                "focus": "Consistency under pressure",
                "sets": "100 game-speed shots mixing catch-and-shoot and off-dribble",
                "priority": "medium"
            })
        
        # Always include consistency drill
        drills.append({
            "name": "21-Day Form Challenge",
            "description": "100 form shots daily with perfect mechanics for 21 days",
            "focus": "Muscle memory and consistency",
            "sets": "100 shots per day, focus on quality over speed",
            "priority": "medium"
        })
        
        return drills
    
    def _format_category_name(self, category_name: str) -> str:
        """Format category name for display"""
        category = self.category_lookup.get(category_name, {})
        return category.get("display_name", category_name.replace("_", " ").title())
    
    def generate_report(self, analysis: Dict, output_format: str = "text") -> str:
        """
        Generate a formatted analysis report
        
        Args:
            analysis: Analysis results from analyze_form()
            output_format: "text", "markdown", or "json"
            
        Returns:
            Formatted report string
        """
        if output_format == "json":
            return json.dumps(analysis, indent=2)
        
        if output_format == "markdown":
            return self._generate_markdown_report(analysis)
        
        # Default: text format
        return self._generate_text_report(analysis)
    
    def _generate_text_report(self, analysis: Dict) -> str:
        """Generate plain text report"""
        
        scores = analysis.get("scores", {})
        recommendations = analysis.get("recommendations", {})
        
        report = []
        report.append("=" * 80)
        report.append("BASKETBALL SHOOTING FORM ANALYSIS REPORT")
        report.append("=" * 80)
        report.append(f"\nImage: {analysis.get('image', 'Unknown')}")
        report.append(f"Overall Score: {scores.get('composite_score', 0):.1f}/100")
        report.append(f"\nAssessment: {recommendations.get('overall_assessment', 'N/A')}")
        
        # Strengths
        report.append("\n" + "-" * 80)
        report.append("STRENGTHS (Maintain These)")
        report.append("-" * 80)
        for strength in scores.get("strengths", [])[:5]:
            report.append(f"✓ {self._format_category_name(strength['category'])}: {strength['label']} ({strength['score']}/100)")
        
        # Weaknesses
        report.append("\n" + "-" * 80)
        report.append("AREAS FOR IMPROVEMENT")
        report.append("-" * 80)
        for weakness in scores.get("weaknesses", [])[:5]:
            report.append(f"✗ {self._format_category_name(weakness['category'])}: {weakness['label']} ({weakness['score']}/100)")
        
        # Priority Corrections
        report.append("\n" + "-" * 80)
        report.append("PRIORITY CORRECTIONS")
        report.append("-" * 80)
        for i, correction in enumerate(recommendations.get("priority_corrections", [])[:3], 1):
            report.append(f"\n{i}. {correction['category']}")
            report.append(f"   Current Issue: {correction['current_issue']}")
            report.append(f"   Focus: {correction.get('focus', 'N/A')}")
            report.append(f"   Drill: {correction.get('drill', 'N/A')}")
            report.append(f"   Coaching Cue: {correction.get('cue', 'N/A')}")
        
        # Drill Suggestions
        report.append("\n" + "-" * 80)
        report.append("RECOMMENDED DRILLS")
        report.append("-" * 80)
        for drill in recommendations.get("drill_suggestions", []):
            report.append(f"\n• {drill['name']} (Priority: {drill.get('priority', 'medium').upper()})")
            report.append(f"  Description: {drill['description']}")
            report.append(f"  Focus: {drill['focus']}")
            report.append(f"  Volume: {drill.get('sets', 'As needed')}")
        
        report.append("\n" + "=" * 80)
        
        return "\n".join(report)
    
    def _generate_markdown_report(self, analysis: Dict) -> str:
        """Generate markdown formatted report"""
        
        scores = analysis.get("scores", {})
        recommendations = analysis.get("recommendations", {})
        
        md = []
        md.append("# Basketball Shooting Form Analysis Report\n")
        md.append(f"**Image:** `{analysis.get('image', 'Unknown')}`\n")
        md.append(f"**Overall Score:** {scores.get('composite_score', 0):.1f}/100\n")
        md.append(f"**Assessment:** {recommendations.get('overall_assessment', 'N/A')}\n")
        
        # Strengths
        md.append("## 🟢 Strengths (Maintain These)\n")
        for strength in scores.get("strengths", [])[:5]:
            md.append(f"- **{self._format_category_name(strength['category'])}:** {strength['label']} `{strength['score']}/100`")
        
        # Weaknesses
        md.append("\n## 🔴 Areas for Improvement\n")
        for weakness in scores.get("weaknesses", [])[:5]:
            md.append(f"- **{self._format_category_name(weakness['category'])}:** {weakness['label']} `{weakness['score']}/100`")
        
        # Priority Corrections
        md.append("\n## 🎯 Priority Corrections\n")
        for i, correction in enumerate(recommendations.get("priority_corrections", [])[:3], 1):
            md.append(f"\n### {i}. {correction['category']}\n")
            md.append(f"- **Current Issue:** {correction['current_issue']}")
            md.append(f"- **Focus:** {correction.get('focus', 'N/A')}")
            md.append(f"- **Drill:** {correction.get('drill', 'N/A')}")
            md.append(f"- **Coaching Cue:** {correction.get('cue', 'N/A')}")
        
        # Drills
        md.append("\n## 🏋️ Recommended Drills\n")
        for drill in recommendations.get("drill_suggestions", []):
            priority_emoji = {"high": "🔴", "medium": "🟡", "low": "🟢"}.get(drill.get("priority", "medium"), "🟡")
            md.append(f"\n### {priority_emoji} {drill['name']}\n")
            md.append(f"- **Description:** {drill['description']}")
            md.append(f"- **Focus:** {drill['focus']}")
            md.append(f"- **Volume:** {drill.get('sets', 'As needed')}")
        
        return "\n".join(md)
    
    def get_category_info(self, category_name: str) -> Dict:
        """Get detailed information about a specific category"""
        return self.category_lookup.get(category_name, {})
    
    def list_all_categories(self) -> List[Dict]:
        """Get list of all available categories"""
        return [
            {
                "name": cat["name"],
                "display_name": cat["display_name"],
                "description": cat["description"],
                "num_labels": len(cat["labels"])
            }
            for cat in self.config["categories"]
        ]


def demo_enhanced_analyzer():
    """Demonstration of the enhanced analyzer"""
    
    print("=" * 80)
    print("ENHANCED BASKETBALL FORM ANALYZER - DEMO")
    print("=" * 80)
    
    analyzer = EnhancedFormAnalyzer()
    
    print("\n📋 Available Categories:")
    categories = analyzer.list_all_categories()
    for i, cat in enumerate(categories, 1):
        print(f"{i:2d}. {cat['display_name']} ({cat['num_labels']} labels)")
        print(f"    {cat['description']}")
    
    print(f"\n\nTotal Categories: {len(categories)}")
    print(f"Total Weight Distribution: {sum(analyzer.weights.values()):.2f}")
    
    print("\n\n📝 Example Usage:")
    print("""
# Analyze shooting form
analyzer = EnhancedFormAnalyzer()
analysis = analyzer.analyze_form("basketball_shot.jpg")

# Generate reports
text_report = analyzer.generate_report(analysis, "text")
markdown_report = analyzer.generate_report(analysis, "markdown")
json_report = analyzer.generate_report(analysis, "json")

# Access specific parts
composite_score = analysis["scores"]["composite_score"]
recommendations = analysis["recommendations"]
priority_corrections = recommendations["priority_corrections"]
    """)
    
    print("\n⚠️  NOTE: Model requires training data before inference")
    print("   Follow ROBOFLOW_SETUP_INSTRUCTIONS.md to configure and train")


if __name__ == "__main__":
    demo_enhanced_analyzer()
