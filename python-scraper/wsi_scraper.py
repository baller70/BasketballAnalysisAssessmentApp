#!/usr/bin/env python3
"""
WSI (Weighted Shooting Index) Basketball Reference Scraper
==========================================================
Scrapes ALL players and categorizes them using the WSI formula:

WSI = (0.45 × 3P%) + (0.35 × Mid-Range%) + (0.15 × FT%) + (0.05 × Rim FG%)

TIERS:
- legendary: WSI >= 38 (with achievements)
- elite: WSI >= 35
- great: WSI >= 30
- good: WSI >= 25
- mid-level: WSI >= 18
- bad: WSI < 18

FILTERS:
- EXCLUDES non-shooting centers (rim-only players)
- INCLUDES shooting bigs (PF/C who take 3s and mid-range)
"""

import requests
from bs4 import BeautifulSoup
import time
import random
import re
from datetime import datetime, timedelta

# Progress tracking
PROGRESS_FILE = "WSI_SCRAPER_PROGRESS.txt"
RESULTS_FILE = "wsi_scraped_shooters.ts"

USER_AGENTS = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
]

BASE_URL = "https://www.basketball-reference.com"

# WSI Tier thresholds
WSI_TIERS = {
    'legendary': 38,  # With achievements
    'elite': 35,
    'great': 30,
    'good': 25,
    'mid_level': 18,
    'bad': 0  # Anything below mid_level
}

# Minimum criteria to be considered a "shooter" for bigs
MIN_3PA_PER_GAME_FOR_BIGS = 0.5  # Must attempt at least 0.5 3PA/game
MIN_GAMES_PLAYED = 50  # Must have played at least 50 games

# Players already in database (skip these)
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
    "World B. Free", "Louie Dampier", "Billy Keller", "Freddie Lewis", "Darel Carrier", 
    "Glen Combs", "Mahmoud Abdul-Rauf", "Álex Abrines", "Jon Barry", "Matt Bullard", 
    "Jud Buechler", "José Calderón", "Brian Cardinal", "Matt Carroll", "Sam Cassell", 
    "Wayne Ellington", "Mario Elie", "Sean Elliott", "Manu Ginóbili", "Richard Hamilton", 
    "Tim Hardaway", "Tim Hardaway Jr.", "Tobias Harris", "Ersan İlyasova", "Andre Iguodala", 
    "Jason Kidd", "Zach LaVine", "Kawhi Leonard", "Tracy McGrady", "CJ McCollum", 
    "Gary Payton", "Scottie Pippen", "Terry Porter", "Norman Powell", "Jerry Stackhouse", 
    "John Stockton", "Isiah Thomas", "Isaiah Thomas", "Fred VanVleet", "Dwyane Wade", 
    "Rasheed Wallace", "Russell Westbrook", "Andrew Wiggins", "Dominique Wilkins",
    "Doug McDermott", "Grayson Allen",
}

# Stats tracking
stats = {
    'start_time': None,
    'current_letter': '',
    'letters_done': 0,
    'total_letters': 26,
    'players_checked': 0,
    'players_added': 0,
    'by_tier': {'legendary': 0, 'elite': 0, 'great': 0, 'good': 0, 'mid_level': 0, 'bad': 0},
    'excluded_rim_runners': 0,
    'all_players': [],
    'errors': 0,
    'status': 'Starting...',
}

def calculate_wsi(three_pct, mid_range_pct, ft_pct, rim_pct):
    """
    Calculate Weighted Shooting Index.
    WSI = (0.45 × 3P%) + (0.35 × Mid-Range%) + (0.15 × FT%) + (0.05 × Rim FG%)
    
    All percentages should be in decimal form (e.g., 0.40 for 40%)
    Returns a score roughly 0-45 range for typical players
    """
    three = three_pct if three_pct else 0
    mid = mid_range_pct if mid_range_pct else 0
    ft = ft_pct if ft_pct else 0
    rim = rim_pct if rim_pct else 0
    
    # Convert to percentage points if needed (0.40 -> 40)
    if three <= 1: three *= 100
    if mid <= 1: mid *= 100
    if ft <= 1: ft *= 100
    if rim <= 1: rim *= 100
    
    wsi = (0.45 * three) + (0.35 * mid) + (0.15 * ft) + (0.05 * rim)
    return round(wsi, 2)

