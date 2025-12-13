"""
Flask API for Scraping Service
Exposes endpoints for triggering scrapes and webhooks
Deploy to Render/Railway
"""

import os
from flask import Flask, request, jsonify
from loguru import logger
from datetime import datetime

from main import run_nba_only, run_historical_only, run_full_scrape, run_image_pipeline
from database import test_connection, get_all_shooters, get_shooter_by_name
from database_images import get_shooter_images, get_shooters_without_images
from backup import BACKUP_ENABLED, backup_service, BackupManager
try:
    from backup.backup_manager import backup_database, verify_backup
except ImportError:
    backup_database = None
    verify_backup = None

app = Flask(__name__)

# API Key for authentication
API_KEY = os.getenv("API_SECRET_KEY", "")


def require_api_key(f):
    """
    Decorator to require API key authentication
    """
    def decorated(*args, **kwargs):
        api_key = request.headers.get("X-API-Key") or request.args.get("api_key")
        
        if API_KEY and api_key != API_KEY:
            return jsonify({"error": "Unauthorized"}), 401
        
        return f(*args, **kwargs)
    
    decorated.__name__ = f.__name__
    return decorated


def require_backup_enabled(f):
    """
    Decorator to check if backup is enabled
    """
    def decorated(*args, **kwargs):
        if not BACKUP_ENABLED:
            return jsonify({
                "error": "Backup not configured",
                "message": "S3 credentials required for backup operations",
                "hint": "Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and BACKUP_BUCKET"
            }), 503
        
        return f(*args, **kwargs)
    
    decorated.__name__ = f.__name__
    return decorated


@app.route("/")
def home():
    """
    Health check endpoint
    """
    return jsonify({
        "service": "Basketball Shooter Scraper",
        "status": "running",
        "timestamp": datetime.now().isoformat(),
    })


@app.route("/health")
def health():
    """
    Detailed health check
    Gracefully handles missing DATABASE_URL
    """
    from storage import S3_ENABLED
    
    # Check if DATABASE_URL is configured
    db_configured = os.getenv("DATABASE_URL") is not None
    
    # Only test connection if database is configured
    db_connected = False
    db_error = None
    if db_configured:
        try:
            db_connected = test_connection()
        except Exception as e:
            db_error = str(e)
            logger.warning(f"Database connection check failed: {e}")
    
    return jsonify({
        "status": "healthy",  # Always healthy if app starts successfully
        "service": "Basketball Shooter Scraper",
        "database": {
            "configured": db_configured,
            "connected": db_connected if db_configured else None,
            "error": db_error if db_error else None,
            "note": "Database required for scraping operations" if not db_configured else "Database ready"
        },
        "s3_storage": {
            "enabled": S3_ENABLED,
            "note": "Image uploads will be skipped" if not S3_ENABLED else "Image uploads enabled"
        },
        "backup_service": {
            "enabled": BACKUP_ENABLED,
            "note": "Database backups disabled" if not BACKUP_ENABLED else "Automatic backups enabled"
        },
        "timestamp": datetime.now().isoformat()
    })


