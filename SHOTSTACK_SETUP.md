# ShotStack Setup for Basketball Shooting Analysis

**Date:** December 13, 2025  
**Status:** ✅ COMPLETE - API Configured & Integration Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [API Credentials](#api-credentials)
3. [API Capabilities](#api-capabilities)
4. [Available Assets](#available-assets)
5. [Basketball Analysis Features](#basketball-analysis-features)
6. [Template Structure](#template-structure)
7. [Integration Scripts](#integration-scripts)
8. [Usage Examples](#usage-examples)
9. [Rate Limits & Pricing](#rate-limits--pricing)
10. [Next Steps](#next-steps)

---

## 🎯 Overview

ShotStack is a cloud-based video editing API that allows programmatic creation of videos with overlays, text, shapes, and effects. For basketball shooting analysis, we'll use it to:

- **Add skeleton overlays** to shooting videos
- **Draw angle measurements** (elbow, knee, release angles)
- **Add text annotations** for coaching feedback
- **Create split-screen comparisons** (before/after)
- **Generate highlight reels** with analysis overlays

---

## 🔑 API Credentials

### Sandbox Environment (Testing)
```
API Key: 5I9pXTQbDLmcF6tvgjOzgYtDN5jyK2FnurBSU5oy
Owner ID: 8esac3y1jg
Endpoint: https://api.shotstack.io/edit/stage
```

### Production Environment
```
API Key: HQNZcbuBHc1zVapRhzAdHQFqNkXzQG1YrqYhBhwZ
Owner ID: 82VuGmx7c7
Endpoint: https://api.shotstack.io/edit/v1
```

### Account Status
- **Credits Remaining:** 24,948
- **Tier:** PRODUCTION
- **Dashboard:** https://dashboard.shotstack.io

### API Endpoints
```
Edit API:   https://api.shotstack.io/edit/{version}
Serve API:  https://api.shotstack.io/serve/{version}
Ingest API: https://api.shotstack.io/ingest/{version}
Create API: https://api.shotstack.io/create/{version}
```

**Note:** Use `stage` for sandbox, `v1` for production

---

## 🎨 API Capabilities

### Core Features

1. **Video Editing**
   - Trim, arrange, and combine video clips
   - Add transitions and effects
   - Adjust speed, opacity, and positioning
   - Support for multiple video formats

2. **Image Overlays**
   - Add static images as overlays
   - Position and scale images
   - Adjust opacity for transparency
   - Perfect for skeleton overlays

3. **Text & Annotations**
   - **TextAsset:** Basic text with styling
   - **RichTextAsset:** Advanced text with gradients, shadows, strokes
   - Custom fonts, colors, sizes
   - Background styling
   - Alignment options

4. **Shape Drawing**
   - **Rectangle:** For boxes and frames
   - **Circle:** For highlighting points
   - **Line:** For angle measurements and guides
   - Customizable fill and stroke

5. **Audio**
   - Add background music
   - Voiceover support
   - Audio mixing

6. **AI Features**
   - Text-to-image generation
   - Image-to-video conversion
   - Caption generation

---

## 📦 Available Assets

### 1. VideoAsset
```json
{
  "type": "video",
  "src": "https://example.com/video.mp4",
  "trim": 5.0,
  "volume": 1.0
}
```

### 2. ImageAsset
```json
{
  "type": "image",
  "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Human_skeleton_front_en.svg/1060px-Human_skeleton_front_en.svg.png"
}
```

### 3. TextAsset
```json
{
  "type": "text",
  "text": "Good form!",
  "font": {
    "family": "Arial",
    "size": 36,
    "color": "#ffffff",
    "weight": 700
  },
  "alignment": {
    "horizontal": "center",
    "vertical": "center"
  },
  "background": {
    "color": "#000000",
    "opacity": 0.8
  }
}
```

### 4. ShapeAsset

**Rectangle:**
```json
{
  "type": "shape",
  "shape": "rectangle",
  "rectangle": {
    "width": 200,
    "height": 100,
    "cornerRadius": 10
  },
  "fill": {
    "color": "#ff0000",
    "opacity": 0.5
  },
  "stroke": {
    "color": "#ffffff",
    "width": 2
  }
}
```

**Circle:**
```json
{
  "type": "shape",
  "shape": "circle",
  "circle": {
    "radius": 50
  },
  "fill": {
    "color": "#00ff00",
    "opacity": 0.3
  }
}
```

**Line:**
```json
{
  "type": "shape",
  "shape": "line",
  "line": {
    "length": 200,
    "thickness": 4
  },
  "fill": {
    "color": "#0000ff",
    "opacity": 1
  }
}
```

---

## 🏀 Basketball Analysis Features

### 1. Skeleton Overlay
Add pose estimation skeleton over shooting video:
```python
skeleton_track = {
    "clips": [{
        "asset": {
            "type": "image",
            "src": "https://i.ytimg.com/vi/tkHmuQO_6HM/maxresdefault.jpg"
        },
        "start": 0,
        "length": 5,
        "opacity": 0.7,
        "position": "center"
    }]
}
```

### 2. Angle Measurements
Draw angle indicators (elbow, knee, release):
```python
angle_track = {
    "clips": [
        # Circle at joint
        {
            "asset": {
                "type": "shape",
                "shape": "circle",
                "circle": {"radius": 30},
                "stroke": {"color": "#00ff00", "width": 3},
                "fill": {"color": "#00ff00", "opacity": 0.2}
            },
            "position": "center",
            "offset": {"x": 0.2, "y": 0.1}
        },
        # Angle text
        {
            "asset": {
                "type": "text",
                "text": "Elbow: 90.5°",
                "font": {"size": 24, "color": "#00ff00"}
            },
            "position": "center",
            "offset": {"x": 0.2, "y": 0.18}
        }
    ]
}
```

### 3. Coaching Annotations
Add feedback text at specific times:
```python
annotation_track = {
    "clips": [{
        "asset": {
            "type": "text",
            "text": "Good follow-through!",
            "font": {
                "family": "Arial",
                "size": 36,
                "color": "#ffffff",
                "weight": 600
            },
            "background": {
                "color": "#000000",
                "opacity": 0.85
            }
        },
        "start": 2.0,
        "length": 2.0,
        "position": "bottom"
    }]
}
```

### 4. Split-Screen Comparison
Compare two shooting forms side-by-side:
```python
tracks = [
    # Left video
    {
        "clips": [{
            "asset": {"type": "video", "src": "video1.mp4"},
            "position": "left",
            "scale": 0.5,
            "offset": {"x": -0.25, "y": 0}
        }]
    },
    # Right video
    {
        "clips": [{
            "asset": {"type": "video", "src": "video2.mp4"},
            "position": "right",
            "scale": 0.5,
            "offset": {"x": 0.25, "y": 0}
        }]
    },
    # Divider line
    {
        "clips": [{
            "asset": {
                "type": "shape",
                "shape": "line",
                "line": {"length": 1080, "thickness": 4}
            },
            "position": "center"
        }]
    }
]
```

---

## 📐 Template Structure

### Basic Template
```json
{
  "timeline": {
    "background": "#000000",
    "tracks": [
      {
        "clips": [
          {
            "asset": {
              "type": "video",
              "src": "https://example.com/basketball.mp4"
            },
            "start": 0,
            "length": 5
          }
        ]
      }
    ]
  },
  "output": {
    "format": "mp4",
    "fps": 30,
    "size": {
      "width": 1920,
      "height": 1080
    }
  }
}
```

### With Merge Fields (Dynamic Content)
```json
{
  "timeline": {
    "tracks": [
      {
        "clips": [{
          "asset": {
            "type": "text",
            "text": "{{player_name}} - {{shot_type}}"
          }
        }]
      }
    ]
  },
  "merge": [
    {
      "find": "player_name",
      "replace": "John Doe"
    },
    {
      "find": "shot_type",
      "replace": "Jump Shot"
    }
  ]
}
```

---

## 🛠️ Integration Scripts

### Files Created

1. **`.env.shotstack`** - API credentials and configuration
2. **`shotstack_helpers.py`** - Python integration library
3. **`SHOTSTACK_SETUP.md`** - This documentation
4. **`SHOTSTACK_INTEGRATION_GUIDE.md`** - Usage guide

### Python Classes

#### `ShotStackClient`
Low-level API client for making requests:
```python
from shotstack_helpers import ShotStackClient

client = ShotStackClient(environment='sandbox')
response = client.render_video(edit_config)
render_id = response['response']['id']
status = client.wait_for_render(render_id)
```

#### `BasketballVideoEditor`
High-level editor for basketball analysis:
```python
from shotstack_helpers import BasketballVideoEditor, ShotStackClient

client = ShotStackClient(environment='sandbox')
editor = BasketballVideoEditor(client)

# Create shooting form analysis
response = editor.create_shooting_form_analysis(
    video_url="https://example.com/shot.mp4",
    annotations=[
        {'text': 'Good elbow alignment', 'start': 0, 'length': 2}
    ],
    angles=[
        {'name': 'Elbow', 'value': 90.5, 'position': {'x': 0.2, 'y': 0}}
    ]
)

# Create split-screen comparison
response = editor.create_split_screen_comparison(
    video1_url="https://example.com/before.mp4",
    video2_url="https://example.com/after.mp4",
    title1="Before Coaching",
    title2="After Coaching"
)
```

---

## 💡 Usage Examples

### Example 1: Simple Annotation
```python
from shotstack_helpers import ShotStackClient

client = ShotStackClient(environment='sandbox')

edit = {
    "timeline": {
        "background": "#000000",
        "tracks": [
            {
                "clips": [{
                    "asset": {
                        "type": "video",
                        "src": "https://example.com/basketball.mp4"
                    },
                    "start": 0,
                    "length": 5
                }]
            },
            {
                "clips": [{
                    "asset": {
                        "type": "text",
                        "text": "Perfect form!",
                        "font": {"size": 48, "color": "#00ff00"}
                    },
                    "start": 2,
                    "length": 2,
                    "position": "bottom"
                }]
            }
        ]
    },
    "output": {
        "format": "mp4",
        "fps": 30,
        "size": {"width": 1920, "height": 1080}
    }
}

response = client.render_video(edit)
print(f"Render ID: {response['response']['id']}")
```

### Example 2: Full Analysis Video
```python
from shotstack_helpers import create_basketball_analysis_video

analysis_results = {
    'feedback': [
        'Good elbow alignment',
        'Follow through needs work',
        'Great balance'
    ],
    'angles': {
        'elbow': {'value': 90.5, 'position': {'x': 0.2, 'y': 0}},
        'knee': {'value': 135.0, 'position': {'x': 0.1, 'y': 0.3}}
    }
}

output_url = create_basketball_analysis_video(
    video_path="https://example.com/shot.mp4",
    skeleton_data={},  # From pose estimation
    analysis_results=analysis_results,
    output_path="analysis_output.mp4",
    environment='sandbox'
)

print(f"Analysis video ready: {output_url}")
```

---

## 📊 Rate Limits & Pricing

### Current Account
- **Credits:** 24,948 remaining
- **Tier:** PRODUCTION
- **Sandbox:** Unlimited testing (watermarked)

### Credit Usage
- **Video rendering:** Varies by duration and resolution
- **Image rendering:** Lower cost than video
- **Sandbox:** Free but watermarked

### Best Practices
1. **Test in sandbox** before production
2. **Optimize video length** to save credits
3. **Use appropriate resolution** (1080p vs 4K)
4. **Cache rendered videos** to avoid re-rendering

---

## 🚀 Next Steps

### Immediate Actions
1. ✅ API credentials obtained and saved
2. ✅ Integration scripts created
3. ✅ Documentation completed
4. ⏳ Test API with sample video
5. ⏳ Integrate with RoboFlow pose estimation
6. ⏳ Create basketball-specific templates
7. ⏳ Build video upload/storage system

### Integration with Basketball App

#### Step 1: Upload Videos
Use ShotStack Ingest API to upload videos:
```python
# TODO: Implement video upload
ingest_url = "https://api.shotstack.io/ingest/v1/sources"
```

#### Step 2: Process with RoboFlow
1. Get video from user
2. Run pose estimation (RoboFlow)
3. Extract keypoints and angles
4. Generate skeleton overlay

#### Step 3: Create Analysis Video
1. Use `BasketballVideoEditor` to combine:
   - Original video
   - Skeleton overlay
   - Angle measurements
   - Coaching annotations
2. Render and return URL

#### Step 4: Store and Serve
1. Save rendered video URL
2. Display in web app
3. Allow download/sharing

### Template Ideas
1. **Shooting Form Analysis** - Full breakdown with angles
2. **Quick Feedback** - Short clips with key points
3. **Progress Comparison** - Side-by-side before/after
4. **Highlight Reel** - Best shots with analysis
5. **Drill Demonstration** - Instructional overlays

---

## 📚 Resources

- **API Documentation:** https://shotstack.io/docs/api/
- **Dashboard:** https://dashboard.shotstack.io
- **API Reference:** https://shotstack.io/docs/api/reference/
- **Examples:** https://shotstack.io/docs/api/examples/

---

## 🔧 Troubleshooting

### Common Issues

1. **Render fails with "Invalid JSON"**
   - Check JSON syntax
   - Ensure all required fields are present
   - Validate asset URLs are accessible

2. **Video not loading**
   - Verify video URL is publicly accessible
   - Check video format is supported (mp4, mov, etc.)
   - Ensure video is not too large

3. **Overlay not visible**
   - Check opacity settings
   - Verify position and offset values
   - Ensure layer order (tracks) is correct

4. **Text not displaying**
   - Verify font family is available
   - Check text color vs background
   - Ensure width/height are sufficient

### Debug Tips
- Use sandbox environment for testing
- Check render status for error messages
- Validate JSON with online tools
- Test with simple examples first

---

## ✅ Setup Complete!

ShotStack is now fully configured and ready to integrate with the basketball shooting analysis system. The API credentials are saved, integration scripts are created, and documentation is complete.

**Next:** Test the API with a sample basketball video and integrate with RoboFlow pose estimation models.

---

*Last Updated: December 13, 2025*
