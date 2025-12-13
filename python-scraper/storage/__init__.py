"""
Storage module for S3 operations
"""

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

__all__ = [
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


