"""
Elite NBA Shooters to Add to Database
=====================================
This file contains a curated list of elite NBA/ABA shooters
who are NOT currently in the database.

These players have:
- Career 3PT% >= 37% OR
- Career FT% >= 85% OR
- Known elite shooting reputation

Data sourced from Basketball-Reference and NBA.com
"""

# Players ALREADY in database (DO NOT ADD - will cause duplicates)
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
}

# NEW elite shooters to add (verified not in database)
# Format: (name, team, position, era, career_3pt_pct, career_ft_pct, achievements, nba_player_id, height_inches, weight_lbs, tier)
NEW_ELITE_SHOOTERS = [
    # Active Elite Shooters
    ("Luke Kennard", "Memphis Grizzlies", "SHOOTING_GUARD", "2017-Present", 44.9, 89.2, "Highest active 3PT%, 3PT Contest participant", 1628379, 77, 206, "elite"),
    ("Duncan Robinson", "Miami Heat", "SMALL_FORWARD", "2018-Present", 40.2, 79.5, "Elite catch-and-shoot specialist, NBA Finals", 1629130, 79, 215, "great"),
    ("Desmond Bane", "Memphis Grizzlies", "SHOOTING_GUARD", "2020-Present", 42.2, 85.0, "All-Star caliber shooter, elite efficiency", 1630217, 77, 215, "elite"),
    ("Kevin Huerter", "Sacramento Kings", "SHOOTING_GUARD", "2018-Present", 38.5, 82.0, "Reliable 3PT shooter, playoff performer", 1628989, 79, 190, "great"),
    ("Malik Beasley", "Detroit Pistons", "SHOOTING_GUARD", "2016-Present", 38.0, 81.5, "High-volume 3PT shooter", 1627736, 76, 187, "great"),
    ("Davis Bertans", "Multiple Teams", "POWER_FORWARD", "2016-Present", 39.4, 83.0, "Elite stretch-4 shooter", 202722, 82, 225, "great"),
    ("Bojan Bogdanović", "New York Knicks", "SMALL_FORWARD", "2015-Present", 39.5, 87.5, "Elite international shooter", 202711, 80, 226, "elite"),
    ("Patty Mills", "Multiple Teams", "POINT_GUARD", "2012-Present", 38.2, 84.0, "NBA Champion, Olympic hero, clutch shooter", 201988, 72, 180, "great"),
    ("Doug McDermott", "San Antonio Spurs", "SMALL_FORWARD", "2014-Present", 41.3, 83.0, "Elite catch-and-shoot, college legend", 203926, 80, 225, "elite"),
    ("Evan Fournier", "Multiple Teams", "SHOOTING_GUARD", "2012-Present", 37.7, 81.0, "Consistent international shooter", 203095, 79, 205, "great"),
    ("Donte DiVincenzo", "Minnesota Timberwolves", "SHOOTING_GUARD", "2018-Present", 39.0, 79.0, "NBA Champion, Big Shot Donte", 1628978, 76, 203, "great"),
    ("Max Strus", "Cleveland Cavaliers", "SHOOTING_GUARD", "2020-Present", 37.5, 85.0, "Undrafted to elite shooter", 1629622, 78, 215, "great"),
    ("Grayson Allen", "Phoenix Suns", "SHOOTING_GUARD", "2018-Present", 39.0, 88.0, "Elite shooter, Duke legend", 1628960, 76, 198, "great"),
    ("Sam Hauser", "Boston Celtics", "SMALL_FORWARD", "2021-Present", 42.0, 87.0, "Elite 3PT specialist", 1630573, 80, 217, "elite"),
    ("Quentin Grimes", "New York Knicks", "SHOOTING_GUARD", "2021-Present", 37.0, 83.0, "Young elite shooter", 1629656, 77, 210, "good"),
    ("Coby White", "Chicago Bulls", "POINT_GUARD", "2019-Present", 37.5, 83.0, "High-volume young shooter", 1629632, 77, 195, "great"),
    ("Anfernee Simons", "Portland Trail Blazers", "SHOOTING_GUARD", "2018-Present", 38.5, 89.0, "Elite scorer and shooter", 1629014, 76, 181, "elite"),
    ("Tyrese Haliburton", "Indiana Pacers", "POINT_GUARD", "2020-Present", 40.0, 86.0, "All-Star, elite playmaking shooter", 1630169, 77, 185, "elite"),
    ("Trae Young", "Atlanta Hawks", "POINT_GUARD", "2018-Present", 35.5, 87.0, "All-Star, deep range specialist", 1629027, 73, 164, "elite"),
    ("Khris Middleton", "Milwaukee Bucks", "SMALL_FORWARD", "2012-Present", 39.0, 88.0, "NBA Champion, 3x All-Star", 203114, 80, 222, "elite"),
    
    # Recent Retired / Veterans
    ("Ray McCallum", "Multiple Teams", "POINT_GUARD", "2013-2017", 37.5, 80.0, "Efficient backup guard", 203492, 75, 190, "good"),
    ("Marco Belinelli", "Multiple Teams", "SHOOTING_GUARD", "2007-2021", 37.4, 83.0, "NBA Champion, 3PT Contest Winner 2014", 201158, 77, 210, "great"),
    ("Channing Frye", "Multiple Teams", "POWER_FORWARD", "2005-2019", 39.2, 81.0, "NBA Champion, elite stretch big", 101112, 83, 255, "great"),
    ("Ryan Anderson", "Multiple Teams", "POWER_FORWARD", "2008-2020", 38.0, 81.0, "Elite stretch-4, high volume", 201583, 82, 240, "great"),
    ("Mike Miller", "Multiple Teams", "SMALL_FORWARD", "2000-2017", 40.7, 86.0, "2x NBA Champion, ROY, elite shooter", 2034, 80, 218, "elite"),
    ("Shane Battier", "Multiple Teams", "SMALL_FORWARD", "2001-2014", 38.4, 79.0, "2x NBA Champion, elite 3&D", 2406, 80, 220, "great"),
    ("James Jones", "Multiple Teams", "SMALL_FORWARD", "2003-2017", 40.1, 79.0, "3x NBA Champion, elite specialist", 2592, 80, 218, "elite"),
    ("Mike Dunleavy Jr.", "Multiple Teams", "SMALL_FORWARD", "2002-2017", 38.5, 83.0, "Reliable shooter, 15yr career", 2399, 81, 230, "great"),
    ("Wally Szczerbiak", "Multiple Teams", "SMALL_FORWARD", "1999-2009", 39.1, 85.0, "All-Star, elite shooter", 1938, 79, 244, "elite"),
    ("Eddie House", "Multiple Teams", "POINT_GUARD", "2000-2012", 37.5, 84.0, "NBA Champion, microwave scorer", 2043, 73, 180, "great"),
    ("Anthony Parker", "Multiple Teams", "SHOOTING_GUARD", "2006-2012", 40.7, 87.0, "Elite international, Euroleague MVP", 2447, 78, 215, "elite"),
    ("Michael Finley", "Multiple Teams", "SHOOTING_GUARD", "1996-2010", 38.7, 84.0, "3x All-Star, NBA Champion", 951, 79, 225, "elite"),
    ("Quentin Richardson", "Multiple Teams", "SMALL_FORWARD", "2000-2013", 35.8, 76.0, "3PT Contest Winner 2005", 2056, 78, 226, "good"),
    ("Vladimir Radmanović", "Multiple Teams", "SMALL_FORWARD", "2001-2012", 38.0, 77.0, "NBA Champion, international shooter", 2048, 82, 235, "great"),
    ("Brent Barry", "Multiple Teams", "SHOOTING_GUARD", "1996-2009", 40.6, 85.0, "2x NBA Champion, Slam Dunk Champ", 1884, 78, 210, "elite"),
    ("Jason Williams", "Multiple Teams", "POINT_GUARD", "1999-2011", 34.2, 77.0, "NBA Champion, White Chocolate", 1900, 73, 190, "good"),
    ("Derek Fisher", "Multiple Teams", "POINT_GUARD", "1996-2014", 37.4, 81.0, "5x NBA Champion, clutch shooter", 2531, 73, 200, "great"),
    ("Robert Horry", "Multiple Teams", "POWER_FORWARD", "1992-2008", 34.1, 73.0, "7x NBA Champion, Big Shot Rob", 286, 82, 240, "good"),
    ("Steve Blake", "Multiple Teams", "POINT_GUARD", "2003-2016", 36.8, 81.0, "Reliable backup, solid shooter", 2581, 75, 172, "good"),
    ("Raja Bell", "Multiple Teams", "SHOOTING_GUARD", "1999-2012", 38.2, 82.0, "Elite 3&D guard", 2119, 77, 210, "great"),
    ("Eddie Jones", "Multiple Teams", "SHOOTING_GUARD", "1994-2008", 37.0, 80.0, "3x All-Star, elite defender/shooter", 700, 78, 200, "great"),
    
    # Classic/Historical Shooters
    ("Detlef Schrempf", "Multiple Teams", "SMALL_FORWARD", "1985-2001", 38.7, 83.0, "3x All-Star, 2x 6MOY", 762, 82, 230, "elite"),
    ("John Starks", "Multiple Teams", "SHOOTING_GUARD", "1988-2002", 34.0, 75.0, "All-Star, Knicks legend, clutch", 893, 77, 185, "good"),
    ("Vinnie Johnson", "Detroit Pistons", "SHOOTING_GUARD", "1979-1992", 34.0, 77.0, "2x NBA Champion, Microwave", 414, 74, 200, "good"),
    ("John Paxson", "Chicago Bulls", "POINT_GUARD", "1983-1994", 37.3, 81.0, "3x NBA Champion, clutch shooter", 624, 74, 185, "great"),
    ("Craig Ehlo", "Multiple Teams", "SHOOTING_GUARD", "1983-1997", 37.0, 80.0, "Solid 3PT shooter, The Shot victim", 238, 78, 185, "good"),
    ("Trent Tucker", "Multiple Teams", "SHOOTING_GUARD", "1982-1993", 38.4, 79.0, "3PT specialist, Trent Tucker Rule", 908, 77, 193, "great"),
    ("Danny Ainge", "Multiple Teams", "SHOOTING_GUARD", "1981-1995", 37.5, 85.0, "2x NBA Champion, executive legend", 19, 77, 185, "great"),
    ("World B. Free", "Multiple Teams", "SHOOTING_GUARD", "1975-1988", 31.0, 80.0, "All-Star, scoring champion era", 274, 75, 185, "good"),
    
    # ABA Shooters
    ("Louie Dampier", "Kentucky Colonels", "POINT_GUARD", "1967-1979", 35.5, 84.0, "ABA All-time 3PT leader, 7x ABA All-Star", 207, 72, 170, "elite"),
    ("Billy Keller", "Indiana Pacers", "POINT_GUARD", "1969-1976", 37.0, 85.0, "3x ABA Champion, elite ABA shooter", 437, 70, 165, "great"),
    ("Freddie Lewis", "Multiple Teams", "GUARD", "1967-1976", 35.0, 82.0, "3x ABA Champion, ABA All-Star", 484, 72, 160, "great"),
    ("Darel Carrier", "Kentucky Colonels", "GUARD", "1968-1975", 36.0, 80.0, "ABA All-Star, elite shooter", 144, 76, 185, "great"),
    ("Glen Combs", "Multiple Teams", "GUARD", "1968-1975", 38.0, 82.0, "ABA elite shooter", 172, 73, 175, "great"),
]

