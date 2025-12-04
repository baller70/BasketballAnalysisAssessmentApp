#!/usr/bin/env python3
"""
Use Replicate to sketch a skeleton overlay on basketball image
"""
import replicate
import requests
import base64
import sys
import os

os.environ["REPLICATE_API_TOKEN"] = "r8_XVbSqNpDmahHdfRWDjmivN2ZNPk3MUH2w1N4x"

def run_skeleton_sketch(image_path: str, output_path: str = "/tmp/skeleton_result.png"):
    """Use Replicate to generate AI-sketched skeleton overlay"""
    
    print(f"Loading: {image_path}")
    
    # Read image as base64
    with open(image_path, "rb") as f:
        img_data = base64.b64encode(f.read()).decode()
    
    ext = image_path.lower().split('.')[-1]
    mime = "image/jpeg" if ext in ["jpg", "jpeg"] else "image/png"
    data_uri = f"data:{mime};base64,{img_data}"
    
    print("Sending to Replicate AI...")
    
    # Use ControlNet OpenPose to extract and render skeleton
    output = replicate.run(
        "jagilley/controlnet-pose:0304f7f774ba7341ef754231f794b1ba3d129e3c46af3022a1e1b5420c5d9a8f",
        input={
            "image": data_uri,
            "prompt": "professional biomechanical skeleton overlay sketch, white anatomical skeleton drawing on basketball player, medical illustration style skeleton with labeled joints showing shoulder elbow wrist hip knee ankle, clean technical drawing",
            "num_samples": "1",
            "image_resolution": "768",
            "ddim_steps": 30,
            "scale": 9,
            "a_prompt": "high quality, detailed skeleton sketch, anatomical accuracy, professional medical illustration",
            "n_prompt": "blurry, low quality, distorted",
            "detect_resolution": 768,
        }
    )
    
    print(f"Output: {output}")
    
    if output:
        url = output[0] if isinstance(output, list) else output
        print(f"Downloading from: {url}")
        
        resp = requests.get(str(url))
        with open(output_path, "wb") as f:
            f.write(resp.content)
        
        print(f"✅ Saved to: {output_path}")
        return output_path
    
    return None

if __name__ == "__main__":
    input_path = sys.argv[1] if len(sys.argv) > 1 else "/tmp/basketball.jpg"
    output_path = sys.argv[2] if len(sys.argv) > 2 else "/tmp/skeleton_result.png"
    
    if not os.path.exists(input_path):
        print(f"❌ File not found: {input_path}")
        print("Save your basketball image to /tmp/basketball.jpg first")
        sys.exit(1)
    
    run_skeleton_sketch(input_path, output_path)

