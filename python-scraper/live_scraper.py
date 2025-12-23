#!/usr/bin/env python3
"""
Live Basketball Reference Scraper with Progress Tracking
=========================================================
Shows real-time progress, countdown timer, and status updates.
Writes progress to a file you can check anytime.
"""

import requests
from bs4 import BeautifulSoup
import time
import random
import re
import sys
import os
from datetime import datetime, timedelta

# Progress file - check this anytime to see status
PROGRESS_FILE = "SCRAPER_PROGRESS.txt"
RESULTS_FILE = "scraped_shooters.ts"

# User agents
USER_AGENTS = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
]

BASE_URL = "https://www.basketball-reference.com"
MIN_3PT_PCT = 37.0
MIN_FT_PCT = 85.0
MIN_3PT_ATTEMPTS = 200

# Existing players to skip
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
    "Mahmoud Abdul-Rauf", "Álex Abrines", "Jon Barry", "Matt Bullard", "Jud Buechler", 
    "José Calderón", "Brian Cardinal", "Matt Carroll", "Sam Cassell", "Wayne Ellington", 
    "Mario Elie", "Sean Elliott", "Manu Ginóbili", "Richard Hamilton", "Tim Hardaway",
    "Tim Hardaway Jr.", "Tobias Harris", "Ersan İlyasova", "Andre Iguodala", "Jason Kidd",
    "Zach LaVine", "Kawhi Leonard", "Tracy McGrady", "CJ McCollum", "Gary Payton",
    "Scottie Pippen", "Terry Porter", "Norman Powell", "Jerry Stackhouse", "John Stockton",
    "Isiah Thomas", "Isaiah Thomas", "Fred VanVleet", "Dwyane Wade", "Rasheed Wallace",
    "Russell Westbrook", "Andrew Wiggins", "Dominique Wilkins", "Doug McDermott", "Grayson Allen",
}

# Stats tracking
stats = {
    'start_time': None,
    'current_letter': '',
    'letters_done': 0,
    'total_letters': 26,
    'players_checked': 0,
    'elite_found': 0,
    'elite_shooters': [],
    'errors': 0,
    'status': 'Starting...',
}

def update_progress_file():
    """Write current progress to file."""
    elapsed = datetime.now() - stats['start_time'] if stats['start_time'] else timedelta(0)
    
    # Estimate remaining time
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
    
    # Create progress bar
    bar_width = 30
    filled = int(bar_width * stats['letters_done'] / stats['total_letters'])
    bar = '█' * filled + '░' * (bar_width - filled)
    
    content = f"""
╔══════════════════════════════════════════════════════════════╗
║           🏀 BASKETBALL REFERENCE SCRAPER STATUS 🏀           ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Progress: [{bar}] {progress_pct:5.1f}%  ║
║                                                              ║
║  Current Letter:    {stats['current_letter'].upper():^10}                            ║
║  Letters Done:      {stats['letters_done']:>3} / {stats['total_letters']}                              ║
║  Players Checked:   {stats['players_checked']:>5}                                  ║
║  Elite Found:       {stats['elite_found']:>5}  🎯                              ║
║  Errors:            {stats['errors']:>5}                                  ║
║                                                              ║
║  ⏱️  Time Elapsed:   {str(elapsed).split('.')[0]:>12}                       ║
║  ⏳ Time Remaining: {remaining_str:>12}                       ║
║  🏁 ETA:            {eta_str:>12}                       ║
║                                                              ║
║  Status: {stats['status'][:50]:<50} ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ELITE SHOOTERS FOUND:                                       ║
"""
    
    # Add found shooters
    for shooter in stats['elite_shooters'][-10:]:  # Last 10
        name = shooter['name'][:25]
        pct = shooter['three_pct'] or 0
        content += f"║    • {name:<25} {pct:>5.1f}% 3PT            ║\n"
    
    if not stats['elite_shooters']:
        content += "║    (none yet)                                            ║\n"
    
    content += """╠══════════════════════════════════════════════════════════════╣
║  📁 Results will be saved to: scraped_shooters.ts           ║
║  🔄 This file updates every few seconds                      ║
╚══════════════════════════════════════════════════════════════╝

Last updated: """ + datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    with open(PROGRESS_FILE, 'w') as f:
        f.write(content)

