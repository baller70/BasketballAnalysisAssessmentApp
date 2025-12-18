# 🏀 Hugging Face Spaces Deployment Guide

## Quick Start (5 Minutes)

### Step 1: Create a Hugging Face Account

1. Go to [huggingface.co](https://huggingface.co)
2. Click **"Sign Up"** (top right)
3. Create account (email or GitHub login)
4. **NO credit card required**

---

### Step 2: Create a New Space

1. Go to [huggingface.co/new-space](https://huggingface.co/new-space)
2. Fill in the form:
   - **Owner**: Your username
   - **Space name**: `basketball-analysis-api` (or any name)
   - **License**: MIT
   - **SDK**: Select **Docker** ⚠️ IMPORTANT
   - **Hardware**: Select **CPU basic (FREE)** ⚠️ IMPORTANT

3. Click **"Create Space"**

---

### Step 3: Upload Files

You have two options:

#### Option A: Upload via Web Interface

1. In your new Space, click **"Files"** tab
2. Click **"Add file"** → **"Upload files"**
3. Upload these files from the `huggingface-backend/` folder:
   - `README.md`
   - `Dockerfile`
   - `app.py`
   - `requirements.txt`

#### Option B: Connect to GitHub (Recommended)

1. In your Space, go to **"Settings"** tab
2. Scroll to **"Repository"** section
3. Click **"Link a GitHub repository"**
4. Select your `BasketballAnalysisAssessmentApp` repo
5. Set **"Subdirectory"** to: `huggingface-backend`
6. Click **"Save"**

Now any push to GitHub will auto-deploy!

---

### Step 4: Configure Environment Variables

1. Go to **"Settings"** tab in your Space
2. Scroll to **"Repository secrets"** section
3. Click **"New secret"**
4. Add this variable:

```
Name: ALLOWED_ORIGINS
Value: https://your-abacus-app-url.com,http://localhost:3000
```

⚠️ **Replace `your-abacus-app-url.com` with your actual Abacus AI frontend URL!**

---

### Step 5: Wait for Build

1. Go to **"App"** tab
2. Watch the build logs
3. Wait for **"Running on CPU basic"** status (takes 3-5 minutes first time)

---

### Step 6: Test Your API

Your API is now live at:
```
https://YOUR-USERNAME-basketball-analysis-api.hf.space
```

Test it:
```bash
curl https://YOUR-USERNAME-basketball-analysis-api.hf.space/health
```

Expected response:
```json
{
  "status": "ok",
  "model": "hybrid",
  "components": ["yolov8x-pose", "mediapipe", "opencv-ball-detection"],
  "version": "1.0.0"
}
```

---

### Step 7: Update Your Abacus AI Frontend

In your Abacus AI deployment, set this environment variable:

```
NEXT_PUBLIC_HYBRID_API_URL=https://YOUR-USERNAME-basketball-analysis-api.hf.space
```

**Done! 🎉**

---

## Troubleshooting

### Build Fails

**Check the logs** in the "App" tab. Common issues:

1. **Missing files**: Ensure all 4 files are uploaded
2. **Wrong SDK**: Must be "Docker", not "Gradio" or "Streamlit"
3. **Syntax errors**: Check `app.py` for typos

### CORS Errors

If your frontend can't connect:

1. Go to Space **"Settings"**
2. Check **"Repository secrets"**
3. Verify `ALLOWED_ORIGINS` includes your frontend URL
4. **Rebuild** the Space (Settings → Factory reboot)

### Space Sleeping

Free Spaces sleep after 48 hours of inactivity.

- **First request after sleep**: Takes 30-60 seconds (cold start)
- **Subsequent requests**: Normal speed
- **Solution**: This is expected behavior on free tier

### API Returns 404

Make sure you're using the correct endpoints:
- ✅ `/health` 
- ✅ `/api/detect-pose`
- ✅ `/api/analyze-form`
- ❌ `/analyze` (wrong endpoint)

---

## API Reference

### Health Check
```
GET /health
```

### Pose Detection
```
POST /api/detect-pose
Content-Type: application/json

{
  "image": "<base64-encoded-image-data>"
}
```

**Response:**
```json
{
  "success": true,
  "keypoints": {
    "nose": {"x": 100, "y": 50, "confidence": 0.95, "source": "fused"},
    "left_shoulder": {"x": 80, "y": 120, "confidence": 0.92, "source": "fused"},
    ...
  },
  "confidence": 0.89,
  "angles": {
    "left_elbow_angle": 92.5,
    "right_knee_angle": 145.2,
    ...
  },
  "basketball": {"x": 150, "y": 100, "radius": 25},
  "image_size": {"width": 1920, "height": 1080},
  "method": "hybrid"
}
```

### Form Analysis
```
POST /api/analyze-form
Content-Type: application/json

{
  "keypoints": {...},
  "angles": {...}
}
```

**Response:**
```json
{
  "success": true,
  "feedback": [
    {"type": "success", "area": "elbow", "message": "Good elbow angle (92°)."},
    {"type": "warning", "area": "knees", "message": "Knees too straight. Bend more!"}
  ],
  "overall_score": 85,
  "angles": {...}
}
```

---

## Costs Summary

| Item | Cost |
|------|------|
| Hugging Face Account | **FREE** |
| CPU Basic Hardware | **FREE** |
| 50GB Storage | **FREE** |
| Unlimited Bandwidth | **FREE** |
| Custom Domain (`.hf.space`) | **FREE** |
| **Total** | **$0** |

---

## Next Steps

1. ✅ Deploy backend to Hugging Face Spaces
2. ✅ Update Abacus AI frontend with API URL
3. ✅ Test full integration
4. 🎉 Launch your app!

---

## Support

- **Hugging Face Docs**: [huggingface.co/docs/hub/spaces](https://huggingface.co/docs/hub/spaces)
- **Spaces Docker Guide**: [huggingface.co/docs/hub/spaces-sdks-docker](https://huggingface.co/docs/hub/spaces-sdks-docker)

