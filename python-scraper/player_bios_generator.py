"""
Player Bios and Photos Generator
Generates biographical information and finds photos for all players in the database
"""

# NBA Player IDs for photo lookup (NBA CDN format)
# Format: "Player Name": player_id
NBA_PLAYER_IDS = {
    # Legendary
    "Stephen Curry": 201939,
    "Ray Allen": 951,
    "Reggie Miller": 397,
    "Klay Thompson": 202691,
    "Larry Bird": 1449,
    # Elite
    "Kevin Durant": 201142,
    "Dirk Nowitzki": 1717,
    "Steve Nash": 959,
    "Kyle Korver": 2594,
    "Steve Kerr": 758,
    "Dale Ellis": 658,
    "Glen Rice": 247,
    "Peja Stojakovic": 1765,
    "Damian Lillard": 203081,
    "James Harden": 201935,
    "Chris Paul": 200755,
    "Mark Price": 215,
    "Drazen Petrovic": 574,
    "Devin Booker": 203925,
    "Dell Curry": 319,
    "Hersey Hawkins": 551,
    "Mitch Richmond": 198,
    "Allan Houston": 728,
    "Dennis Scott": 60,
    "Craig Hodges": 1718,
    "Hubert Davis": 1713,
    "Dana Barros": 1891,
    # Great
    "JJ Redick": 200768,
    "Buddy Hield": 1627741,
    "Joe Harris": 202331,
    # More players...
}

# WNBA Player IDs
WNBA_PLAYER_IDS = {
    "Diana Taurasi": 100940,
    "Sue Bird": 100720,
    "Elena Delle Donne": 203836,
    "Breanna Stewart": 1628932,
    "A'ja Wilson": 1628932,
    "Sabrina Ionescu": 1629673,
    "Kelsey Plum": 1628932,
    "Jewell Loyd": 1628932,
    "Arike Ogunbowale": 1629673,
    "Caitlin Clark": 1641720,
}