def print_status(msg):
    """Print status and update file."""
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
    """Scrape with retry."""
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

def parse_player_stats(html):
    """Parse player page for stats."""
    soup = BeautifulSoup(html, 'html.parser')
    result = {'career_3pt_pct': None, 'career_ft_pct': None, 'career_3pt_attempts': 0, 'teams': [], 'achievements': []}
    
    for table_id in ['per_game', 'totals']:
        table = soup.find('table', {'id': table_id})
        if table:
            tfoot = table.find('tfoot')
            if tfoot:
                career_row = tfoot.find('tr')
                if career_row:
                    fg3_pct = career_row.find('td', {'data-stat': 'fg3_pct'})
                    if fg3_pct and fg3_pct.text.strip():
                        try:
                            val = float(fg3_pct.text.strip())
                            result['career_3pt_pct'] = val * 100 if val < 1 else val
                        except: pass
                    
                    ft_pct = career_row.find('td', {'data-stat': 'ft_pct'})
                    if ft_pct and ft_pct.text.strip():
                        try:
                            val = float(ft_pct.text.strip())
                            result['career_ft_pct'] = val * 100 if val < 1 else val
                        except: pass
                    
                    fg3a = career_row.find('td', {'data-stat': 'fg3a'})
                    if fg3a and fg3a.text.strip():
                        try:
                            result['career_3pt_attempts'] = int(float(fg3a.text.strip()))
                        except: pass
                    break
    
    # Teams
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
    
    # Achievements
    bling = soup.find('ul', {'id': 'bling'})
    if bling:
        result['achievements'] = [li.text.strip() for li in bling.find_all('li')][:5]
    
    return result

def is_elite_shooter(s):
    three = s.get('career_3pt_pct')
    ft = s.get('career_ft_pct')
    att = s.get('career_3pt_attempts', 0)
    if three and three >= MIN_3PT_PCT and att >= MIN_3PT_ATTEMPTS:
        return True
    if ft and ft >= MIN_FT_PCT and three and three >= 33:
        return True
    return False

def height_to_inches(h):
    try:
        if '-' in h:
            p = h.split('-')
            return int(p[0]) * 12 + int(p[1])
    except: pass
    return 76

def pos_to_enum(p):
    m = {'PG': 'POINT_GUARD', 'G': 'GUARD', 'SG': 'SHOOTING_GUARD', 'SF': 'SMALL_FORWARD', 'F': 'FORWARD', 'PF': 'POWER_FORWARD', 'C': 'CENTER'}
    return m.get(p.upper().split('-')[0], 'SHOOTING_GUARD')

def get_tier(three, ft, ach):
    a = ' '.join(ach).lower() if ach else ''
    if three and three >= 42:
        return 'legendary' if ('mvp' in a or 'champion' in a or 'hall of fame' in a) else 'elite'
    if three and three >= 40:
        return 'elite' if ('all-star' in a or 'champion' in a) else 'great'
    if three and three >= 38:
        return 'great'
    return 'good'

def get_score(tier, three):
    base = {'legendary': 95, 'elite': 88, 'great': 78, 'good': 70}.get(tier, 70)
    if three:
        if three >= 44: base += 4
        elif three >= 42: base += 3
        elif three >= 40: base += 2
        elif three >= 38: base += 1
    return min(99, base)

def format_ts(player, s):
    name = player['name']
    teams = s.get('teams', [])
    team = teams[0] if len(teams) == 1 else 'Multiple Teams'
    pos = pos_to_enum(player.get('position', 'SG'))
    era = f"{player.get('year_start', '')}-{player.get('year_end', '')}"
    three = s.get('career_3pt_pct', 0) or 0
    ft = s.get('career_ft_pct', 80) or 80
    ach = ', '.join(s.get('achievements', [])[:3]) or 'NBA Player'
    tier = get_tier(three, ft, s.get('achievements', []))
    score = get_score(tier, three)
    form = 'EXCELLENT' if tier in ['legendary', 'elite'] else 'GOOD'
    h = height_to_inches(player.get('height', '6-4'))
    w = int(player.get('weight', 200)) if player.get('weight') else 200
    nba_id = abs(hash(player.get('url', ''))) % 9000000 + 1000000
    
    return f'  createShooter({{ id: idCounter++, name: "{name}", team: "{team}", league: "NBA", tier: "{tier}", era: "{era}", careerPct: {three:.1f}, careerFreeThrowPct: {ft:.1f}, achievements: "{ach}", photoUrl: nbaPhoto({nba_id}), measurements: genMeasurements(\'{tier}\'), overallScore: {score}, formCategory: \'{form}\', position: \'{pos}\', height: {h}, weight: {w} }}),'

