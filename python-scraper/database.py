"""
Database Connection and Operations
Connects to PostgreSQL on Abacus AI

IMPORTANT: Database connection is LAZY (only created when needed)
This allows the app to start without DATABASE_URL for deployment
"""

import os
from typing import Optional, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from loguru import logger
import pandas as pd

# Load DATABASE_URL from environment (optional for deployment)
DATABASE_URL = os.getenv("DATABASE_URL", None)

# Global engine and session maker (created lazily)
_engine: Optional[Any] = None
_SessionLocal: Optional[Any] = None


def get_engine():
    """
    Lazy database engine creation
    Only connects when actually needed
    
    Raises:
        Exception: If DATABASE_URL is not configured
    """
    global _engine
    
    if DATABASE_URL is None:
        raise Exception(
            "❌ DATABASE_URL not configured. "
            "Database operations require a valid DATABASE_URL environment variable. "
            "Set DATABASE_URL to enable scraping functionality."
        )
    
    if _engine is None:
        logger.info(f"Creating database engine for: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'database'}")
        _engine = create_engine(DATABASE_URL)
        logger.info("✅ Database engine created successfully")
    
    return _engine


def get_session_maker():
    """
    Get or create the session maker
    """
    global _SessionLocal
    
    if _SessionLocal is None:
        engine = get_engine()
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    return _SessionLocal


def get_db_session() -> Session:
    """
    Get a database session
    Only connects to database when this is called
    """
    SessionLocal = get_session_maker()
    session = SessionLocal()
    try:
        return session
    except Exception as e:
        session.close()
        raise e


def insert_shooter(shooter_data: dict) -> int:
    """
    Insert a new shooter into the database
    Returns the shooter_id
    """
    session = get_db_session()
    
    try:
        # Insert into shooters table
        query = text("""
            INSERT INTO shooters (
                name, position, height_inches, weight_lbs, wingspan_inches,
                arm_length_inches, body_type, dominant_hand, career_fg_percentage,
                career_3pt_percentage, career_ft_percentage, shooting_style,
                era, skill_level, profile_image_url
            ) VALUES (
                :name, :position, :height_inches, :weight_lbs, :wingspan_inches,
                :arm_length_inches, :body_type, :dominant_hand, :career_fg_percentage,
                :career_3pt_percentage, :career_ft_percentage, :shooting_style,
                :era, :skill_level, :profile_image_url
            )
            RETURNING shooter_id
        """)
        
        result = session.execute(query, {
            "name": shooter_data.get("name"),
            "position": shooter_data.get("position"),
            "height_inches": shooter_data.get("height_inches"),
            "weight_lbs": shooter_data.get("weight_lbs"),
            "wingspan_inches": shooter_data.get("wingspan_inches"),
            "arm_length_inches": shooter_data.get("arm_length_inches"),
            "body_type": shooter_data.get("body_type"),
            "dominant_hand": shooter_data.get("dominant_hand"),
            "career_fg_percentage": shooter_data.get("career_fg_percentage"),
            "career_3pt_percentage": shooter_data.get("career_3pt_percentage"),
            "career_ft_percentage": shooter_data.get("career_ft_percentage"),
            "shooting_style": shooter_data.get("shooting_style"),
            "era": shooter_data.get("era"),
            "skill_level": shooter_data.get("skill_level"),
            "profile_image_url": shooter_data.get("profile_image_url"),
        })
        
        shooter_id = result.fetchone()[0]
        session.commit()
        
        logger.info(f"Inserted shooter: {shooter_data.get('name')} (ID: {shooter_id})")
        return shooter_id
        
    except Exception as e:
        session.rollback()
        logger.error(f"Error inserting shooter: {e}")
        raise
    finally:
        session.close()


