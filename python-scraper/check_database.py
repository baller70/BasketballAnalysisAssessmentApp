"""
Check what's already in the database
"""

from database import get_all_shooters
from loguru import logger
import pandas as pd

logger.info("Fetching all shooters from database...")
shooters = get_all_shooters()

if shooters:
    logger.info(f"\n✅ Found {len(shooters)} shooters in database\n")
    
    # Convert to DataFrame for better display
    df = pd.DataFrame([
        {
            'Name': s.get('full_name', 'N/A'),
            '3PT%': f"{s.get('fg3_pct', 0):.1%}" if s.get('fg3_pct') else "N/A",
            'FT%': f"{s.get('ft_pct', 0):.1%}" if s.get('ft_pct') else "N/A",
            'Height': s.get('height_inches', 'N/A'),
            'Position': s.get('position', 'N/A'),
            'Team': s.get('team', 'N/A'),
        }
        for s in shooters
    ])
    
    print("\n" + "="*100)
    print("DATABASE CONTENTS - ELITE SHOOTERS")
    print("="*100)
    print(df.to_string(index=True))
    print("="*100)
    
    # Statistics
    print(f"\n📊 Statistics:")
    print(f"  Total shooters: {len(shooters)}")
    print(f"  With 3PT%: {sum(1 for s in shooters if s.get('fg3_pct'))}")
    print(f"  With FT%: {sum(1 for s in shooters if s.get('ft_pct'))}")
    print(f"  With height data: {sum(1 for s in shooters if s.get('height_inches'))}")
    
else:
    logger.warning("No shooters found in database")
