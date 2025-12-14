#!/usr/bin/env python3
"""
Vision AI Pre-Filter using Claude

Filters collected images using Claude Vision API:
- Checks for basketball visibility
- Verifies shooting form clarity
- Ensures full body visibility
- Assesses image quality

Only ACCEPT images pass through to user approval.
"""

import os
import sys
import json
import base64
import anthropic
from pathlib import Path
from typing import Dict, Optional
import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
BASE_DIR = Path(__file__).parent
RAW_IMAGES_DIR = BASE_DIR / "raw_images"
FILTERED_IMAGES_DIR = BASE_DIR / "filtered_images"
REJECTED_IMAGES_DIR = BASE_DIR / "rejected_images"
METADATA_DIR = BASE_DIR / "metadata"

# Create directories
for directory in [FILTERED_IMAGES_DIR, REJECTED_IMAGES_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# API Configuration
ANTHROPIC_API_KEY = os.getenv(
    "ANTHROPIC_API_KEY",
    "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"
)

VISION_VERIFICATION_PROMPT = """
You are an expert basketball shooting form analyzer. Evaluate this image for use in training a basketball shooting form detection AI model.

**ACCEPTANCE CRITERIA:**

✅ ACCEPT if ALL of these are true:
1. Basketball is clearly visible in the image
2. Person is actively shooting or in shooting stance
3. Full body is visible (head to feet, or at least torso to feet)
4. Image is clear and not blurry
5. Lighting is adequate (not too dark or overexposed)
6. Single player is the main focus (others in background OK)

❌ REJECT if ANY of these are true:
1. No basketball visible
2. Person not shooting (dribbling, passing, or just standing)
3. Upper body or lower body cut off significantly
4. Image is blurry or out of focus
5. Too dark or overexposed
6. Multiple players with unclear focus
7. Cartoon/illustration (we need real photos)

**SCORING:**
Provide a quality score from 0-100:
- 90-100: Perfect for training (ideal angle, clarity, form)
- 70-89: Good quality (acceptable for training)
- 50-69: Marginal (usable but not ideal)
- 0-49: Poor quality (should be rejected)

**RESPONSE FORMAT:**
Respond in JSON format ONLY:
{
  "verdict": "ACCEPT" or "REJECT",
  "score": 0-100,
  "basketball_visible": true/false,
  "shooting_form_visible": true/false,
  "full_body_visible": true/false,
  "image_quality": "excellent"/"good"/"fair"/"poor",
  "reason": "Brief explanation of verdict"
}
"""

class VisionAIFilter:
    """Vision AI filtering using Claude"""
    
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        self.stats = {
            "total_processed": 0,
            "accepted": 0,
            "rejected": 0,
            "errors": 0
        }
    
    def encode_image(self, image_path: Path) -> str:
        """Encode image to base64"""
        with open(image_path, 'rb') as f:
            return base64.b64encode(f.read()).decode('utf-8')
    
    def analyze_image(self, image_path: Path) -> Optional[Dict]:
        """Analyze single image with Claude Vision"""
        try:
            # Encode image
            image_data = self.encode_image(image_path)
            
            # Determine media type
            ext = image_path.suffix.lower()
            media_type_map = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.webp': 'image/webp'
            }
            media_type = media_type_map.get(ext, 'image/jpeg')
            
            # Call Claude Vision API
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": image_data
                                }
                            },
                            {
                                "type": "text",
                                "text": VISION_VERIFICATION_PROMPT
                            }
                        ]
                    }
                ]
            )
            
            # Parse response
            response_text = message.content[0].text
            
            # Extract JSON from response
            # Sometimes Claude wraps JSON in markdown code blocks
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            
            result = json.loads(response_text)
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error for {image_path.name}: {str(e)}")
            logger.error(f"Response was: {response_text[:200]}...")
            return None
        except Exception as e:
            logger.error(f"Error analyzing {image_path.name}: {str(e)}")
            return None
    
    def filter_image(self, image_path: Path) -> bool:
        """Filter single image and move to appropriate directory"""
        logger.info(f"🔍 Analyzing: {image_path.name}")
        
        # Analyze with Vision AI
        result = self.analyze_image(image_path)
        
        if not result:
            self.stats["errors"] += 1
            logger.error(f"❌ Analysis failed: {image_path.name}")
            return False
        
        verdict = result.get("verdict", "REJECT")
        score = result.get("score", 0)
        reason = result.get("reason", "No reason provided")
        
        # Update metadata
        self.update_metadata(image_path.name, result)
        
        # Move file based on verdict
        if verdict == "ACCEPT" and score >= 50:  # Minimum score threshold
            # Move to filtered directory
            dest_path = FILTERED_IMAGES_DIR / image_path.name
            image_path.rename(dest_path)
            self.stats["accepted"] += 1
            logger.info(f"✅ ACCEPTED (score: {score}): {image_path.name}")
            logger.info(f"   Reason: {reason}")
            return True
        else:
            # Move to rejected directory
            dest_path = REJECTED_IMAGES_DIR / image_path.name
            image_path.rename(dest_path)
            self.stats["rejected"] += 1
            logger.info(f"❌ REJECTED (score: {score}): {image_path.name}")
            logger.info(f"   Reason: {reason}")
            return False
    
    def update_metadata(self, filename: str, analysis_result: Dict):
        """Update metadata file with Vision AI results"""
        metadata_file = METADATA_DIR / "collection_metadata.json"
        
        if not metadata_file.exists():
            return
        
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
        
        # Find image in metadata and update
        for img in metadata.get("images", []):
            if img["filename"] == filename:
                img["vision_ai_score"] = analysis_result.get("score")
                img["vision_ai_verdict"] = analysis_result.get("verdict")
                img["vision_ai_details"] = analysis_result
                break
        
        # Save updated metadata
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
    
    def filter_all_images(self, max_workers: int = 3):
        """Filter all images in raw_images directory"""
        image_files = list(RAW_IMAGES_DIR.glob("*.jpg")) + \
                      list(RAW_IMAGES_DIR.glob("*.jpeg")) + \
                      list(RAW_IMAGES_DIR.glob("*.png"))
        
        total = len(image_files)
        logger.info(f"📊 Found {total} images to filter")
        
        if total == 0:
            logger.warning("⚠️ No images found in raw_images directory")
            return
        
        # Process images with rate limiting
        # Claude API has rate limits, so we process sequentially with delays
        for idx, image_path in enumerate(image_files, 1):
            logger.info(f"\n{'='*60}")
            logger.info(f"Processing {idx}/{total}")
            logger.info(f"{'='*60}")
            
            self.filter_image(image_path)
            self.stats["total_processed"] += 1
            
            # Rate limiting: 1 request per 2 seconds (safe for Claude API)
            if idx < total:
                time.sleep(2)
        
        # Generate report
        self.generate_report()
    
    def generate_report(self) -> str:
        """Generate filtering report"""
        acceptance_rate = (self.stats["accepted"] / self.stats["total_processed"] * 100) if self.stats["total_processed"] > 0 else 0
        
        report = f"""
╔══════════════════════════════════════════════════════════════╗
║            VISION AI PRE-FILTERING REPORT                    ║
╚══════════════════════════════════════════════════════════════╝

📊 PROCESSING SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Processed: {self.stats['total_processed']}
Accepted: {self.stats['accepted']} ✅
Rejected: {self.stats['rejected']} ❌
Errors: {self.stats['errors']} ⚠️

Acceptance Rate: {acceptance_rate:.1f}%

📁 OUTPUT DIRECTORIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Accepted Images: {FILTERED_IMAGES_DIR}
Rejected Images: {REJECTED_IMAGES_DIR}
Metadata: {METADATA_DIR / 'collection_metadata.json'}

✅ NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Review accepted images ({self.stats['accepted']} images)
2. Open user approval interface
3. User approves final selection
4. Upload to RoboFlow for annotation

💡 TIP: If acceptance rate is low (<40%), consider:
   - Adjusting search queries for image sources
   - Lowering quality threshold (currently 50)
   - Collecting from more specific sources

"""
        
        print("\n" + report)
        
        # Save report to file
        report_file = METADATA_DIR / "vision_ai_filter_report.txt"
        with open(report_file, 'w') as f:
            f.write(report)
        logger.info(f"📄 Report saved to {report_file}")
        
        return report

def main():
    """Main execution function"""
    logger.info("🚀 Starting Vision AI pre-filtering...")
    logger.info(f"📂 Raw images directory: {RAW_IMAGES_DIR}")
    
    filter_instance = VisionAIFilter()
    filter_instance.filter_all_images()

if __name__ == "__main__":
    main()
