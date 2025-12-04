# Basketball Analysis - Python Backend API

FastAPI-based backend for basketball shooting form analysis using MediaPipe pose detection.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- pip or poetry for package management

### Installation

1. **Clone the repository** (if not already done)
```bash
git clone https://github.com/baller70/BasketballAnalysisAssessmentApp.git
cd BasketballAnalysisAssessmentApp/python-backend
```

2. **Create virtual environment**
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env and add your Replicate API token
```

5. **Run the development server**
```bash
# Using the provided script
bash run_dev.sh

# Or manually
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## 📋 Environment Variables

Create a `.env` file in the `python-backend` directory:

```bash
# Required
REPLICATE_API_TOKEN=your_replicate_api_token_here

# Optional (with defaults)
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
MEDIAPIPE_MODEL_COMPLEXITY=2
```

### Getting a Replicate API Token
1. Sign up at https://replicate.com
2. Go to https://replicate.com/account/api-tokens
3. Create a new API token
4. Copy the token to your `.env` file

## 🔌 API Endpoints

### Health Check
```bash
GET /health
```
Returns server status and version information.

### Analyze Image
```bash
POST /analyze
Content-Type: multipart/form-data

file: <image_file>
```
Analyzes an image for pose detection and returns keypoints.

**Response:**
```json
{
  "success": true,
  "keypoints": [...],
  "confidence": 0.89,
  "is_shooting_pose": true,
  "message": "Detected 33 keypoints"
}
```

### Export Annotated Image
```bash
POST /export?skeleton_color=#FFFFFF&joint_color=#FFFFFF
Content-Type: multipart/form-data

file: <image_file>
```
Returns an image with skeleton overlay as base64.

**Query Parameters:**
- `skeleton_color`: Hex color for skeleton lines (default: #FFFFFF)
- `joint_color`: Hex color for joint circles (default: #FFFFFF)
- `label_color`: Hex color for labels (default: #FFFFFF)
- `show_callouts`: Show anatomical labels (default: true)
- `output_format`: png or jpeg (default: png)
- `quality`: 1-100 (default: 95)

### AI Skeleton Overlay
```bash
POST /ai-skeleton
Content-Type: multipart/form-data

file: <image_file>
```
Generates detailed anatomical skeleton overlay with medical illustration quality.

## 🐳 Docker Deployment

### Build Docker Image
```bash
docker build -t basketball-analysis-backend .
```

### Run Docker Container
```bash
docker run -d \
  -p 8000:8000 \
  -e REPLICATE_API_TOKEN=your_token_here \
  -e ALLOWED_ORIGINS=https://your-frontend-url.com \
  --name basketball-backend \
  basketball-analysis-backend
```

## 🌐 Production Deployment

### Option 1: Traditional Server

1. **Install system dependencies** (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y \
  libgl1-mesa-glx \
  libglib2.0-0 \
  libsm6 \
  libxext6 \
  libxrender-dev
```

2. **Set up Python environment**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. **Configure environment variables**
```bash
export REPLICATE_API_TOKEN="your_token"
export ALLOWED_ORIGINS="https://your-frontend.com"
```

4. **Run with gunicorn** (production ASGI server)
```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Option 2: Cloud Platform Deployment

#### Railway
1. Create new project from GitHub repo
2. Set environment variables in Railway dashboard
3. Railway will auto-detect and deploy

#### Render
1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables

#### AWS EC2/ECS
- Use the provided Dockerfile
- Configure ALB/Target Groups
- Set environment variables in task definition

## 🔧 Development

### Project Structure
```
python-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app & endpoints
│   ├── models.py                  # Pydantic models
│   ├── pose_detection.py          # MediaPipe pose detection
│   ├── skeleton_drawing.py        # Skeleton overlay rendering
│   └── anatomical_skeleton.py     # Detailed anatomical skeleton
├── .env                           # Environment variables (not in git)
├── .env.example                   # Template for environment variables
├── Dockerfile                     # Docker configuration
├── requirements.txt               # Python dependencies
├── run_dev.sh                     # Development server script
└── README.md                      # This file
```

### Running Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests (if tests directory exists)
pytest
```

### API Documentation
Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔒 Security Notes

1. **Never commit `.env` file** - It contains sensitive API tokens
2. **Use environment variables** for all secrets
3. **Configure CORS** properly for production
4. **Enable HTTPS** in production deployments
5. **Rate limiting** - Consider adding rate limiting for production

## 📊 Performance

### MediaPipe Model Complexity
- `0` (Lite): Fastest, lower accuracy
- `1` (Full): Balanced
- `2` (Heavy): Most accurate (default)

Set via `MEDIAPIPE_MODEL_COMPLEXITY` environment variable.

### Scaling Recommendations
- Use gunicorn with multiple workers for CPU-bound tasks
- Consider Redis for caching pose detection results
- Use CDN for serving annotated images
- Implement request queuing for video processing

## 🐛 Troubleshooting

### ImportError: No module named 'cv2'
```bash
pip install opencv-python
```

### MediaPipe not found
```bash
pip install mediapipe==0.10.9
```

### Permission denied on run_dev.sh
```bash
chmod +x run_dev.sh
```

### CORS errors
Update `ALLOWED_ORIGINS` in `.env` to include your frontend URL.

## 📝 License

See repository root for license information.

## 🤝 Contributing

This is a private repository. For access and contribution guidelines, contact the repository owner.

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Contact: baller70 (repository owner)
