"""
Storage module for S3 operations
"""

import os
from loguru import logger

# Check if S3 is available
S3_ENABLED = bool(
    os.getenv("AWS_ACCESS_KEY_ID") and 
    os.getenv("AWS_SECRET_ACCESS_KEY") and
    os.getenv("S3_BUCKET_NAME")
)

# Try to import S3 functions (will be None if S3 is disabled)
if S3_ENABLED:
    try:
        from .s3_uploader import (
            # Simple upload
            upload_to_s3,
            upload_shooter_phase_images,
            # Advanced upload
            upload_file_to_s3,
            upload_player_images,
            batch_upload_to_s3,
            # Path generation
            generate_s3_key,
            # Management
            delete_from_s3,
            list_player_images,
            get_signed_url,
            get_s3_client,
        )
        logger.info("✅ S3 storage enabled")
    except Exception as e:
        logger.warning(f"⚠️  S3 import failed: {e}. S3 storage disabled.")
        S3_ENABLED = False
else:
    logger.info("⚠️  S3 storage disabled (AWS credentials not configured)")
    # Create stub functions that do nothing
    upload_to_s3 = None
    upload_shooter_phase_images = None
    upload_file_to_s3 = None
    upload_player_images = None
    batch_upload_to_s3 = None
    generate_s3_key = None
    delete_from_s3 = None
    list_player_images = None
    get_signed_url = None
    get_s3_client = None

__all__ = [
    # Configuration
    "S3_ENABLED",
    # Simple upload
    "upload_to_s3",
    "upload_shooter_phase_images",
    # Advanced upload
    "upload_file_to_s3",
    "upload_player_images",
    "batch_upload_to_s3",
    # Path generation
    "generate_s3_key",
    # Management
    "delete_from_s3",
    "list_player_images",
    "get_signed_url",
    "get_s3_client",
]


