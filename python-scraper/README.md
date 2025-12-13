# Basketball Shooter Scraping Pipeline

Python web scraping service for collecting NBA player data.

**Deploy to:** Render or Railway (NOT Abacus AI)

## 🚀 Quick Deploy (No AWS Required)

**NEW**: You can now deploy without AWS S3 credentials! The scraper will populate the database with player data while skipping image uploads.

- ✅ **Required**: `DATABASE_URL` + `API_SECRET_KEY` only
- ⚠️ **Optional**: AWS S3 credentials (for image storage)
- 📖 **Guide**: See [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md) for step-by-step instructions

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│    Next.js App      │     │   Python Scraper    │
│   (Abacus AI)       │◄────│  (Render/Railway)   │
└─────────────────────┘     └─────────────────────┘
         │                           │
         └───────────┬───────────────┘
                     ▼
         ┌─────────────────────┐
         │     PostgreSQL      │
         │    (Abacus AI)      │
         └─────────────────────┘
```

## Data Sources

1. **NBA.com Stats API** - Current NBA player stats
2. **Basketball-Reference.com** - Historical player data

## Scraped Data

- Player name
- Position (Guard/Forward/Center)
- Height & Weight
- Career FG%, 3PT%, FT%
- Team
- Era (Modern/Historical)
- Profile image URL

## Setup

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string (Abacus AI)
- `API_SECRET_KEY` - Secret key for API authentication

### 3. Run locally

```bash
# Test single scraper
python main.py nba 10

# Run full pipeline
python main.py full

# Start API server
python app.py
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/health` | GET | Detailed health status |
| `/api/scrape/nba` | POST | Trigger NBA scrape |
| `/api/scrape/historical` | POST | Trigger historical scrape |
| `/api/scrape/full` | POST | Trigger full pipeline |
| `/api/shooters` | GET | List all shooters |
| `/api/shooters/<name>` | GET | Get shooter by name |
| `/webhook/nextjs` | POST | Webhook for Next.js |

### Authentication

Include API key in headers:
```
X-API-Key: your-api-key
```

Or as query parameter:
```
?api_key=your-api-key
```

## Deploy to Render

1. Create new Web Service
2. Connect your GitHub repo
3. Set root directory to `python-scraper`
4. Build command: `pip install -r requirements.txt`
5. Start command: `gunicorn app:app`
6. Add environment variables

## Deploy to Railway

1. Create new project
2. Connect GitHub repo
3. Railway will auto-detect Python
4. Add environment variables in dashboard

## Scheduled Scraping

Use Render/Railway cron jobs or external scheduler:

```bash
# Scrape NBA players daily
0 6 * * * curl -X POST https://your-scraper.render.com/api/scrape/nba -H "X-API-Key: your-key"

# Scrape historical players weekly
0 6 * * 0 curl -X POST https://your-scraper.render.com/api/scrape/historical -H "X-API-Key: your-key"
```

## Files

```
python-scraper/
├── app.py                  # Flask API server
├── main.py                 # Main scraping pipeline
├── config.py               # Configuration
├── database.py             # Database operations
├── requirements.txt        # Python dependencies
├── Procfile                # Render/Railway start command
├── scrapers/
│   ├── __init__.py
│   ├── nba_scraper.py      # NBA.com scraper
│   └── basketball_reference_scraper.py  # Historical scraper
└── logs/                   # Log files
```


