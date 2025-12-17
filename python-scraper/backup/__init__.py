"""
Database Backup Module
Basketball Shooting Analysis System
"""

import os
from loguru import logger

# Check if S3 backup is available (requires S3 credentials)
BACKUP_ENABLED = bool(
    os.getenv("AWS_ACCESS_KEY_ID") and 
    os.getenv("AWS_SECRET_ACCESS_KEY") and
    os.getenv("BACKUP_BUCKET")
)

# Try to import backup functions (will be None if backup is disabled)
if BACKUP_ENABLED:
    try:
        from backup.backup_config import (
            BACKUP_BUCKET,
            BACKUP_PREFIX,
            BACKUP_SCHEDULES,
            RETENTION_POLICIES,
            TABLES_TO_BACKUP,
            CRITICAL_TABLES,
        )

        from backup.backup_manager import (
            BackupManager,
            run_scheduled_backup,
        )

        from backup.scheduler import (
            BackupSchedulerService,
            backup_service,
            setup_backup_scheduler,
        )
        logger.info("✅ Database backup enabled (S3 configured)")
    except Exception as e:
        logger.warning(f"⚠️  Backup import failed: {e}. Backup disabled.")
        BACKUP_ENABLED = False
        # Create stub variables
        BACKUP_BUCKET = None
        BACKUP_PREFIX = None
        BACKUP_SCHEDULES = None
        RETENTION_POLICIES = None
        TABLES_TO_BACKUP = None
        CRITICAL_TABLES = None
        BackupManager = None
        run_scheduled_backup = None
        BackupSchedulerService = None
        backup_service = None
        setup_backup_scheduler = None
else:
    logger.info("⚠️  Database backup disabled (S3 not configured)")
    # Create stub variables
    BACKUP_BUCKET = None
    BACKUP_PREFIX = None
    BACKUP_SCHEDULES = None
    RETENTION_POLICIES = None
    TABLES_TO_BACKUP = None
    CRITICAL_TABLES = None
    BackupManager = None
    run_scheduled_backup = None
    BackupSchedulerService = None
    backup_service = None
    setup_backup_scheduler = None

__all__ = [
    # Status
    "BACKUP_ENABLED",
    # Config
    "BACKUP_BUCKET",
    "BACKUP_PREFIX",
    "BACKUP_SCHEDULES",
    "RETENTION_POLICIES",
    "TABLES_TO_BACKUP",
    "CRITICAL_TABLES",
    # Manager
    "BackupManager",
    "run_scheduled_backup",
    # Scheduler
    "BackupSchedulerService",
    "backup_service",
    "setup_backup_scheduler",
]