def get_tier_from_wsi(wsi, achievements=None):
    """Determine tier based on WSI score."""
    ach_text = ' '.join(achievements).lower() if achievements else ''
    has_major_achievement = any(x in ach_text for x in ['mvp', 'champion', 'hall of fame', 'all-star'])
    
    if wsi >= WSI_TIERS['legendary'] and has_major_achievement:
        return 'legendary'
    elif wsi >= WSI_TIERS['elite']:
        return 'elite'
    elif wsi >= WSI_TIERS['great']:
        return 'great'
    elif wsi >= WSI_TIERS['good']:
        return 'good'
    elif wsi >= WSI_TIERS['mid_level']:
        return 'mid_level'
    else:
        return 'bad'

def is_rim_runner(position, three_pa_per_game, fg_pct, three_pct, ft_pct):
    """
    Determine if a player is a non-shooting rim-runner to EXCLUDE.
    
    Criteria for exclusion:
    - Position is C or PF
    - Very low 3PA per game (< 0.5)
    - High FG% (> 55%) suggesting mostly layups/dunks
    - Low FT% (< 60%) suggesting poor shooting touch
    - Low or no 3PT%
    """
    if position not in ['C', 'PF', 'F-C', 'C-F']:
        return False  # Guards and forwards are not rim-runners
    
    # Check if they're a non-shooter
    low_three_attempts = three_pa_per_game < MIN_3PA_PER_GAME_FOR_BIGS
    high_fg_pct = fg_pct and fg_pct > 55  # Suggests easy shots
    low_ft_pct = ft_pct and ft_pct < 60  # Poor shooting touch
    no_three_pct = not three_pct or three_pct < 20
    
    # If multiple indicators suggest rim-runner, exclude
    rim_runner_indicators = sum([low_three_attempts, high_fg_pct, low_ft_pct, no_three_pct])
    
    return rim_runner_indicators >= 3

def update_progress_file():
    """Write current progress to file."""
    elapsed = datetime.now() - stats['start_time'] if stats['start_time'] else timedelta(0)
    
    if stats['letters_done'] > 0:
        avg_per_letter = elapsed.total_seconds() / stats['letters_done']
        remaining_letters = stats['total_letters'] - stats['letters_done']
        remaining_secs = avg_per_letter * remaining_letters
        eta = datetime.now() + timedelta(seconds=remaining_secs)
        eta_str = eta.strftime('%I:%M:%S %p')
        remaining_str = str(timedelta(seconds=int(remaining_secs)))
    else:
        eta_str = "Calculating..."
        remaining_str = "Calculating..."
    
    progress_pct = (stats['letters_done'] / stats['total_letters']) * 100
    bar_width = 30
    filled = int(bar_width * stats['letters_done'] / stats['total_letters'])
    bar = '█' * filled + '░' * (bar_width - filled)
    
    content = f"""
╔══════════════════════════════════════════════════════════════════╗
║         🏀 WSI SCRAPER - ALL SKILL LEVELS 🏀                     ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Progress: [{bar}] {progress_pct:5.1f}%      ║
║                                                                  ║
║  Current Letter:      {stats['current_letter'].upper():^10}                            ║
║  Letters Done:        {stats['letters_done']:>3} / {stats['total_letters']}                                ║
║  Players Checked:     {stats['players_checked']:>5}                                    ║
║  Players Added:       {stats['players_added']:>5}  ✅                                ║
║  Rim-Runners Excluded:{stats['excluded_rim_runners']:>5}  🚫                                ║
║  Errors:              {stats['errors']:>5}                                    ║
║                                                                  ║
║  ⏱️  Time Elapsed:     {str(elapsed).split('.')[0]:>12}                         ║
║  ⏳ Time Remaining:   {remaining_str:>12}                         ║
║  🏁 ETA:              {eta_str:>12}                         ║
║                                                                  ║
║  Status: {stats['status'][:52]:<52} ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║  PLAYERS BY TIER:                                                ║
║    🏆 Legendary:  {stats['by_tier']['legendary']:>4}    ⭐ Elite:     {stats['by_tier']['elite']:>4}              ║
║    🥇 Great:      {stats['by_tier']['great']:>4}    🥈 Good:      {stats['by_tier']['good']:>4}              ║
║    🥉 Mid-Level:  {stats['by_tier']['mid_level']:>4}    ❌ Bad:       {stats['by_tier']['bad']:>4}              ║
╠══════════════════════════════════════════════════════════════════╣
║  RECENT ADDITIONS:                                               ║
"""
    
    # Show last 8 players added
    for player in stats['all_players'][-8:]:
        name = player['name'][:22]
        tier = player['tier'][:8]
        wsi = player['wsi']
        content += f"║    • {name:<22} {tier:<8} WSI:{wsi:>5.1f}        ║\n"
    
    if not stats['all_players']:
        content += "║    (none yet)                                              ║\n"
    
    content += f"""╠══════════════════════════════════════════════════════════════════╣
║  📁 Results: {RESULTS_FILE:<40}       ║
║  🔄 This file updates every few seconds                          ║
╚══════════════════════════════════════════════════════════════════╝

Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

WSI Formula: (0.45 × 3P%) + (0.35 × Mid-Range%) + (0.15 × FT%) + (0.05 × Rim%)
"""
    
    with open(PROGRESS_FILE, 'w') as f:
        f.write(content)

