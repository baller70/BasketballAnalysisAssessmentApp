# ShotStack Quick Reference Card

**Last Updated:** December 13, 2025

---

## 🔑 API Credentials

### Sandbox (Testing)
```
API Key: 5I9pXTQbDLmcF6tvgjOzgYtDN5jyK2FnurBSU5oy
Endpoint: https://api.shotstack.io/edit/stage
```

### Production
```
API Key: HQNZcbuBHc1zVapRhzAdHQFqNkXzQG1YrqYhBhwZ
Endpoint: https://api.shotstack.io/edit/v1
```

---

## 🚀 Quick Start

```python
from shotstack_helpers import ShotStackClient, BasketballVideoEditor

# Initialize
client = ShotStackClient(environment='sandbox')
editor = BasketballVideoEditor(client)

# Create analysis video
response = editor.create_shooting_form_analysis(
    video_url="https://example.com/shot.mp4",
    annotations=[{'text': 'Good form!', 'start': 0, 'length': 2}],
    angles=[{'name': 'Elbow', 'value': 90.5, 'position': {'x': 0.2, 'y': 0}}],
    duration=5.0
)

# Wait for render
render_id = response['response']['id']
status = client.wait_for_render(render_id)
video_url = status['response']['url']
```

---

## 📋 Common Tasks

### Add Text Annotation
```python
annotation = {
    'text': 'Good elbow alignment!',
    'start': 0,
    'length': 2,
    'position': 'bottom',
    'color': '#00ff00',
    'background': '#000000'
}
```

### Add Angle Measurement
```python
angle = {
    'name': 'Elbow Angle',
    'value': 90.5,
    'position': {'x': 0.2, 'y': 0.0},
    'start': 0,
    'length': 5
}
```

### Create Split-Screen
```python
response = editor.create_split_screen_comparison(
    video1_url="before.mp4",
    video2_url="after.mp4",
    title1="Before",
    title2="After",
    duration=5.0
)
```

---

## 🎨 Position Values

### Named Positions
- `"top"` - Top of frame
- `"center"` - Center of frame
- `"bottom"` - Bottom of frame
- `"left"` - Left side
- `"right"` - Right side

### Offset Coordinates
```python
offset = {
    'x': 0.2,   # -1 (left) to 1 (right)
    'y': -0.1   # -1 (top) to 1 (bottom)
}
```

---

## 🎨 Colors

### Status Colors
```python
'#00ff00'  # Green - Good
'#ffff00'  # Yellow - Warning
'#ff0000'  # Red - Needs work
'#ffffff'  # White
'#000000'  # Black
```

---

## 📊 Output Formats

### Video
```python
output = {
    "format": "mp4",
    "fps": 30,
    "size": {"width": 1920, "height": 1080}
}
```

### Common Resolutions
- **720p:** 1280 x 720
- **1080p:** 1920 x 1080
- **4K:** 3840 x 2160
- **Mobile:** 720 x 1280

---

## 🧪 Testing

```bash
# Run test suite
python shotstack_test.py

# Run examples
python shotstack_example.py

# Test connection
python -c "from shotstack_helpers import ShotStackClient; print('✓ OK')"
```

---

## 📚 Files

### Scripts
- `shotstack_helpers.py` - Main library
- `shotstack_test.py` - Test suite
- `shotstack_example.py` - Examples

### Documentation
- `SHOTSTACK_SETUP.md` - Setup guide
- `SHOTSTACK_INTEGRATION_GUIDE.md` - Developer guide
- `SHOTSTACK_FINAL_REPORT.md` - Complete report

### Configuration
- `.env.shotstack` - API credentials

---

## 🔗 Links

- **Dashboard:** https://dashboard.shotstack.io
- **API Docs:** https://shotstack.io/docs/
- **API Reference:** https://shotstack.io/docs/api/reference/

---

## 💰 Credits

- **Available:** 24,948
- **720p (5s):** ~10-20 credits
- **1080p (5s):** ~20-40 credits

---

## ⚡ Tips

1. Test in sandbox first (watermarked)
2. Keep videos short (5-10 seconds)
3. Use 720p for mobile
4. Cache rendered videos
5. Validate JSON before submitting

---

*Quick Reference v1.0*
