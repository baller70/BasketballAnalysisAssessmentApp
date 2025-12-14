#!/usr/bin/env python3
"""
Vision AI Image Verifier for Basketball Shooting Images
Uses OpenAI GPT-4 Vision API to verify images show basketball shooting with ball visible
"""

import os
import json
import base64
from openai import OpenAI
from pathlib import Path
from typing import Dict, List, Tuple
import time

# OpenAI API Configuration
OPENAI_API_KEY = "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"
client = OpenAI(api_key=OPENAI_API_KEY)

VERIFICATION_PROMPT = """Analyze this image carefully and answer these questions:

1. Is there a basketball visible in the image? (YES/NO)
2. Is there a person shooting the basketball? (YES/NO)
3. Where is the ball? (over head / near chest / near stomach / in hands / follow-through / not visible)
4. Is the person's full body visible (head to toe)? (YES/NO)
5. Is this clearly a basketball shooting motion? (YES/NO)
6. Are there any other sports equipment visible (soccer ball, volleyball, etc.)? (YES/NO)
7. What shooting phase is shown? (preparation / release / follow-through / landing / not shooting)

REJECT if:
- No basketball visible
- Person just jumping with no ball
- Different sport
- Ball not in shooting position
- Not a shooting motion
- Multiple people blocking view
- Ball too small or unclear

ACCEPT if:
- Basketball clearly visible
- Person shooting the ball
- Full body visible (or most of body)
- Clear shooting form
- Ball in shooting position (overhead, chest, release, follow-through)

Answer in JSON format:
{
  "basketball_visible": true/false,
  "person_shooting": true/false,
  "ball_position": "string",
  "full_body_visible": true/false,
  "shooting_motion": true/false,
  "other_sports": true/false,
  "shooting_phase": "string",
  "verdict": "ACCEPT" or "REJECT",
  "reason": "brief explanation",
  "confidence": 0-100
}"""


def encode_image_to_base64(image_path: str) -> Tuple[str, str]:
    """
    Encode image to base64 and detect media type
    
    Args:
        image_path: Path to the image file
        
    Returns:
        Tuple of (base64_data, media_type)
    """
    with open(image_path, "rb") as image_file:
        image_data = image_file.read()
        base64_data = base64.standard_b64encode(image_data).decode("utf-8")
    
    # Detect media type
    ext = Path(image_path).suffix.lower()
    media_type_map = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
    }
    media_type = media_type_map.get(ext, 'image/jpeg')
    
    return base64_data, media_type


def verify_image_with_vision_ai(image_path: str, verbose: bool = False) -> Dict:
    """
    Verify if an image shows basketball shooting with ball visible using GPT-4 Vision API
    
    Args:
        image_path: Path to the image file
        verbose: Whether to print detailed logs
        
    Returns:
        Dictionary with verification results
    """
    try:
        if verbose:
            print(f"\n🔍 Analyzing: {image_path}")
        
        # Encode image
        base64_data, media_type = encode_image_to_base64(image_path)
        
        # Call OpenAI GPT-4 Vision API
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": VERIFICATION_PROMPT
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{media_type};base64,{base64_data}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1024,
            temperature=0.2
        )
        
        # Extract response
        response_text = response.choices[0].message.content
        
        if verbose:
            print(f"📝 Raw response: {response_text[:200]}...")
        
        # Parse JSON response
        # Try to extract JSON from code blocks if present
        if "```json" in response_text:
            json_start = response_text.find("```json") + 7
            json_end = response_text.find("```", json_start)
            response_text = response_text[json_start:json_end].strip()
        elif "```" in response_text:
            json_start = response_text.find("```") + 3
            json_end = response_text.find("```", json_start)
            response_text = response_text[json_start:json_end].strip()
        
        result = json.loads(response_text)
        
        # Add metadata
        result['image_path'] = image_path
        result['timestamp'] = time.strftime('%Y-%m-%d %H:%M:%S')
        
        if verbose:
            verdict = result.get('verdict', 'UNKNOWN')
            reason = result.get('reason', 'No reason provided')
            print(f"✅ Verdict: {verdict} - {reason}")
        
        return result
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON Parse Error for {image_path}: {e}")
        print(f"Response text: {response_text}")
        return {
            'image_path': image_path,
            'verdict': 'ERROR',
            'reason': f'JSON parse error: {str(e)}',
            'error': True
        }
    except Exception as e:
        print(f"❌ Error analyzing {image_path}: {e}")
        return {
            'image_path': image_path,
            'verdict': 'ERROR',
            'reason': str(e),
            'error': True
        }