@app.route("/api/scrape/nba", methods=["POST"])
@require_api_key
def scrape_nba():
    """
    Trigger NBA scraping
    """
    try:
        limit = request.json.get("limit", 100) if request.json else 100
        
        logger.info(f"Starting NBA scrape with limit={limit}")
        df = run_nba_only(limit)
        
        return jsonify({
            "success": True,
            "message": f"Scraped {len(df)} NBA players",
            "count": len(df),
        })
    except Exception as e:
        logger.error(f"NBA scrape failed: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@app.route("/api/scrape/historical", methods=["POST"])
@require_api_key
def scrape_historical():
    """
    Trigger historical scraping
    """
    try:
        limit = request.json.get("limit", 50) if request.json else 50
        
        logger.info(f"Starting historical scrape with limit={limit}")
        df = run_historical_only(limit)
        
        return jsonify({
            "success": True,
            "message": f"Scraped {len(df)} historical players",
            "count": len(df),
        })
    except Exception as e:
        logger.error(f"Historical scrape failed: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@app.route("/api/scrape/full", methods=["POST"])
@require_api_key
def scrape_full():
    """
    Trigger full scraping pipeline
    """
    try:
        logger.info("Starting full scrape pipeline")
        success = run_full_scrape()
        
        return jsonify({
            "success": success,
            "message": "Full scrape completed" if success else "Scrape completed with errors",
        })
    except Exception as e:
        logger.error(f"Full scrape failed: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@app.route("/api/shooters", methods=["GET"])
def list_shooters():
    """
    List all shooters
    """
    try:
        limit = request.args.get("limit", 100, type=int)
        offset = request.args.get("offset", 0, type=int)
        
        shooters = get_all_shooters(limit, offset)
        
        return jsonify({
            "success": True,
            "count": len(shooters),
            "shooters": shooters,
        })
    except Exception as e:
        logger.error(f"Error fetching shooters: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@app.route("/api/shooters/<name>", methods=["GET"])
def get_shooter(name: str):
    """
    Get a specific shooter by name
    """
    try:
        shooter = get_shooter_by_name(name)
        
        if shooter:
            return jsonify({
                "success": True,
                "shooter": shooter,
            })
        else:
            return jsonify({
                "success": False,
                "error": "Shooter not found",
            }), 404
    except Exception as e:
        logger.error(f"Error fetching shooter: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@app.route("/api/scrape/images", methods=["POST"])
@require_api_key
def scrape_images():
    """
    Trigger image download pipeline
    """
    try:
        limit = request.json.get("limit", 50) if request.json else 50
        
        logger.info(f"Starting image pipeline with limit={limit}")
        success = run_image_pipeline(limit)
        
        return jsonify({
            "success": success,
            "message": "Image pipeline completed" if success else "Image pipeline failed",
        })
    except Exception as e:
        logger.error(f"Image pipeline failed: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@app.route("/api/shooters/<int:shooter_id>/images", methods=["GET"])
def get_shooter_images_route(shooter_id: int):
    """
    Get all images for a shooter
    """
    try:
        images = get_shooter_images(shooter_id)
        
        return jsonify({
            "success": True,
            "count": len(images),
            "images": images,
        })
    except Exception as e:
        logger.error(f"Error fetching images: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@app.route("/api/shooters/without-images", methods=["GET"])
def get_shooters_needing_images():
    """
    Get shooters that don't have any images
    """
    try:
        shooters = get_shooters_without_images()
        
        return jsonify({
            "success": True,
            "count": len(shooters),
            "shooters": shooters,
        })
    except Exception as e:
        logger.error(f"Error fetching shooters: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@app.route("/webhook/nextjs", methods=["POST"])
@require_api_key
def nextjs_webhook():
    """
    Webhook endpoint for Next.js to trigger scrapes
    """
    try:
        data = request.json or {}
        action = data.get("action", "")
        
        if action == "scrape_nba":
            df = run_nba_only(data.get("limit", 100))
            return jsonify({"success": True, "count": len(df)})
        
        elif action == "scrape_historical":
            df = run_historical_only(data.get("limit", 50))
            return jsonify({"success": True, "count": len(df)})
        
        elif action == "scrape_full":
            success = run_full_scrape()
            return jsonify({"success": success})
        
        else:
            return jsonify({"error": "Unknown action"}), 400
    
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


# ==========================================
# BACKUP API ENDPOINTS
# ==========================================

@app.route("/api/backup/daily", methods=["POST"])
@require_api_key
@require_backup_enabled
def backup_daily():
    """
    Simple daily backup - single SQL file to S3
    """
    try:
        logger.info("Daily backup triggered")
        result = backup_database()
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Daily backup failed: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@app.route("/api/backup/full", methods=["POST"])
@require_api_key
@require_backup_enabled
def backup_full():
    """
    Trigger full database backup
    """
    try:
        logger.info("Manual full backup triggered")
        result = backup_service.trigger_backup("full")
        
        return jsonify({
            "success": result.get("success", False),
            "type": "full",
            "files": result.get("files", []),
            "errors": result.get("errors", []),
            "timestamp": result.get("timestamp"),
        })
    except Exception as e:
        logger.error(f"Backup failed: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@app.route("/api/backup/critical", methods=["POST"])
@require_api_key
@require_backup_enabled
def backup_critical():
    """
    Backup critical tables only (shooters, images)
    """
    try:
        logger.info("Manual critical backup triggered")
        result = backup_service.trigger_backup("critical")
        
        return jsonify({
            "success": result.get("success", False),
            "type": "critical",
            "files": result.get("files", []),
            "timestamp": result.get("timestamp"),
        })
    except Exception as e:
        logger.error(f"Critical backup failed: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@app.route("/api/backup/list", methods=["GET"])
@require_api_key
@require_backup_enabled
def list_backups():
    """
    List available backups
    """
    try:
        backup_type = request.args.get("type", "full")
        manager = BackupManager()
        backups = manager.list_backups(backup_type)
        
        return jsonify({
            "success": True,
            "type": backup_type,
            "count": len(backups),
            "backups": backups,
        })
    except Exception as e:
        logger.error(f"Failed to list backups: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@app.route("/api/backup/restore", methods=["POST"])
@require_api_key
@require_backup_enabled
def restore_backup():
    """
    Restore from a backup
    """
    try:
        data = request.json or {}
        backup_key = data.get("backup_key")
        
        if not backup_key:
            return jsonify({
                "success": False,
                "error": "backup_key is required",
            }), 400
        
        logger.info(f"Restoring from backup: {backup_key}")
        manager = BackupManager()
        success = manager.restore_backup(backup_key)
        
        return jsonify({
            "success": success,
            "message": "Restore completed" if success else "Restore failed",
            "backup_key": backup_key,
        })
    except Exception as e:
        logger.error(f"Restore failed: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@app.route("/api/backup/verify", methods=["POST"])
@require_api_key
@require_backup_enabled
def verify_backup_endpoint():
    """
    Verify backup integrity
    - Test restore to temporary database
    - Check row counts match
    - Verify no corruption
    """
    try:
        data = request.json or {}
        backup_file = data.get("backup_file")
        
        if not backup_file:
            return jsonify({
                "success": False,
                "error": "backup_file is required",
            }), 400
        
        logger.info(f"Verifying backup: {backup_file}")
        result = verify_backup(backup_file)
        
        return jsonify({
            "success": result.get("verified", False),
            **result
        })
    except Exception as e:
        logger.error(f"Verification failed: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@app.route("/api/backup/cleanup", methods=["POST"])
@require_api_key
@require_backup_enabled
def cleanup_backups():
    """
    Remove old backups
    """
    try:
        data = request.json or {}
        retention_days = data.get("retention_days", 30)
        
        logger.info(f"Cleaning up backups older than {retention_days} days")
        manager = BackupManager()
        deleted = manager.cleanup_old_backups(retention_days)
        
        return jsonify({
            "success": True,
            "deleted_count": deleted,
            "retention_days": retention_days,
        })
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@app.route("/api/backup/scheduler/status", methods=["GET"])
@require_api_key
@require_backup_enabled
def backup_scheduler_status():
    """
    Get backup scheduler status
    """
    return jsonify(backup_service.get_status())


@app.route("/api/backup/scheduler/start", methods=["POST"])
@require_api_key
@require_backup_enabled
def start_backup_scheduler():
    """
    Start the backup scheduler
    """
    try:
        backup_service.start()
        return jsonify({
            "success": True,
            "message": "Backup scheduler started",
            "status": backup_service.get_status(),
        })
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@app.route("/api/backup/scheduler/stop", methods=["POST"])
@require_api_key
@require_backup_enabled
def stop_backup_scheduler():
    """
    Stop the backup scheduler
    """
    try:
        backup_service.stop()
        return jsonify({
            "success": True,
            "message": "Backup scheduler stopped",
        })
    except Exception as e:
        logger.error(f"Failed to stop scheduler: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=os.getenv("DEBUG", "false").lower() == "true")


