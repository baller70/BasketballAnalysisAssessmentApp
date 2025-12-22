"""
Full A-Z Basketball Reference Scraper
======================================
Scrapes ALL NBA/ABA players from Basketball-Reference.com
and filters for elite shooters (3PT% >= 37% or FT% >= 85%)

Usage:
    python full_az_scraper.py

This will:
1. Scrape all 26 letter index pages
2. Extract player links and basic info
3. Scrape individual player pages for shooting stats
4. Filter for elite shooters only
5. Skip players already in the database
6. Output TypeScript code ready to add to eliteShooters.ts
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import re
import sys

# ZenRows API Configuration
ZENROWS_API_KEY = "5598362eb2f2a524c0065d4251b623618ffdba75"
ZENROWS_API_URL = "https://api.zenrows.com/v1/"

# Basketball Reference URLs
BASE_URL = "https://www.basketball-reference.com"

# Minimum thresholds for elite shooters
MIN_3PT_PCT = 37.0  # Career 3PT%
MIN_FT_PCT = 85.0   # Career FT%
MIN_3PT_ATTEMPTS = 200  # Minimum 3PT attempts to qualify

# Players already in database (DO NOT ADD)
EXISTING_PLAYERS = {
    # Original NBA shooters
    "Stephen Curry", "Ray Allen", "Reggie Miller", "Klay Thompson", "Larry Bird",
    "Kevin Durant", "Dirk Nowitzki", "Steve Nash", "Kyle Korver", "Steve Kerr",
    "Mark Price", "Dale Ellis", "Peja Stojaković", "Damian Lillard", "James Harden",
    "JJ Redick", "Hubert Davis", "Dražen Petrović", "Joe Harris", "Craig Hodges",
    "Chris Mullin", "Dell Curry", "Mitch Richmond", "Rick Barry", "Paul Pierce",
    "Vince Carter", "Jason Terry", "Kyle Lowry", "Buddy Hield", "Paul George",
    "Joe Johnson", "Mike Conley", "Kyrie Irving", "Chris Paul", "Chauncey Billups",
    "Seth Curry", "Jason Kapono", "Glen Rice", "Allan Houston", "Hersey Hawkins",
    "Michael Redd", "Bradley Beal", "Donovan Mitchell", "Kemba Walker", "Jeff Hornacek",
    "Danny Green", "Dennis Scott", "Carmelo Anthony", "Kevin Love", "Dan Majerle",
    "J.R. Smith", "Wesley Matthews", "Tim Legler", "Steve Novak", "B.J. Armstrong",
    "Wesley Person", "Anthony Morrow", "Matt Bonner", "Dana Barros", "Joe Ingles",
    "Ben Gordon", "Rashard Lewis", "Nicolas Batum", "Jason Richardson", "Toni Kukoc",
    "Bruce Bowen", "Fred Hoiberg", "Steve Smith", "Jamal Crawford", "Michael Adams",
    # Newly added shooters (batch 1)
    "Luke Kennard", "Duncan Robinson", "Desmond Bane", "Kevin Huerter", "Malik Beasley",
    "Davis Bertans", "Bojan Bogdanović", "Patty Mills", "Evan Fournier", "Donte DiVincenzo",
    "Max Strus", "Sam Hauser", "Quentin Grimes", "Coby White", "Anfernee Simons",
    "Tyrese Haliburton", "Trae Young", "Khris Middleton", "Marco Belinelli", "Channing Frye",
    "Ryan Anderson", "Mike Miller", "Shane Battier", "James Jones", "Mike Dunleavy Jr.",
    "Wally Szczerbiak", "Eddie House", "Anthony Parker", "Michael Finley", "Quentin Richardson",
    "Vladimir Radmanović", "Brent Barry", "Jason Williams", "Derek Fisher", "Robert Horry",
    "Steve Blake", "Raja Bell", "Eddie Jones", "Detlef Schrempf", "John Starks",
    "Vinnie Johnson", "John Paxson", "Craig Ehlo", "Trent Tucker", "Danny Ainge",
    "World B. Free", "Louie Dampier", "Billy Keller", "Freddie Lewis", "Darel Carrier", "Glen Combs",
    # A-Z Scrape additions (batch 2)
    "Mahmoud Abdul-Rauf", "Álex Abrines", "Cliff Alexander", "Jon Barry", "Tony Battie",
    "Keith Bogans", "Matt Bullard", "Jud Buechler", "José Calderón", "Brian Cardinal",
    "Matt Carroll", "Sam Cassell", "Antonio Daniels", "Baron Davis", "Ed Davis",
    "Wayne Ellington", "Mario Elie", "Sean Elliott", "Jordan Farmar", "Raymond Felton",
    "Manu Ginóbili", "Drew Gooden", "Devean George", "Richard Hamilton", "Anfernee Hardaway",
    "Tim Hardaway", "Tim Hardaway Jr.", "Tobias Harris", "Udonis Haslem", "Ersan İlyasova",
    "Andre Iguodala", "Jaren Jackson Jr.", "Mike James", "Antawn Jamison", "Shawn Kemp",
    "Jason Kidd", "Andrei Kirilenko", "Bill Laimbeer", "Zach LaVine", "Kawhi Leonard",
    "Shaun Livingston", "Karl Malone", "Stephon Marbury", "Shawn Marion", "Jamal Mashburn",
    "Tracy McGrady", "CJ McCollum", "Antonio McDyess", "Jameer Nelson", "Lamar Odom",
    "Jermaine O'Neal", "Gary Payton", "Gary Payton II", "Scottie Pippen", "Terry Porter",
    "Norman Powell", "Theo Ratliff", "J.R. Reid", "Doc Rivers", "David Robinson",
    "Nate Robinson", "Rajon Rondo", "John Salley", "Ralph Sampson", "Brian Shaw",
    "Jerry Stackhouse", "John Stockton", "Amar'e Stoudemire", "Isiah Thomas", "Isaiah Thomas",
    "Tyrus Thomas", "Fred VanVleet", "Ben Wallace", "Rasheed Wallace", "Gerald Wallace",
    "Dwyane Wade", "Chris Webber", "Russell Westbrook", "Andrew Wiggins", "Dominique Wilkins",
    "Corliss Williamson", "Nick Young", "Thaddeus Young",
    # WNBA (skip these)
    "Diana Taurasi", "Sue Bird", "Elena Delle Donne", "Allie Quigley", "Maya Moore",
    "Becky Hammon", "Katie Smith", "Sabrina Ionescu", "Kelsey Plum", "Jewell Loyd",
    # NCAA (skip these)
    "Pete Maravich", "Jimmer Fredette", "Caitlin Clark", "Jackie Stiles", "Doug McDermott",
    "Antoine Davis", "Fletcher Magee", "Travis Bader",
}

# Track API calls
api_calls = 0
MAX_API_CALLS = 900  # Leave buffer from 1000 free tier

def scrape_with_zenrows(url: str, wait_selector: str = None) -> str:
    """Scrape a URL using ZenRows API."""
    global api_calls
    
    if api_calls >= MAX_API_CALLS:
        print(f"⚠️ API call limit reached ({MAX_API_CALLS})")
        return ""
    
    params = {
        'url': url,
        'apikey': ZENROWS_API_KEY,
        'js_render': 'true',
        'premium_proxy': 'true',
    }
    
    if wait_selector:
        params['wait_for'] = wait_selector
        params['wait'] = '2000'
    
    try:
        print(f"🔄 [{api_calls + 1}] Scraping: {url[:80]}...")
        response = requests.get(ZENROWS_API_URL, params=params, timeout=60)
        api_calls += 1
        
        if response.status_code == 200:
            print(f"   ✅ Success ({len(response.text)} chars)")
            return response.text
        else:
            print(f"   ❌ Error {response.status_code}")
            return ""
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        api_calls += 1
        return ""

def parse_player_index(html: str) -> list:
    """Parse player index page to get player info."""
    soup = BeautifulSoup(html, 'html.parser')
    players = []
    
    # Find the players table
    table = soup.find('table', {'id': 'players'})
    if not table:
        # Try alternate table structure
        table = soup.find('table')
    
    if not table:
        print("   ⚠️ No table found")
        return players
    
    tbody = table.find('tbody')
    rows = tbody.find_all('tr') if tbody else table.find_all('tr')
    
    for row in rows:
        # Skip header rows
        if row.get('class') and 'thead' in ' '.join(row.get('class', [])):
            continue
        
        # Get player name and link
        name_cell = row.find('th', {'data-stat': 'player'})
        if not name_cell:
            name_cell = row.find('td', {'data-stat': 'player'})
        
        if name_cell:
            link = name_cell.find('a')
            if link:
                player_name = link.text.strip()
                player_url = link.get('href', '')
                
                # Skip if already in database
                if player_name in EXISTING_PLAYERS:
                    continue
                
                # Get other info
                year_min = row.find('td', {'data-stat': 'year_min'})
                year_max = row.find('td', {'data-stat': 'year_max'})
                pos = row.find('td', {'data-stat': 'pos'})
                height = row.find('td', {'data-stat': 'height'})
                weight = row.find('td', {'data-stat': 'weight'})
                
                players.append({
                    'name': player_name,
                    'url': BASE_URL + player_url if player_url.startswith('/') else player_url,
                    'year_start': year_min.text.strip() if year_min else '',
                    'year_end': year_max.text.strip() if year_max else '',
                    'position': pos.text.strip() if pos else '',
                    'height': height.text.strip() if height else '',
                    'weight': weight.text.strip() if weight else '',
                })
    
    return players

def parse_player_stats(html: str) -> dict:
    """Parse player page for career shooting stats."""
    soup = BeautifulSoup(html, 'html.parser')
    
    stats = {
        'career_3pt_pct': None,
        'career_ft_pct': None,
        'career_3pt_attempts': 0,
        'teams': [],
        'achievements': [],
    }
    
    # Look for career totals in footer
    for table_id in ['per_game', 'totals', 'per_minute', 'per_poss']:
        table = soup.find('table', {'id': table_id})
        if table:
            tfoot = table.find('tfoot')
            if tfoot:
                career_row = tfoot.find('tr')
                if career_row:
                    # 3PT%
                    fg3_pct = career_row.find('td', {'data-stat': 'fg3_pct'})
                    if fg3_pct and fg3_pct.text.strip():
                        try:
                            val = float(fg3_pct.text.strip())
                            stats['career_3pt_pct'] = val * 100 if val < 1 else val
                        except:
                            pass
                    
                    # FT%
                    ft_pct = career_row.find('td', {'data-stat': 'ft_pct'})
                    if ft_pct and ft_pct.text.strip():
                        try:
                            val = float(ft_pct.text.strip())
                            stats['career_ft_pct'] = val * 100 if val < 1 else val
                        except:
                            pass
                    
                    # 3PT attempts
                    fg3a = career_row.find('td', {'data-stat': 'fg3a'})
                    if fg3a and fg3a.text.strip():
                        try:
                            stats['career_3pt_attempts'] = int(float(fg3a.text.strip()))
                        except:
                            pass
                    
                    break
    
    # Get teams
    for table_id in ['per_game', 'totals']:
        table = soup.find('table', {'id': table_id})
        if table:
            team_cells = table.find_all('td', {'data-stat': 'team_id'})
            teams = set()
            for cell in team_cells:
                team = cell.text.strip()
                if team and team != 'TOT':
                    teams.add(team)
            stats['teams'] = list(teams)
            break
    
    # Get achievements from bling section
    bling = soup.find('ul', {'id': 'bling'})
    if bling:
        stats['achievements'] = [li.text.strip() for li in bling.find_all('li')][:5]
    
    return stats

def is_elite_shooter(stats: dict) -> bool:
    """Check if player qualifies as elite shooter."""
    three_pct = stats.get('career_3pt_pct')
    ft_pct = stats.get('career_ft_pct')
    attempts = stats.get('career_3pt_attempts', 0)
    
    # Must have minimum attempts to qualify for 3PT%
    if three_pct and three_pct >= MIN_3PT_PCT and attempts >= MIN_3PT_ATTEMPTS:
        return True
    
    # High FT% can also qualify (indicates good shooting touch)
    if ft_pct and ft_pct >= MIN_FT_PCT and three_pct and three_pct >= 33:
        return True
    
    return False

def height_to_inches(height_str: str) -> int:
    """Convert height string to inches."""
    try:
        if '-' in height_str:
            parts = height_str.split('-')
            return int(parts[0]) * 12 + int(parts[1])
    except:
        pass
    return 76  # Default 6'4"

def position_to_enum(pos_str: str) -> str:
    """Convert position to enum."""
    pos_map = {
        'PG': 'POINT_GUARD', 'G': 'GUARD', 'SG': 'SHOOTING_GUARD',
        'SF': 'SMALL_FORWARD', 'F': 'FORWARD', 'PF': 'POWER_FORWARD',
        'C': 'CENTER', 'G-F': 'GUARD', 'F-G': 'FORWARD', 'F-C': 'POWER_FORWARD',
    }
    return pos_map.get(pos_str.upper().split('-')[0], 'SHOOTING_GUARD')

def determine_tier(three_pct: float, ft_pct: float, achievements: list) -> str:
    """Determine shooter tier."""
    ach_text = ' '.join(achievements).lower() if achievements else ''
    
    # Check for legendary indicators
    if three_pct and three_pct >= 42:
        if 'mvp' in ach_text or 'champion' in ach_text or 'hall of fame' in ach_text:
            return 'legendary'
        return 'elite'
    
    if three_pct and three_pct >= 40:
        if 'all-star' in ach_text or 'champion' in ach_text:
            return 'elite'
        return 'great'
    
    if three_pct and three_pct >= 38:
        return 'great'
    
    return 'good'

def calculate_score(tier: str, three_pct: float) -> int:
    """Calculate overall score."""
    base = {'legendary': 95, 'elite': 88, 'great': 78, 'good': 70}.get(tier, 70)
    
    if three_pct:
        if three_pct >= 44: base += 4
        elif three_pct >= 42: base += 3
        elif three_pct >= 40: base += 2
        elif three_pct >= 38: base += 1
    
    return min(99, base)

def get_nba_player_id(player_url: str) -> int:
    """Extract or estimate NBA player ID from URL."""
    # Try to extract from BBRef URL pattern
    # e.g., /players/a/abdulma02.html -> need to look up
    # For now, return a placeholder - we'll need to look these up
    match = re.search(r'/players/\w/(\w+)\.html', player_url)
    if match:
        bbref_id = match.group(1)
        # Return hash-based ID for now (we can look up real IDs later)
        return abs(hash(bbref_id)) % 9000000 + 1000000
    return 0

def format_shooter_typescript(player: dict, stats: dict) -> str:
    """Format player as TypeScript createShooter call."""
    name = player['name']
    teams = stats.get('teams', [])
    team = teams[0] if len(teams) == 1 else 'Multiple Teams'
    position = position_to_enum(player.get('position', 'SG'))
    era = f"{player.get('year_start', '')}-{player.get('year_end', '')}"
    
    three_pct = stats.get('career_3pt_pct', 0) or 0
    ft_pct = stats.get('career_ft_pct', 80) or 80
    achievements = ', '.join(stats.get('achievements', [])[:3]) or 'NBA Player'
    
    tier = determine_tier(three_pct, ft_pct, stats.get('achievements', []))
    score = calculate_score(tier, three_pct)
    form_cat = 'EXCELLENT' if tier in ['legendary', 'elite'] else 'GOOD'
    
    height = height_to_inches(player.get('height', '6-4'))
    weight = int(player.get('weight', 200)) if player.get('weight') else 200
    
    # Get NBA player ID (placeholder for now)
    nba_id = get_nba_player_id(player.get('url', ''))
    
    return f'  createShooter({{ id: idCounter++, name: "{name}", team: "{team}", league: "NBA", tier: "{tier}", era: "{era}", careerPct: {three_pct:.1f}, careerFreeThrowPct: {ft_pct:.1f}, achievements: "{achievements}", photoUrl: nbaPhoto({nba_id}), measurements: genMeasurements(\'{tier}\'), overallScore: {score}, formCategory: \'{form_cat}\', position: \'{position}\', height: {height}, weight: {weight} }}),'

def scrape_letter(letter: str) -> list:
    """Scrape all elite shooters for a given letter."""
    elite_shooters = []
    
    # Scrape index page
    index_url = f"{BASE_URL}/players/{letter}/"
    html = scrape_with_zenrows(index_url)
    
    if not html:
        return elite_shooters
    
    # Parse player list
    players = parse_player_index(html)
    print(f"   📋 Found {len(players)} new players (excluding existing)")
    
    # For efficiency, we'll check a sample of players per letter
    # to avoid using all API calls on one letter
    max_per_letter = 15
    checked = 0
    
    for player in players:
        if checked >= max_per_letter:
            break
        
        if api_calls >= MAX_API_CALLS:
            break
        
        # Rate limiting
        time.sleep(0.5)
        
        # Scrape player page
        player_html = scrape_with_zenrows(player['url'])
        checked += 1
        
        if not player_html:
            continue
        
        # Parse stats
        stats = parse_player_stats(player_html)
        
        # Check if elite shooter
        if is_elite_shooter(stats):
            ts_code = format_shooter_typescript(player, stats)
            elite_shooters.append({
                'name': player['name'],
                'three_pct': stats.get('career_3pt_pct'),
                'ft_pct': stats.get('career_ft_pct'),
                'typescript': ts_code
            })
            print(f"   🏀 ELITE: {player['name']} - {stats.get('career_3pt_pct', 0):.1f}% 3PT")
        else:
            three = stats.get('career_3pt_pct', 0) or 0
            print(f"   ⏭️ Skip: {player['name']} - {three:.1f}% 3PT")
    
    return elite_shooters

def main():
    """Main scraping function."""
    print("=" * 60)
    print("🏀 FULL A-Z BASKETBALL REFERENCE SCRAPER")
    print("=" * 60)
    print(f"Looking for: 3PT% >= {MIN_3PT_PCT}% OR FT% >= {MIN_FT_PCT}%")
    print(f"API call limit: {MAX_API_CALLS}")
    print("=" * 60)
    
    all_elite_shooters = []
    letters = 'abcdefghijklmnopqrstuvwxyz'
    
    for letter in letters:
        if api_calls >= MAX_API_CALLS:
            print(f"\n⚠️ API limit reached at letter '{letter}'")
            break
        
        print(f"\n{'='*40}")
        print(f"📖 LETTER: {letter.upper()}")
        print(f"{'='*40}")
        
        shooters = scrape_letter(letter)
        all_elite_shooters.extend(shooters)
        
        print(f"   ✅ Found {len(shooters)} elite shooters for '{letter.upper()}'")
        print(f"   📊 Total so far: {len(all_elite_shooters)}")
        print(f"   🔢 API calls used: {api_calls}/{MAX_API_CALLS}")
    
    # Output results
    print("\n" + "=" * 60)
    print(f"🏆 FINAL RESULTS: {len(all_elite_shooters)} NEW ELITE SHOOTERS")
    print("=" * 60)
    
    # Save TypeScript code
    ts_lines = [
        "// NEW Elite Shooters from A-Z Scrape",
        "// Add these to NBA_SHOOTERS array in eliteShooters.ts",
        ""
    ]
    
    for shooter in all_elite_shooters:
        ts_lines.append(shooter['typescript'])
        print(f"  • {shooter['name']}: {shooter['three_pct']:.1f}% 3PT")
    
    # Save to file
    output_file = 'az_scraped_shooters.ts'
    with open(output_file, 'w') as f:
        f.write('\n'.join(ts_lines))
    
    print(f"\n💾 Saved to: {output_file}")
    print(f"📊 Total API calls used: {api_calls}")
    
    # Also save JSON for reference
    with open('az_scraped_shooters.json', 'w') as f:
        json.dump(all_elite_shooters, f, indent=2)
    
    return all_elite_shooters

if __name__ == "__main__":
    main()

