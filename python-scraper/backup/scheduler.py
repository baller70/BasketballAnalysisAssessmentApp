"""
Backup Scheduler
Runs automated backups on a schedule using APScheduler
"""

import os
import sys
from pathlib import Path
from datetime import datetime

sys.path.append(str(Path(__file__).parent.parent))

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from loguru import logger

from backup.backup_manager import BackupManager, run_scheduled_backup
from backup.backup_config import BACKUP_SCHEDULES


def setup_backup_scheduler() -> BackgroundScheduler:
    """
    Set up automated backup scheduler
    
    Schedule:
    - Full backup: Daily at 2 AM
    - Critical backup: Every 6 hours
    - Cleanup: Weekly on Sunday at 4 AM
    """
    scheduler = BackgroundScheduler()
    
    # Full database backup - daily at 2 AM
    scheduler.add_job(
        func=lambda: run_scheduled_backup("full"),
        trigger=CronTrigger(hour=2, minute=0),
        id='full_backup',
        name='Full Database Backup',
        replace_existing=True
    )
    logger.info("Scheduled: Full backup daily at 2:00 AM")
    
    # Critical tables backup - every 6 hours
    scheduler.add_job(
        func=lambda: run_scheduled_backup("critical"),
        trigger=CronTrigger(hour='*/6', minute=0),
        id='critical_backup',
        name='Critical Tables Backup',
        replace_existing=True
    )
    logger.info("Scheduled: Critical backup every 6 hours")
    
    # Cleanup old backups - weekly on Sunday at 4 AM
    scheduler.add_job(
        func=lambda: BackupManager().cleanup_old_backups(retention_days=30),
        trigger=CronTrigger(day_of_week='sun', hour=4, minute=0),
        id='cleanup_backups',
        name='Cleanup Old Backups',
        replace_existing=True
    )
    logger.info("Scheduled: Cleanup weekly on Sunday at 4:00 AM")
    
    return scheduler


def get_next_run_times(scheduler: BackgroundScheduler) -> dict:
    """
    Get next scheduled run times for all jobs
    """
    jobs = {}
    for job in scheduler.get_jobs():
        jobs[job.id] = {
            "name": job.name,
            "next_run": job.next_run_time.isoformat() if job.next_run_time else None
        }
    return jobs


class BackupSchedulerService:
    """
    Service class for managing backup scheduler
    Can be integrated with Flask app
    """
    
    def __init__(self):
        self.scheduler = None
        self.is_running = False
    
    def start(self):
        """Start the backup scheduler"""
        if self.is_running:
            logger.warning("Scheduler already running")
            return
        
        self.scheduler = setup_backup_scheduler()
        self.scheduler.start()
        self.is_running = True
        logger.info("Backup scheduler started")
    
    def stop(self):
        """Stop the backup scheduler"""
        if self.scheduler and self.is_running:
            self.scheduler.shutdown()
            self.is_running = False
            logger.info("Backup scheduler stopped")
    
    def get_status(self) -> dict:
        """Get scheduler status"""
        if not self.scheduler:
            return {"running": False, "jobs": []}
        
        return {
            "running": self.is_running,
            "jobs": get_next_run_times(self.scheduler)
        }
    
    def trigger_backup(self, backup_type: str = "full") -> dict:
        """Manually trigger a backup"""
        logger.info(f"Manual backup triggered: {backup_type}")
        return run_scheduled_backup(backup_type)
    
    def pause_job(self, job_id: str):
        """Pause a specific backup job"""
        if self.scheduler:
            self.scheduler.pause_job(job_id)
            logger.info(f"Paused job: {job_id}")
    
    def resume_job(self, job_id: str):
        """Resume a paused backup job"""
        if self.scheduler:
            self.scheduler.resume_job(job_id)
            logger.info(f"Resumed job: {job_id}")


# Global instance for Flask integration
backup_service = BackupSchedulerService()


if __name__ == "__main__":
    logger.add("backup_scheduler.log", rotation="10 MB")
    
    print("Starting backup scheduler...")
    print("Press Ctrl+C to exit")
    
    scheduler = setup_backup_scheduler()
    scheduler.start()
    
    # Print next run times
    print("\nScheduled jobs:")
    for job in scheduler.get_jobs():
        print(f"  - {job.name}: Next run at {job.next_run_time}")
    
    try:
        # Keep running
        while True:
            import time
            time.sleep(60)
    except KeyboardInterrupt:
        print("\nShutting down scheduler...")
        scheduler.shutdown()







