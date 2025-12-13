"""
Database Operations for Shooter Images
Handles inserting and managing images in the shooter_images table
"""

import os
from sqlalchemy import text
from loguru import logger
from typing import List, Dict, Optional
from database import get_db_session, engine


def insert_shooter_image(
    shooter_id: int,
    image_url: str,
    s3_path: str,
    image_category: str = "form_front",
    capture_phase: str = None,
    shooting_angle: str = "front",
    image_resolution: str = None,
    is_primary: bool = False
) -> Optional[int]:
    """
    Insert a single image record into shooter_images table
    
    Returns:
        image_id if successful, None if failed
    """
    session = get_db_session()
    
    try:
        query = text("""
            INSERT INTO shooter_images (
                shooter_id, image_category, image_url, s3_path,
                image_resolution, capture_phase, shooting_angle, is_primary
            ) VALUES (
                :shooter_id, :image_category, :image_url, :s3_path,
                :image_resolution, :capture_phase, :shooting_angle, :is_primary
            )
            RETURNING image_id
        """)
        
        result = session.execute(query, {
            "shooter_id": shooter_id,
            "image_category": image_category,
            "image_url": image_url,
            "s3_path": s3_path,
            "image_resolution": image_resolution,
            "capture_phase": capture_phase,
            "shooting_angle": shooting_angle,
            "is_primary": is_primary,
        })
        
        image_id = result.fetchone()[0]
        session.commit()
        
        logger.info(f"Inserted image {image_id} for shooter {shooter_id}")
        return image_id
        
    except Exception as e:
        session.rollback()
        logger.error(f"Error inserting image: {e}")
        return None
    finally:
        session.close()


def insert_shooter_images_bulk(
    shooter_id: int,
    images: List[Dict]
) -> List[int]:
    """
    Bulk insert images for a shooter
    
    Args:
        shooter_id: The shooter's database ID
        images: List of image dicts with s3_url, s3_key, category, angle, phase, is_primary
        
    Returns:
        List of inserted image_ids
    """
    session = get_db_session()
    image_ids = []
    
    try:
        for img in images:
            query = text("""
                INSERT INTO shooter_images (
                    shooter_id, image_category, image_url, s3_path,
                    capture_phase, shooting_angle, is_primary
                ) VALUES (
                    :shooter_id, :image_category, :image_url, :s3_path,
                    :capture_phase, :shooting_angle, :is_primary
                )
                RETURNING image_id
            """)
            
            result = session.execute(query, {
                "shooter_id": shooter_id,
                "image_category": img.get("category", "form_front"),
                "image_url": img.get("s3_url") or img.get("image_url"),
                "s3_path": img.get("s3_key") or img.get("s3_path"),
                "capture_phase": img.get("phase"),
                "shooting_angle": img.get("angle", "front"),
                "is_primary": img.get("is_primary", False),
            })
            
            image_id = result.fetchone()[0]
            image_ids.append(image_id)
        
        session.commit()
        logger.info(f"Inserted {len(image_ids)} images for shooter {shooter_id}")
        return image_ids
        
    except Exception as e:
        session.rollback()
        logger.error(f"Error in bulk image insert: {e}")
        return []
    finally:
        session.close()


def get_shooter_images(shooter_id: int) -> List[Dict]:
    """
    Get all images for a shooter
    """
    session = get_db_session()
    
    try:
        query = text("""
            SELECT * FROM shooter_images 
            WHERE shooter_id = :shooter_id
            ORDER BY is_primary DESC, created_at DESC
        """)
        
        result = session.execute(query, {"shooter_id": shooter_id})
        return [dict(row._mapping) for row in result.fetchall()]
        
    finally:
        session.close()


def get_primary_image(shooter_id: int) -> Optional[Dict]:
    """
    Get the primary image for a shooter
    """
    session = get_db_session()
    
    try:
        query = text("""
            SELECT * FROM shooter_images 
            WHERE shooter_id = :shooter_id AND is_primary = TRUE
            LIMIT 1
        """)
        
        result = session.execute(query, {"shooter_id": shooter_id})
        row = result.fetchone()
        
        if row:
            return dict(row._mapping)
        return None
        
    finally:
        session.close()