def print_status(msg):
    stats['status'] = msg
    print(f"\r{msg[:80]:<80}", end='', flush=True)
    update_progress_file()

def get_session():
    session = requests.Session()
    session.headers.update({
        'User-Agent': random.choice(USER_AGENTS),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    })
    return session

def scrape_url(session, url):
    for attempt in range(3):
        try:
            time.sleep(random.uniform(1.0, 2.0))
            session.headers['User-Agent'] = random.choice(USER_AGENTS)
            response = session.get(url, timeout=20)
            if response.status_code == 200:
                return response.text
            elif response.status_code == 429:
                print_status(f"⚠️ Rate limited, waiting 20s...")
                time.sleep(20)
            else:
                stats['errors'] += 1
        except Exception as e:
            stats['errors'] += 1
            time.sleep(3)
    return None

def parse_player_index(html):
    """Parse player index page."""
    soup = BeautifulSoup(html, 'html.parser')
    players = []
    table = soup.find('table', {'id': 'players'})
    if not table:
        return players
    
    tbody = table.find('tbody')
    rows = tbody.find_all('tr') if tbody else []
    
    for row in rows:
        name_cell = row.find('th', {'data-stat': 'player'})
        if not name_cell:
            continue
        link = name_cell.find('a')
        if not link:
            continue
        
        player_name = link.text.strip()
        if player_name in EXISTING_PLAYERS:
            continue
        
        player_url = link.get('href', '')
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