def insert_shooters_bulk(df: pd.DataFrame) -> list:
    """
    Bulk insert shooters from a DataFrame
    Returns list of inserted shooter_ids
    """
    session = get_db_session()
    shooter_ids = []
    
    try:
        for idx, row in df.iterrows():
            shooter_data = row.to_dict()
            
            query = text("""
                INSERT INTO shooters (
                    name, position, height_inches, weight_lbs,
                    career_fg_percentage, career_3pt_percentage, career_ft_percentage,
                    era, skill_level, profile_image_url
                ) VALUES (
                    :name, :position, :height_inches, :weight_lbs,
                    :career_fg_percentage, :career_3pt_percentage, :career_ft_percentage,
                    :era, :skill_level, :profile_image_url
                )
                ON CONFLICT (name) DO UPDATE SET
                    career_fg_percentage = EXCLUDED.career_fg_percentage,
                    career_3pt_percentage = EXCLUDED.career_3pt_percentage,
                    career_ft_percentage = EXCLUDED.career_ft_percentage,
                    updated_at = NOW()
                RETURNING shooter_id
            """)
            
            result = session.execute(query, {
                "name": shooter_data.get("name", ""),
                "position": shooter_data.get("position"),
                "height_inches": shooter_data.get("height_inches"),
                "weight_lbs": shooter_data.get("weight_lbs"),
                "career_fg_percentage": shooter_data.get("career_fg_percentage"),
                "career_3pt_percentage": shooter_data.get("career_3pt_percentage"),
                "career_ft_percentage": shooter_data.get("career_ft_percentage"),
                "era": shooter_data.get("era", "Modern"),
                "skill_level": shooter_data.get("skill_level", "Professional"),
                "profile_image_url": shooter_data.get("profile_image_url"),
            })
            
            shooter_id = result.fetchone()[0]
            shooter_ids.append(shooter_id)
            
            if (idx + 1) % 10 == 0:
                logger.info(f"Processed {idx + 1}/{len(df)} shooters")
        
        session.commit()
        logger.info(f"Successfully inserted {len(shooter_ids)} shooters")
        return shooter_ids
        
    except Exception as e:
        session.rollback()
        logger.error(f"Error in bulk insert: {e}")
        raise
    finally:
        session.close()


def get_shooter_by_name(name: str) -> dict:
    """
    Get a shooter by name
    """
    session = get_db_session()
    
    try:
        query = text("SELECT * FROM shooters WHERE name = :name")
        result = session.execute(query, {"name": name})
        row = result.fetchone()
        
        if row:
            return dict(row._mapping)
        return None
        
    finally:
        session.close()


def get_all_shooters(limit: int = 100, offset: int = 0) -> list:
    """
    Get all shooters with pagination
    """
    session = get_db_session()
    
    try:
        query = text("""
            SELECT * FROM shooters 
            ORDER BY career_3pt_percentage DESC 
            LIMIT :limit OFFSET :offset
        """)
        result = session.execute(query, {"limit": limit, "offset": offset})
        
        return [dict(row._mapping) for row in result.fetchall()]
        
    finally:
        session.close()


def insert_players_to_db(df: pd.DataFrame, table_name: str = "shooters", if_exists: str = "append") -> int:
    """
    Insert cleaned player data into PostgreSQL using pandas to_sql
    
    Args:
        df: DataFrame with player data
        table_name: Target table name (default: "shooters")
        if_exists: How to handle existing table - 'append', 'replace', or 'fail'
        
    Returns:
        Number of rows inserted
    """
    try:
        # Map DataFrame columns to database columns
        column_mapping = {
            'name': 'name',
            'position': 'position',
            'height_inches': 'height_inches',
            'weight_lbs': 'weight_lbs',
            'wingspan_inches': 'wingspan_inches',
            'arm_length_inches': 'arm_length_inches',
            'body_type': 'body_type',
            'dominant_hand': 'dominant_hand',
            'career_fg_percentage': 'career_fg_percentage',
            'career_3pt_percentage': 'career_3pt_percentage',
            'career_ft_percentage': 'career_ft_percentage',
            'shooting_style': 'shooting_style',
            'era': 'era',
            'skill_level': 'skill_level',
            'profile_image_url': 'profile_image_url',
        }
        
        # Only keep columns that exist in both DataFrame and mapping
        existing_cols = [col for col in column_mapping.keys() if col in df.columns]
        insert_df = df[existing_cols].copy()
        
        # Rename columns to match database schema
        insert_df = insert_df.rename(columns={k: v for k, v in column_mapping.items() if k in existing_cols})
        
        # Insert using pandas to_sql (uses lazy engine)
        engine = get_engine()
        rows_inserted = insert_df.to_sql(
            table_name, 
            con=engine, 
            if_exists=if_exists, 
            index=False,
            method='multi',  # Faster bulk insert
            chunksize=100    # Insert in chunks
        )
        
        logger.info(f"Inserted {len(insert_df)} players into {table_name} table")
        return len(insert_df)
        
    except Exception as e:
        logger.error(f"Error inserting players: {e}")
        raise


