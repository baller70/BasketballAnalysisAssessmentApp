# Real-ESRGAN Hugging Face Space Deployment Guide

## Quick Start

### Step 1: Create Hugging Face Space

1. Go to [huggingface.co/spaces](https://huggingface.co/spaces)
2. Click "Create new Space"
3. Fill in:
   - **Space name**: `basketball-image-enhancement`
   - **License**: MIT
   - **SDK**: Gradio
   - **Hardware**: CPU basic (free)
4. Click "Create Space"

### Step 2: Upload Files

Upload these files to your Space:
- `app.py` - Main application
- `requirements.txt` - Python dependencies
- `README.md` - Space description

### Step 3: Wait for Build

The Space will automatically build. This takes 5-10 minutes on first deploy.

### Step 4: Get Your Space URL

Your Space URL will be:
```
https://YOUR_USERNAME-basketball-image-enhancement.hf.space
```

### Step 5: Configure Your App

Add the environment variable to your Next.js app:

```env
NEXT_PUBLIC_REALESRGAN_SPACE_URL=https://YOUR_USERNAME-basketball-image-enhancement.hf.space
```

---

## How It Works

### Three Enhancement Tiers

| Tier | Method | Speed | Quality | Cost |
|------|--------|-------|---------|------|
| **Basic** | Canvas sharpening | Instant | Good | Free |
| **HD** | Your HF Space | 30-60s | Great | Free |
| **Premium** | Public APIs | 5-15s | Great | Free |

### User Flow

1. User clicks on screenshot to expand
2. User selects enhancement tier (Basic/HD/Premium)
3. User clicks "Download"
4. For HD/Premium: AI enhancement runs, then downloads
5. For Basic: Downloads immediately with canvas sharpening

---

## Troubleshooting

### Space Not Building

Check the build logs in your Space's "Logs" tab. Common issues:
- Missing dependencies in `requirements.txt`
- Python version mismatch

### Enhancement Timeout

The free tier has a ~120 second timeout. Solutions:
- Resize large images before enhancement
- Use Basic tier for large images
- Upgrade to Pro ($9/month) for better performance

### Model Download Failed

The Real-ESRGAN model (64MB) downloads on first run. If it fails:
- Check internet connectivity
- Restart the Space
- Manually upload the model to `weights/` folder

---

## API Usage

### From Your App

```typescript
const response = await fetch('YOUR_SPACE_URL/api/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: [imageBase64, 4, true]  // image, scale, use_ai
  })
})
const result = await response.json()
const enhancedImage = result.data[0]
```

### From Python

```python
from gradio_client import Client

client = Client("YOUR_USERNAME/basketball-image-enhancement")
result = client.predict(
    "path/to/image.jpg",
    4,      # scale factor
    True,   # use AI
    api_name="/predict"
)
```

---

## Cost Summary

| Usage Level | Monthly Cost | Notes |
|-------------|--------------|-------|
| Light (< 50 images) | $0 | Free tier sufficient |
| Medium (50-200 images) | $0-9 | May need Pro for speed |
| Heavy (200+ images) | $9-20 | Pro recommended |

---

## Files Structure

```
huggingface-realesrgan/
├── app.py              # Main Gradio application
├── requirements.txt    # Python dependencies
├── README.md          # HF Space description
└── DEPLOYMENT_GUIDE.md # This file
```