def scrape_letter(session, letter, max_per_letter=12):
    """Scrape one letter."""
    shooters = []
    index_url = f"{BASE_URL}/players/{letter}/"
    
    print_status(f"📖 Letter {letter.upper()}: Fetching index...")
    html = scrape_url(session, index_url)
    if not html:
        return shooters
    
    players = parse_player_index(html)
    print_status(f"📖 Letter {letter.upper()}: Found {len(players)} new players")
    
    checked = 0
    for player in players:
        if checked >= max_per_letter:
            break
        
        stats['players_checked'] += 1
        print_status(f"📖 {letter.upper()} [{checked+1}/{max_per_letter}]: Checking {player['name'][:30]}...")
        
        html = scrape_url(session, player['url'])
        checked += 1
        
        if not html:
            continue
        
        player_stats = parse_player_stats(html)
        
        if is_elite_shooter(player_stats):
            ts = format_ts(player, player_stats)
            shooter_data = {
                'name': player['name'],
                'three_pct': player_stats.get('career_3pt_pct'),
                'ft_pct': player_stats.get('career_ft_pct'),
                'typescript': ts
            }
            shooters.append(shooter_data)
            stats['elite_shooters'].append(shooter_data)
            stats['elite_found'] += 1
            print(f"\n🏀 ELITE FOUND: {player['name']} - {player_stats.get('career_3pt_pct', 0):.1f}% 3PT")
        
        update_progress_file()
    
    return shooters

def save_results():
    """Save results to TypeScript file."""
    lines = [
        "// ═══════════════════════════════════════════════════════════════",
        "// NEW Elite Shooters - Scraped from Basketball-Reference",
        f"// Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"// Total Found: {len(stats['elite_shooters'])} elite shooters",
        "// ═══════════════════════════════════════════════════════════════",
        "",
        "// Add these to NBA_SHOOTERS array in eliteShooters.ts",
        ""
    ]
    
    for shooter in stats['elite_shooters']:
        lines.append(shooter['typescript'])
    
    with open(RESULTS_FILE, 'w') as f:
        f.write('\n'.join(lines))

def main():
    print("\n" + "="*60)
    print("🏀 BASKETBALL REFERENCE SCRAPER - LIVE PROGRESS")
    print("="*60)
    print(f"\n📁 Check progress anytime: {PROGRESS_FILE}")
    print(f"📁 Results saved to: {RESULTS_FILE}")
    print("\n" + "="*60 + "\n")
    
    stats['start_time'] = datetime.now()
    session = get_session()
    
    letters = 'abcdefghijklmnopqrstuvwxyz'
    
    for letter in letters:
        stats['current_letter'] = letter
        print(f"\n\n{'='*50}")
        print(f"📖 STARTING LETTER: {letter.upper()} ({stats['letters_done']+1}/26)")
        print(f"{'='*50}")
        
        scrape_letter(session, letter, max_per_letter=10)
        
        stats['letters_done'] += 1
        update_progress_file()
        save_results()
        
        # Delay between letters
        if letter != 'z':
            print_status(f"⏳ Waiting before next letter...")
            time.sleep(random.uniform(2, 4))
    
    # Final update
    stats['status'] = "✅ COMPLETE!"
    update_progress_file()
    save_results()
    
    print("\n\n" + "="*60)
    print("🏆 SCRAPING COMPLETE!")
    print("="*60)
    print(f"📊 Players Checked: {stats['players_checked']}")
    print(f"🎯 Elite Shooters Found: {stats['elite_found']}")
    print(f"📁 Results saved to: {RESULTS_FILE}")
    print("="*60)
    
    # List all found shooters
    print("\n🏀 ELITE SHOOTERS FOUND:")
    for s in stats['elite_shooters']:
        print(f"  • {s['name']}: {s['three_pct']:.1f}% 3PT")

if __name__ == "__main__":
    main()