def batch_verify_images(image_paths: List[str], verbose: bool = False, delay: float = 1.0) -> List[Dict]:
    """
    Verify multiple images with Vision AI
    
    Args:
        image_paths: List of image paths to verify
        verbose: Whether to print detailed logs
        delay: Delay between API calls in seconds
        
    Returns:
        List of verification results
    """
    results = []
    accepted = []
    rejected = []
    errors = []
    
    print(f"\n🚀 Starting batch verification of {len(image_paths)} images...")
    print("=" * 80)
    
    for i, image_path in enumerate(image_paths, 1):
        print(f"\n[{i}/{len(image_paths)}] Processing: {Path(image_path).name}")
        
        result = verify_image_with_vision_ai(image_path, verbose=verbose)
        results.append(result)
        
        verdict = result.get('verdict', 'ERROR')
        if verdict == 'ACCEPT':
            accepted.append(result)
            print(f"✅ ACCEPTED - Ball: {result.get('ball_position', 'unknown')}, Phase: {result.get('shooting_phase', 'unknown')}")
        elif verdict == 'REJECT':
            rejected.append(result)
            print(f"❌ REJECTED - {result.get('reason', 'No reason')}")
        else:
            errors.append(result)
            print(f"⚠️  ERROR - {result.get('reason', 'Unknown error')}")
        
        # Rate limiting
        if i < len(image_paths):
            time.sleep(delay)
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 BATCH VERIFICATION SUMMARY")
    print("=" * 80)
    print(f"✅ Accepted: {len(accepted)}/{len(image_paths)} ({len(accepted)/len(image_paths)*100:.1f}%)")
    print(f"❌ Rejected: {len(rejected)}/{len(image_paths)} ({len(rejected)/len(image_paths)*100:.1f}%)")
    print(f"⚠️  Errors: {len(errors)}/{len(image_paths)} ({len(errors)/len(image_paths)*100:.1f}%)")
    
    return results


def find_best_images_by_phase(results: List[Dict], target_phases: List[str] = None) -> Dict[str, Dict]:
    """
    Find the best images for each shooting phase
    
    Args:
        results: List of verification results
        target_phases: List of target shooting phases
        
    Returns:
        Dictionary mapping phase to best image result
    """
    if target_phases is None:
        target_phases = ['preparation', 'release', 'follow-through', 'landing']
    
    # Filter accepted images
    accepted = [r for r in results if r.get('verdict') == 'ACCEPT']
    
    # Group by shooting phase
    phase_groups = {phase: [] for phase in target_phases}
    phase_groups['other'] = []
    
    for result in accepted:
        phase = result.get('shooting_phase', 'other')
        if phase in phase_groups:
            phase_groups[phase].append(result)
        else:
            phase_groups['other'].append(result)
    
    # Select best image for each phase (highest confidence)
    best_images = {}
    for phase, images in phase_groups.items():
        if images:
            # Sort by confidence
            images.sort(key=lambda x: x.get('confidence', 0), reverse=True)
            best_images[phase] = images[0]
    
    return best_images


def save_verification_results(results: List[Dict], output_path: str):
    """
    Save verification results to JSON file
    
    Args:
        results: List of verification results
        output_path: Path to output JSON file
    """
    output_data = {
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        'total_images': len(results),
        'accepted': len([r for r in results if r.get('verdict') == 'ACCEPT']),
        'rejected': len([r for r in results if r.get('verdict') == 'REJECT']),
        'errors': len([r for r in results if r.get('verdict') == 'ERROR']),
        'results': results
    }
    
    with open(output_path, 'w') as f:
        json.dump(output_data, f, indent=2)
    
    print(f"\n💾 Results saved to: {output_path}")


if __name__ == "__main__":
    # Test with uploaded images
    print("🏀 Basketball Shooting Image Verifier")
    print("Using Claude Vision API to verify images")
    print("=" * 80)
    
    # Test images from uploads
    test_images = [
        "/home/ubuntu/Uploads/CleanShot 2025-12-13 at 12.59.53.png",
        "/home/ubuntu/Uploads/CleanShot 2025-12-13 at 13.00.22.png",
        "/home/ubuntu/Uploads/R2EhfAhMroUFxcZKlwXgfMkXfqE2_71dcd771-0257-435f-9b91-959121fa74d4.png"
    ]
    
    # Filter existing images
    test_images = [img for img in test_images if os.path.exists(img)]
    
    if test_images:
        results = batch_verify_images(test_images, verbose=True, delay=1.0)
        
        # Save results
        output_dir = "/home/ubuntu/basketball_app/vision_ai_results"
        os.makedirs(output_dir, exist_ok=True)
        save_verification_results(results, f"{output_dir}/test_verification_results.json")
    else:
        print("⚠️  No test images found")
