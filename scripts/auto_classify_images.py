#!/usr/bin/env python3
"""
Auto-Classify Basketball Images by Shooting Phase

Uses OpenAI Vision API to automatically classify images into:
- load: Ball below chin, knees bent, preparing to shoot
- set: Ball at forehead/set point, aiming
- release: Ball leaving hands
- follow_through: Arms extended, ball released
- reject: Not a shooting image (dribbling, passing, etc.)
"""

import os
import sys
import json
import base64
import shutil
from pathlib import Path
from openai import OpenAI

# Paths
BASE_DIR = Path(__file__).parent.parent
TRAINING_DIR = BASE_DIR / "training_data"
RAW_DIR = TRAINING_DIR / "raw"
UNCLASSIFIED_DIR = RAW_DIR / "unclassified"
REJECTED_DIR = TRAINING_DIR / "rejected"

# OpenAI API key from environment
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

# Shooting phases
VALID_PHASES = ["load", "set", "release", "follow_through", "reject"]

CLASSIFICATION_PROMPT = """Analyze this basketball image and classify it into ONE of these shooting phases:

1. **load** - Player is preparing to shoot. Ball is below chin level, knees are bent, getting ready.
2. **set** - Ball is at the "set point" (forehead level or above), player is aiming at the basket.
3. **release** - Ball is actively leaving the player's hands, mid-release.
4. **follow_through** - Ball has been released, arms are extended upward, wrist is snapped.
5. **reject** - This is NOT a basketball shooting image. Player is dribbling, passing, dunking, defending, or image doesn't show shooting form clearly.

RULES:
- Only classify as a shooting phase if you can clearly see a player in shooting motion
- If the image is blurry, cropped badly, or doesn't show full shooting form, classify as "reject"
- If multiple players are visible and overlapping, classify as "reject"
- If the player is clearly NOT shooting (dunking, passing, dribbling), classify as "reject"

Respond with ONLY a JSON object in this exact format:
{"phase": "load|set|release|follow_through|reject", "confidence": 0.0-1.0, "reason": "brief explanation"}
"""


def encode_image(image_path: Path) -> str:
    """Encode image to base64."""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def classify_image(client: OpenAI, image_path: Path) -> dict:
    """Classify a single image using OpenAI Vision."""
    try:
        # Get image extension
        ext = image_path.suffix.lower()
        if ext in [".jpg", ".jpeg"]:
            media_type = "image/jpeg"
        elif ext == ".png":
            media_type = "image/png"
        elif ext == ".webp":
            media_type = "image/webp"
        else:
            return {"phase": "reject", "confidence": 0, "reason": "Unsupported image format"}
        
        # Encode image
        base64_image = encode_image(image_path)
        
        # Call OpenAI Vision
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Use mini for cost efficiency
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": CLASSIFICATION_PROMPT},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{media_type};base64,{base64_image}",
                                "detail": "low"  # Low detail for faster/cheaper
                            }
                        }
                    ]
                }
            ],
            max_tokens=150
        )
        
        # Parse response
        content = response.choices[0].message.content.strip()
        
        # Try to parse JSON
        try:
            # Handle potential markdown code blocks
            if "```" in content:
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            
            result = json.loads(content)
            
            # Validate phase
            if result.get("phase") not in VALID_PHASES:
                result["phase"] = "reject"
            
            return result
        except json.JSONDecodeError:
            # Try to extract phase from text
            content_lower = content.lower()
            for phase in VALID_PHASES:
                if phase in content_lower:
                    return {"phase": phase, "confidence": 0.5, "reason": "Parsed from text"}
            return {"phase": "reject", "confidence": 0, "reason": "Could not parse response"}
    
    except Exception as e:
        return {"phase": "reject", "confidence": 0, "reason": f"Error: {str(e)[:50]}"}


def move_image(image_path: Path, phase: str):
    """Move image to appropriate phase folder."""
    if phase == "reject":
        dest_dir = REJECTED_DIR
    else:
        dest_dir = RAW_DIR / phase
    
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / image_path.name
    
    # Handle duplicate filenames
    if dest_path.exists():
        stem = image_path.stem
        suffix = image_path.suffix
        counter = 1
        while dest_path.exists():
            dest_path = dest_dir / f"{stem}_{counter}{suffix}"
            counter += 1
    
    shutil.move(str(image_path), str(dest_path))
    return dest_path


def main():
    print("="*60)
    print("🏀 Auto-Classify Basketball Images (OpenAI Vision)")
    print("="*60)
    
    # Check API key
    if not OPENAI_API_KEY:
        print("\n❌ OPENAI_API_KEY not set!")
        print("   export OPENAI_API_KEY='your_key_here'")
        return
    
    # Initialize client
    client = OpenAI(api_key=OPENAI_API_KEY)
    
    # Create directories
    REJECTED_DIR.mkdir(parents=True, exist_ok=True)
    for phase in ["load", "set", "release", "follow_through"]:
        (RAW_DIR / phase).mkdir(parents=True, exist_ok=True)
    
    # Get images to classify
    images = list(UNCLASSIFIED_DIR.glob("*.*"))
    images = [img for img in images if img.suffix.lower() in [".jpg", ".jpeg", ".png", ".webp"]]
    
    print(f"\n📁 Found {len(images)} images to classify")
    
    if not images:
        print("   No images to classify!")
        return
    
    # Stats
    stats = {phase: 0 for phase in VALID_PHASES}
    
    # Classify each image
    print("\n🔄 Classifying images...")
    
    for i, image_path in enumerate(images):
        print(f"\n  [{i+1}/{len(images)}] {image_path.name}")
        
        # Classify
        result = classify_image(client, image_path)
        phase = result.get("phase", "reject")
        confidence = result.get("confidence", 0)
        reason = result.get("reason", "")
        
        # Move image
        new_path = move_image(image_path, phase)
        
        # Update stats
        stats[phase] += 1
        
        # Status indicator
        if phase == "reject":
            status = "❌"
        else:
            status = "✅"
        
        print(f"     {status} {phase.upper()} ({confidence:.0%}) - {reason[:40]}")
    
    # Print summary
    print("\n" + "="*60)
    print("📊 CLASSIFICATION COMPLETE")
    print("="*60)
    
    total_good = 0
    for phase in ["load", "set", "release", "follow_through"]:
        count = stats[phase]
        total_good += count
        status = "✅" if count >= 25 else "⚠️"
        print(f"  {status} {phase.upper()}: {count} images")
    
    print(f"\n  ❌ REJECTED: {stats['reject']} images")
    print(f"\n  📁 Total usable: {total_good}")
    
    if total_good >= 100:
        print("\n✅ Minimum 100 usable images achieved!")
    else:
        print(f"\n⚠️ Need {100 - total_good} more usable images")
    
    print("="*60)


if __name__ == "__main__":
    main()




