#!/usr/bin/env python3
"""
Generate skeleton overlay on basketball image using Replicate AI
"""
import replicate
import requests
import base64
import sys
import os
from pathlib import Path

# Set API token
os.environ["REPLICATE_API_TOKEN"] = "r8_XVbSqNpDmahHdfRWDjmivN2ZNPk3MUH2w1N4x"

def image_to_data_uri(image_path: str) -> str:
    """Convert local image to data URI"""
    with open(image_path, "rb") as f:
        data = base64.b64encode(f.read()).decode()
    
    ext = Path(image_path).suffix.lower()
    mime = "image/jpeg" if ext in [".jpg", ".jpeg"] else "image/png"
    return f"data:{mime};base64,{data}"

def generate_skeleton_overlay(input_image_path: str, output_path: str = "skeleton_output.png"):
    """Use Replicate to generate skeleton overlay"""
    
    print(f"Loading image: {input_image_path}")
    
    # Convert to data URI for Replicate
    image_uri = image_to_data_uri(input_image_path)
    
    print("Running pose detection model...")
    
    # Use img2img with ControlNet pose for skeleton overlay
    # Or use a dedicated pose estimation model
    
    try:
        # Try using a pose estimation model that outputs skeleton
        output = replicate.run(
            "jagilley/controlnet-pose:0304f7f774ba7341ef754231f794b1ba3d129e3c46af3022a1e1b5420c5d9a8f",
            input={
                "image": image_uri,
                "prompt": "basketball player shooting form, white skeleton overlay on joints, anatomical pose visualization, white lines connecting shoulder elbow wrist hip knee ankle joints, clean minimalist skeleton drawing",
                "num_samples": "1",
                "image_resolution": "512",
                "ddim_steps": 20,
                "scale": 9,
                "a_prompt": "best quality, white skeleton lines, pose estimation visualization",
                "n_prompt": "lowres, bad anatomy, worst quality",
                "detect_resolution": 512,
            }
        )
        
        print(f"Output: {output}")
        
        # Download result
        if output and len(output) > 0:
            result_url = output[0] if isinstance(output, list) else output
            print(f"Downloading result from: {result_url}")
            
            response = requests.get(result_url)
            with open(output_path, "wb") as f:
                f.write(response.content)
            
            print(f"✅ Saved skeleton overlay to: {output_path}")
            return output_path
            
    except Exception as e:
        print(f"ControlNet approach failed: {e}")
        print("Trying alternative model...")
        
        # Alternative: Use image editing model
        try:
            output = replicate.run(
                "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
                input={
                    "image": image_uri,
                    "prompt": "Add white skeleton overlay lines connecting joints: shoulders, elbows, wrists, hips, knees, ankles. White circles at each joint. Clean biomechanical analysis visualization.",
                    "num_outputs": 1,
                }
            )
            
            if output:
                result_url = output[0] if isinstance(output, list) else output
                response = requests.get(str(result_url))
                with open(output_path, "wb") as f:
                    f.write(response.content)
                print(f"✅ Saved to: {output_path}")
                return output_path
                
        except Exception as e2:
            print(f"Alternative also failed: {e2}")
    
    return None

if __name__ == "__main__":
    input_path = sys.argv[1] if len(sys.argv) > 1 else "/tmp/basketball_input.jpg"
    output_path = sys.argv[2] if len(sys.argv) > 2 else "/tmp/skeleton_output.png"
    
    if not os.path.exists(input_path):
        print(f"❌ Input image not found: {input_path}")
        print("Please save your basketball image to this path first.")
        sys.exit(1)
    
    generate_skeleton_overlay(input_path, output_path)

