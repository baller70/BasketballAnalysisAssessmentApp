#!/usr/bin/env python3
"""Quick test of Pexels API"""

import requests

API_KEY = "1YOjyRmXxeA5s4q1d7CuxepcnFEgMEhmopApbn3MTS7zPf0vUJsrsQSu"
headers = {"Authorization": API_KEY}

# Test API connection
print("🔌 Testing Pexels API connection...")
response = requests.get(
    "https://api.pexels.com/v1/search",
    headers=headers,
    params={"query": "basketball", "per_page": 5, "page": 1}
)

if response.status_code == 200:
    data = response.json()
    print("✅ API connection successful!")
    print(f"📊 Total basketball images available: {data.get('total_results', 0)}")
    print(f"📷 Retrieved {len(data.get('photos', []))} sample photos")
    
    # Show first photo info
    if data.get('photos'):
        photo = data['photos'][0]
        print(f"\nSample photo:")
        print(f"  - ID: {photo['id']}")
        print(f"  - Photographer: {photo['photographer']}")
        print(f"  - Size: {photo['width']}x{photo['height']}")
        print(f"  - URL: {photo['src']['large'][:60]}...")
else:
    print(f"❌ API connection failed! Status code: {response.status_code}")
    print(f"Response: {response.text}")
