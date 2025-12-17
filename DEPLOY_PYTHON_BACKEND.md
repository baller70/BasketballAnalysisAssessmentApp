# Deploy Python Hybrid Pose Detection Backend

## Quick Deploy to Render (FREE)

### Step 1: Push to GitHub
```bash
cd /home/ubuntu/basketball_analysis_abacus/python-scraper
git add .
git commit -m "Add hybrid pose detection deployment files"
git push
```

### Step 2: Deploy on Render

1. Go to https://render.com and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the `python-scraper` directory
5. Configure:
   - **Name**: basketball-hybrid-pose
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements-hybrid.txt`
   - **Start Command**: `gunicorn hybrid_pose_detection:app --bind 0.0.0.0:$PORT --timeout 120 --workers 1`
6. Click "Create Web Service"

### Step 3: Get Your Public URL

After deployment, Render will give you a URL like:
```
https://basketball-hybrid-pose.onrender.com
```

### Step 4: Update Next.js Environment Variable

Go to your Next.js `.env` file and update:
```bash
HYBRID_SERVER_URL=https://basketball-hybrid-pose.onrender.com
```

### Step 5: Redeploy Next.js

Redeploy your Next.js app with the new environment variable.

## Alternative: Railway (Also FREE)

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repo and `python-scraper` directory
4. Railway will auto-detect and deploy
5. Get the public URL and update `HYBRID_SERVER_URL`

## Test Your Deployment

```bash
# Test health endpoint
curl https://your-url.onrender.com/health

# Should return:
# {"status": "ok", "model": "hybrid", ...}
```
