"""
Main Scraping Pipeline
Orchestrates all scrapers and database operations
"""

import os
import sys
from datetime import datetime
from loguru import logger
import pandas as pd

from scrapers import scrape_nba_players, scrape_basketball_reference, batch_download_images
from database import insert_shooters_bulk, test_connection, get_all_shooters
from utils import clean_player_data, validate_shooter_data
from storage import batch_upload_to_s3, S3_ENABLED
from database_images import insert_shooter_images_bulk, update_shooter_profile_image


def setup_logging():
    """
    Configure logging
    """
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)
    
    logger.add(
        f"{log_dir}/scraper_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log",
        rotation="10 MB",
        retention="30 days",
        level="INFO",
    )


def run_full_scrape():
    """
    Run full scraping pipeline
    """
    logger.info("=" * 50)
    logger.info("Starting Basketball Shooter Scraping Pipeline")
    logger.info("=" * 50)
    
    # Test database connection first
    if not test_connection():
        logger.error("Cannot proceed without database connection")
        return False
    
    all_shooters = pd.DataFrame()
    
    # Step 1: Scrape NBA.com
    logger.info("\n--- PHASE 1: NBA.com Scraping ---")
    try:
        nba_df = scrape_nba_players(limit=100)
        if not nba_df.empty:
            logger.info(f"Collected {len(nba_df)} NBA players")
            all_shooters = pd.concat([all_shooters, nba_df], ignore_index=True)
        else:
            logger.warning("No NBA data collected")
    except Exception as e:
        logger.error(f"NBA scraping failed: {e}")
    
    # Step 2: Scrape Basketball-Reference (Historical)
    logger.info("\n--- PHASE 2: Basketball-Reference Scraping ---")
    try:
        historical_df = scrape_basketball_reference(limit=50)
        if not historical_df.empty:
            logger.info(f"Collected {len(historical_df)} historical players")
            all_shooters = pd.concat([all_shooters, historical_df], ignore_index=True)
        else:
            logger.warning("No historical data collected")
    except Exception as e:
        logger.error(f"Basketball-Reference scraping failed: {e}")
    
    # Step 3: Clean and validate data
    logger.info("\n--- PHASE 3: Data Cleaning ---")
    if not all_shooters.empty:
        all_shooters = clean_player_data(all_shooters)
        
        # Validate before insertion
        is_valid, errors = validate_shooter_data(all_shooters)
        if not is_valid:
            logger.warning(f"Validation issues (proceeding anyway): {errors}")
    
    # Step 5: Insert into database
    logger.info("\n--- PHASE 4: Database Insertion ---")
    if not all_shooters.empty:
        try:
            shooter_ids = insert_shooters_bulk(all_shooters)
            logger.info(f"Successfully inserted {len(shooter_ids)} shooters into database")
        except Exception as e:
            logger.error(f"Database insertion failed: {e}")
            # Save to CSV as backup
            backup_file = f"backup_shooters_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            all_shooters.to_csv(backup_file, index=False)
            logger.info(f"Data saved to backup file: {backup_file}")
    
    # Summary
    logger.info("\n" + "=" * 50)
    logger.info("SCRAPING PIPELINE COMPLETE")
    logger.info(f"Total shooters collected: {len(all_shooters)}")
    logger.info("=" * 50)
    
    return True


