"""
S3 Image Uploader
Uploads downloaded images to AWS S3 / Abacus AI Cloud Storage
"""

import os
import boto3
from botocore.exceptions import ClientError
from pathlib import Path
from typing import Optional, List, Dict
from loguru import logger
from datetime import datetime
import mimetypes
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import DATABASE_URL

# S3 Configuration
S3_BUCKET = os.getenv("S3_BUCKET_NAME", "basketball-shooters-db")
S3_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")

# Initialize S3 client
s3_client = None

def get_s3_client():
    """
    Get or create S3 client
    """
    global s3_client
    
    if s3_client is None:
        if AWS_ACCESS_KEY and AWS_SECRET_KEY:
            s3_client = boto3.client(
                's3',
                region_name=S3_REGION,
                aws_access_key_id=AWS_ACCESS_KEY,
                aws_secret_access_key=AWS_SECRET_KEY
            )
        else:
            # Use default credentials (IAM role, env vars, etc.)
            s3_client = boto3.client('s3', region_name=S3_REGION)
    
    return s3_client


def upload_file_to_s3(
    local_path: Path,
    s3_key: str,
    content_type: Optional[str] = None,
    metadata: Optional[Dict] = None
) -> Optional[str]:
    """
    Upload a file to S3
    
    Args:
        local_path: Path to local file
        s3_key: S3 object key (path in bucket)
        content_type: MIME type (auto-detected if not provided)
        metadata: Additional metadata to store with object
        
    Returns:
        S3 URL if successful, None if failed
    """
    try:
        client = get_s3_client()
        
        # Auto-detect content type
        if not content_type:
            content_type, _ = mimetypes.guess_type(str(local_path))
            content_type = content_type or 'application/octet-stream'
        
        # Prepare extra args
        extra_args = {
            'ContentType': content_type,
        }
        
        if metadata:
            extra_args['Metadata'] = {k: str(v) for k, v in metadata.items()}
        
        # Upload file
        client.upload_file(
            str(local_path),
            S3_BUCKET,
            s3_key,
            ExtraArgs=extra_args
        )
        
        # Generate URL
        s3_url = f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{s3_key}"
        
        logger.info(f"Uploaded to S3: {s3_key}")
        return s3_url
        
    except ClientError as e:
        logger.error(f"S3 upload error: {e}")
        return None
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return None


def generate_s3_key(
    player_name: str,
    skill_level: str = "professional",
    league: str = "nba",
    angle: str = "front",
    phase: str = None,
    filename: str = None
) -> str:
    """
    Generate S3 key following the exact folder structure
    
    Structure: professional-shooters/nba/stephen-curry/front-angle/release.jpg
    
    Args:
        player_name: Player name (e.g., "Stephen Curry")
        skill_level: "professional" or "amateur"
        league: "nba", "wnba", "college", etc.
        angle: "front", "side", or "45-degree"
        phase: "setup", "dip", "release", or "follow-through"
        filename: Optional custom filename (defaults to phase.jpg)
    """
    import re
    
    # Sanitize player name (stephen-curry)
    safe_name = re.sub(r'[^\w\s-]', '', player_name).strip().lower().replace(' ', '-')
    
    # Map skill level to folder
    if skill_level.lower() in ['professional', 'pro']:
        base_folder = "professional-shooters"
    else:
        base_folder = "amateur-shooters"
    
    # Format angle folder name (front-angle, side-angle, 45-degree)
    angle_folder = f"{angle}-angle" if angle in ["front", "side"] else angle
    
    # Generate filename (default: phase.jpg or timestamped)
    if not filename:
        if phase:
            filename = f"{phase}.jpg"
        else:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"image_{timestamp}.jpg"
    
    # Build S3 key: professional-shooters/nba/stephen-curry/front-angle/release.jpg
    s3_key = f"{base_folder}/{league.lower()}/{safe_name}/{angle_folder}/{filename}"
    
    return s3_key


