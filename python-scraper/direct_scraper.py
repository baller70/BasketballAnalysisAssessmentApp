"""
Direct Basketball Reference Scraper
====================================
Scrapes NBA/ABA players directly from Basketball-Reference.com
without using ZenRows API.

Uses rotating user agents and delays to be respectful.
"""

import requests
from bs4 import BeautifulSoup
import time
import random
import re

# User agents to rotate
USER_AGENTS = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
]

# Basketball Reference URLs
BASE_URL = "https://www.basketball-reference.com"

# Minimum thresholds for elite shooters
MIN_3PT_PCT = 37.0
MIN_FT_PCT = 85.0
MIN_3PT_ATTEMPTS = 200

# Players already in database
EXISTING_PLAYERS = {
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
    "Corliss Williamson", "Nick Young", "Thaddeus Young", "Doug McDermott", "Grayson Allen",
}

def get_session():
    """Create a requests session with headers."""
    session = requests.Session()
    session.headers.update({
        'User-Agent': random.choice(USER_AGENTS),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    })
    return session

def scrape_url(session, url, retries=3):
    """Scrape a URL with retries and delays."""
    for attempt in range(retries):
        try:
            # Random delay between requests (1-3 seconds)
            time.sleep(random.uniform(1.5, 3.5))
            
            # Rotate user agent
            session.headers['User-Agent'] = random.choice(USER_AGENTS)
            
            response = session.get(url, timeout=30)
            
            if response.status_code == 200:
                return response.text
            elif response.status_code == 429:  # Rate limited
                print(f"   ⚠️ Rate limited, waiting 30 seconds...")
                time.sleep(30)
            else:
                print(f"   ❌ HTTP {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Error: {e}")
            time.sleep(5)
    
    return None

def parse_player_index(html):
    """Parse player index page to get player info."""
    soup = BeautifulSoup(html, 'html.parser')
    players = []
    
    table = soup.find('table', {'id': 'players'})
    if not table:
        return players
    
    tbody = table.find('tbody')
    rows = tbody.find_all('tr') if tbody else []
    
    for row in rows:
        if row.get('class') and 'thead' in ' '.join(row.get('class', [])):
            continue
        
        name_cell = row.find('th', {'data-stat': 'player'})
        if not name_cell:
            continue
            
        link = name_cell.find('a')
        if not link:
            continue
            
        player_name = link.text.strip()
        
        # Skip if already in database
        if player_name in EXISTING_PLAYERS:
            continue
        
        player_url = link.get('href', '')
        
        # Get other info from the row
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

def parse_player_stats(html):
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
    for table_id in ['per_game', 'totals']:
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

def is_elite_shooter(stats):
    """Check if player qualifies as elite shooter."""
    three_pct = stats.get('career_3pt_pct')
    ft_pct = stats.get('career_ft_pct')
    attempts = stats.get('career_3pt_attempts', 0)
    
    # Must have minimum attempts to qualify for 3PT%
    if three_pct and three_pct >= MIN_3PT_PCT and attempts >= MIN_3PT_ATTEMPTS:
        return True
    
    # High FT% with decent 3PT can also qualify
    if ft_pct and ft_pct >= MIN_FT_PCT and three_pct and three_pct >= 33:
        return True
    
    return False

def height_to_inches(height_str):
    """Convert height string to inches."""
    try:
        if '-' in height_str:
            parts = height_str.split('-')
            return int(parts[0]) * 12 + int(parts[1])
    except:
        pass
    return 76

def position_to_enum(pos_str):
    """Convert position to enum."""
    pos_map = {
        'PG': 'POINT_GUARD', 'G': 'GUARD', 'SG': 'SHOOTING_GUARD',
        'SF': 'SMALL_FORWARD', 'F': 'FORWARD', 'PF': 'POWER_FORWARD',
        'C': 'CENTER', 'G-F': 'GUARD', 'F-G': 'FORWARD', 'F-C': 'POWER_FORWARD',
    }
    return pos_map.get(pos_str.upper().split('-')[0], 'SHOOTING_GUARD')

def determine_tier(three_pct, ft_pct, achievements):
    """Determine shooter tier."""
    ach_text = ' '.join(achievements).lower() if achievements else ''
    
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

