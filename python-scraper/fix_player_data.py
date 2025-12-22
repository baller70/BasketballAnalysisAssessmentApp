"""
Fix Player Physical Stats and Photo IDs
This script generates corrected player data for the eliteShooters.ts file
"""

# Correct physical measurements for players
# Format: name -> (height_inches, weight_lbs, wingspan_inches, photo_id, league)

PLAYER_CORRECTIONS = {
    # NBA LEGENDARY
    "Stephen Curry": (74, 185, 79, 201939, "NBA"),  # 6'2", 185 lbs
    "Ray Allen": (77, 205, 81, 951, "NBA"),  # 6'5", 205 lbs
    "Reggie Miller": (79, 195, 82, 397, "NBA"),  # 6'7", 195 lbs
    "Klay Thompson": (78, 215, 81, 202691, "NBA"),  # 6'6", 215 lbs
    "Larry Bird": (81, 220, 84, 1449, "NBA"),  # 6'9", 220 lbs
    
    # NBA ELITE
    "Kevin Durant": (82, 240, 89, 201142, "NBA"),  # 6'10", 240 lbs (actually taller)
    "Dirk Nowitzki": (84, 245, 86, 1717, "NBA"),  # 7'0", 245 lbs
    "Steve Nash": (75, 178, 77, 959, "NBA"),  # 6'3", 178 lbs
    "Kyle Korver": (79, 212, 82, 2594, "NBA"),  # 6'7", 212 lbs
    "Steve Kerr": (75, 175, 77, 758, "NBA"),  # 6'3", 175 lbs
    "Mark Price": (72, 178, 74, 658, "NBA"),  # 6'0", 178 lbs
    "Dale Ellis": (79, 215, 81, 247, "NBA"),  # 6'7", 215 lbs
    "Peja Stojaković": (82, 229, 84, 1765, "NBA"),  # 6'10", 229 lbs
    "Damian Lillard": (75, 195, 80, 203081, "NBA"),  # 6'3", 195 lbs
    "James Harden": (77, 220, 82, 201935, "NBA"),  # 6'5", 220 lbs
    "JJ Redick": (76, 190, 79, 200755, "NBA"),  # 6'4", 190 lbs
    "Hubert Davis": (77, 183, 79, 215, "NBA"),  # 6'5", 183 lbs
    "Dražen Petrović": (77, 195, 79, 574, "NBA"),  # 6'5", 195 lbs
    "Joe Harris": (78, 218, 81, 203925, "NBA"),  # 6'6", 218 lbs
    "Craig Hodges": (75, 190, 77, 319, "NBA"),  # 6'3", 190 lbs
    "Chris Mullin": (79, 215, 81, 551, "NBA"),  # 6'7", 215 lbs
    "Dell Curry": (77, 190, 80, 198, "NBA"),  # 6'5", 190 lbs
    "Mitch Richmond": (77, 215, 80, 728, "NBA"),  # 6'5", 215 lbs
    "Rick Barry": (79, 205, 81, 60, "NBA"),  # 6'7", 205 lbs
    
    # NBA GREAT
    "Paul Pierce": (79, 235, 82, 1718, "NBA"),  # 6'7", 235 lbs
    "Vince Carter": (78, 220, 81, 1713, "NBA"),  # 6'6", 220 lbs
    "Jason Terry": (74, 185, 77, 1891, "NBA"),  # 6'2", 185 lbs
    "Kyle Lowry": (72, 196, 75, 200768, "NBA"),  # 6'0", 196 lbs
    "Buddy Hield": (76, 220, 80, 1627741, "NBA"),  # 6'4", 220 lbs
    "Paul George": (80, 220, 83, 202331, "NBA"),  # 6'8", 220 lbs
    "Joe Johnson": (79, 240, 82, 2207, "NBA"),  # 6'7", 240 lbs
    "Mike Conley": (73, 175, 76, 201144, "NBA"),  # 6'1", 175 lbs
    "Kyrie Irving": (74, 195, 77, 202681, "NBA"),  # 6'2", 195 lbs
    "Chris Paul": (72, 175, 75, 101108, "NBA"),  # 6'0", 175 lbs
    "Chauncey Billups": (75, 202, 78, 1497, "NBA"),  # 6'3", 202 lbs
    "Seth Curry": (74, 185, 77, 203552, "NBA"),  # 6'2", 185 lbs
    "Jason Kapono": (80, 213, 82, 2440, "NBA"),  # 6'8", 213 lbs
    "Glen Rice": (80, 220, 83, 720, "NBA"),  # 6'8", 220 lbs
    
    # WNBA LEGENDARY
    "Diana Taurasi": (72, 163, 74, 100940, "WNBA"),  # 6'0", 163 lbs
    "Sue Bird": (69, 150, 71, 100720, "WNBA"),  # 5'9", 150 lbs
    "Elena Delle Donne": (77, 187, 79, 203399, "WNBA"),  # 6'5", 187 lbs
    "Allie Quigley": (70, 155, 72, 100862, "WNBA"),  # 5'10", 155 lbs
    
    # WNBA ELITE
    "Maya Moore": (72, 174, 74, 201458, "WNBA"),  # 6'0", 174 lbs
    "Becky Hammon": (67, 136, 69, 100616, "WNBA"),  # 5'7", 136 lbs
    "Katie Smith": (71, 175, 73, 100636, "WNBA"),  # 5'11", 175 lbs
    "Sabrina Ionescu": (71, 170, 73, 1629673, "WNBA"),  # 5'11", 170 lbs
    "Kelsey Plum": (68, 146, 70, 1628276, "WNBA"),  # 5'8", 146 lbs
    "Jewell Loyd": (70, 165, 72, 1627256, "WNBA"),  # 5'10", 165 lbs
    "Tina Thompson": (74, 176, 76, 100621, "WNBA"),  # 6'2", 176 lbs
    "Kara Lawson": (69, 160, 71, 100732, "WNBA"),  # 5'9", 160 lbs
    
    # WNBA GREAT
    "Arike Ogunbowale": (68, 152, 70, 1629023, "WNBA"),  # 5'8", 152 lbs
    "Kelsey Mitchell": (67, 160, 69, 1628886, "WNBA"),  # 5'7", 160 lbs
    "Cappie Pondexter": (69, 159, 71, 100850, "WNBA"),  # 5'9", 159 lbs
    "Katie Douglas": (70, 165, 72, 100705, "WNBA"),  # 5'10", 165 lbs
    "Kayla McBride": (71, 165, 73, 203717, "WNBA"),  # 5'11", 165 lbs
    "Renee Montgomery": (67, 140, 69, 201198, "WNBA"),  # 5'7", 140 lbs
    "Ivory Latta": (64, 145, 66, 100872, "WNBA"),  # 5'4", 145 lbs
    "Nicole Powell": (74, 170, 76, 100802, "WNBA"),  # 6'2", 170 lbs
    "Rhyne Howard": (74, 168, 76, 1630581, "WNBA"),  # 6'2", 168 lbs
    "Sami Whitcomb": (70, 145, 72, 1628809, "WNBA"),  # 5'10", 145 lbs
    "Leilani Mitchell": (64, 145, 66, 201103, "WNBA"),  # 5'4", 145 lbs
    "Shekinna Stricklen": (74, 175, 76, 201537, "WNBA"),  # 6'2", 175 lbs
    
    # NCAA MEN
    "Pete Maravich": (77, 200, 80, None, "NCAA_MEN"),  # 6'5", 200 lbs
    "Jimmer Fredette": (74, 195, 77, None, "NCAA_MEN"),  # 6'2", 195 lbs
    "Doug McDermott": (80, 225, 82, None, "NCAA_MEN"),  # 6'8", 225 lbs
    "Antoine Davis": (73, 170, 75, None, "NCAA_MEN"),  # 6'1", 170 lbs
    "Fletcher Magee": (76, 190, 78, None, "NCAA_MEN"),  # 6'4", 190 lbs
    "Travis Bader": (77, 190, 79, None, "NCAA_MEN"),  # 6'5", 190 lbs
    "Adam Morrison": (80, 205, 82, None, "NCAA_MEN"),  # 6'8", 205 lbs
    "Steve Alford": (74, 180, 76, None, "NCAA_MEN"),  # 6'2", 180 lbs
    "Darius McGhee": (69, 170, 71, None, "NCAA_MEN"),  # 5'9", 170 lbs
    "Max Abmas": (72, 165, 74, None, "NCAA_MEN"),  # 6'0", 165 lbs
    "Gerry McNamara": (74, 185, 76, None, "NCAA_MEN"),  # 6'2", 185 lbs
    "Jack Taylor": (69, 155, 71, None, "NCAA_MEN"),  # 5'9", 155 lbs
    "Kyle Guy": (74, 170, 76, None, "NCAA_MEN"),  # 6'2", 170 lbs
    "Corey Kispert": (79, 220, 81, None, "NCAA_MEN"),  # 6'7", 220 lbs
    "Grayson Allen": (76, 198, 78, None, "NCAA_MEN"),  # 6'4", 198 lbs
    
    # NCAA WOMEN (Caitlin Clark already fixed)
    "Jackie Stiles": (69, 150, 71, None, "NCAA_WOMEN"),  # 5'9", 150 lbs
    "Taylor Robertson": (70, 150, 72, None, "NCAA_WOMEN"),  # 5'10", 150 lbs
    "Katie Lou Samuelson": (72, 155, 74, None, "NCAA_WOMEN"),  # 6'0", 155 lbs
    "Katelynn Flaherty": (68, 145, 70, None, "NCAA_WOMEN"),  # 5'8", 145 lbs
    "Dyaisha Fair": (67, 145, 69, None, "NCAA_WOMEN"),  # 5'7", 145 lbs
    "Kendall Spray": (70, 150, 72, None, "NCAA_WOMEN"),  # 5'10", 150 lbs
}

def generate_fix_commands():
    """Generate sed commands or TypeScript code to fix the data"""
    print("// Physical stats corrections for eliteShooters.ts")
    print("// Format: height (inches), weight (lbs), wingspan (inches)")
    print()
    
    for name, (height, weight, wingspan, photo_id, league) in PLAYER_CORRECTIONS.items():
        height_ft = height // 12
        height_in = height % 12
        print(f"// {name}: {height_ft}'{height_in}\" ({height}in), {weight} lbs, {wingspan}in wingspan")
        if photo_id:
            print(f"//   Photo ID: {photo_id}")
        print()

if __name__ == "__main__":
    generate_fix_commands()