def upsert_players(df: pd.DataFrame) -> int:
    """
    Insert or update players (upsert)
    Updates existing records based on name match
    
    Args:
        df: DataFrame with player data
        
    Returns:
        Number of rows affected
    """
    session = get_db_session()
    affected = 0
    
    try:
        for idx, row in df.iterrows():
            # Check if player exists
            existing = session.execute(
                text("SELECT shooter_id FROM shooters WHERE name = :name"),
                {"name": row.get("name")}
            ).fetchone()
            
            if existing:
                # Update existing player
                update_query = text("""
                    UPDATE shooters SET
                        position = COALESCE(:position, position),
                        height_inches = COALESCE(:height_inches, height_inches),
                        weight_lbs = COALESCE(:weight_lbs, weight_lbs),
                        career_fg_percentage = COALESCE(:career_fg_percentage, career_fg_percentage),
                        career_3pt_percentage = COALESCE(:career_3pt_percentage, career_3pt_percentage),
                        career_ft_percentage = COALESCE(:career_ft_percentage, career_ft_percentage),
                        profile_image_url = COALESCE(:profile_image_url, profile_image_url),
                        updated_at = NOW()
                    WHERE name = :name
                """)
            else:
                # Insert new player
                update_query = text("""
                    INSERT INTO shooters (
                        name, position, height_inches, weight_lbs,
                        career_fg_percentage, career_3pt_percentage, career_ft_percentage,
                        era, skill_level, profile_image_url
                    ) VALUES (
                        :name, :position, :height_inches, :weight_lbs,
                        :career_fg_percentage, :career_3pt_percentage, :career_ft_percentage,
                        :era, :skill_level, :profile_image_url
                    )
                """)
            
            session.execute(update_query, {
                "name": row.get("name"),
                "position": row.get("position"),
                "height_inches": row.get("height_inches"),
                "weight_lbs": row.get("weight_lbs"),
                "career_fg_percentage": row.get("career_fg_percentage"),
                "career_3pt_percentage": row.get("career_3pt_percentage"),
                "career_ft_percentage": row.get("career_ft_percentage"),
                "era": row.get("era", "Modern"),
                "skill_level": row.get("skill_level", "Professional"),
                "profile_image_url": row.get("profile_image_url"),
            })
            affected += 1
            
            if (idx + 1) % 25 == 0:
                session.commit()
                logger.info(f"Processed {idx + 1}/{len(df)} players")
        
        session.commit()
        logger.info(f"Upserted {affected} players")
        return affected
        
    except Exception as e:
        session.rollback()
        logger.error(f"Error in upsert: {e}")
        raise
    finally:
        session.close()


def test_connection() -> bool:
    """
    Test database connection
    """
    try:
        session = get_db_session()
        session.execute(text("SELECT 1"))
        session.close()
        logger.info("Database connection successful")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False


if __name__ == "__main__":
    # Test connection
    if test_connection():
        print("✅ Database connection successful")
    else:
        print("❌ Database connection failed")


