"""
ZenRows Basketball Reference Scraper
=====================================
Scrapes player shooting statistics from Basketball-Reference.com
to populate the Elite Shooter Database.

Usage:
    python zenrows_scraper.py

Output:
    - scraped_players.json: Raw scraped data
    - elite_shooters_import.ts: TypeScript-ready import data

Requirements:
    pip install requests beautifulsoup4
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import re

# ZenRows API Configuration
ZENROWS_API_KEY = "1754b0a0648e9d56c099bb0d85577f9b921b868d"
ZENROWS_API_URL = "https://api.zenrows.com/v1/"

# Basketball Reference URLs
BASE_URL = "https://www.basketball-reference.com"

def scrape_with_zenrows(url: str, wait_selector: str = ".content") -> str:
    """
    Scrape a URL using ZenRows API with JavaScript rendering.
    """
    params = {
        'url': url,
        'apikey': ZENROWS_API_KEY,
        'js_render': 'true',
        'premium_proxy': 'true',
        'wait': '2500',
        'wait_for': wait_selector,
    }
    
    print(f"🔄 Scraping: {url}")
    response = requests.get(ZENROWS_API_URL, params=params)
    
    if response.status_code == 200:
        print(f"✅ Success: {len(response.text)} characters")
        return response.text
    else:
        print(f"❌ Error {response.status_code}: {response.text[:200]}")
        return ""

def parse_player_index(html: str) -> list:
    """
    Parse the player index page to get player links.
    Returns list of dicts with player name and URL.
    """
    soup = BeautifulSoup(html, 'html.parser')
    players = []
    
    # Find all player links in the index
    table = soup.find('table', {'id': 'players'})
    if not table:
        print("⚠️ Could not find players table")
        return players
    
    rows = table.find('tbody').find_all('tr') if table.find('tbody') else []
    
    for row in rows:
        # Skip header rows
        if row.get('class') and 'thead' in row.get('class'):
            continue
            
        name_cell = row.find('th', {'data-stat': 'player'})
        if name_cell and name_cell.find('a'):
            link = name_cell.find('a')
            player_url = BASE_URL + link['href']
            player_name = link.text.strip()
            
            # Get basic info from the row
            year_min = row.find('td', {'data-stat': 'year_min'})
            year_max = row.find('td', {'data-stat': 'year_max'})
            pos = row.find('td', {'data-stat': 'pos'})
            height = row.find('td', {'data-stat': 'height'})
            weight = row.find('td', {'data-stat': 'weight'})
            
            players.append({
                'name': player_name,
                'url': player_url,
                'year_start': year_min.text.strip() if year_min else '',
                'year_end': year_max.text.strip() if year_max else '',
                'position': pos.text.strip() if pos else '',
                'height': height.text.strip() if height else '',
                'weight': weight.text.strip() if weight else '',
            })
    
    print(f"📋 Found {len(players)} players on index page")
    return players

def parse_player_page(html: str, basic_info: dict) -> dict:
    """
    Parse individual player page for detailed shooting stats.
    """
    soup = BeautifulSoup(html, 'html.parser')
    
    player_data = {
        **basic_info,
        'career_3pt_pct': None,
        'career_ft_pct': None,
        'career_fg_pct': None,
        'teams': [],
        'achievements': [],
    }
    
    # Get career stats from footer of stats table
    career_row = soup.find('tfoot')
    if career_row:
        tr = career_row.find('tr')
        if tr:
            # 3PT%
            fg3_pct = tr.find('td', {'data-stat': 'fg3_pct'})
            if fg3_pct and fg3_pct.text.strip():
                try:
                    player_data['career_3pt_pct'] = float(fg3_pct.text.strip()) * 100
                except:
                    pass
            
            # FT%
            ft_pct = tr.find('td', {'data-stat': 'ft_pct'})
            if ft_pct and ft_pct.text.strip():
                try:
                    player_data['career_ft_pct'] = float(ft_pct.text.strip()) * 100
                except:
                    pass
            
            # FG%
            fg_pct = tr.find('td', {'data-stat': 'fg_pct'})
            if fg_pct and fg_pct.text.strip():
                try:
                    player_data['career_fg_pct'] = float(fg_pct.text.strip()) * 100
                except:
                    pass
    
    # Get teams from stats table
    stats_table = soup.find('table', {'id': 'per_game'})
    if stats_table:
        team_cells = stats_table.find_all('td', {'data-stat': 'team_id'})
        teams = set()
        for cell in team_cells:
            if cell.text.strip() and cell.text.strip() != 'TOT':
                teams.add(cell.text.strip())
        player_data['teams'] = list(teams)
    
    # Get achievements/accolades from bling section
    bling = soup.find('ul', {'id': 'bling'})
    if bling:
        achievements = [li.text.strip() for li in bling.find_all('li')]
        player_data['achievements'] = achievements
    
    return player_data

def height_to_inches(height_str: str) -> int:
    """Convert height string (e.g., '6-3') to inches."""
    try:
        if '-' in height_str:
            feet, inches = height_str.split('-')
            return int(feet) * 12 + int(inches)
    except:
        pass
    return 75  # Default height

def position_to_enum(pos_str: str) -> str:
    """Convert position string to EliteShooter position enum."""
    pos_map = {
        'PG': 'POINT_GUARD',
        'SG': 'SHOOTING_GUARD',
        'SF': 'SMALL_FORWARD',
        'PF': 'POWER_FORWARD',
        'C': 'CENTER',
        'G': 'GUARD',
        'F': 'FORWARD',
        'G-F': 'GUARD',
        'F-G': 'FORWARD',
        'F-C': 'POWER_FORWARD',
        'C-F': 'CENTER',
    }
    return pos_map.get(pos_str.upper(), 'SHOOTING_GUARD')

def determine_tier(career_3pt_pct: float, achievements: list) -> str:
    """Determine shooter tier based on stats and achievements."""
    achievement_text = ' '.join(achievements).lower()
    
    # Check for legendary indicators
    if career_3pt_pct and career_3pt_pct >= 42:
        if any(x in achievement_text for x in ['mvp', 'champion', 'hall of fame', 'hof', 'all-star']):
            return 'legendary'
    
    if career_3pt_pct and career_3pt_pct >= 40:
        if any(x in achievement_text for x in ['all-star', 'all-nba', 'champion']):
            return 'elite'
        return 'great'
    
    if career_3pt_pct and career_3pt_pct >= 37:
        return 'great'
    
    if career_3pt_pct and career_3pt_pct >= 35:
        return 'good'
    
    return 'good'

def calculate_score(tier: str, career_3pt_pct: float) -> int:
    """Calculate overall score based on tier and 3PT%."""
    base_scores = {
        'legendary': 95,
        'elite': 88,
        'great': 78,
        'good': 70
    }
    base = base_scores.get(tier, 70)
    
    # Add bonus for high 3PT%
    if career_3pt_pct:
        if career_3pt_pct >= 45:
            base += 4
        elif career_3pt_pct >= 42:
            base += 3
        elif career_3pt_pct >= 40:
            base += 2
        elif career_3pt_pct >= 38:
            base += 1
    
    return min(99, base)

def convert_to_elite_shooter(player_data: dict, id_counter: int) -> dict:
    """Convert scraped player data to EliteShooter format."""
    tier = determine_tier(
        player_data.get('career_3pt_pct'),
        player_data.get('achievements', [])
    )
    
    score = calculate_score(tier, player_data.get('career_3pt_pct'))
    
    era = f"{player_data.get('year_start', '')}-{player_data.get('year_end', '')}"
    
    teams = player_data.get('teams', [])
    team_str = teams[0] if len(teams) == 1 else 'Multiple Teams'
    
    return {
        'id': id_counter,
        'name': player_data['name'],
        'team': team_str,
        'league': 'NBA',
        'tier': tier,
        'era': era,
        'careerPct': player_data.get('career_3pt_pct'),
        'careerFreeThrowPct': player_data.get('career_ft_pct', 80),
        'achievements': ', '.join(player_data.get('achievements', [])[:3]),
        'position': position_to_enum(player_data.get('position', 'SG')),
        'height': height_to_inches(player_data.get('height', '6-3')),
        'weight': int(player_data.get('weight', 200)) if player_data.get('weight') else 200,
        'overallScore': score,
        'formCategory': 'EXCELLENT' if tier in ['legendary', 'elite'] else 'GOOD',
    }

def generate_typescript_code(players: list) -> str:
    """Generate TypeScript code for importing players."""
    lines = [
        "// Auto-generated from Basketball Reference scrape",
        "// Add these to eliteShooters.ts",
        "",
        "const scrapedPlayers: Partial<EliteShooter>[] = ["
    ]
    
    for p in players:
        lines.append(f"  {{")
        lines.append(f"    id: {p['id']},")
        lines.append(f"    name: \"{p['name']}\",")
        lines.append(f"    team: \"{p['team']}\",")
        lines.append(f"    league: \"{p['league']}\",")
        lines.append(f"    tier: \"{p['tier']}\",")
        lines.append(f"    era: \"{p['era']}\",")
        if p.get('careerPct'):
            lines.append(f"    careerPct: {p['careerPct']:.1f},")
        lines.append(f"    careerFreeThrowPct: {p.get('careerFreeThrowPct', 80):.1f},")
        lines.append(f"    achievements: \"{p.get('achievements', '')}\",")
        lines.append(f"    position: \"{p['position']}\",")
        lines.append(f"    height: {p['height']},")
        lines.append(f"    weight: {p['weight']},")
        lines.append(f"    overallScore: {p['overallScore']},")
        lines.append(f"    formCategory: \"{p['formCategory']}\",")
        lines.append(f"  }},")
    
    lines.append("];")
    return '\n'.join(lines)

def scrape_elite_shooters(letters: list = None, max_per_letter: int = 10):
    """
    Main function to scrape elite shooters from Basketball Reference.
    
    Args:
        letters: List of letters to scrape (e.g., ['a', 'b', 'c'])
        max_per_letter: Maximum players to scrape per letter (for testing)
    """
    if letters is None:
        letters = ['a']  # Start with just 'a' for testing
    
    all_players = []
    id_counter = 1000  # Start from 1000 to avoid conflicts
    
    for letter in letters:
        print(f"\n{'='*50}")
        print(f"📖 Scraping players starting with '{letter.upper()}'")
        print(f"{'='*50}")
        
        # Scrape the index page
        index_url = f"{BASE_URL}/players/{letter}/"
        index_html = scrape_with_zenrows(index_url)
        
        if not index_html:
            continue
        
        # Parse player list
        players = parse_player_index(index_html)
        
        # Filter to only players who might be good shooters
        # (We'll scrape their pages to get actual stats)
        players_to_scrape = players[:max_per_letter]
        
        for i, player in enumerate(players_to_scrape):
            print(f"\n[{i+1}/{len(players_to_scrape)}] {player['name']}")
            
            # Rate limiting - ZenRows has limits
            time.sleep(1)
            
            # Scrape player page
            player_html = scrape_with_zenrows(player['url'], wait_selector='#per_game')
            
            if player_html:
                detailed_data = parse_player_page(player_html, player)
                
                # Only include players with 3PT data and decent percentage
                if detailed_data.get('career_3pt_pct') and detailed_data['career_3pt_pct'] >= 33:
                    elite_shooter = convert_to_elite_shooter(detailed_data, id_counter)
                    all_players.append(elite_shooter)
                    id_counter += 1
                    print(f"   ✅ Added: {detailed_data['career_3pt_pct']:.1f}% 3PT")
                else:
                    print(f"   ⏭️ Skipped: No/low 3PT data")
    
    # Save results
    print(f"\n{'='*50}")
    print(f"📊 RESULTS: {len(all_players)} elite shooters found")
    print(f"{'='*50}")
    
    # Save raw JSON
    with open('scraped_players.json', 'w') as f:
        json.dump(all_players, f, indent=2)
    print("💾 Saved: scraped_players.json")
    
    # Save TypeScript import
    ts_code = generate_typescript_code(all_players)
    with open('elite_shooters_import.ts', 'w') as f:
        f.write(ts_code)
    print("💾 Saved: elite_shooters_import.ts")
    
    return all_players

def test_single_scrape():
    """Test scraping a single page to verify ZenRows is working."""
    print("🧪 Testing ZenRows connection...")
    
    url = "https://www.basketball-reference.com/players/a/"
    html = scrape_with_zenrows(url)
    
    if html:
        # Parse and show first few players
        players = parse_player_index(html)
        print(f"\n📋 Sample players found:")
        for p in players[:5]:
            print(f"   - {p['name']} ({p['position']}) {p['year_start']}-{p['year_end']}")
        return True
    return False

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        # Just test the connection
        test_single_scrape()
    else:
        # Run full scrape (start with letter 'a' for testing)
        # To scrape more: scrape_elite_shooters(['a', 'b', 'c'], max_per_letter=20)
        scrape_elite_shooters(['a'], max_per_letter=5)









