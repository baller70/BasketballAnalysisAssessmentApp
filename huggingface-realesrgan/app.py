"""
Real-ESRGAN Image Enhancement API for Basketball Analysis
Hugging Face Space - Free CPU Tier

This provides AI-powered image upscaling and enhancement.
Optimized for basketball shooting form screenshots.
"""

import gradio as gr
import numpy as np
from PIL import Image
import cv2
import base64
import io
import os
import time

# Try to import Real-ESRGAN, fall back to basic enhancement if not available
try:
    from realesrgan import RealESRGANer
    from basicsr.archs.rrdbnet_arch import RRDBNet
    REALESRGAN_AVAILABLE = True
except ImportError:
    REALESRGAN_AVAILABLE = False
    print("Real-ESRGAN not available, using fallback enhancement")

# Global upsampler instance (loaded once)
upsampler = None

def load_model():
    """Load the Real-ESRGAN model (called once at startup)"""
    global upsampler
    
    if not REALESRGAN_AVAILABLE:
        return None
    
    try:
        # Use RealESRGAN_x4plus model (best quality for general images)
        model = RRDBNet(
            num_in_ch=3, 
            num_out_ch=3, 
            num_feat=64, 
            num_block=23, 
            num_grow_ch=32, 
            scale=4
        )
        
        # Model path - will be downloaded automatically
        model_path = 'weights/RealESRGAN_x4plus.pth'
        
        # Check if model exists, if not download it
        if not os.path.exists(model_path):
            os.makedirs('weights', exist_ok=True)
            import urllib.request
            url = 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth'
            print(f"Downloading model from {url}...")
            urllib.request.urlretrieve(url, model_path)
            print("Model downloaded successfully!")
        
        upsampler = RealESRGANer(
            scale=4,
            model_path=model_path,
            model=model,
            tile=400,  # Tile size for processing (reduces memory usage)
            tile_pad=10,
            pre_pad=0,
            half=False,  # Use full precision for CPU
            device='cpu'  # Force CPU for free tier
        )
        
        print("Real-ESRGAN model loaded successfully!")
        return upsampler
        
    except Exception as e:
        print(f"Error loading Real-ESRGAN: {e}")
        return None

def fallback_enhance(image: np.ndarray, scale: int = 2) -> np.ndarray:
    """
    Fallback enhancement using OpenCV when Real-ESRGAN is not available.
    Uses a combination of upscaling, sharpening, and denoising.
    """
    # Upscale using Lanczos interpolation
    h, w = image.shape[:2]
    upscaled = cv2.resize(image, (w * scale, h * scale), interpolation=cv2.INTER_LANCZOS4)
    
    # Apply bilateral filter for edge-preserving smoothing
    denoised = cv2.bilateralFilter(upscaled, 9, 75, 75)
    
    # Apply unsharp masking for sharpening
    gaussian = cv2.GaussianBlur(denoised, (0, 0), 3)
    sharpened = cv2.addWeighted(denoised, 1.5, gaussian, -0.5, 0)
    
    # Enhance contrast using CLAHE
    lab = cv2.cvtColor(sharpened, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    enhanced = cv2.merge([l, a, b])
    enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
    
    return enhanced

def enhance_image(input_image, scale_factor: int = 4, use_ai: bool = True):
    """
    Enhance an image using Real-ESRGAN or fallback methods.
    
    Args:
        input_image: PIL Image or numpy array
        scale_factor: Upscaling factor (2 or 4)
        use_ai: Whether to use AI enhancement (Real-ESRGAN) or basic enhancement
    
    Returns:
        Enhanced PIL Image
    """
    global upsampler
    
    start_time = time.time()
    
    # Convert PIL to numpy if needed
    if isinstance(input_image, Image.Image):
        img = np.array(input_image)
        # Convert RGB to BGR for OpenCV
        img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    else:
        img = input_image
    
    # Get original dimensions
    h, w = img.shape[:2]
    print(f"Processing image: {w}x{h}, scale={scale_factor}, use_ai={use_ai}")
    
    # Limit input size to prevent timeout (max 1024px on longest side)
    max_size = 1024
    if max(h, w) > max_size:
        ratio = max_size / max(h, w)
        new_w = int(w * ratio)
        new_h = int(h * ratio)
        img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)
        print(f"Resized to {new_w}x{new_h} to prevent timeout")
    
    try:
        if use_ai and REALESRGAN_AVAILABLE and upsampler is not None:
            # Use Real-ESRGAN
            print("Using Real-ESRGAN for enhancement...")
            output, _ = upsampler.enhance(img, outscale=scale_factor)
        else:
            # Use fallback enhancement
            print("Using fallback enhancement...")
            output = fallback_enhance(img, scale=min(scale_factor, 2))
    except Exception as e:
        print(f"Enhancement error: {e}, falling back to basic method")
        output = fallback_enhance(img, scale=min(scale_factor, 2))
    
    # Convert BGR back to RGB
    output = cv2.cvtColor(output, cv2.COLOR_BGR2RGB)
    
    # Convert to PIL Image
    result = Image.fromarray(output)
    
    elapsed = time.time() - start_time
    print(f"Enhancement complete in {elapsed:.2f}s, output size: {result.size}")
    
    return result

