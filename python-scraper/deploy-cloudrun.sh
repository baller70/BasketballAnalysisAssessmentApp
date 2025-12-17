#!/bin/bash
# Quick deployment script for Google Cloud Run
# Usage: ./deploy-cloudrun.sh [PROJECT_ID]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Basketball Pose Detection - Google Cloud Run Deployment${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI is not installed${NC}"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get or set project ID
if [ -z "$1" ]; then
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    if [ -z "$PROJECT_ID" ]; then
        echo -e "${RED}❌ Error: No project ID provided and no default project set${NC}"
        echo "Usage: ./deploy-cloudrun.sh [PROJECT_ID]"
        echo "Or set default: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    fi
    echo -e "${YELLOW}📦 Using default project: ${PROJECT_ID}${NC}"
else
    PROJECT_ID=$1
    echo -e "${YELLOW}📦 Using project: ${PROJECT_ID}${NC}"
fi

echo ""
echo -e "${GREEN}Step 1: Enable required APIs${NC}"
gcloud services enable run.googleapis.com --project=$PROJECT_ID
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID
gcloud services enable containerregistry.googleapis.com --project=$PROJECT_ID

echo ""
echo -e "${GREEN}Step 2: Build and deploy using Cloud Build${NC}"
gcloud builds submit --config=cloudbuild.yaml --project=$PROJECT_ID

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Your service URL:"
gcloud run services describe basketball-pose-detection --region=us-central1 --project=$PROJECT_ID --format='value(status.url)'
echo ""
echo -e "${YELLOW}💡 Update your Next.js .env file with:${NC}"
echo "HYBRID_SERVER_URL=<your-cloud-run-url>"