def set_primary_image(shooter_id: int, image_id: int) -> bool:
    """
    Set an image as the primary image for a shooter
    (Unsets any existing primary image)
    """
    session = get_db_session()
    
    try:
        # Unset existing primary
        session.execute(
            text("UPDATE shooter_images SET is_primary = FALSE WHERE shooter_id = :shooter_id"),
            {"shooter_id": shooter_id}
        )
        
        # Set new primary
        session.execute(
            text("UPDATE shooter_images SET is_primary = TRUE WHERE image_id = :image_id"),
            {"image_id": image_id}
        )
        
        session.commit()
        logger.info(f"Set image {image_id} as primary for shooter {shooter_id}")
        return True
        
    except Exception as e:
        session.rollback()
        logger.error(f"Error setting primary image: {e}")
        return False
    finally:
        session.close()


def delete_shooter_image(image_id: int) -> bool:
    """
    Delete an image record from the database
    (Does not delete from S3 - call storage.delete_from_s3 separately)
    """
    session = get_db_session()
    
    try:
        query = text("DELETE FROM shooter_images WHERE image_id = :image_id")
        session.execute(query, {"image_id": image_id})
        session.commit()
        
        logger.info(f"Deleted image {image_id}")
        return True
        
    except Exception as e:
        session.rollback()
        logger.error(f"Error deleting image: {e}")
        return False
    finally:
        session.close()


def get_images_by_category(
    shooter_id: int,
    category: str
) -> List[Dict]:
    """
    Get images for a shooter filtered by category
    
    Categories: form_front, form_side, release_point, follow_through
    """
    session = get_db_session()
    
    try:
        query = text("""
            SELECT * FROM shooter_images 
            WHERE shooter_id = :shooter_id AND image_category = :category
            ORDER BY created_at DESC
        """)
        
        result = session.execute(query, {
            "shooter_id": shooter_id,
            "category": category,
        })
        return [dict(row._mapping) for row in result.fetchall()]
        
    finally:
        session.close()


def get_images_by_angle(
    shooter_id: int,
    angle: str
) -> List[Dict]:
    """
    Get images for a shooter filtered by shooting angle
    
    Angles: front, side, 45_degree
    """
    session = get_db_session()
    
    try:
        query = text("""
            SELECT * FROM shooter_images 
            WHERE shooter_id = :shooter_id AND shooting_angle = :angle
            ORDER BY created_at DESC
        """)
        
        result = session.execute(query, {
            "shooter_id": shooter_id,
            "angle": angle,
        })
        return [dict(row._mapping) for row in result.fetchall()]
        
    finally:
        session.close()


def update_shooter_profile_image(shooter_id: int, image_url: str) -> bool:
    """
    Update the profile_image_url in the shooters table
    """
    session = get_db_session()
    
    try:
        query = text("""
            UPDATE shooters 
            SET profile_image_url = :image_url, updated_at = NOW()
            WHERE shooter_id = :shooter_id
        """)
        
        session.execute(query, {
            "shooter_id": shooter_id,
            "image_url": image_url,
        })
        
        session.commit()
        logger.info(f"Updated profile image for shooter {shooter_id}")
        return True
        
    except Exception as e:
        session.rollback()
        logger.error(f"Error updating profile image: {e}")
        return False
    finally:
        session.close()


