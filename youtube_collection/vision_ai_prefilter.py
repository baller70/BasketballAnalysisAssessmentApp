#!/usr/bin/env python3
"""
Vision AI Pre-Filter for Basketball Shooting Images
Uses Claude Vision API to verify images meet dataset criteria
"""

import os
import json
import base64
import anthropic
from datetime import datetime
from pathlib import Path
import time

# Configuration
API_KEY = "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"
INPUT_DIR = "/home/ubuntu/basketball_app/youtube_collection/extracted_frames"
OUTPUT_DIR = "/home/ubuntu/basketball_app/youtube_collection/vision_ai_results"
APPROVED_DIR = "/home/ubuntu/basketball_app/youtube_collection/approved_images"

# Verification prompt
VERIFICATION_PROMPT = """Analyze this image for a basketball shooting form analysis dataset.

CRITICAL REQUIREMENTS:
1. Basketball must be clearly visible in the image
2. Exactly one person as the main subject (background people OK if one person is clearly the focus)
3. Person is actively shooting the basketball (NOT dribbling, NOT layup, NOT passing)
4. Person's full body is visible from head to toe (or at least torso to feet)
5. Ball is in shooting position: at chest, overhead, in release, or follow-through
6. Clear view of shooting form and posture

REJECT if:
- No basketball visible
- Person just standing/jumping without ball
- Dribbling motion
- Layup or driving to basket
- Multiple people with unclear focus
- Only partial body visible (just upper body or just legs)
- Blurry or poor quality
- Different sport (soccer, volleyball, etc.)
- Diagrams, illustrations, or skeleton overlays (we need real photos)
- Text overlay covering the person
- Legal forms or documents

Respond in JSON format:
{
  "basketball_visible": true/false,
  "person_shooting": true/false,
  "full_body_visible": true/false,
  "ball_position": "chest/overhead/release/follow-through/not_visible",
  "shooting_phase": "preparation/loading/rise/release/follow-through/none",
  "quality_score": 0-100,
  "is_real_photo": true/false,
  "verdict": "ACCEPT/REJECT",
  "reason": "brief explanation"
}"""

def encode_image(image_path):
    """Encode image to base64"""
    with open(image_path, 'rb') as f:
        return base64.standard_b64encode(f.read()).decode('utf-8')

def get_media_type(filename):
    """Get media type from file extension"""
    ext = Path(filename).suffix.lower()
    media_types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif'
    }
    return media_types.get(ext, 'image/jpeg')

def verify_image(client, image_path, index, total):
    """Verify a single image using Claude Vision API"""
    filename = os.path.basename(image_path)
    print(f"\n{'='*60}")
    print(f"Analyzing image {index}/{total}: {filename}")
    print(f"{'='*60}")
    
    try:
        # Encode image
        image_data = encode_image(image_path)
        media_type = get_media_type(filename)
        
        # Call Claude Vision API
        message = client.messages.create(
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
                                "data": image_data,
                            },
                        },
                        {
                            "type": "text",
                            "text": VERIFICATION_PROMPT
                        }
                    ],
                }
            ],
        )
        
        # Parse response
        response_text = message.content[0].text
        print(f"\nClaude Response:\n{response_text}")
        
        # Extract JSON from response
        try:
            # Try to find JSON in the response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                analysis = json.loads(json_str)
            else:
                # Fallback: create manual analysis from text
                analysis = {
                    "verdict": "REJECT" if "reject" in response_text.lower() else "ACCEPT",
                    "reason": "Could not parse JSON response",
                    "raw_response": response_text
                }
        except json.JSONDecodeError as e:
            print(f"⚠️  JSON parse error: {e}")
            analysis = {
                "verdict": "REJECT",
                "reason": f"JSON parse error: {e}",
                "raw_response": response_text
            }
        
        # Add metadata
        result = {
            "filename": filename,
            "filepath": image_path,
            "index": index,
            "analysis": analysis,
            "verdict": analysis.get("verdict", "REJECT"),
            "analyzed_at": datetime.now().isoformat(),
            "api_usage": {
                "model": message.model,
                "input_tokens": message.usage.input_tokens,
                "output_tokens": message.usage.output_tokens
            }
        }
        
        # Print verdict
        verdict = result["verdict"]
        if verdict == "ACCEPT":
            print(f"\n✅ ACCEPTED")
        else:
            print(f"\n❌ REJECTED")
        
        print(f"Reason: {analysis.get('reason', 'No reason provided')}")
        
        return result
        
    except Exception as e:
        print(f"❌ Error analyzing {filename}: {str(e)}")
        return {
            "filename": filename,
            "filepath": image_path,
            "index": index,
            "verdict": "ERROR",
            "error": str(e),
            "analyzed_at": datetime.now().isoformat()
        }

