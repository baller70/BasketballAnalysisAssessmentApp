# Pixabay API Information
**Extracted from Screenshot: December 13, 2025**

## API Credentials
```
API Key: 40138022-57af4b7daf7ed0a81d2f7bded
Base URL: https://pixabay.com/api/
```

## Rate Limits & Usage Rules

### Rate Limiting
- **Limit:** 100 requests per 60 seconds
- **Headers Returned:**
  - `X-RateLimit-Limit`: Maximum requests allowed (100)
  - `X-RateLimit-Remaining`: Requests remaining in window
  - `X-RateLimit-Reset`: Seconds until rate limit resets

### Caching Requirements
- **Must cache results for 24 hours**
- API is designed for real human requests
- No systematic mass downloads allowed
- Can request limit increase if properly implemented

### Hotlinking Policy
- **Temporary display:** OK for search results
- **Permanent hotlinking:** NOT ALLOWED
- **Recommendation:** Download images to your server first
- **Videos:** Can embed directly, but server storage recommended

### Error Handling
- HTTP error codes with plain text descriptions
- Example: HTTP 429 "Too Many Requests" = Rate limit exceeded

## API Parameters

### Image Search Endpoint
`GET https://pixabay.com/api/`

#### Required Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | string | API key (required for all requests) |

#### Optional Parameters
| Parameter | Type | Values | Default |
|-----------|------|--------|---------|
| `q` | string | URL-encoded search term (max 100 chars) | all images |
| `lang` | string | cs, da, de, en, es, fr, id, it, hu, nl, no, pl, pt, ro, sk, fi, sv, tr, vi, th, bg, ru, el, ja, ko, zh | "en" |
| `id` | string | Retrieve individual images by ID | - |
| `image_type` | string | "all", "photo", "illustration", "vector" | "all" |
| `orientation` | string | "all", "horizontal", "vertical" | "all" |
| `category` | string | backgrounds, fashion, nature, science, education, feelings, health, people, religion, places, animals, industry, computer, food, sports, transportation, travel, buildings, business, music | - |
| `min_width` | int | Minimum image width | 0 |
| `min_height` | int | Minimum image height | 0 |
| `colors` | string | grayscale, transparent, red, orange, yellow, green, turquoise, blue, lilac, pink, white, gray, black, brown | - |
| `editors_choice` | bool | "true", "false" | "false" |
| `safesearch` | bool | "true", "false" | "false" |
| `order` | string | "popular", "latest" | "popular" |
| `page` | int | Page number for paginated results | 1 |
| `per_page` | int | Results per page (3-200) | 20 |
| `callback` | string | JSONP callback function name | - |
| `pretty` | bool | Indent JSON output (not for production) | "false" |

### Video Search Endpoint
`GET https://pixabay.com/api/videos/`

Similar parameters to image search, with video-specific options:
- `video_type`: "all", "film", "animation"
- Video quality levels: large (3840x2160), medium (1920x1080), small (1280x720), tiny (960x540)

## Response Format

### Image Response Structure
```json
{
  "total": 4692,
  "totalHits": 500,
  "hits": [
    {
      "id": 195893,
      "pageURL": "https://images.pexels.com/photos/30731364/pexels-photo-30731364.jpeg?cs=srgb&dl=pexels-mavicair2tw-30731364.jpg&fm=jpg",
      "type": "photo",
      "tags": "blossom, bloom, flower",
      "previewURL": "https://upload.wikimedia.org/wikipedia/commons/8/81/Badamwari_Flower_Series_2.png",
      "previewWidth": 150,
      "previewHeight": 84,
      "webformatURL": "https://images.unsplash.com/photo-1436891436013-5965265af5fc?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Zmxvd2VyJTIwYmxvb218ZW58MHx8MHx8fDA%3D",
      "webformatWidth": 640,
      "webformatHeight": 360,
      "largeImageURL": "https://...1280.jpg",
      "fullHDURL": "https://...1920.jpg",
      "imageURL": "https://...",
      "imageWidth": 4000,
      "imageHeight": 2250,
      "imageSize": 4731420,
      "views": 7671,
      "downloads": 6439,
      "likes": 5,
      "comments": 2,
      "user_id": 48777,
      "user": "Josch13",
      "userImageURL": "https://..."
    }
  ]
}
```

### Image URL Sizes
Replace `_640` in `webformatURL` to access other sizes:
- `_180`: 180px tall version
- `_340`: 340px tall version
- `_640`: 640px max dimension (default)
- `_960`: 960x720px max dimension

### High-Resolution Access
- `largeImageURL`: Max 1280px
- `fullHDURL`: Max 1920px (Full HD)
- `imageURL`: Original full resolution

## Example Request
```bash
https://pixabay.com/api/?key=40138022-57af4b7daf7ed0a81d2f7bded&q=basketball+shooting&image_type=photo&min_width=1920&per_page=200
```

## Attribution Requirements
**Show users where images are from whenever displaying search results.**

Example:
> Images from [Pixabay](https://pixabay.com)

## Best Practices for Basketball Training Dataset

### Optimized Search Terms
- "basketball shooting back view"
- "basketball from behind"
- "amateur basketball"
- "youth basketball shooting"
- "street basketball"
- "recreational basketball"

### Quality Filters
```python
params = {
    'image_type': 'photo',
    'min_width': 1920,
    'min_height': 1080,
    'per_page': 200,  # Maximum
    'order': 'popular',
    'safesearch': 'false'
}
```

### Rate Limit Implementation
```python
import time

RATE_LIMIT_DELAY = 0.6  # 100 req/60s = 0.6s between requests
last_request_time = 0

def rate_limit_wait():
    global last_request_time
    current_time = time.time()
    time_since_last = current_time - last_request_time
    if time_since_last < RATE_LIMIT_DELAY:
        time.sleep(RATE_LIMIT_DELAY - time_since_last)
    last_request_time = time.time()
```

## Notes
- API limits to 500 images per query (totalHits cap)
- Use multiple search terms to get more variety
- Download highest quality available (fullHDURL or largeImageURL)
- Cache results for 24 hours as required
- Monitor rate limit headers in responses

## Collection Status
- ✅ API Key Extracted: 2025-12-13
- ✅ Integration Complete: 2025-12-13
- 🔄 Collection In Progress: Targeting 400+ images from Pixabay API