# Player bios - comprehensive descriptions
PLAYER_BIOS = {
    # NBA LEGENDARY
    "Stephen Curry": "Stephen Curry is widely considered the greatest shooter in NBA history. A 2x MVP and 4x NBA Champion with the Golden State Warriors, Curry revolutionized basketball with his unprecedented three-point shooting range. He holds the all-time record for career three-pointers made and has led the league in three-point shooting multiple times. His quick release, unlimited range, and ability to shoot off the dribble changed how the game is played.",
    
    "Ray Allen": "Ray Allen is a Basketball Hall of Famer and one of the purest shooters the game has ever seen. A 2x NBA Champion (Boston Celtics, Miami Heat), 10x All-Star, and former all-time leader in three-pointers made. Known for his textbook shooting form and incredible work ethic, Allen's clutch shooting in the 2013 NBA Finals is one of the most iconic moments in basketball history.",
    
    "Reggie Miller": "Reggie Miller spent his entire 18-year career with the Indiana Pacers and is known as one of the greatest clutch shooters ever. A 5x All-Star and Hall of Famer, Miller was famous for his trash-talking and ability to hit big shots in pressure moments. His 8 points in 8.9 seconds against the Knicks remains one of the most legendary performances in playoff history.",
    
    "Klay Thompson": "Klay Thompson is one half of the 'Splash Brothers' alongside Stephen Curry. A 4x NBA Champion and 5x All-Star, Thompson holds the record for most three-pointers in a single game (14) and most points in a quarter (37). Known for his catch-and-shoot ability and textbook form, he's considered one of the greatest two-way shooting guards in NBA history.",
    
    "Larry Bird": "Larry Bird is a 3x NBA Champion, 3x MVP, and Basketball Hall of Famer. Widely regarded as one of the greatest players ever, Bird was known for his incredible shooting, court vision, and competitiveness. He won three consecutive three-point contests (1986-88) and his rivalry with Magic Johnson helped save the NBA in the 1980s.",
    
    # NBA ELITE
    "Kevin Durant": "Kevin Durant is a 2x NBA Champion, MVP, and 4x scoring champion. Standing 6'10\" with guard-like skills, Durant's length and shooting ability make him virtually unguardable. He's one of the most efficient scorers in NBA history with a career average over 27 points per game.",
    
    "Dirk Nowitzki": "Dirk Nowitzki revolutionized the power forward position with his shooting ability. The 2011 NBA Champion and MVP spent his entire 21-year career with the Dallas Mavericks. His signature one-legged fadeaway is one of the most unblockable shots in basketball history.",
    
    "Steve Nash": "Steve Nash is a 2x MVP and 8x All-Star known for his incredible shooting and playmaking. One of the greatest point guards ever, Nash is a member of the exclusive 50-40-90 club (four times) and led the 'Seven Seconds or Less' Phoenix Suns teams that changed NBA offense.",
    
    "Kyle Korver": "Kyle Korver had a 17-year NBA career and is one of the greatest three-point shooters in league history. An All-Star in 2015, Korver led the league in three-point percentage four times and finished his career with over 2,450 three-pointers made.",
    
    "Damian Lillard": "Damian Lillard is a 7x All-Star and one of the most clutch players in NBA history. Known for his deep three-point range and 'Dame Time' performances, Lillard has hit multiple series-winning buzzer-beaters including his iconic shot against Oklahoma City in 2019.",
    
    "James Harden": "James Harden is a former MVP and 10x All-Star known for his scoring ability and step-back three-pointer. He's one of only a few players to average over 36 points per game in a season and has led the league in scoring three times.",
    
    "Devin Booker": "Devin Booker became the youngest player to score 70 points in a game at age 20. A 4x All-Star, Booker led the Phoenix Suns to the 2021 NBA Finals and is known for his smooth shooting stroke and mid-range game.",
    
    # WNBA
    "Diana Taurasi": "Diana Taurasi is the WNBA's all-time leading scorer and a 3x WNBA Champion. Known as the 'GOAT' of women's basketball, Taurasi has won 5 Olympic gold medals and is a 10x All-Star. Her competitive fire and shooting ability have made her the standard for excellence in women's basketball.",
    
    "Sue Bird": "Sue Bird is a 4x WNBA Champion and the league's all-time leader in assists. A 13x All-Star and 5x Olympic gold medalist, Bird spent her entire 21-year career with the Seattle Storm. She's considered one of the greatest point guards in basketball history, regardless of gender.",
    
    "Elena Delle Donne": "Elena Delle Donne is a 2x WNBA MVP and one of the most efficient scorers in league history. She became the first WNBA player to join the 50-40-90 club and led the Washington Mystics to their first championship in 2019.",
    
    "Caitlin Clark": "Caitlin Clark is the all-time leading scorer in NCAA Division I basketball history (men's or women's). A 3x National Player of the Year at Iowa, Clark's deep three-point range and flashy playmaking made her a cultural phenomenon and helped elevate women's basketball to unprecedented popularity.",
    
    "Sabrina Ionescu": "Sabrina Ionescu is the only player in NCAA history (men's or women's) to record 2,000 points, 1,000 assists, and 1,000 rebounds. The #1 pick in 2020, she's become one of the WNBA's brightest stars with the New York Liberty.",
    
    # NCAA
    "Pete Maravich": "Pete Maravich, 'Pistol Pete,' is the all-time leading scorer in NCAA Division I history with 3,667 points and a 44.2 points per game average - records that still stand today. Playing before the three-point line existed, Maravich's ball-handling and shooting were decades ahead of his time.",
    
    "JJ Redick": "JJ Redick is Duke's all-time leading scorer and a 2x consensus All-American. He went on to have a successful 15-year NBA career, making over 1,900 three-pointers. Known for his tireless work ethic and coming off screens, Redick is now a popular basketball analyst and podcaster.",
}

# Generate bio based on achievements and stats
def generate_bio(name, team, league, era, tier, achievements, career_pct):
    """Generate a bio for players without a custom one"""
    if name in PLAYER_BIOS:
        return PLAYER_BIOS[name]
    
    # Generate based on available info
    tier_desc = {
        'legendary': 'one of the greatest shooters',
        'elite': 'an exceptional shooter',
        'great': 'a highly skilled shooter',
        'good': 'a reliable shooter',
        'mid_level': 'a capable shooter',
        'bad': 'a player known more for other skills than shooting'
    }
    
    league_desc = {
        'NBA': 'the NBA',
        'WNBA': 'the WNBA',
        'NCAA_MEN': "NCAA Division I Men's basketball",
        'NCAA_WOMEN': "NCAA Division I Women's basketball",
        'TOP_COLLEGE': 'college basketball'
    }
    
    bio = f"{name} played for {team} in {league_desc.get(league, 'professional basketball')} during the {era} era. "
    bio += f"Considered {tier_desc.get(tier, 'a shooter')} of their time"
    
    if career_pct:
        bio += f" with a career three-point percentage of {career_pct}%"
    
    bio += ". "
    
    if achievements:
        bio += achievements
    
    return bio

# Output the TypeScript updates needed
if __name__ == "__main__":
    print("=== Player Bios Generator ===")
    print("\nGenerated bios for key players:")
    for name, bio in list(PLAYER_BIOS.items())[:5]:
        print(f"\n{name}:")
        print(f"  {bio[:100]}...")





