# Phase 1 Complete: Data Foundation

## 🏀 Basketball Shooting Analysis Tool

---

## 1. Exact SQL Commands to Copy-Paste

### Create All Tables

```sql
-- ==========================================
-- BASKETBALL SHOOTING ANALYSIS DATABASE
-- Phase 1: Data Foundation
-- ==========================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ==========================================
-- TABLE 1: SHOOTERS (Main Profile)
-- ==========================================
CREATE TABLE IF NOT EXISTS shooters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(20),
    height_inches INTEGER,
    weight_lbs INTEGER,
    wingspan_inches INTEGER,
    arm_length_inches INTEGER,
    body_type VARCHAR(50),
    dominant_hand VARCHAR(10) DEFAULT 'Right',
    career_fg_percentage DECIMAL(5,2),
    career_3pt_percentage DECIMAL(5,2),
    career_ft_percentage DECIMAL(5,2),
    shooting_style VARCHAR(50),
    era VARCHAR(20),
    skill_level VARCHAR(20) DEFAULT 'Professional',
    profile_image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TABLE 2: SHOOTING BIOMECHANICS
-- ==========================================
CREATE TABLE IF NOT EXISTS shooting_biomechanics (
    id SERIAL PRIMARY KEY,
    shooter_id INTEGER REFERENCES shooters(id) ON DELETE CASCADE,
    elbow_angle DECIMAL(5,2),
    shoulder_angle DECIMAL(5,2),
    hip_angle DECIMAL(5,2),
    knee_angle DECIMAL(5,2),
    ankle_angle DECIMAL(5,2),
    release_height DECIMAL(5,2),
    release_angle DECIMAL(5,2),
    entry_angle DECIMAL(5,2),
    follow_through_extension DECIMAL(5,2),
    balance_score DECIMAL(5,2),
    arc_consistency DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TABLE 3: SHOOTER IMAGES
-- ==========================================
CREATE TABLE IF NOT EXISTS shooter_images (
    image_id SERIAL PRIMARY KEY,
    shooter_id INTEGER REFERENCES shooters(id) ON DELETE CASCADE,
    image_category VARCHAR(50),
    image_url TEXT NOT NULL,
    s3_path TEXT,
    image_resolution VARCHAR(20),
    capture_phase VARCHAR(30),
    shooting_angle VARCHAR(30),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TABLE 4: SHOOTING STATS
-- ==========================================
CREATE TABLE IF NOT EXISTS shooting_stats (
    id SERIAL PRIMARY KEY,
    shooter_id INTEGER REFERENCES shooters(id) ON DELETE CASCADE,
    season VARCHAR(10),
    games_played INTEGER,
    fg_attempts INTEGER,
    fg_made INTEGER,
    three_pt_attempts INTEGER,
    three_pt_made INTEGER,
    ft_attempts INTEGER,
    ft_made INTEGER,
    points_per_game DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TABLE 5: SHOOTING STRENGTHS
-- ==========================================
CREATE TABLE IF NOT EXISTS shooting_strengths (
    id SERIAL PRIMARY KEY,
    shooter_id INTEGER REFERENCES shooters(id) ON DELETE CASCADE,
    strength_category VARCHAR(50),
    description TEXT,
    confidence_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TABLE 6: SHOOTING WEAKNESSES
-- ==========================================
CREATE TABLE IF NOT EXISTS shooting_weaknesses (
    id SERIAL PRIMARY KEY,
    shooter_id INTEGER REFERENCES shooters(id) ON DELETE CASCADE,
    weakness_category VARCHAR(50),
    description TEXT,
    severity_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TABLE 7: HABITUAL MECHANICS
-- ==========================================
CREATE TABLE IF NOT EXISTS habitual_mechanics (
    id SERIAL PRIMARY KEY,
    shooter_id INTEGER REFERENCES shooters(id) ON DELETE CASCADE,
    habit_name VARCHAR(100),
    habit_type VARCHAR(50),
    frequency VARCHAR(20),
    impact_on_performance TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- CREATE ALL INDEXES
-- ==========================================

-- Shooters indexes
CREATE INDEX IF NOT EXISTS idx_shooter_name ON shooters(name);
CREATE INDEX IF NOT EXISTS idx_skill_level ON shooters(skill_level);
CREATE INDEX IF NOT EXISTS idx_shooting_style ON shooters(shooting_style);
CREATE INDEX IF NOT EXISTS idx_position ON shooters(position);
CREATE INDEX IF NOT EXISTS idx_era ON shooters(era);
CREATE INDEX IF NOT EXISTS idx_3pt_percentage ON shooters(career_3pt_percentage DESC);
CREATE INDEX IF NOT EXISTS idx_fg_percentage ON shooters(career_fg_percentage DESC);
CREATE INDEX IF NOT EXISTS idx_height ON shooters(height_inches);
CREATE INDEX IF NOT EXISTS idx_body_type ON shooters(body_type);
CREATE INDEX IF NOT EXISTS idx_skill_position ON shooters(skill_level, position);
CREATE INDEX IF NOT EXISTS idx_skill_style ON shooters(skill_level, shooting_style);

-- Shooter images indexes
CREATE INDEX IF NOT EXISTS idx_images_shooter_id ON shooter_images(shooter_id);
CREATE INDEX IF NOT EXISTS idx_image_category ON shooter_images(image_category);
CREATE INDEX IF NOT EXISTS idx_capture_phase ON shooter_images(capture_phase);
CREATE INDEX IF NOT EXISTS idx_shooting_angle ON shooter_images(shooting_angle);
CREATE INDEX IF NOT EXISTS idx_shooter_phase ON shooter_images(shooter_id, capture_phase);
CREATE INDEX IF NOT EXISTS idx_shooter_primary ON shooter_images(shooter_id, is_primary);

-- Biomechanics indexes
CREATE INDEX IF NOT EXISTS idx_biomech_shooter_id ON shooting_biomechanics(shooter_id);
CREATE INDEX IF NOT EXISTS idx_elbow_angle ON shooting_biomechanics(elbow_angle);
CREATE INDEX IF NOT EXISTS idx_knee_angle ON shooting_biomechanics(knee_angle);
CREATE INDEX IF NOT EXISTS idx_release_angle ON shooting_biomechanics(release_angle);

-- Stats indexes
CREATE INDEX IF NOT EXISTS idx_stats_shooter_id ON shooting_stats(shooter_id);
CREATE INDEX IF NOT EXISTS idx_season ON shooting_stats(season);
CREATE INDEX IF NOT EXISTS idx_shooter_season ON shooting_stats(shooter_id, season);

-- Other indexes
CREATE INDEX IF NOT EXISTS idx_strengths_shooter_id ON shooting_strengths(shooter_id);
CREATE INDEX IF NOT EXISTS idx_weaknesses_shooter_id ON shooting_weaknesses(shooter_id);
CREATE INDEX IF NOT EXISTS idx_habits_shooter_id ON habitual_mechanics(shooter_id);

-- Full-text search (optional)
CREATE INDEX IF NOT EXISTS idx_shooter_name_trgm ON shooters USING gin(name gin_trgm_ops);

-- Analyze tables
ANALYZE shooters;
ANALYZE shooter_images;
ANALYZE shooting_biomechanics;
ANALYZE shooting_stats;
```

