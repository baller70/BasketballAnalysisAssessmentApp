"""
Seed Elite Shooters from Static Data
Populates the database with predefined elite basketball shooters
"""

import os
import json
from database import get_db_session
from sqlalchemy import text
from loguru import logger

# Elite shooters data - converted from TypeScript file
ELITE_SHOOTERS = [
    # TIER 1 - LEGENDARY
    {
        "name": "Stephen Curry", "team": "Golden State Warriors", "league": "NBA",
        "position": "POINT_GUARD", "height": 75, "weight": 185, "wingspan": 79,
        "body_type": "LEAN", "tier": "LEGENDARY", "career_3pt_pct": 43.0,
        "career_ft_pct": 91.0, "era": "2009-Present", "overall_score": 99,
        "achievements": "Greatest 3PT shooter ever, 2x MVP, 4x Champion",
        "key_traits": ["Quick Release", "Deep Range", "Off-Balance Accuracy"],
        "shooting_style": "Quick release with incredible range and shot-making ability"
    },
    {
        "name": "Ray Allen", "team": "Multiple Teams", "league": "NBA",
        "position": "SHOOTING_GUARD", "height": 77, "weight": 205, "wingspan": 81,
        "body_type": "ATHLETIC", "tier": "LEGENDARY", "career_3pt_pct": 40.0,
        "career_ft_pct": 89.4, "era": "1996-2014", "overall_score": 97,
        "achievements": "2x NBA Champion, 10x All-Star, HOF",
        "key_traits": ["Perfect Mechanics", "Elite Footwork", "Clutch Shooter"],
        "shooting_style": "Textbook form with elite consistency and clutch performance"
    },
    {
        "name": "Reggie Miller", "team": "Indiana Pacers", "league": "NBA",
        "position": "SHOOTING_GUARD", "height": 79, "weight": 195, "wingspan": 82,
        "body_type": "ATHLETIC", "tier": "LEGENDARY", "career_3pt_pct": 39.5,
        "career_ft_pct": 88.8, "era": "1987-2005", "overall_score": 96,
        "achievements": "5x All-Star, HOF 2012, Clutch legend",
        "key_traits": ["Clutch Shooter", "Quick Release", "High Arc"],
        "shooting_style": "Clutch performer with quick trigger and elite movement"
    },
    {
        "name": "Klay Thompson", "team": "Golden State Warriors", "league": "NBA",
        "position": "SHOOTING_GUARD", "height": 78, "weight": 215, "wingspan": 81,
        "body_type": "ATHLETIC", "tier": "LEGENDARY", "career_3pt_pct": 41.3,
        "career_ft_pct": 85.3, "era": "2011-Present", "overall_score": 98,
        "achievements": "4x NBA Champion, 5x All-Star, 37pts in quarter",
        "key_traits": ["Catch-and-Shoot", "Perfect Square-Up", "Minimal Wasted Motion"],
        "shooting_style": "Pure catch-and-shoot specialist with textbook mechanics"
    },
    {
        "name": "Larry Bird", "team": "Boston Celtics", "league": "NBA",
        "position": "SMALL_FORWARD", "height": 81, "weight": 220, "wingspan": 84,
        "body_type": "ATHLETIC", "tier": "LEGENDARY", "career_3pt_pct": 37.6,
        "career_ft_pct": 88.6, "era": "1979-1992", "overall_score": 95,
        "achievements": "3x NBA Champion, 3x MVP, HOF",
        "key_traits": ["High Release Point", "Clutch Shooter", "Versatile Shooter"],
        "shooting_style": "High release with exceptional accuracy from all ranges"
    },
    
    # TIER 2 - ELITE
    {
        "name": "Kevin Durant", "team": "Phoenix Suns", "league": "NBA",
        "position": "SMALL_FORWARD", "height": 83, "weight": 240, "wingspan": 89,
        "body_type": "TALL_LEAN", "tier": "ELITE", "career_3pt_pct": 38.5,
        "career_ft_pct": 88.3, "era": "2007-Present", "overall_score": 94,
        "achievements": "2x NBA Champion, MVP, Scoring Champion",
        "key_traits": ["High Release Point", "Smooth Follow-Through", "Great Footwork"],
        "shooting_style": "Pure catch-and-shoot specialist with excellent mechanics"
    },
    {
        "name": "Dirk Nowitzki", "team": "Dallas Mavericks", "league": "NBA",
        "position": "POWER_FORWARD", "height": 84, "weight": 245, "wingspan": 86,
        "body_type": "ATHLETIC", "tier": "ELITE", "career_3pt_pct": 38.0,
        "career_ft_pct": 87.9, "era": "1998-2019", "overall_score": 93,
        "achievements": "NBA Champion, MVP, 14x All-Star",
        "key_traits": ["One-Legged Fadeaway", "High Release", "Consistent Form"],
        "shooting_style": "Unique one-legged fadeaway with exceptional accuracy"
    },
    {
        "name": "Steve Nash", "team": "Multiple Teams", "league": "NBA",
        "position": "POINT_GUARD", "height": 75, "weight": 178, "wingspan": 77,
        "body_type": "LEAN", "tier": "ELITE", "career_3pt_pct": 42.8,
        "career_ft_pct": 90.4, "era": "1996-2014", "overall_score": 93,
        "achievements": "2x MVP, 8x All-Star, 90/50/40 club",
        "key_traits": ["Quick Release", "High Arc", "Elite Footwork"],
        "shooting_style": "Quick release with incredible accuracy"
    },
    {
        "name": "Kyle Korver", "team": "Multiple Teams", "league": "NBA",
        "position": "SHOOTING_GUARD", "height": 79, "weight": 212, "wingspan": 82,
        "body_type": "ATHLETIC", "tier": "ELITE", "career_3pt_pct": 42.9,
        "career_ft_pct": 88.6, "era": "2003-2020", "overall_score": 94,
        "achievements": "All-Star, All-time 3PM leader era",
        "key_traits": ["Catch-and-Shoot", "High Release Point", "Smooth Follow-Through"],
        "shooting_style": "Pure catch-and-shoot with perfect mechanics"
    },
    {
        "name": "Steve Kerr", "team": "Multiple Teams", "league": "NBA",
        "position": "POINT_GUARD", "height": 75, "weight": 175, "wingspan": 77,
        "body_type": "LEAN", "tier": "ELITE", "career_3pt_pct": 45.4,
        "career_ft_pct": 86.4, "era": "1988-2003", "overall_score": 93,
        "achievements": "Highest career 3PT%, 5x Champion",
        "key_traits": ["Quick Release", "Consistent Form", "High Arc"],
        "shooting_style": "Highest career percentage with textbook form"
    },
    {
        "name": "Damian Lillard", "team": "Milwaukee Bucks", "league": "NBA",
        "position": "POINT_GUARD", "height": 75, "weight": 195, "wingspan": 80,
        "body_type": "LEAN", "tier": "ELITE", "career_3pt_pct": 37.1,
        "career_ft_pct": 89.5, "era": "2012-Present", "overall_score": 92,
        "achievements": "7x All-Star, Logo shots specialist",
        "key_traits": ["Deep Range", "Quick Release", "Clutch Shooter"],
        "shooting_style": "Logo range with incredible clutch performance"
    },
    {
        "name": "JJ Redick", "team": "Multiple Teams", "league": "NBA",
        "position": "SHOOTING_GUARD", "height": 76, "weight": 190, "wingspan": 79,
        "body_type": "LEAN", "tier": "ELITE", "career_3pt_pct": 41.5,
        "career_ft_pct": 89.2, "era": "2006-2021", "overall_score": 92,
        "achievements": "Elite off-ball shooter, 15yr career",
        "key_traits": ["Catch-and-Shoot", "Great Footwork", "Quick Setup"],
        "shooting_style": "Elite off-ball movement with perfect mechanics"
    },
    {
        "name": "Peja Stojaković", "team": "Multiple Teams", "league": "NBA",
        "position": "SMALL_FORWARD", "height": 82, "weight": 229, "wingspan": 84,
        "body_type": "ATHLETIC", "tier": "ELITE", "career_3pt_pct": 40.1,
        "career_ft_pct": 89.5, "era": "1998-2011", "overall_score": 92,
        "achievements": "3x All-Star, 2x 3PT Contest Winner",
        "key_traits": ["High Release", "Smooth Form", "Great Range"],
        "shooting_style": "Smooth release with exceptional range"
    },
    
    # TIER 3 - GREAT
    {
        "name": "Paul Pierce", "team": "Boston Celtics", "league": "NBA",
        "position": "SMALL_FORWARD", "height": 79, "weight": 235, "wingspan": 83,
        "body_type": "ATHLETIC", "tier": "GREAT", "career_3pt_pct": 36.8,
        "career_ft_pct": 81.2, "era": "1998-2017", "overall_score": 87,
        "achievements": "NBA Champion, Finals MVP, HOF",
        "key_traits": ["Clutch Shooter", "Versatile Range", "Strong Base"],
        "shooting_style": "Clutch performer with versatile shooting"
    },
    {
        "name": "Kyrie Irving", "team": "Dallas Mavericks", "league": "NBA",
        "position": "POINT_GUARD", "height": 74, "weight": 195, "wingspan": 78,
        "body_type": "LEAN", "tier": "GREAT", "career_3pt_pct": 39.3,
        "career_ft_pct": 87.8, "era": "2011-Present", "overall_score": 87,
        "achievements": "NBA Champion, 8x All-Star",
        "key_traits": ["Quick Release", "Creative Shooter", "Clutch Gene"],
        "shooting_style": "Creative with exceptional ball-handling integration"
    },
    {
        "name": "Paul George", "team": "Philadelphia 76ers", "league": "NBA",
        "position": "SMALL_FORWARD", "height": 80, "weight": 220, "wingspan": 86,
        "body_type": "ATHLETIC", "tier": "GREAT", "career_3pt_pct": 38.5,
        "career_ft_pct": 83.9, "era": "2010-Present", "overall_score": 86,
        "achievements": "9x All-Star, All-NBA",
        "key_traits": ["High Release", "Good Range", "Strong Base"],
        "shooting_style": "Two-way player with reliable shooting"
    },
    {
        "name": "Bradley Beal", "team": "Phoenix Suns", "league": "NBA",
        "position": "SHOOTING_GUARD", "height": 77, "weight": 207, "wingspan": 81,
        "body_type": "ATHLETIC", "tier": "GREAT", "career_3pt_pct": 37.4,
        "career_ft_pct": 84.5, "era": "2012-Present", "overall_score": 85,
        "achievements": "3x All-Star, 30+ PPG seasons",
        "key_traits": ["Consistent Form", "Good Arc", "Quick Setup"],
        "shooting_style": "Reliable mid-range and three-point threat"
    },
    {
        "name": "Buddy Hield", "team": "Philadelphia 76ers", "league": "NBA",
        "position": "SHOOTING_GUARD", "height": 76, "weight": 220, "wingspan": 80,
        "body_type": "ATHLETIC", "tier": "GREAT", "career_3pt_pct": 39.8,
        "career_ft_pct": 86.4, "era": "2016-Present", "overall_score": 87,
        "achievements": "Elite volume 3PT shooter",
        "key_traits": ["Quick Release", "High Volume", "Consistent Form"],
        "shooting_style": "High volume with consistent mechanics"
    },
    
    # TIER 4 - GOOD
    {
        "name": "J.R. Smith", "team": "Multiple Teams", "league": "NBA",
        "position": "SHOOTING_GUARD", "height": 78, "weight": 225, "wingspan": 82,
        "body_type": "ATHLETIC", "tier": "GOOD", "career_3pt_pct": 37.3,
        "career_ft_pct": 74.9, "era": "2004-2020", "overall_score": 77,
        "achievements": "NBA Champion, 6th Man",
        "key_traits": ["Streaky Shooter", "Deep Range", "Athletic Release"],
        "shooting_style": "Streaky but capable of elite performances"
    },
    {
        "name": "Duncan Robinson", "team": "Miami Heat", "league": "NBA",
        "position": "SHOOTING_GUARD", "height": 79, "weight": 215, "wingspan": 82,
        "body_type": "ATHLETIC", "tier": "GOOD", "career_3pt_pct": 40.3,
        "career_ft_pct": 83.6, "era": "2018-Present", "overall_score": 76,
        "achievements": "Undrafted to elite shooter",
        "key_traits": ["Catch-and-Shoot", "Off-Ball Movement", "Quick Release"],
        "shooting_style": "Pure specialist with excellent mechanics"
    },
    {
        "name": "Joe Ingles", "team": "Multiple Teams", "league": "NBA",
        "position": "SMALL_FORWARD", "height": 80, "weight": 226, "wingspan": 84,
        "body_type": "ATHLETIC", "tier": "GOOD", "career_3pt_pct": 40.8,
        "career_ft_pct": 80.9, "era": "2014-Present", "overall_score": 76,
        "achievements": "Aussie sniper",
        "key_traits": ["Smart Shooter", "Good Range", "Solid Base"],
        "shooting_style": "High IQ with reliable shooting"
    },
    
    # WNBA LEGENDARY
    {
        "name": "Diana Taurasi", "team": "Phoenix Mercury", "league": "WNBA",
        "position": "GUARD", "height": 72, "weight": 163, "wingspan": 75,
        "body_type": "ATHLETIC", "tier": "LEGENDARY", "career_3pt_pct": 36.3,
        "career_ft_pct": 86.5, "era": "2004-Present", "overall_score": 98,
        "achievements": "3x WNBA Champion, All-time leading scorer",
        "key_traits": ["Clutch Shooter", "Deep Range", "Versatile"],
        "shooting_style": "Greatest WNBA shooter with elite clutch gene"
    },
    {
        "name": "Sue Bird", "team": "Seattle Storm", "league": "WNBA",
        "position": "POINT_GUARD", "height": 69, "weight": 150, "wingspan": 72,
        "body_type": "LEAN", "tier": "LEGENDARY", "career_3pt_pct": 37.9,
        "career_ft_pct": 89.2, "era": "2002-2023", "overall_score": 97,
        "achievements": "4x WNBA Champion, 13x All-Star",
        "key_traits": ["Perfect Mechanics", "Elite IQ", "Consistent Form"],
        "shooting_style": "Textbook form with incredible consistency"
    },
    {
        "name": "Elena Delle Donne", "team": "Washington Mystics", "league": "WNBA",
        "position": "FORWARD", "height": 77, "weight": 187, "wingspan": 81,
        "body_type": "TALL_LEAN", "tier": "LEGENDARY", "career_3pt_pct": 43.5,
        "career_ft_pct": 93.5, "era": "2013-Present", "overall_score": 98,
        "achievements": "WNBA Champion, 2x MVP, 50-40-90 club",
        "key_traits": ["High Release", "Elite Accuracy", "Perfect Form"],
        "shooting_style": "50-40-90 club member with exceptional skill"
    },
]

