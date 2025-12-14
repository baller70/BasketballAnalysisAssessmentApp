"""
API Credentials Configuration
Extracted from uploaded screenshot and provided keys
"""

# Pixabay API (extracted from screenshot)
PIXABAY_API_KEY = "40138022-57af4b7daf7ed0a81d2f7bded"
PIXABAY_RATE_LIMIT = 100  # requests per 60 seconds
PIXABAY_CACHE_HOURS = 24

# Pexels API
PEXELS_API_KEY = "1YOjyRmXxeA5s4q1d7CuxepcnFEgMEhmopApbn3MTS7zPf0vUJsrsQSu"
PEXELS_RATE_LIMIT = 200  # requests per hour

# Unsplash API
UNSPLASH_ACCESS_KEY = "OMJeP8It444nadmsbi5VpbFDfBo9RP0FBwHTLjhulsg"
UNSPLASH_SECRET_KEY = "gGzB9BbRQfOWfNljeWyj3nBD7X_rEexlqf2sdvFjk_E"
UNSPLASH_RATE_LIMIT = 50  # requests per hour

# Kaggle API
KAGGLE_API_KEY = "KGAT_51f015e15f1b1b6313b5e195fe1dd321"

# Rate limiting configuration
RATE_LIMIT_DELAY = {
    'pixabay': 0.6,  # 100 req/60s = ~0.6s between requests
    'pexels': 18,    # 200 req/hour = 18s between requests
    'unsplash': 72,  # 50 req/hour = 72s between requests
    'kaggle': 5      # Conservative delay for Kaggle
}