def update_shooter_images_in_db(
    shooter_id: int,
    image_urls: List[tuple]
) -> List[int]:
    """
    Insert image URLs into shooter_images table
    
    Args:
        shooter_id: The shooter's database ID
        image_urls: List of tuples (url, category, phase, s3_path)
                   - url: S3 URL of the image
                   - category: 'form_front', 'form_side', 'release_point', 'follow_through'
                   - phase: 'setup', 'dip', 'release', 'follow-through'
                   - s3_path: S3 key/path
    
    Returns:
        List of inserted image_ids
        
    Example:
        image_urls = [
            ("https://s3.../release.jpg", "form_front", "release", "professional-shooters/nba/curry/front-angle/release.jpg"),
            ("https://s3.../setup.jpg", "form_front", "setup", "professional-shooters/nba/curry/front-angle/setup.jpg"),
        ]
        ids = update_shooter_images_in_db(123, image_urls)
    """
    session = get_db_session()
    image_ids = []
    
    try:
        for item in image_urls:
            # Handle both 3-tuple and 4-tuple formats
            if len(item) == 4:
                url, category, phase, s3_path = item
            elif len(item) == 3:
                url, category, phase = item
                s3_path = url.replace(f"https://{os.getenv('S3_BUCKET_NAME', 'basketball-shooters-db')}.s3.{os.getenv('AWS_REGION', 'us-east-1')}.amazonaws.com/", "")
            else:
                logger.warning(f"Invalid image tuple: {item}")
                continue
            
            # Determine shooting angle from category
            if "front" in category.lower():
                shooting_angle = "front"
            elif "side" in category.lower():
                shooting_angle = "side"
            elif "45" in category.lower():
                shooting_angle = "45-degree"
            else:
                shooting_angle = "front"
            
            # Release phase is primary
            is_primary = phase == "release"
            
            query = text("""
                INSERT INTO shooter_images 
                (shooter_id, image_category, image_url, s3_path, capture_phase, shooting_angle, is_primary)
                VALUES (:shooter_id, :category, :url, :s3_path, :phase, :shooting_angle, :is_primary)
                RETURNING image_id
            """)
            
            result = session.execute(query, {
                "shooter_id": shooter_id,
                "category": category,
                "url": url,
                "s3_path": s3_path,
                "phase": phase,
                "shooting_angle": shooting_angle,
                "is_primary": is_primary,
            })
            
            image_id = result.fetchone()[0]
            image_ids.append(image_id)
        
        session.commit()
        logger.info(f"Inserted {len(image_ids)} images for shooter {shooter_id}")
        return image_ids
        
    except Exception as e:
        session.rollback()
        logger.error(f"Error inserting images: {e}")
        return []
    finally:
        session.close()


def update_shooter_all_angles(
    shooter_id: int,
    uploaded_images: Dict[str, Dict[str, str]]
) -> int:
    """
    Update database with all angle/phase images for a shooter
    
    Args:
        shooter_id: The shooter's database ID
        uploaded_images: Dict from upload_shooter_phase_images()
                        { "front-angle": { "setup": "url", "release": "url", ... }, ... }
    
    Returns:
        Number of images inserted
        
    Example:
        uploaded = {
            "front-angle": {
                "setup": "https://s3.../setup.jpg",
                "dip": "https://s3.../dip.jpg",
                "release": "https://s3.../release.jpg",
                "follow-through": "https://s3.../follow-through.jpg"
            },
            "side-angle": { ... }
        }
        count = update_shooter_all_angles(123, uploaded)
    """
    image_urls = []
    
    for angle, phases in uploaded_images.items():
        # Map angle to category
        if "front" in angle:
            category = "form_front"
        elif "side" in angle:
            category = "form_side"
        else:
            category = "form_45"
        
        for phase, url in phases.items():
            # Extract s3_path from URL
            s3_path = url.split(".amazonaws.com/")[-1] if ".amazonaws.com/" in url else url
            image_urls.append((url, category, phase, s3_path))
    
    return len(update_shooter_images_in_db(shooter_id, image_urls))


def count_shooter_images(shooter_id: int) -> int:
    """
    Count total images for a shooter
    """
    session = get_db_session()
    
    try:
        query = text("SELECT COUNT(*) FROM shooter_images WHERE shooter_id = :shooter_id")
        result = session.execute(query, {"shooter_id": shooter_id})
        return result.fetchone()[0]
    finally:
        session.close()


def get_shooters_without_images() -> List[Dict]:
    """
    Get list of shooters that have no images
    (Useful for identifying who needs image scraping)
    """
    session = get_db_session()
    
    try:
        query = text("""
            SELECT s.* FROM shooters s
            LEFT JOIN shooter_images si ON s.shooter_id = si.shooter_id
            WHERE si.image_id IS NULL
        """)
        
        result = session.execute(query)
        return [dict(row._mapping) for row in result.fetchall()]
        
    finally:
        session.close()