def calculate_score(tier, three_pct):
    """Calculate overall score."""
    base = {'legendary': 95, 'elite': 88, 'great': 78, 'good': 70}.get(tier, 70)
    
    if three_pct:
        if three_pct >= 44: base += 4
        elif three_pct >= 42: base += 3
        elif three_pct >= 40: base += 2
        elif three_pct >= 38: base += 1
    
    return min(99, base)

def get_nba_player_id(player_url):
    """Extract player ID hash from URL."""
    match = re.search(r'/players/\w/(\w+)\.html', player_url)
    if match:
        bbref_id = match.group(1)
        return abs(hash(bbref_id)) % 9000000 + 1000000
    return 0

def format_shooter_typescript(player, stats):
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
    
    nba_id = get_nba_player_id(player.get('url', ''))
    
    return f'  createShooter({{ id: idCounter++, name: "{name}", team: "{team}", league: "NBA", tier: "{tier}", era: "{era}", careerPct: {three_pct:.1f}, careerFreeThrowPct: {ft_pct:.1f}, achievements: "{achievements}", photoUrl: nbaPhoto({nba_id}), measurements: genMeasurements(\'{tier}\'), overallScore: {score}, formCategory: \'{form_cat}\', position: \'{position}\', height: {height}, weight: {weight} }}),'

def scrape_letter(session, letter, max_players=10):
    """Scrape elite shooters for a given letter."""
    elite_shooters = []
    
    # Scrape index page
    index_url = f"{BASE_URL}/players/{letter}/"
    print(f"🔄 Scraping index: {index_url}")
    
    html = scrape_url(session, index_url)
    if not html:
        print("   ❌ Failed to get index page")
        return elite_shooters
    
    # Parse player list
    players = parse_player_index(html)
    print(f"   📋 Found {len(players)} new players (excluding existing)")
    
    checked = 0
    for player in players:
        if checked >= max_players:
            break
        
        print(f"🔄 [{checked+1}/{max_players}] Checking: {player['name']}")
        
        player_html = scrape_url(session, player['url'])
        checked += 1
        
        if not player_html:
            continue
        
        stats = parse_player_stats(player_html)
        
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
            print(f"   ⏭️ Skip: {three:.1f}% 3PT")
    
    return elite_shooters

def main():
    """Main scraping function."""
    print("=" * 60)
    print("🏀 DIRECT BASKETBALL REFERENCE SCRAPER")
    print("=" * 60)
    print(f"Looking for: 3PT% >= {MIN_3PT_PCT}% OR FT% >= {MIN_FT_PCT}%")
    print("=" * 60)
    
    session = get_session()
    all_elite_shooters = []
    letters = 'abcdefghijklmnopqrstuvwxyz'
    
    for letter in letters:
        print(f"\n{'='*40}")
        print(f"📖 LETTER: {letter.upper()}")
        print(f"{'='*40}")
        
        shooters = scrape_letter(session, letter, max_players=8)
        all_elite_shooters.extend(shooters)
        
        print(f"   ✅ Found {len(shooters)} elite shooters for '{letter.upper()}'")
        print(f"   📊 Total so far: {len(all_elite_shooters)}")
        
        # Longer delay between letters
        time.sleep(random.uniform(3, 6))
    
    # Output results
    print("\n" + "=" * 60)
    print(f"🏆 FINAL RESULTS: {len(all_elite_shooters)} NEW ELITE SHOOTERS")
    print("=" * 60)
    
    ts_lines = [
        "// NEW Elite Shooters from Direct A-Z Scrape",
        "// Add these to NBA_SHOOTERS array in eliteShooters.ts",
        ""
    ]
    
    for shooter in all_elite_shooters:
        ts_lines.append(shooter['typescript'])
        print(f"  • {shooter['name']}: {shooter['three_pct']:.1f}% 3PT")
    
    output_file = 'direct_scraped_shooters.ts'
    with open(output_file, 'w') as f:
        f.write('\n'.join(ts_lines))
    
    print(f"\n💾 Saved to: {output_file}")
    
    return all_elite_shooters

if __name__ == "__main__":
    main()