def run_image_pipeline(limit: int = 50):
    """
    Download and upload images for shooters in the database
    """
    logger.info("=" * 50)
    logger.info("Starting Image Download Pipeline")
    logger.info("=" * 50)
    
    # Get shooters from database
    shooters = get_all_shooters(limit=limit)
    
    if not shooters:
        logger.warning("No shooters found in database")
        return False
    
    logger.info(f"Found {len(shooters)} shooters to process")
    
    # Prepare player list for batch download
    players = []
    players_info = {}
    
    for shooter in shooters:
        player = {
            "name": shooter.get("name"),
            "player_id_nba": shooter.get("player_id_nba"),
            "skill_level": shooter.get("skill_level", "professional"),
            "league": "nba",  # Default to NBA
        }
        players.append(player)
        players_info[shooter["name"]] = {
            "shooter_id": shooter.get("shooter_id"),
            "skill_level": shooter.get("skill_level", "professional"),
            "league": "nba",
        }
    
    # Step 1: Download images
    logger.info("\n--- PHASE 1: Downloading Images ---")
    all_downloads = batch_download_images(players, max_per_player=5)
    
    total_downloaded = sum(len(imgs) for imgs in all_downloads.values())
    logger.info(f"Downloaded {total_downloaded} images")
    
    if total_downloaded == 0:
        logger.warning("No images downloaded")
        return False
    
    # Step 2: Upload to S3 (OPTIONAL - skip if S3 not configured)
    if S3_ENABLED:
        logger.info("\n--- PHASE 2: Uploading to S3 ---")
        all_uploaded = batch_upload_to_s3(all_downloads, players_info)
        
        total_uploaded = sum(len(imgs) for imgs in all_uploaded.values())
        logger.info(f"Uploaded {total_uploaded} images to S3")
        
        # Step 3: Insert image records into database
        logger.info("\n--- PHASE 3: Database Insertion ---")
        for player_name, images in all_uploaded.items():
            shooter_info = players_info.get(player_name, {})
            shooter_id = shooter_info.get("shooter_id")
            
            if shooter_id and images:
                # Insert image records
                insert_shooter_images_bulk(shooter_id, images)
                
                # Update profile image (use first primary image)
                primary_images = [img for img in images if img.get("is_primary")]
                if primary_images:
                    update_shooter_profile_image(shooter_id, primary_images[0]["s3_url"])
                elif images:
                    update_shooter_profile_image(shooter_id, images[0]["s3_url"])
        
        logger.info("\n" + "=" * 50)
        logger.info("IMAGE PIPELINE COMPLETE")
        logger.info(f"Total images processed: {total_uploaded}")
        logger.info("=" * 50)
    else:
        logger.warning("\n⚠️  PHASE 2 & 3 SKIPPED: S3 storage not configured")
        logger.warning("Images downloaded locally but not uploaded to cloud storage")
        logger.warning("To enable S3 storage, set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and S3_BUCKET_NAME")
        logger.info("\n" + "=" * 50)
        logger.info("IMAGE PIPELINE COMPLETE (S3 DISABLED)")
        logger.info(f"Total images downloaded: {total_downloaded}")
        logger.info("=" * 50)
    
    return True


def run_nba_only(limit: int = 100):
    """
    Run only NBA scraping
    """
    logger.info("Running NBA-only scrape...")
    
    df = scrape_nba_players(limit)
    
    if not df.empty:
        # Save to CSV
        output_file = f"nba_shooters_{datetime.now().strftime('%Y%m%d')}.csv"
        df.to_csv(output_file, index=False)
        logger.info(f"Saved {len(df)} shooters to {output_file}")
        
        # Insert to database if connected
        if test_connection():
            insert_shooters_bulk(df)
    
    return df


def run_historical_only(limit: int = 50):
    """
    Run only historical scraping
    """
    logger.info("Running historical-only scrape...")
    
    df = scrape_basketball_reference(limit)
    
    if not df.empty:
        # Save to CSV
        output_file = f"historical_shooters_{datetime.now().strftime('%Y%m%d')}.csv"
        df.to_csv(output_file, index=False)
        logger.info(f"Saved {len(df)} shooters to {output_file}")
        
        # Insert to database if connected
        if test_connection():
            insert_shooters_bulk(df)
    
    return df


if __name__ == "__main__":
    setup_logging()
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "nba":
            limit = int(sys.argv[2]) if len(sys.argv) > 2 else 100
            run_nba_only(limit)
        elif command == "historical":
            limit = int(sys.argv[2]) if len(sys.argv) > 2 else 50
            run_historical_only(limit)
        elif command == "full":
            run_full_scrape()
        elif command == "images":
            limit = int(sys.argv[2]) if len(sys.argv) > 2 else 50
            run_image_pipeline(limit)
        else:
            print("Usage: python main.py [nba|historical|full|images] [limit]")
            print("")
            print("Commands:")
            print("  nba        - Scrape NBA players")
            print("  historical - Scrape historical players")
            print("  full       - Run full scraping pipeline")
            print("  images     - Download and upload images for existing shooters")
    else:
        # Default: run full scrape
        run_full_scrape()