def upload_player_images(
    player_name: str,
    local_images: List[Dict],
    skill_level: str = "professional",
    league: str = "nba",
    shooter_id: Optional[int] = None
) -> List[Dict]:
    """
    Upload all images for a player to S3
    
    Args:
        player_name: Player name
        local_images: List of image dicts from image_scraper
        skill_level: Professional/Amateur/College
        league: nba/wnba/college
        shooter_id: Database shooter_id for metadata
        
    Returns:
        List of uploaded image info with S3 URLs
    """
    uploaded = []
    
    for img_info in local_images:
        local_path = Path(img_info.get('local_path', ''))
        
        if not local_path.exists():
            logger.warning(f"Local file not found: {local_path}")
            continue
        
        # Generate S3 key
        angle = img_info.get('angle', 'front')
        s3_key = generate_s3_key(
            player_name=player_name,
            skill_level=skill_level,
            league=league,
            angle=angle,
            filename=local_path.name
        )
        
        # Prepare metadata
        metadata = {
            'player_name': player_name,
            'category': img_info.get('category', ''),
            'angle': angle,
            'phase': img_info.get('phase', ''),
            'source_url': img_info.get('source_url', ''),
            'is_primary': str(img_info.get('is_primary', False)),
        }
        
        if shooter_id:
            metadata['shooter_id'] = str(shooter_id)
        
        # Upload to S3
        s3_url = upload_file_to_s3(local_path, s3_key, metadata=metadata)
        
        if s3_url:
            uploaded.append({
                **img_info,
                's3_key': s3_key,
                's3_url': s3_url,
                'image_url': s3_url,  # For database insertion
            })
    
    logger.info(f"Uploaded {len(uploaded)}/{len(local_images)} images for {player_name}")
    return uploaded


def batch_upload_to_s3(
    all_downloads: Dict[str, List[Dict]],
    players_info: Dict[str, Dict]
) -> Dict[str, List[Dict]]:
    """
    Batch upload all downloaded images to S3
    
    Args:
        all_downloads: Dict from batch_download_images (player_name -> images)
        players_info: Dict mapping player_name to player info (shooter_id, skill_level, league)
        
    Returns:
        Dict mapping player_name to uploaded images with S3 URLs
    """
    all_uploaded = {}
    
    for player_name, images in all_downloads.items():
        player_info = players_info.get(player_name, {})
        
        uploaded = upload_player_images(
            player_name=player_name,
            local_images=images,
            skill_level=player_info.get('skill_level', 'professional'),
            league=player_info.get('league', 'nba'),
            shooter_id=player_info.get('shooter_id'),
        )
        
        all_uploaded[player_name] = uploaded
    
    # Summary
    total_uploaded = sum(len(imgs) for imgs in all_uploaded.values())
    logger.info(f"Total uploaded to S3: {total_uploaded} images")
    
    return all_uploaded


def delete_from_s3(s3_key: str) -> bool:
    """
    Delete a file from S3
    """
    try:
        client = get_s3_client()
        client.delete_object(Bucket=S3_BUCKET, Key=s3_key)
        logger.info(f"Deleted from S3: {s3_key}")
        return True
    except Exception as e:
        logger.error(f"Delete error: {e}")
        return False


def list_player_images(player_name: str, skill_level: str = "professional", league: str = "nba") -> List[str]:
    """
    List all images for a player in S3
    """
    import re
    safe_name = re.sub(r'[^\w\s-]', '', player_name).strip().lower().replace(' ', '-')
    
    if skill_level.lower() in ['professional', 'pro']:
        prefix = f"professional-shooters/{league.lower()}/{safe_name}/"
    else:
        prefix = f"amateur-shooters/{league.lower()}/{safe_name}/"
    
    try:
        client = get_s3_client()
        response = client.list_objects_v2(Bucket=S3_BUCKET, Prefix=prefix)
        
        keys = [obj['Key'] for obj in response.get('Contents', [])]
        logger.info(f"Found {len(keys)} images for {player_name}")
        return keys
        
    except Exception as e:
        logger.error(f"List error: {e}")
        return []


