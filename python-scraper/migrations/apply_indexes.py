"""
Apply Database Indexes for Fast Retrieval
Run this after creating tables to add performance indexes
"""

import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import text
from loguru import logger
from database import get_db_session


# Index definitions
INDEXES = {
    # ==========================================
    # SHOOTERS TABLE
    # ==========================================
    "shooters": [
        ("idx_shooter_name", "name"),
        ("idx_skill_level", "skill_level"),
        ("idx_shooting_style", "shooting_style"),
        ("idx_position", "position"),
        ("idx_era", "era"),
        ("idx_3pt_percentage", "career_3pt_percentage DESC"),
        ("idx_fg_percentage", "career_fg_percentage DESC"),
        ("idx_ft_percentage", "career_ft_percentage DESC"),
        ("idx_height", "height_inches"),
        ("idx_body_type", "body_type"),
        ("idx_dominant_hand", "dominant_hand"),
        # Composite indexes
        ("idx_skill_position", "skill_level, position"),
        ("idx_skill_style", "skill_level, shooting_style"),
        ("idx_era_skill", "era, skill_level"),
    ],
    
    # ==========================================
    # SHOOTER_IMAGES TABLE
    # ==========================================
    "shooter_images": [
        ("idx_images_shooter_id", "shooter_id"),
        ("idx_image_category", "image_category"),
        ("idx_capture_phase", "capture_phase"),
        ("idx_shooting_angle", "shooting_angle"),
        # Composite indexes
        ("idx_shooter_phase", "shooter_id, capture_phase"),
        ("idx_shooter_angle", "shooter_id, shooting_angle"),
        ("idx_shooter_category", "shooter_id, image_category"),
        ("idx_shooter_primary", "shooter_id, is_primary"),
    ],
    
    # ==========================================
    # SHOOTING_BIOMECHANICS TABLE
    # ==========================================
    "shooting_biomechanics": [
        ("idx_biomech_shooter_id", "shooter_id"),
        ("idx_elbow_angle", "elbow_angle"),
        ("idx_knee_angle", "knee_angle"),
        ("idx_release_angle", "release_angle"),
        ("idx_shoulder_angle", "shoulder_angle"),
        ("idx_release_height", "release_height"),
        ("idx_balance_score", "balance_score"),
        # Composite indexes
        ("idx_elbow_knee", "elbow_angle, knee_angle"),
        ("idx_release_metrics", "release_angle, release_height"),
    ],
    
    # ==========================================
    # SHOOTING_STATS TABLE
    # ==========================================
    "shooting_stats": [
        ("idx_stats_shooter_id", "shooter_id"),
        ("idx_season", "season"),
        ("idx_shooter_season", "shooter_id, season"),
    ],
    
    # ==========================================
    # OTHER TABLES
    # ==========================================
    "shooting_strengths": [
        ("idx_strengths_shooter_id", "shooter_id"),
        ("idx_strength_category", "strength_category"),
    ],
    "shooting_weaknesses": [
        ("idx_weaknesses_shooter_id", "shooter_id"),
        ("idx_weakness_category", "weakness_category"),
        ("idx_severity_score", "severity_score DESC"),
    ],
    "habitual_mechanics": [
        ("idx_habits_shooter_id", "shooter_id"),
        ("idx_habit_type", "habit_type"),
    ],
}


def create_index(session, table: str, index_name: str, columns: str) -> bool:
    """
    Create a single index
    """
    try:
        query = text(f"CREATE INDEX IF NOT EXISTS {index_name} ON {table}({columns})")
        session.execute(query)
        logger.info(f"✅ Created index: {index_name} on {table}({columns})")
        return True
    except Exception as e:
        logger.warning(f"⚠️ Failed to create index {index_name}: {e}")
        return False


def create_all_indexes() -> dict:
    """
    Create all defined indexes
    
    Returns:
        Dict with counts of created/failed indexes
    """
    logger.info("=" * 50)
    logger.info("Creating Database Indexes for Fast Retrieval")
    logger.info("=" * 50)
    
    session = get_db_session()
    created = 0
    failed = 0
    
    try:
        for table, indexes in INDEXES.items():
            logger.info(f"\n--- {table.upper()} ---")
            
            for index_name, columns in indexes:
                if create_index(session, table, index_name, columns):
                    created += 1
                else:
                    failed += 1
        
        session.commit()
        
        # Analyze tables to update statistics
        logger.info("\n--- ANALYZING TABLES ---")
        for table in INDEXES.keys():
            try:
                session.execute(text(f"ANALYZE {table}"))
                logger.info(f"✅ Analyzed: {table}")
            except Exception as e:
                logger.warning(f"⚠️ Failed to analyze {table}: {e}")
        
        session.commit()
        
    except Exception as e:
        session.rollback()
        logger.error(f"Error creating indexes: {e}")
    finally:
        session.close()
    
    logger.info("\n" + "=" * 50)
    logger.info(f"INDEX CREATION COMPLETE")
    logger.info(f"Created: {created} | Failed: {failed}")
    logger.info("=" * 50)
    
    return {"created": created, "failed": failed}


def drop_all_indexes() -> int:
    """
    Drop all custom indexes (for rebuilding)
    """
    session = get_db_session()
    dropped = 0
    
    try:
        for table, indexes in INDEXES.items():
            for index_name, _ in indexes:
                try:
                    session.execute(text(f"DROP INDEX IF EXISTS {index_name}"))
                    dropped += 1
                except:
                    pass
        
        session.commit()
        logger.info(f"Dropped {dropped} indexes")
        
    finally:
        session.close()
    
    return dropped


def list_indexes() -> list:
    """
    List all indexes in the database
    """
    session = get_db_session()
    
    try:
        query = text("""
            SELECT 
                tablename,
                indexname,
                indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
            ORDER BY tablename, indexname
        """)
        
        result = session.execute(query)
        indexes = [dict(row._mapping) for row in result.fetchall()]
        
        return indexes
        
    finally:
        session.close()


def check_index_usage() -> list:
    """
    Check which indexes are being used (PostgreSQL specific)
    """
    session = get_db_session()
    
    try:
        query = text("""
            SELECT 
                schemaname,
                relname as table_name,
                indexrelname as index_name,
                idx_scan as times_used,
                idx_tup_read as rows_read,
                idx_tup_fetch as rows_fetched
            FROM pg_stat_user_indexes
            ORDER BY idx_scan DESC
        """)
        
        result = session.execute(query)
        usage = [dict(row._mapping) for row in result.fetchall()]
        
        return usage
        
    finally:
        session.close()


if __name__ == "__main__":
    import sys
    
    logger.add("index_migration.log", rotation="10 MB")
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "create":
            create_all_indexes()
        elif command == "drop":
            drop_all_indexes()
        elif command == "list":
            indexes = list_indexes()
            print(f"\nFound {len(indexes)} indexes:\n")
            for idx in indexes:
                print(f"  {idx['tablename']}.{idx['indexname']}")
        elif command == "usage":
            usage = check_index_usage()
            print(f"\nIndex usage statistics:\n")
            for u in usage[:20]:
                print(f"  {u['index_name']}: {u['times_used']} scans")
        else:
            print("Usage: python apply_indexes.py [create|drop|list|usage]")
    else:
        # Default: create all indexes
        create_all_indexes()