def parse_player_detailed_stats(html):
    """
    Parse player page for detailed shooting stats needed for WSI.
    Returns: 3P%, estimated mid-range%, FT%, rim FG%, plus other stats
    """
    soup = BeautifulSoup(html, 'html.parser')
    
    result = {
        'three_pct': None,
        'mid_range_pct': None,  # Estimated from 2P% - rim%
        'ft_pct': None,
        'rim_pct': None,
        'fg_pct': None,
        'two_pct': None,
        'games': 0,
        'three_pa_per_game': 0,
        'teams': [],
        'achievements': [],
    }
    
    # Get career totals from per_game or totals table
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
                            result['three_pct'] = val * 100 if val < 1 else val
                        except: pass
                    
                    # FT%
                    ft_pct = career_row.find('td', {'data-stat': 'ft_pct'})
                    if ft_pct and ft_pct.text.strip():
                        try:
                            val = float(ft_pct.text.strip())
                            result['ft_pct'] = val * 100 if val < 1 else val
                        except: pass
                    
                    # FG%
                    fg_pct = career_row.find('td', {'data-stat': 'fg_pct'})
                    if fg_pct and fg_pct.text.strip():
                        try:
                            val = float(fg_pct.text.strip())
                            result['fg_pct'] = val * 100 if val < 1 else val
                        except: pass
                    
                    # 2PT%
                    fg2_pct = career_row.find('td', {'data-stat': 'fg2_pct'})
                    if fg2_pct and fg2_pct.text.strip():
                        try:
                            val = float(fg2_pct.text.strip())
                            result['two_pct'] = val * 100 if val < 1 else val
                        except: pass
                    
                    # Games
                    games = career_row.find('td', {'data-stat': 'g'})
                    if games and games.text.strip():
                        try:
                            result['games'] = int(games.text.strip())
                        except: pass
                    
                    # 3PA per game
                    fg3a = career_row.find('td', {'data-stat': 'fg3a_per_g'})
                    if fg3a and fg3a.text.strip():
                        try:
                            result['three_pa_per_game'] = float(fg3a.text.strip())
                        except: pass
                    
                    # If no per-game 3PA, calculate from totals
                    if result['three_pa_per_game'] == 0 and result['games'] > 0:
                        fg3a_total = career_row.find('td', {'data-stat': 'fg3a'})
                        if fg3a_total and fg3a_total.text.strip():
                            try:
                                total_3pa = float(fg3a_total.text.strip())
                                result['three_pa_per_game'] = total_3pa / result['games']
                            except: pass
                    
                    break
    
    # Estimate mid-range% and rim%
    # Mid-range is roughly 2P% (which includes both mid-range and rim)
    # We'll estimate: mid-range% ≈ 2P% - 5% (rim shots are usually higher %)
    # Rim% ≈ 2P% + 10% (layups/dunks are more efficient)
    if result['two_pct']:
        result['mid_range_pct'] = max(0, result['two_pct'] - 5)
        result['rim_pct'] = min(100, result['two_pct'] + 10)
    elif result['fg_pct']:
        # Fallback: estimate from overall FG%
        result['mid_range_pct'] = result['fg_pct']
        result['rim_pct'] = min(100, result['fg_pct'] + 10)
    
    # Get teams
    for table_id in ['per_game', 'totals']:
        table = soup.find('table', {'id': table_id})
        if table:
            teams = set()
            for cell in table.find_all('td', {'data-stat': 'team_id'}):
                team = cell.text.strip()
                if team and team != 'TOT':
                    teams.add(team)
            result['teams'] = list(teams)
            break
    
    # Get achievements
    bling = soup.find('ul', {'id': 'bling'})
    if bling:
        result['achievements'] = [li.text.strip() for li in bling.find_all('li')][:5]
    
    return result

def height_to_inches(h):
    try:
        if '-' in h:
            p = h.split('-')
            return int(p[0]) * 12 + int(p[1])
    except: pass
    return 76

def pos_to_enum(p):
    m = {
        'PG': 'POINT_GUARD', 'G': 'GUARD', 'SG': 'SHOOTING_GUARD', 
        'SF': 'SMALL_FORWARD', 'F': 'FORWARD', 'PF': 'POWER_FORWARD', 
        'C': 'CENTER', 'G-F': 'GUARD', 'F-G': 'FORWARD', 'F-C': 'POWER_FORWARD',
        'C-F': 'CENTER'
    }
    return m.get(p.upper().split('-')[0], 'SHOOTING_GUARD')

def get_form_category(tier):
    """Get form category based on tier."""
    if tier in ['legendary', 'elite']:
        return 'EXCELLENT'
    elif tier in ['great', 'good']:
        return 'GOOD'
    else:
        return 'NEEDS WORK'

def get_overall_score(tier, wsi):
    """Calculate overall score based on tier and WSI."""
    base_scores = {
        'legendary': 95,
        'elite': 88,
        'great': 78,
        'good': 70,
        'mid_level': 55,
        'bad': 40
    }
    base = base_scores.get(tier, 50)
    
    # Adjust based on WSI within tier
    if tier == 'legendary':
        return min(99, base + int((wsi - 38) / 2))
    elif tier == 'elite':
        return min(94, base + int((wsi - 35) / 1.5))
    elif tier == 'great':
        return min(87, base + int((wsi - 30) / 1.5))
    elif tier == 'good':
        return min(77, base + int((wsi - 25) / 1.5))
    elif tier == 'mid_level':
        return min(69, base + int((wsi - 18) / 1.5))
    else:
        return max(30, base + int(wsi / 2))