---

## 2. Phase 1 Monitoring Checklist

### ✅ Database Setup Verification

| Check | Command | Expected Result |
|-------|---------|-----------------|
| Tables exist | `\dt` | 7 tables listed |
| Shooters table | `SELECT COUNT(*) FROM shooters;` | 0+ rows |
| Indexes created | `\di` | 25+ indexes |
| Foreign keys work | `INSERT INTO shooter_images (shooter_id, image_url) VALUES (999, 'test');` | Should FAIL (no shooter 999) |

### ✅ S3 Storage Verification

| Check | How to Verify | Expected Result |
|-------|---------------|-----------------|
| Bucket exists | AWS Console → S3 | `basketball-shooters-db` visible |
| Folders created | Browse bucket | `professional-shooters/`, `amateur-shooters/`, `user-uploads/` |
| Permissions | Upload test file | Success, file accessible |
| Encryption | Check bucket settings | AES-256 enabled |

### ✅ Scraper Verification

| Check | Command/Action | Expected Result |
|-------|----------------|-----------------|
| Scraper running | `curl https://your-scraper.onrender.com/health` | `{"status": "healthy"}` |
| NBA scrape works | POST `/api/scrape/nba` | `{"success": true, "count": 100}` |
| Data in DB | `SELECT COUNT(*) FROM shooters;` | 100+ rows |
| Images downloaded | Check S3 bucket | Images in folders |

### ✅ Backup Verification

| Check | Command/Action | Expected Result |
|-------|----------------|-----------------|
| Backup runs | POST `/api/backup/daily` | `{"success": true}` |
| Backup in S3 | Check `basketball-shooters-db-backups/daily/` | SQL files present |
| Verify backup | POST `/api/backup/verify` | `{"verified": true}` |
| Scheduler running | GET `/api/backup/scheduler/status` | `{"running": true}` |

### ✅ Query Performance

```sql
-- Test query speed (should be <100ms)
EXPLAIN ANALYZE SELECT * FROM shooters WHERE skill_level = 'Professional' LIMIT 10;
EXPLAIN ANALYZE SELECT * FROM shooter_images WHERE shooter_id = 1;
EXPLAIN ANALYZE SELECT * FROM shooters WHERE career_3pt_percentage > 40 ORDER BY career_3pt_percentage DESC;
```

---

## 3. Phase 2 Preview: Roboflow Integration

### What Phase 2 Does

