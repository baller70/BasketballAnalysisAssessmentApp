#!/usr/bin/env python3
"""
Progress Tracker for Image Collection

Tracks progress across all stages:
1. Collection from sources
2. Vision AI filtering
3. User approval
4. RoboFlow upload
"""

import json
from pathlib import Path
from typing import Dict
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent
METADATA_DIR = BASE_DIR / "metadata"
PROGRESS_FILE = METADATA_DIR / "progress.json"

class ProgressTracker:
    """Track collection progress"""
    
    def __init__(self):
        self.progress = self.load_progress()
    
    def load_progress(self) -> Dict:
        """Load progress from file"""
        if PROGRESS_FILE.exists():
            with open(PROGRESS_FILE, 'r') as f:
                return json.load(f)
        else:
            # Initialize default progress
            return {
                "target_images": 1500,
                "collection": {
                    "raw_collected": 0,
                    "by_source": {
                        "youtube": {"collected": 0, "duplicates": 0},
                        "pixabay": {"collected": 0, "duplicates": 0},
                        "pexels": {"collected": 0, "duplicates": 0},
                        "unsplash": {"collected": 0, "duplicates": 0},
                        "web_scraping": {"collected": 0, "duplicates": 0}
                    }
                },
                "vision_ai_filtering": {
                    "processed": 0,
                    "accepted": 0,
                    "rejected": 0,
                    "acceptance_rate": 0.0
                },
                "user_approval": {
                    "approved": 0,
                    "rejected": 0,
                    "pending": 0
                },
                "roboflow_upload": {
                    "uploaded": 0,
                    "annotated": 0
                },
                "overall_progress_percentage": 0.0,
                "estimated_time_remaining": "Unknown",
                "last_updated": datetime.now().isoformat()
            }
    
    def save_progress(self):
        """Save progress to file"""
        self.progress["last_updated"] = datetime.now().isoformat()
        METADATA_DIR.mkdir(parents=True, exist_ok=True)
        with open(PROGRESS_FILE, 'w') as f:
            json.dump(self.progress, f, indent=2)
    
    def update_from_collection_metadata(self):
        """Update progress from collection metadata"""
        metadata_file = METADATA_DIR / "collection_metadata.json"
        if not metadata_file.exists():
            return
        
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
        
        # Update collection stats
        self.progress["collection"]["raw_collected"] = metadata.get("total_images", 0)
        self.progress["collection"]["by_source"] = metadata.get("stats", {})
        
        self.save_progress()
        logger.info("✅ Updated progress from collection metadata")
    
    def update_from_vision_ai(self):
        """Update progress from Vision AI results"""
        metadata_file = METADATA_DIR / "collection_metadata.json"
        if not metadata_file.exists():
            return
        
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
        
        # Count Vision AI results
        processed = 0
        accepted = 0
        rejected = 0
        
        for img in metadata.get("images", []):
            if img.get("vision_ai_verdict"):
                processed += 1
                if img["vision_ai_verdict"] == "ACCEPT":
                    accepted += 1
                else:
                    rejected += 1
        
        self.progress["vision_ai_filtering"]["processed"] = processed
        self.progress["vision_ai_filtering"]["accepted"] = accepted
        self.progress["vision_ai_filtering"]["rejected"] = rejected
        
        if processed > 0:
            self.progress["vision_ai_filtering"]["acceptance_rate"] = (accepted / processed) * 100
        
        # Update user approval pending count
        self.progress["user_approval"]["pending"] = accepted
        
        self.save_progress()
        logger.info("✅ Updated progress from Vision AI filtering")
    
    def update_user_approval(self, approved: int, rejected: int):
        """Update user approval stats"""
        self.progress["user_approval"]["approved"] = approved
        self.progress["user_approval"]["rejected"] = rejected
        self.progress["user_approval"]["pending"] = \
            self.progress["vision_ai_filtering"]["accepted"] - approved - rejected
        
        self.save_progress()
        logger.info(f"✅ Updated user approval: {approved} approved, {rejected} rejected")
    
    def calculate_overall_progress(self):
        """Calculate overall progress percentage"""
        target = self.progress["target_images"]
        approved = self.progress["user_approval"]["approved"]
        
        if target > 0:
            self.progress["overall_progress_percentage"] = (approved / target) * 100
        
        # Estimate time remaining
        if approved > 0:
            # Assume 10 seconds per image for approval
            remaining_images = target - approved
            remaining_seconds = remaining_images * 10
            hours = remaining_seconds // 3600
            minutes = (remaining_seconds % 3600) // 60
            
            if hours > 0:
                self.progress["estimated_time_remaining"] = f"{hours}h {minutes}m"
            else:
                self.progress["estimated_time_remaining"] = f"{minutes}m"
        
        self.save_progress()
    
    def generate_dashboard_data(self) -> Dict:
        """Generate data for dashboard visualization"""
        self.calculate_overall_progress()
        
        return {
            "target": self.progress["target_images"],
            "collected": self.progress["collection"]["raw_collected"],
            "filtered": self.progress["vision_ai_filtering"]["accepted"],
            "approved": self.progress["user_approval"]["approved"],
            "progress_percentage": self.progress["overall_progress_percentage"],
            "estimated_time": self.progress["estimated_time_remaining"],
            "acceptance_rate": self.progress["vision_ai_filtering"]["acceptance_rate"],
            "by_source": self.progress["collection"]["by_source"]
        }
    
    def print_status(self):
        """Print current status to console"""
        self.calculate_overall_progress()
        
        print("\n" + "╔═" * 30 + "╗")
        print("║" + " " * 20 + "IMAGE COLLECTION PROGRESS" + " " * 20 + "║")
        print("╚═" * 30 + "╝\n")
        
        print(f"🎯 TARGET: {self.progress['target_images']} images\n")
        
        print("📁 COLLECTION")
        print("━" * 60)
        print(f"Raw Collected: {self.progress['collection']['raw_collected']}")
        for source, stats in self.progress['collection']['by_source'].items():
            print(f"  {source:15}: {stats['collected']:3} ({stats['duplicates']} duplicates)")
        
        print("\n🤖 VISION AI FILTERING")
        print("━" * 60)
        vai = self.progress['vision_ai_filtering']
        print(f"Processed: {vai['processed']}")
        print(f"Accepted: {vai['accepted']} ✅")
        print(f"Rejected: {vai['rejected']} ❌")
        print(f"Acceptance Rate: {vai['acceptance_rate']:.1f}%")
        
        print("\n👤 USER APPROVAL")
        print("━" * 60)
        ua = self.progress['user_approval']
        print(f"Approved: {ua['approved']} ✅")
        print(f"Rejected: {ua['rejected']} ❌")
        print(f"Pending: {ua['pending']} ⏳")
        
        print("\n📊 OVERALL PROGRESS")
        print("━" * 60)
        progress_pct = self.progress['overall_progress_percentage']
        bar_length = 40
        filled = int(bar_length * progress_pct / 100)
        bar = "█" * filled + "░" * (bar_length - filled)
        print(f"[{bar}] {progress_pct:.1f}%")
        print(f"\nEstimated Time Remaining: {self.progress['estimated_time_remaining']}")
        print(f"Last Updated: {self.progress['last_updated'][:19]}\n")

def main():
    """Main execution"""
    tracker = ProgressTracker()
    
    # Update from available metadata
    tracker.update_from_collection_metadata()
    tracker.update_from_vision_ai()
    
    # Print status
    tracker.print_status()
    
    # Generate dashboard data
    dashboard_data = tracker.generate_dashboard_data()
    dashboard_file = METADATA_DIR / "dashboard_data.json"
    with open(dashboard_file, 'w') as f:
        json.dump(dashboard_data, f, indent=2)
    
    logger.info(f"📊 Dashboard data saved to {dashboard_file}")

if __name__ == "__main__":
    main()
