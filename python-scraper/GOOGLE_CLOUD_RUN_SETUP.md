# Google Cloud Run Deployment Guide

## Overview

This guide will help you deploy the Basketball Pose Detection service to Google Cloud Run with **2GB RAM** (well within the free tier limits).

## Prerequisites

- Google Cloud account (with Google Workspace, your credit card should already be on file)
- Access to Google Cloud Console

## Free Tier Benefits

Google Cloud Run free tier includes:
- ✅ **2 million requests/month** (free)
- ✅ **180,000 vCPU-seconds/month** (free)
- ✅ **360,000 GiB-seconds/month of memory** (free)
- ✅ **1 GB network egress** (free)

For a basketball analysis app with moderate usage, you'll likely **stay free forever**.

## Deployment Steps

### Option A: Automated Deployment (Recommended)

1. **Open Google Cloud Console**
   - Go to: https://console.cloud.google.com
   - Log in with your Google Workspace account

2. **Activate Cloud Shell**
   - Click the Cloud Shell icon (>_) in the top-right corner
   - A terminal will open at the bottom of your browser

3. **Clone Your Repository**
   ```bash
   git clone https://github.com/tballer/BasketballAnalysisAssessmentApp.git
   cd BasketballAnalysisAssessmentApp/python-scraper
   ```

4. **Run the Deployment Script**
   ```bash
   chmod +x deploy-cloudrun.sh
   ./deploy-cloudrun.sh
   ```

5. **Get Your Service URL**
   - The script will output your service URL at the end
   - Example: `https://basketball-pose-detection-abc123-uc.a.run.app`

6. **Update Your Next.js App**
   - Copy the service URL
   - Update your `.env` file in the Next.js project:
     ```
     HYBRID_SERVER_URL=https://basketball-pose-detection-abc123-uc.a.run.app
     ```

### Option B: Manual Deployment

1. **Enable APIs**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

2. **Set Project ID**
   ```bash
   export PROJECT_ID=your-project-id
   gcloud config set project $PROJECT_ID
   ```

3. **Build and Deploy**
   ```bash
   gcloud builds submit --config=cloudbuild.yaml
   ```

## Configuration Details

### Memory and CPU
- **Memory**: 2GB (sufficient for YOLO + MediaPipe)
- **CPU**: 2 vCPUs
- **Timeout**: 300 seconds (5 minutes)
- **Concurrency**: 10 requests per instance
- **Min Instances**: 0 (scales to zero when not in use)
- **Max Instances**: 10

### Cost Estimate

Assuming 100 analyses per month:
- **Requests**: 100 (well under 2 million free)
- **Compute time**: ~500 seconds total (well under 180,000 free)
- **Memory**: ~1000 GiB-seconds (well under 360,000 free)

**Total cost: $0.00** (free tier)

## Monitoring

### View Logs
```bash
gcloud run services logs read basketball-pose-detection --region=us-central1
```

### Check Status
```bash
gcloud run services describe basketball-pose-detection --region=us-central1
```

### Test the Service
```bash
curl https://your-service-url.run.app/health
```

## Updating the Service

To update after code changes:

```bash
cd python-scraper
gcloud builds submit --config=cloudbuild.yaml
```

## Troubleshooting

### Build Fails
- Check that all files are committed to Git
- Ensure `yolov8n.pt` and `yolov8s-pose.pt` are in the directory
- Review build logs in Cloud Console

### Service Returns 502
- Check logs: `gcloud run services logs read basketball-pose-detection`
- Verify memory limits (may need to increase to 4GB)
- Check that models are loading correctly

### Cold Start Slow
- First request after inactivity takes 15-30 seconds (models loading)
- Subsequent requests are fast (2-5 seconds)
- Consider setting `--min-instances=1` to keep one instance warm (costs ~$10/month)

## Comparison: Render vs Cloud Run

| Feature | Render Free | Cloud Run Free |
|---------|-------------|----------------|
| Memory | 512MB | Up to 4GB |
| Timeout | 90s | 300s (5 min) |
| Requests/month | Unlimited | 2 million |
| Cold starts | Yes | Yes |
| Scaling | Limited | Auto |
| Cost after free | $7/mo | Pay per use |

**Verdict**: Cloud Run is **far superior** for ML workloads!

## Next Steps

1. ✅ Deploy to Cloud Run using this guide
2. ✅ Update `HYBRID_SERVER_URL` in your Next.js `.env`
3. ✅ Test the pose detection endpoint
4. ✅ Deploy your Next.js app to Abacus.AI
5. 🎉 Enjoy unlimited basketball analysis!
