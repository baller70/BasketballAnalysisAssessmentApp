"""
Database Backup Configuration
Basketball Shooting Analysis System
"""

import os
from datetime import timedelta

# ==========================================
# BACKUP CONFIGURATION
# ==========================================

# Backup storage location (S3 bucket)
BACKUP_BUCKET = os.getenv("BACKUP_BUCKET", "basketball-shooters-db-backups")
BACKUP_PREFIX = "database-backups/"

# Local backup directory (temporary storage before S3 upload)
LOCAL_BACKUP_DIR = os.getenv("LOCAL_BACKUP_DIR", "/tmp/db_backups")

# Backup schedule (cron-style)
BACKUP_SCHEDULES = {
    # Full backup daily at 2 AM
    "full": {
        "cron": "0 2 * * *",  # 2:00 AM daily
        "retention_days": 30,
        "description": "Complete database dump"
    },
    # Incremental backup every 6 hours
    "incremental": {
        "cron": "0 */6 * * *",  # Every 6 hours
        "retention_days": 7,
        "description": "Changes since last full backup"
    },
    # Weekly archive (Sundays at 3 AM)
    "weekly": {
        "cron": "0 3 * * 0",  # Sunday 3:00 AM
        "retention_days": 90,
        "description": "Weekly archive backup"
    }
}

# Retention policies
RETENTION_POLICIES = {
    "daily": timedelta(days=7),      # Keep daily backups for 7 days
    "weekly": timedelta(days=30),    # Keep weekly backups for 30 days
    "monthly": timedelta(days=365),  # Keep monthly backups for 1 year
}

# Tables to backup (in dependency order)
TABLES_TO_BACKUP = [
    "shooters",              # Main table (no dependencies)
    "shooting_biomechanics", # Depends on shooters
    "shooter_images",        # Depends on shooters
    "shooting_stats",        # Depends on shooters
    "shooting_strengths",    # Depends on shooters
    "shooting_weaknesses",   # Depends on shooters
    "habitual_mechanics",    # Depends on shooters
]

# Critical tables (always backed up first)
CRITICAL_TABLES = ["shooters", "shooter_images"]

# Backup file naming
BACKUP_FILENAME_FORMAT = "{backup_type}_{table}_{timestamp}.sql"
ARCHIVE_FILENAME_FORMAT = "full_backup_{timestamp}.tar.gz"

# Compression settings
COMPRESSION_ENABLED = True
COMPRESSION_LEVEL = 9  # Max compression (1-9)

# Encryption settings (for sensitive data)
ENCRYPTION_ENABLED = os.getenv("BACKUP_ENCRYPTION_ENABLED", "true").lower() == "true"
ENCRYPTION_KEY_ID = os.getenv("BACKUP_ENCRYPTION_KEY_ID", "")

# Notification settings
NOTIFY_ON_SUCCESS = os.getenv("BACKUP_NOTIFY_SUCCESS", "false").lower() == "true"
NOTIFY_ON_FAILURE = True  # Always notify on failure
NOTIFICATION_EMAIL = os.getenv("BACKUP_NOTIFICATION_EMAIL", "")
NOTIFICATION_WEBHOOK = os.getenv("BACKUP_NOTIFICATION_WEBHOOK", "")

# Database connection (from environment)
DATABASE_URL = os.getenv("DATABASE_URL", "")

# S3 configuration
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")