# Function to format as TypeScript
def format_as_typescript(shooters):
    """Format the shooters list as TypeScript code matching the existing format."""
    lines = []
    lines.append("// NEW NBA Elite Shooters - Add to NBA_SHOOTERS array in eliteShooters.ts")
    lines.append("// Generated from Basketball-Reference data")
    lines.append("")
    
    for shooter in shooters:
        name, team, position, era, three_pct, ft_pct, achievements, nba_id, height, weight, tier = shooter
        
        # Determine form category based on tier
        form_category = "EXCELLENT" if tier in ["legendary", "elite"] else "GOOD"
        
        # Determine overall score based on tier and 3PT%
        if tier == "legendary":
            base_score = 95
        elif tier == "elite":
            base_score = 88
        elif tier == "great":
            base_score = 78
        else:
            base_score = 70
        
        # Add bonus for high 3PT%
        if three_pct >= 42:
            score = min(99, base_score + 4)
        elif three_pct >= 40:
            score = min(99, base_score + 3)
        elif three_pct >= 38:
            score = min(99, base_score + 2)
        else:
            score = base_score
        
        lines.append(f'  createShooter({{ id: idCounter++, name: "{name}", team: "{team}", league: "NBA", tier: "{tier}", era: "{era}", careerPct: {three_pct}, careerFreeThrowPct: {ft_pct}, achievements: "{achievements}", photoUrl: nbaPhoto({nba_id}), measurements: genMeasurements(\'{tier}\'), overallScore: {score}, formCategory: \'{form_category}\', position: \'{position}\', height: {height}, weight: {weight} }}),')
    
    return '\n'.join(lines)

if __name__ == "__main__":
    # Generate TypeScript code
    ts_code = format_as_typescript(NEW_ELITE_SHOOTERS)
    
    # Save to file
    with open('new_shooters_to_add.ts', 'w') as f:
        f.write(ts_code)
    
    print(f"Generated {len(NEW_ELITE_SHOOTERS)} new elite shooters")
    print("Output saved to: new_shooters_to_add.ts")
    print("\nCopy the contents and add to NBA_SHOOTERS array in eliteShooters.ts")