def populate_database():
    """
    Populate the database with elite shooters
    """
    session = get_db_session()
    inserted_count = 0
    updated_count = 0
    
    try:
        for shooter in ELITE_SHOOTERS:
            # Check if shooter exists
            check_query = text("SELECT shooter_id FROM shooters WHERE name = :name")
            result = session.execute(check_query, {"name": shooter["name"]})
            existing = result.fetchone()
            
            if existing:
                # Update existing shooter
                update_query = text("""
                    UPDATE shooters SET
                        position = :position,
                        height_inches = :height,
                        weight_lbs = :weight,
                        wingspan_inches = :wingspan,
                        body_type = :body_type,
                        career_3pt_percentage = :career_3pt_pct,
                        career_ft_percentage = :career_ft_pct,
                        shooting_style = :shooting_style,
                        era = :era,
                        skill_level = :skill_level,
                        updated_at = NOW()
                    WHERE name = :name
                """)
                
                session.execute(update_query, {
                    "name": shooter["name"],
                    "position": shooter["position"],
                    "height": shooter["height"],
                    "weight": shooter["weight"],
                    "wingspan": shooter["wingspan"],
                    "body_type": shooter["body_type"],
                    "career_3pt_pct": shooter["career_3pt_pct"],
                    "career_ft_pct": shooter["career_ft_pct"],
                    "shooting_style": shooter["shooting_style"],
                    "era": shooter["era"],
                    "skill_level": shooter["tier"]
                })
                updated_count += 1
                logger.info(f"Updated: {shooter['name']}")
            else:
                # Insert new shooter
                insert_query = text("""
                    INSERT INTO shooters (
                        name, position, height_inches, weight_lbs, wingspan_inches,
                        body_type, career_3pt_percentage, career_ft_percentage,
                        shooting_style, era, skill_level
                    ) VALUES (
                        :name, :position, :height, :weight, :wingspan,
                        :body_type, :career_3pt_pct, :career_ft_pct,
                        :shooting_style, :era, :skill_level
                    )
                """)
                
                session.execute(insert_query, {
                    "name": shooter["name"],
                    "position": shooter["position"],
                    "height": shooter["height"],
                    "weight": shooter["weight"],
                    "wingspan": shooter["wingspan"],
                    "body_type": shooter["body_type"],
                    "career_3pt_pct": shooter["career_3pt_pct"],
                    "career_ft_pct": shooter["career_ft_pct"],
                    "shooting_style": shooter["shooting_style"],
                    "era": shooter["era"],
                    "skill_level": shooter["tier"]
                })
                inserted_count += 1
                logger.info(f"Inserted: {shooter['name']}")
        
        session.commit()
        logger.success(f"✅ Database populated: {inserted_count} inserted, {updated_count} updated")
        return {"inserted": inserted_count, "updated": updated_count}
        
    except Exception as e:
        session.rollback()
        logger.error(f"❌ Error populating database: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    logger.info("Starting elite shooter database population...")
    result = populate_database()
    logger.success(f"✅ Complete! Inserted: {result['inserted']}, Updated: {result['updated']}")