def format_ts(player, player_stats, wsi, tier):
    """Format player as TypeScript createShooter call."""
    name = player['name'].replace('"', '\\"')
    teams = player_stats.get('teams', [])
    team = teams[0] if len(teams) == 1 else 'Multiple Teams'
    team = team.replace('"', '\\"')
    pos = pos_to_enum(player.get('position', 'SG'))
    era = f"{player.get('year_start', '')}-{player.get('year_end', '')}"
    
    three = player_stats.get('three_pct', 0) or 0
    ft = player_stats.get('ft_pct', 70) or 70
    ach = ', '.join(player_stats.get('achievements', [])[:3]) or 'NBA Player'
    ach = ach.replace('"', '\\"')
    
    form = get_form_category(tier)
    score = get_overall_score(tier, wsi)
    h = height_to_inches(player.get('height', '6-4'))
    w = int(player.get('weight', 200)) if player.get('weight') else 200
    nba_id = abs(hash(player.get('url', ''))) % 9000000 + 1000000
    
    # Convert tier for TypeScript (mid_level -> mid-level for display, but use 'good' type for now)
    ts_tier = tier if tier not in ['mid_level', 'bad'] else 'good'  # Will need to update types
    
    return f'  createShooter({{ id: idCounter++, name: "{name}", team: "{team}", league: "NBA", tier: "{ts_tier}", era: "{era}", careerPct: {three:.1f}, careerFreeThrowPct: {ft:.1f}, achievements: "{ach}", photoUrl: nbaPhoto({nba_id}), measurements: genMeasurements(\'{ts_tier}\'), overallScore: {score}, formCategory: \'{form}\', position: \'{pos}\', height: {h}, weight: {w}, wsiScore: {wsi:.1f}, shooterCategory: \'{tier}\' }}),'

def scrape_letter(session, letter, max_per_letter=15):
    """Scrape one letter for ALL skill levels."""
    players_found = []
    index_url = f"{BASE_URL}/players/{letter}/"
    
    print_status(f"📖 Letter {letter.upper()}: Fetching index...")
    html = scrape_url(session, index_url)
    if not html:
        return players_found
    
    players = parse_player_index(html)
    print_status(f"📖 Letter {letter.upper()}: Found {len(players)} new players")
    
    checked = 0
    for player in players:
        if checked >= max_per_letter:
            break
        
        stats['players_checked'] += 1
        print_status(f"📖 {letter.upper()} [{checked+1}/{max_per_letter}]: {player['name'][:25]}...")
        
        html = scrape_url(session, player['url'])
        checked += 1
        
        if not html:
            continue
        
        player_stats = parse_player_detailed_stats(html)
        
        # Skip players with too few games
        if player_stats['games'] < MIN_GAMES_PLAYED:
            continue
        
        # Check if rim-runner (exclude non-shooting bigs)
        if is_rim_runner(
            player['position'],
            player_stats['three_pa_per_game'],
            player_stats['fg_pct'],
            player_stats['three_pct'],
            player_stats['ft_pct']
        ):
            stats['excluded_rim_runners'] += 1
            print(f"\n🚫 EXCLUDED (rim-runner): {player['name']}")
            continue
        
        # Calculate WSI
        wsi = calculate_wsi(
            player_stats['three_pct'],
            player_stats['mid_range_pct'],
            player_stats['ft_pct'],
            player_stats['rim_pct']
        )
        
        # Determine tier
        tier = get_tier_from_wsi(wsi, player_stats['achievements'])
        
        # Create player data
        ts_code = format_ts(player, player_stats, wsi, tier)
        player_data = {
            'name': player['name'],
            'wsi': wsi,
            'tier': tier,
            'three_pct': player_stats.get('three_pct'),
            'ft_pct': player_stats.get('ft_pct'),
            'typescript': ts_code
        }
        
        players_found.append(player_data)
        stats['all_players'].append(player_data)
        stats['players_added'] += 1
        stats['by_tier'][tier] += 1
        
        tier_emoji = {'legendary': '🏆', 'elite': '⭐', 'great': '🥇', 'good': '🥈', 'mid_level': '🥉', 'bad': '❌'}
        print(f"\n{tier_emoji.get(tier, '•')} ADDED: {player['name']} - {tier.upper()} (WSI: {wsi:.1f})")
        
        update_progress_file()
    
    return players_found