def get_signed_url(s3_key: str, expires_in: int = 3600) -> Optional[str]:
    """
    Generate a signed URL for temporary access
    
    Args:
        s3_key: S3 object key
        expires_in: Seconds until URL expires (default 1 hour)
        
    Returns:
        Signed URL or None if failed
    """
    try:
        client = get_s3_client()
        url = client.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET, 'Key': s3_key},
            ExpiresIn=expires_in
        )
        return url
    except Exception as e:
        logger.error(f"Signed URL error: {e}")
        return None


def upload_to_s3(local_path: str, s3_path: str, content_type: str = "image/jpeg") -> str:
    """
    Simple upload function - uploads a file to S3
    
    Args:
        local_path: Path to local file
        s3_path: S3 key (path in bucket)
        content_type: MIME type (default: image/jpeg)
        
    Returns:
        S3 URL of uploaded file
        
    Example:
        url = upload_to_s3(
            "downloads/curry_release.jpg",
            "professional-shooters/nba/stephen-curry/front-angle/release.jpg"
        )
        # Returns: https://basketball-shooters-db.s3.us-east-1.amazonaws.com/professional-shooters/nba/stephen-curry/front-angle/release.jpg
    """
    client = get_s3_client()
    
    client.upload_file(
        local_path,
        S3_BUCKET,
        s3_path,
        ExtraArgs={'ContentType': content_type}
    )
    
    # Return S3 URL
    s3_url = f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{s3_path}"
    logger.info(f"Uploaded: {s3_path}")
    
    return s3_url


def upload_shooter_phase_images(
    player_name: str,
    league: str = "nba",
    skill_level: str = "professional",
    images_dir: str = None
) -> Dict[str, Dict[str, str]]:
    """
    Upload all phase images for a shooter (all angles)
    
    Expected local structure:
        images_dir/front-angle/setup.jpg
        images_dir/front-angle/dip.jpg
        images_dir/front-angle/release.jpg
        images_dir/front-angle/follow-through.jpg
        images_dir/side-angle/...
        images_dir/45-degree/...
    
    Returns:
        Dict of { angle: { phase: s3_url } }
    """
    import re
    from pathlib import Path
    
    safe_name = re.sub(r'[^\w\s-]', '', player_name).strip().lower().replace(' ', '-')
    
    if images_dir is None:
        images_dir = Path("downloaded_images") / "professional-shooters" / league / safe_name
    else:
        images_dir = Path(images_dir)
    
    if not images_dir.exists():
        logger.warning(f"Images directory not found: {images_dir}")
        return {}
    
    uploaded = {}
    angles = ["front-angle", "side-angle", "45-degree"]
    phases = ["setup", "dip", "release", "follow-through"]
    
    for angle in angles:
        angle_dir = images_dir / angle
        if not angle_dir.exists():
            continue
        
        uploaded[angle] = {}
        
        for phase in phases:
            local_file = angle_dir / f"{phase}.jpg"
            
            if local_file.exists():
                s3_path = generate_s3_key(
                    player_name=player_name,
                    skill_level=skill_level,
                    league=league,
                    angle=angle.replace("-angle", ""),
                    phase=phase
                )
                
                try:
                    s3_url = upload_to_s3(str(local_file), s3_path)
                    uploaded[angle][phase] = s3_url
                except Exception as e:
                    logger.error(f"Failed to upload {local_file}: {e}")
    
    # Summary
    total = sum(len(phases) for phases in uploaded.values())
    logger.info(f"Uploaded {total} images for {player_name}")
    
    return uploaded


if __name__ == "__main__":
    # Test S3 upload
    logger.add("s3_uploader.log", rotation="10 MB")
    
    # Check if credentials are configured
    if not AWS_ACCESS_KEY or not AWS_SECRET_KEY:
        print("⚠️  AWS credentials not configured")
        print("Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables")
    else:
        print(f"✅ S3 Bucket: {S3_BUCKET}")
        print(f"✅ Region: {S3_REGION}")
        
        # List existing files (test connection)
        try:
            client = get_s3_client()
            response = client.list_objects_v2(Bucket=S3_BUCKET, MaxKeys=5)
            print(f"✅ Connection successful. Found {response.get('KeyCount', 0)} objects.")
        except Exception as e:
            print(f"❌ Connection failed: {e}")