Phase 2 trains a custom AI model to detect:
- 🏀 Basketball position
- 👋 Hand positions (shooting hand, guide hand)
- 💪 Body landmarks (elbow, shoulder, knee, hip, ankle)
- 📐 Shooting angles

### Phase 2 Components

| Component | Purpose |
|-----------|---------|
| Roboflow Project | Host training images |
| Custom Model | Detect basketball + body parts |
| API Integration | Real-time pose analysis |
| Annotation Pipeline | Auto-label new images |

### Phase 2 High-Level Steps

1. **Create Roboflow Project**
   - Sign up at roboflow.com
   - Create "basketball-shooting-form" project
   - Choose "Object Detection" type

2. **Upload Training Images**
   - Export images from S3
   - Upload to Roboflow
   - 500+ images recommended

3. **Annotate Images**
   - Label basketball (bounding box)
   - Label hands, elbows, shoulders
   - Use Roboflow's annotation tool

4. **Train Model**
   - Select YOLOv8 architecture
   - Train for 100+ epochs
   - Validate accuracy >90%

5. **Deploy Model**
   - Get API endpoint
   - Integrate with Next.js app
   - Replace/enhance Vision AI

### Phase 2 Expected Outcome

| Metric | Target |
|--------|--------|
| Basketball detection | >95% accuracy |
| Hand detection | >90% accuracy |
| Body landmark detection | >85% accuracy |
| Inference speed | <500ms |

---

## 4. Troubleshooting Guide

### Common Phase 1 Issues

#### ❌ "Connection refused" to database

```bash
# Check database URL format
echo $DATABASE_URL
# Should be: postgresql://user:password@host:5432/database

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

**Fix:** Verify DATABASE_URL is correct, check if database server is running.

---

#### ❌ "Permission denied" on S3 upload

```bash
# Check AWS credentials
aws s3 ls s3://basketball-shooters-db/
```

**Fix:** Verify IAM user has `s3:PutObject`, `s3:GetObject` permissions.

---

#### ❌ Scraper returns empty data

```python
# Check if website structure changed
import requests
response = requests.get("https://www.nba.com/stats/players", headers={"User-Agent": "Mozilla/5.0"})
print(response.status_code)  # Should be 200
```

**Fix:** NBA.com may have changed structure. Update scraper selectors.

---

#### ❌ Backup fails with "pg_dump not found"

```bash
# Install PostgreSQL client
# Mac:
brew install postgresql

# Ubuntu:
sudo apt-get install postgresql-client
```

**Fix:** Ensure pg_dump is installed and in PATH.

---

#### ❌ Indexes not improving performance

```sql
-- Check if indexes are being used
EXPLAIN ANALYZE SELECT * FROM shooters WHERE name = 'Stephen Curry';

-- If "Seq Scan" appears, index not used
-- Run ANALYZE to update statistics
ANALYZE shooters;
```

**Fix:** Run `ANALYZE` on tables, check query structure.

---

#### ❌ Images not appearing in app

1. Check S3 URL is correct
2. Verify bucket has public read (or use signed URLs)
3. Check CORS configuration on bucket

```json
// S3 CORS Configuration
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST"],
        "AllowedOrigins": ["https://your-app.abacus.ai", "http://localhost:3000"],
        "ExposeHeaders": []
    }
]
```

---

#### ❌ Scraper rate limited (429 errors)

```python
# Increase delay between requests
SCRAPE_DELAY_SECONDS = 3  # Increase from 1 to 3

# Use rotating user agents
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
]
```

**Fix:** Add delays, rotate user agents, consider proxy rotation.

---

## Quick Reference Commands

### Database

```bash
# Connect to database
psql $DATABASE_URL

# Check table counts
psql $DATABASE_URL -c "SELECT 'shooters' as table_name, COUNT(*) FROM shooters UNION ALL SELECT 'shooter_images', COUNT(*) FROM shooter_images;"

# Export data
pg_dump $DATABASE_URL > backup.sql
```

### S3

```bash
# List bucket contents
aws s3 ls s3://basketball-shooters-db/ --recursive

# Upload file
aws s3 cp image.jpg s3://basketball-shooters-db/test/

# Download file
aws s3 cp s3://basketball-shooters-db/test/image.jpg ./
```

### Scraper API

```bash
# Health check
curl https://your-scraper.onrender.com/health

# Trigger NBA scrape
curl -X POST https://your-scraper.onrender.com/api/scrape/nba \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"limit": 50}'

# Trigger backup
curl -X POST https://your-scraper.onrender.com/api/backup/daily \
  -H "X-API-Key: your-key"
```

---

## ✅ Phase 1 Complete!

You now have:
- ✅ PostgreSQL database with 7 tables
- ✅ 30+ indexes for fast queries
- ✅ AWS S3 storage configured
- ✅ Web scraping pipeline
- ✅ Automated backup system
- ✅ API endpoints for all operations

**Ready for Phase 2: Roboflow Model Training!**







