---
title: Basketball Analysis API
emoji: 🏀
colorFrom: yellow
colorTo: red
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# Basketball Shooting Form Analysis API

A hybrid pose detection system for analyzing basketball shooting form using YOLOv8 + MediaPipe.

## Features

- **Hybrid Pose Detection**: Combines YOLOv8x-pose and MediaPipe for maximum accuracy
- **Smart Shooter Detection**: Automatically identifies the main subject in crowded scenes
- **Basketball Detection**: Locates the ball using color analysis and position heuristics
- **Biomechanical Analysis**: Calculates elbow angles, knee bend, and body alignment
- **Form Feedback**: Provides actionable coaching feedback

## API Endpoints

### Health Check
```
GET /health
```
Returns API status and loaded models.

### Pose Detection
```
POST /api/detect-pose
Content-Type: application/json

{
  "image": "<base64-encoded-image>"
}
```
Returns keypoints, confidence scores, angles, and basketball position.

### Form Analysis
```
POST /api/analyze-form
Content-Type: application/json

{
  "keypoints": {...},
  "angles": {...}
}
```
Returns shooting form feedback and overall score.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ALLOWED_ORIGINS` | Yes | Comma-separated list of allowed CORS origins |

## Technology Stack

- **Flask** - Web framework
- **YOLOv8x-pose** - Primary pose estimation
- **MediaPipe** - Secondary pose verification
- **OpenCV** - Image processing & basketball detection
- **Gunicorn** - Production WSGI server

## Usage with Frontend

Set your frontend's environment variable:
```
NEXT_PUBLIC_PYTHON_API_URL=https://your-space-name.hf.space
```

## License

MIT License