def main():
    """Main pre-filter function"""
    print("\n" + "="*60)
    print("🤖 VISION AI PRE-FILTER - BASKETBALL SHOOTING IMAGES")
    print("="*60 + "\n")
    
    # Create output directories
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(APPROVED_DIR, exist_ok=True)
    
    # Initialize Anthropic client
    client = anthropic.Anthropic(api_key=API_KEY)
    
    # Get all images
    image_files = []
    for ext in ['*.jpg', '*.jpeg', '*.png', '*.webp', '*.gif']:
        image_files.extend(Path(INPUT_DIR).glob(ext))
    
    # Filter out metadata files
    image_files = [f for f in image_files if 'metadata' not in f.name.lower()]
    
    print(f"Found {len(image_files)} images to analyze\n")
    
    if len(image_files) == 0:
        print("❌ No images found in input directory")
        return False
    
    # Process all images
    results = []
    for index, image_path in enumerate(image_files, 1):
        result = verify_image(client, str(image_path), index, len(image_files))
        results.append(result)
        
        # Rate limiting: wait 1 second between API calls
        if index < len(image_files):
            time.sleep(1)
    
    # Save results
    results_file = os.path.join(OUTPUT_DIR, "vision_ai_results.json")
    with open(results_file, 'w') as f:
        json.dump({
            "analyzed_at": datetime.now().isoformat(),
            "total_images": len(image_files),
            "accepted": len([r for r in results if r.get("verdict") == "ACCEPT"]),
            "rejected": len([r for r in results if r.get("verdict") == "REJECT"]),
            "errors": len([r for r in results if r.get("verdict") == "ERROR"]),
            "results": results
        }, f, indent=2)
    
    # Generate summary
    print("\n" + "="*60)
    print("📊 VISION AI PRE-FILTER SUMMARY")
    print("="*60)
    
    accepted = [r for r in results if r.get("verdict") == "ACCEPT"]
    rejected = [r for r in results if r.get("verdict") == "REJECT"]
    errors = [r for r in results if r.get("verdict") == "ERROR"]
    
    print(f"\n✅ ACCEPTED: {len(accepted)}/{len(results)}")
    print(f"❌ REJECTED: {len(rejected)}/{len(results)}")
    print(f"⚠️  ERRORS: {len(errors)}/{len(results)}")
    
    if accepted:
        print(f"\n📁 Accepted Images:")
        for r in accepted:
            print(f"  ✓ {r['filename']}")
            if 'analysis' in r and 'quality_score' in r['analysis']:
                print(f"    Quality: {r['analysis']['quality_score']}/100")
    
    if rejected:
        print(f"\n🚫 Rejected Images:")
        for r in rejected:
            print(f"  ✗ {r['filename']}")
            if 'analysis' in r:
                print(f"    Reason: {r['analysis'].get('reason', 'No reason')}")
    
    # Calculate total API usage
    total_input_tokens = sum(r.get('api_usage', {}).get('input_tokens', 0) for r in results if 'api_usage' in r)
    total_output_tokens = sum(r.get('api_usage', {}).get('output_tokens', 0) for r in results if 'api_usage' in r)
    
    print(f"\n💰 API Usage:")
    print(f"  Input Tokens: {total_input_tokens:,}")
    print(f"  Output Tokens: {total_output_tokens:,}")
    print(f"  Total Tokens: {total_input_tokens + total_output_tokens:,}")
    
    print(f"\n📋 Results saved to: {results_file}")
    print("\n" + "="*60 + "\n")
    
    return len(accepted) > 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
