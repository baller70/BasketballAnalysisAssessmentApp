"""
Data Cleaning and Validation Utilities
Ensures scraped data is clean and consistent before database insertion
"""

import pandas as pd
import numpy as np
from loguru import logger
from typing import Optional


def clean_player_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and validate scraped player data
    
    Args:
        df: Raw DataFrame from scraper
        
    Returns:
        Cleaned DataFrame ready for database insertion
    """
    if df.empty:
        logger.warning("Empty DataFrame provided to cleaner")
        return df
    
    logger.info(f"Cleaning {len(df)} player records...")
    original_count = len(df)
    
    # ==========================================
    # STEP 1: Remove duplicates
    # ==========================================
    df = df.drop_duplicates(subset=['name'], keep='first')
    duplicates_removed = original_count - len(df)
    if duplicates_removed > 0:
        logger.info(f"Removed {duplicates_removed} duplicate records")
    
    # ==========================================
    # STEP 2: Standardize player names
    # ==========================================
    df['name'] = df['name'].str.strip()  # Remove whitespace
    df['name'] = df['name'].str.title()  # Capitalize properly
    
    # Handle common nickname patterns
    df['name'] = df['name'].replace({
        r'\s+': ' ',  # Multiple spaces to single
        r'\.': '',     # Remove periods (Jr. -> Jr)
    }, regex=True)
    
    # ==========================================
    # STEP 3: Clean percentage columns
    # ==========================================
    pct_columns = [
        'career_fg_percentage',
        'career_3pt_percentage', 
        'career_ft_percentage',
        'fg_percentage',
        'three_pt_percentage',
        'ft_percentage'
    ]
    
    for col in pct_columns:
        if col in df.columns:
            # Convert to numeric, coercing errors to NaN
            df[col] = pd.to_numeric(df[col], errors='coerce')
            
            # If values are > 1, they're likely already percentages (e.g., 45.5 instead of 0.455)
            # Keep them as percentages (0-100 scale) for consistency with database schema
            # The schema uses DECIMAL(5,2) which expects values like 45.50
            
            # Ensure values are in valid range (0-100)
            df.loc[df[col] > 100, col] = np.nan
            df.loc[df[col] < 0, col] = np.nan
    
    # ==========================================
    # STEP 4: Clean height (convert to inches if needed)
    # ==========================================
    if 'height_inches' in df.columns:
        df['height_inches'] = pd.to_numeric(df['height_inches'], errors='coerce')
        # Valid NBA height range: 60-96 inches (5'0" to 8'0")
        df.loc[~df['height_inches'].between(60, 96), 'height_inches'] = np.nan
    
    if 'height' in df.columns and 'height_inches' not in df.columns:
        # Convert string height to inches
        df['height_inches'] = df['height'].apply(height_string_to_inches)
    
    # ==========================================
    # STEP 5: Clean weight
    # ==========================================
    if 'weight_lbs' in df.columns:
        df['weight_lbs'] = pd.to_numeric(df['weight_lbs'], errors='coerce')
        # Valid NBA weight range: 150-350 lbs
        df.loc[~df['weight_lbs'].between(150, 350), 'weight_lbs'] = np.nan
    
    if 'weight' in df.columns and 'weight_lbs' not in df.columns:
        df['weight_lbs'] = pd.to_numeric(df['weight'].str.replace(r'[^\d]', '', regex=True), errors='coerce')
    
    # ==========================================
    # STEP 6: Handle missing values
    # ==========================================
    # Fill missing heights with median
    if 'height_inches' in df.columns:
        median_height = df['height_inches'].median()
        if pd.notna(median_height):
            df['height_inches'].fillna(median_height, inplace=True)
            logger.info(f"Filled missing heights with median: {median_height:.0f} inches")
    
    # Fill missing weights with median
    if 'weight_lbs' in df.columns:
        median_weight = df['weight_lbs'].median()
        if pd.notna(median_weight):
            df['weight_lbs'].fillna(median_weight, inplace=True)
            logger.info(f"Filled missing weights with median: {median_weight:.0f} lbs")
    
    # ==========================================
    # STEP 7: Standardize position
    # ==========================================
    if 'position' in df.columns:
        df['position'] = df['position'].str.strip().str.title()
        
        # Map common variations
        position_map = {
            'Pg': 'Guard',
            'Sg': 'Guard',
            'Point Guard': 'Guard',
            'Shooting Guard': 'Guard',
            'Sf': 'Forward',
            'Pf': 'Forward',
            'Small Forward': 'Forward',
            'Power Forward': 'Forward',
            'C': 'Center',
            'G': 'Guard',
            'F': 'Forward',
            'G-F': 'Guard',
            'F-G': 'Forward',
            'F-C': 'Forward',
            'C-F': 'Center',
        }
        df['position'] = df['position'].replace(position_map)
    
    # ==========================================
    # STEP 8: Standardize era
    # ==========================================
    if 'era' in df.columns:
        df['era'] = df['era'].str.strip().str.title()
        # Ensure valid values
        valid_eras = ['Modern', 'Classic', 'Historical']
        df.loc[~df['era'].isin(valid_eras), 'era'] = 'Modern'
    
    # ==========================================
    # STEP 9: Standardize skill level
    # ==========================================
    if 'skill_level' in df.columns:
        df['skill_level'] = df['skill_level'].str.strip().str.title()
        # Ensure valid values
        valid_levels = ['Professional', 'College', 'High School', 'Amateur']
        df.loc[~df['skill_level'].isin(valid_levels), 'skill_level'] = 'Professional'
    
    # ==========================================
    # STEP 10: Validate data ranges
    # ==========================================
    validation_errors = []
    
    for col in pct_columns:
        if col in df.columns:
            invalid = ~df[col].between(0, 100) & df[col].notna()
            if invalid.any():
                validation_errors.append(f"{col}: {invalid.sum()} values out of range")
                df.loc[invalid, col] = np.nan
    
    if validation_errors:
        logger.warning(f"Validation issues: {', '.join(validation_errors)}")
    
    # ==========================================
    # STEP 11: Remove rows with no name
    # ==========================================
    df = df[df['name'].notna() & (df['name'] != '')]
    
    logger.info(f"Cleaning complete. {len(df)} records remaining (removed {original_count - len(df)} total)")
    
    return df


def height_string_to_inches(height_str: Optional[str]) -> Optional[int]:
    """
    Convert height string to inches
    
    Handles formats:
    - "6-3" (feet-inches)
    - "6'3\"" (feet'inches")
    - "6 ft 3 in"
    - "75" (already inches)
    - "190 cm" (centimeters)
    """
    if pd.isna(height_str) or not height_str:
        return None
    
    height_str = str(height_str).strip().lower()
    
    try:
        # Already inches (just a number)
        if height_str.isdigit():
            inches = int(height_str)
            if 60 <= inches <= 96:
                return inches
        
        # Centimeters
        if 'cm' in height_str:
            cm = float(height_str.replace('cm', '').strip())
            return int(cm / 2.54)
        
        # "6-3" format
        if '-' in height_str:
            parts = height_str.split('-')
            if len(parts) == 2:
                feet = int(parts[0])
                inches = int(parts[1])
                return feet * 12 + inches
        
        # "6'3" or '6'3"' format
        if "'" in height_str:
            height_str = height_str.replace('"', '').replace("'", '-')
            if '-' in height_str:
                parts = height_str.split('-')
                feet = int(parts[0])
                inches = int(parts[1]) if parts[1] else 0
                return feet * 12 + inches
        
        # "6 ft 3 in" format
        if 'ft' in height_str:
            import re
            match = re.search(r'(\d+)\s*ft\s*(\d*)', height_str)
            if match:
                feet = int(match.group(1))
                inches = int(match.group(2)) if match.group(2) else 0
                return feet * 12 + inches
        
        return None
        
    except (ValueError, IndexError):
        return None


def validate_shooter_data(df: pd.DataFrame) -> tuple[bool, list[str]]:
    """
    Validate shooter data before database insertion
    
    Returns:
        (is_valid, list of error messages)
    """
    errors = []
    
    # Required columns
    required_columns = ['name']
    missing_cols = [col for col in required_columns if col not in df.columns]
    if missing_cols:
        errors.append(f"Missing required columns: {missing_cols}")
    
    # Check for empty DataFrame
    if df.empty:
        errors.append("DataFrame is empty")
    
    # Check for null names
    if 'name' in df.columns:
        null_names = df['name'].isna().sum()
        if null_names > 0:
            errors.append(f"{null_names} records have null names")
    
    # Validate percentages
    pct_cols = ['career_fg_percentage', 'career_3pt_percentage', 'career_ft_percentage']
    for col in pct_cols:
        if col in df.columns:
            invalid = df[col].notna() & ~df[col].between(0, 100)
            if invalid.any():
                errors.append(f"{col}: {invalid.sum()} values out of range (0-100)")
    
    is_valid = len(errors) == 0
    
    if is_valid:
        logger.info("Data validation passed")
    else:
        logger.warning(f"Data validation failed: {errors}")
    
    return is_valid, errors


def deduplicate_with_merge(existing_df: pd.DataFrame, new_df: pd.DataFrame) -> pd.DataFrame:
    """
    Merge new data with existing, keeping most recent stats
    
    Args:
        existing_df: Current data in database
        new_df: Newly scraped data
        
    Returns:
        Merged DataFrame with updates
    """
    if existing_df.empty:
        return new_df
    
    if new_df.empty:
        return existing_df
    
    # Combine DataFrames
    combined = pd.concat([existing_df, new_df], ignore_index=True)
    
    # For duplicates, keep the one with most recent scraped_at
    if 'scraped_at' in combined.columns:
        combined = combined.sort_values('scraped_at', ascending=False)
    
    # Drop duplicates keeping first (most recent)
    combined = combined.drop_duplicates(subset=['name'], keep='first')
    
    logger.info(f"Merged {len(existing_df)} existing + {len(new_df)} new = {len(combined)} total")
    
    return combined