def save_results():
    """Save results to TypeScript file."""
    lines = [
        "// ═══════════════════════════════════════════════════════════════",
        "// WSI-Rated Shooters - ALL Skill Levels",
        f"// Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"// Total Players: {len(stats['all_players'])}",
        "// ═══════════════════════════════════════════════════════════════",
        "//",
        "// WSI Formula: (0.45 × 3P%) + (0.35 × Mid-Range%) + (0.15 × FT%) + (0.05 × Rim%)",
        "//",
        f"// Legendary: {stats['by_tier']['legendary']} | Elite: {stats['by_tier']['elite']} | Great: {stats['by_tier']['great']}",
        f"// Good: {stats['by_tier']['good']} | Mid-Level: {stats['by_tier']['mid_level']} | Bad: {stats['by_tier']['bad']}",
        "//",
        "// Add these to NBA_SHOOTERS array in eliteShooters.ts",
        "// NOTE: You'll need to add 'mid_level' and 'bad' to ShooterTier type",
        "",
    ]
    
    # Group by tier
    for tier in ['legendary', 'elite', 'great', 'good', 'mid_level', 'bad']:
        tier_players = [p for p in stats['all_players'] if p['tier'] == tier]
        if tier_players:
            lines.append(f"  // === {tier.upper()} SHOOTERS ({len(tier_players)}) ===")
            for player in sorted(tier_players, key=lambda x: x['wsi'], reverse=True):
                lines.append(player['typescript'])
            lines.append("")
    
    with open(RESULTS_FILE, 'w') as f:
        f.write('\n'.join(lines))

def main():
    print("\n" + "="*65)
    print("🏀 WSI SCRAPER - ALL SKILL LEVELS (Legendary to Bad)")
    print("="*65)
    print(f"\n📁 Check progress: {PROGRESS_FILE}")
    print(f"📁 Results: {RESULTS_FILE}")
    print("\nWSI = (0.45 × 3P%) + (0.35 × Mid%) + (0.15 × FT%) + (0.05 × Rim%)")
    print("\n" + "="*65 + "\n")
    
    stats['start_time'] = datetime.now()
    session = get_session()
    
    letters = 'abcdefghijklmnopqrstuvwxyz'
    
    for letter in letters:
        stats['current_letter'] = letter
        print(f"\n\n{'='*50}")
        print(f"📖 STARTING LETTER: {letter.upper()} ({stats['letters_done']+1}/26)")
        print(f"{'='*50}")
        
        scrape_letter(session, letter, max_per_letter=12)
        
        stats['letters_done'] += 1
        update_progress_file()
        save_results()
        
        if letter != 'z':
            print_status(f"⏳ Waiting before next letter...")
            time.sleep(random.uniform(2, 4))
    
    # Final update
    stats['status'] = "✅ COMPLETE!"
    update_progress_file()
    save_results()
    
    print("\n\n" + "="*65)
    print("🏆 WSI SCRAPING COMPLETE!")
    print("="*65)
    print(f"📊 Players Checked: {stats['players_checked']}")
    print(f"✅ Players Added: {stats['players_added']}")
    print(f"🚫 Rim-Runners Excluded: {stats['excluded_rim_runners']}")
    print(f"\n📊 BY TIER:")
    print(f"   🏆 Legendary: {stats['by_tier']['legendary']}")
    print(f"   ⭐ Elite: {stats['by_tier']['elite']}")
    print(f"   🥇 Great: {stats['by_tier']['great']}")
    print(f"   🥈 Good: {stats['by_tier']['good']}")
    print(f"   🥉 Mid-Level: {stats['by_tier']['mid_level']}")
    print(f"   ❌ Bad: {stats['by_tier']['bad']}")
    print(f"\n📁 Results saved to: {RESULTS_FILE}")
    print("="*65)

if __name__ == "__main__":
    main()