def process_base64(image_base64: str, scale_factor: int = 4, use_ai: bool = True) -> str:
    """
    Process a base64-encoded image and return enhanced base64.
    Used for API calls from the basketball analysis app.
    """
    # Decode base64 to image
    if ',' in image_base64:
        image_base64 = image_base64.split(',')[1]
    
    image_bytes = base64.b64decode(image_base64)
    image = Image.open(io.BytesIO(image_bytes))
    
    # Enhance
    enhanced = enhance_image(image, scale_factor, use_ai)
    
    # Encode back to base64
    buffer = io.BytesIO()
    enhanced.save(buffer, format='PNG', quality=100)
    enhanced_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    return f"data:image/png;base64,{enhanced_base64}"

# Load model at startup
print("Loading Real-ESRGAN model...")
load_model()

# Create Gradio interface
with gr.Blocks(title="Basketball Analysis - Image Enhancement") as demo:
    gr.Markdown("""
    # 🏀 Basketball Analysis - HD Image Enhancement
    
    Enhance your shooting form screenshots with AI-powered upscaling.
    
    **Features:**
    - 4x resolution upscaling
    - AI-powered detail enhancement (Real-ESRGAN)
    - Optimized for basketball analysis images
    
    **Note:** Processing on free tier (CPU) takes 30-60 seconds per image.
    """)
    
    with gr.Row():
        with gr.Column():
            input_image = gr.Image(label="Input Image", type="pil")
            
            with gr.Row():
                scale_slider = gr.Slider(
                    minimum=2, 
                    maximum=4, 
                    value=4, 
                    step=2,
                    label="Scale Factor"
                )
                use_ai_checkbox = gr.Checkbox(
                    value=True, 
                    label="Use AI Enhancement (slower but better)"
                )
            
            enhance_btn = gr.Button("🚀 Enhance Image", variant="primary")
        
        with gr.Column():
            output_image = gr.Image(label="Enhanced Image", type="pil")
            status_text = gr.Textbox(label="Status", interactive=False)
    
    def enhance_with_status(img, scale, use_ai):
        if img is None:
            return None, "Please upload an image first"
        
        start = time.time()
        try:
            result = enhance_image(img, int(scale), use_ai)
            elapsed = time.time() - start
            return result, f"✅ Enhanced in {elapsed:.1f}s | Output: {result.size[0]}x{result.size[1]}"
        except Exception as e:
            return None, f"❌ Error: {str(e)}"
    
    enhance_btn.click(
        fn=enhance_with_status,
        inputs=[input_image, scale_slider, use_ai_checkbox],
        outputs=[output_image, status_text]
    )
    
    # API endpoint for programmatic access
    gr.Markdown("""
    ---
    ### API Usage
    
    You can also use this as an API:
    
    ```python
    import requests
    
    response = requests.post(
        "YOUR_SPACE_URL/api/predict",
        json={"data": [image_base64, 4, True]}
    )
    enhanced_image = response.json()["data"][0]
    ```
    """)

# Launch
if __name__ == "__main__":
    demo.launch()








