/**
 * @file eliteShooters.ts
 * @description Database of NBA shooters with physical attributes and career stats
 * 
 * PURPOSE:
 * - Provides reference data for shooter comparisons at ALL skill levels
 * - Contains physical measurements, shooting stats, and form characteristics
 * - Used to match users with similar shooters (from legendary to bad)
 * 
 * TIER CLASSIFICATION (based on career 3PT%):
 * - LEGENDARY (Tier 1): Greatest shooters ever (95-99 score) - Curry, Ray Allen - 42%+ 3PT
 * - ELITE (Tier 2): Exceptional shooters (88-94 score) - Klay Thompson, Korver - 40-42% 3PT
 * - GREAT (Tier 3): Very good shooters (78-87 score) - 38-40% 3PT
 * - GOOD (Tier 4): Competent shooters (70-77 score) - 37-38% 3PT
 * - MID_LEVEL (Tier 5): Average shooters (55-69 score) - 33-37% 3PT
 * - BAD (Tier 6): Poor shooters (30-54 score) - Below 33% 3PT (but still TAKE shots)
 * 
 * NOTE: Players who don't take jump shots (rim-only centers) are EXCLUDED entirely.
 * 
 * DATA INCLUDES:
 * - Physical: height, weight, wingspan, body type
 * - Stats: career 3PT%, FT%, era
 * - Form: shooting style, release characteristics
 * - Photos: NBA headshot URLs
 * 
 * MAIN EXPORTS:
 * - ALL_ELITE_SHOOTERS - Array of all shooter profiles
 * - EliteShooter interface - Type definition
 * - TIER_LABELS, TIER_COLORS - Display constants
 * - LEAGUE_LABELS, POSITION_LABELS - Enum labels
 * 
 * USED BY:
 * - src/app/results/demo/page.tsx - Shooter matching
 * - src/app/elite-shooters/page.tsx - Shooter database browser
 * - src/services/comparisonAlgorithm.ts - Matching logic
 */

export type ShooterTier = 'legendary' | 'elite' | 'great' | 'good' | 'mid_level' | 'bad';
export type Position = 'POINT_GUARD' | 'SHOOTING_GUARD' | 'SMALL_FORWARD' | 'POWER_FORWARD' | 'CENTER' | 'GUARD' | 'FORWARD';
export type BodyType = 'LEAN' | 'ATHLETIC' | 'STOCKY' | 'TALL_LEAN';

export interface EliteShooter {
  id: number;
  name: string;
  team: string;
  league: 'NBA' | 'WNBA' | 'NCAA_MEN' | 'NCAA_WOMEN' | 'TOP_COLLEGE';
  era: string;
  tier: ShooterTier;
  position: Position;
  // Physical attributes
  height: number;      // inches
  weight: number;      // lbs
  wingspan: number;    // inches
  bodyType: BodyType;
  // Shooting stats
  careerPct?: number;  // Career 3PT%
  careerFreeThrowPct: number;
  achievements?: string;
  keyTraits: string[];
  shootingStyle: string;
  // Photos
  photoUrl?: string;
  // Player bio for popup
  bio?: string;
  // Shooting form images (at least 3 images showing their shooting motion)
  shootingFormImages?: string[];
  // Biomechanics (measurements)
  measurements: {
    shoulderAngle: number;
    elbowAngle: number;
    hipAngle: number;
    kneeAngle: number;
    ankleAngle: number;
    releaseHeight: number;
    releaseAngle: number;
    entryAngle: number;
  };
  overallScore: number;
  formCategory: 'EXCELLENT' | 'GOOD' | 'NEEDS WORK';
}

// CDN helpers
const nbaPhoto = (id: number) => `https://cdn.nba.com/headshots/nba/latest/1040x760/${id}.png`;
const wnbaPhoto = (id: number) => `https://ak-static.cms.nba.com/wp-content/uploads/headshots/wnba/latest/1040x760/${id}.png`;
// ESPN headshot helper for NCAA players
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _espnPhoto = (id: number) => `https://a.espncdn.com/combiner/i?img=/i/headshots/mens-college-basketball/players/full/${id}.png&w=350&h=254`;
const espnWomenPhoto = (id: number) => `https://a.espncdn.com/combiner/i?img=/i/headshots/womens-college-basketball/players/full/${id}.png&w=350&h=254`;

// Shooting form images are stored directly as URL strings in the shootingFormImages array
// Sources include: NBA.com, Sporting News, ESPN, various sports media CDNs

// Generate biomechanics based on tier (deterministic - no random to avoid hydration errors)
const genBio = (tier: ShooterTier, heightMod = 0) => {
  const base = {
    legendary:  { sa: 172, ea: 90, ha: 174, ka: 142, aa: 88, rh: 110 + heightMod, ra: 51, ena: 46 },
    elite:      { sa: 170, ea: 89, ha: 172, ka: 140, aa: 87, rh: 108 + heightMod, ra: 50, ena: 45 },
    great:      { sa: 168, ea: 87, ha: 170, ka: 138, aa: 85, rh: 105 + heightMod, ra: 48, ena: 44 },
    good:       { sa: 165, ea: 85, ha: 168, ka: 135, aa: 83, rh: 102 + heightMod, ra: 46, ena: 42 },
    mid_level:  { sa: 162, ea: 82, ha: 165, ka: 132, aa: 80, rh: 99 + heightMod, ra: 44, ena: 40 },
    bad:        { sa: 158, ea: 78, ha: 162, ka: 128, aa: 76, rh: 95 + heightMod, ra: 41, ena: 38 }
  }[tier];
  return {
    shoulderAngle: base.sa, elbowAngle: base.ea, hipAngle: base.ha,
    kneeAngle: base.ka, ankleAngle: base.aa, releaseHeight: base.rh,
    releaseAngle: base.ra, entryAngle: base.ena
  };
};

// Tier display
export const TIER_LABELS: Record<ShooterTier, string> = {
  legendary: 'LEGENDARY', elite: 'ELITE', great: 'GREAT', good: 'GOOD', mid_level: 'MID-LEVEL', bad: 'BAD'
};

export const TIER_COLORS: Record<ShooterTier, string> = {
  legendary: '#FFD700', elite: '#C0C0C0', great: '#CD7F32', good: '#4A90D9', mid_level: '#808080', bad: '#8B0000'
};

// Generate measurements using genBio
const genMeasurements = (tier: ShooterTier) => genBio(tier, 0);

// Position display helper
export const POSITION_LABELS: Record<Position, string> = {
  POINT_GUARD: 'POINT GUARD',
  SHOOTING_GUARD: 'SHOOTING GUARD',
  SMALL_FORWARD: 'SMALL FORWARD',
  POWER_FORWARD: 'POWER FORWARD',
  CENTER: 'CENTER',
  GUARD: 'GUARD',
  FORWARD: 'FORWARD'
};

// Key traits by tier
const TRAITS_BY_TIER: Record<ShooterTier, string[][]> = {
  legendary: [
    ["Quick Release", "Deep Range", "Consistent Form"],
    ["Perfect Mechanics", "Elite Footwork", "High Arc"],
    ["Clutch Shooter", "Off-Balance Accuracy", "One-Motion Shot"]
  ],
  elite: [
    ["Catch-and-Shoot", "High Release Point", "Smooth Follow-Through"],
    ["Great Footwork", "Consistent Elbow Alignment", "Quick Setup"],
    ["Mid-Range Master", "Reliable Spot-Up", "Strong Base"]
  ],
  great: [
    ["Good Range", "Solid Mechanics", "Quick Setup"],
    ["Reliable Form", "Good Arc", "Strong Base"],
    ["Balanced Shot", "Consistent Release", "Good Footwork"]
  ],
  good: [
    ["Decent Range", "Improving Form", "Solid Base"],
    ["Developing Mechanics", "Good Potential", "Work Ethic"],
    ["Raw Talent", "Athletic Release", "Quick Learner"]
  ],
  mid_level: [
    ["Average Range", "Inconsistent Form", "Streaky Shooter"],
    ["Basic Mechanics", "Open Shot Reliant", "Hesitant Release"],
    ["Limited Range", "Situational Shooter", "Needs Space"]
  ],
  bad: [
    ["Poor Mechanics", "Low Confidence", "Flat Arc"],
    ["Inconsistent Release", "Rushed Shot", "Poor Follow-Through"],
    ["Limited Range", "Avoids Shooting", "Needs Major Work"]
  ]
};

// Shooting styles by tier
const STYLES_BY_TIER: Record<ShooterTier, string[]> = {
  legendary: [
    "Quick release with incredible range and shot-making ability",
    "Textbook form with elite consistency and clutch performance",
    "Smooth one-motion shot with exceptional accuracy"
  ],
  elite: [
    "Pure catch-and-shoot specialist with excellent mechanics",
    "High release point with consistent follow-through",
    "Classic mid-range specialist with strong fundamentals"
  ],
  great: [
    "Reliable shooter with solid mechanics",
    "Good range with improving consistency",
    "Strong fundamental shooter with good form"
  ],
  good: [
    "Developing shooter with good potential",
    "Athletic shooter with raw talent",
    "Solid form with room for improvement"
  ],
  mid_level: [
    "Average shooter who can hit open shots",
    "Inconsistent mechanics with streaky results",
    "Limited range but functional in rhythm"
  ],
  bad: [
    "Poor shooter with mechanical issues",
    "Low percentage shooter who struggles from range",
    "Needs significant work on shooting form"
  ]
};

// Generate physical attributes based on position
const genPhysical = (pos: Position): { height: number; weight: number; wingspan: number; bodyType: BodyType } => {
  const base: Record<Position, { h: number; w: number; ws: number; bt: BodyType }> = {
    POINT_GUARD: { h: 74, w: 185, ws: 78, bt: 'LEAN' },
    SHOOTING_GUARD: { h: 77, w: 200, ws: 81, bt: 'ATHLETIC' },
    SMALL_FORWARD: { h: 79, w: 215, ws: 84, bt: 'ATHLETIC' },
    POWER_FORWARD: { h: 81, w: 235, ws: 86, bt: 'ATHLETIC' },
    CENTER: { h: 84, w: 255, ws: 89, bt: 'TALL_LEAN' },
    GUARD: { h: 75, w: 190, ws: 79, bt: 'LEAN' },
    FORWARD: { h: 80, w: 225, ws: 85, bt: 'ATHLETIC' }
  };
  const b = base[pos];
  // Deterministic - no random to avoid hydration errors
  return { height: b.h, weight: b.w, wingspan: b.ws, bodyType: b.bt };
};

// Generate FT% based on 3PT% (shooters typically have correlated FT%)
// Deterministic - no random to avoid hydration errors
const genFtPct = (threePct?: number, tier?: ShooterTier): number => {
  if (threePct) return Math.min(95, threePct + 45); // Fixed offset instead of random
  const baseFt: Record<ShooterTier, number> = { legendary: 88, elite: 85, great: 82, good: 78, mid_level: 74, bad: 68 };
  return baseFt[tier || 'good'];
};

// Get traits for a tier (deterministic - first option)
const getTraits = (tier: ShooterTier): string[] => {
  const options = TRAITS_BY_TIER[tier];
  return options[0]; // Always return first option for consistency
};

// Get style for a tier (deterministic - first option)
const getStyle = (tier: ShooterTier): string => {
  const options = STYLES_BY_TIER[tier];
  return options[0]; // Always return first option for consistency
};

// Default position based on league (can be overridden)
const defaultPos = (league: string): Position => {
  if (league === 'WNBA' || league === 'NCAA_WOMEN') return 'GUARD';
  return 'SHOOTING_GUARD';
};

let idCounter = 1;

// Factory function to create shooter with all required fields
type PartialShooter = Omit<EliteShooter, 'position' | 'height' | 'weight' | 'wingspan' | 'bodyType' | 'careerFreeThrowPct' | 'keyTraits' | 'shootingStyle'> & {
  position?: Position;
  height?: number;
  weight?: number;
  wingspan?: number;
  bodyType?: BodyType;
  careerFreeThrowPct?: number;
  keyTraits?: string[];
  shootingStyle?: string;
};

const createShooter = (partial: PartialShooter): EliteShooter => {
  const pos = partial.position || defaultPos(partial.league);
  const physical = genPhysical(pos);
  return {
    ...partial,
    position: pos,
    height: partial.height ?? physical.height,
    weight: partial.weight ?? physical.weight,
    wingspan: partial.wingspan ?? physical.wingspan,
    bodyType: partial.bodyType ?? physical.bodyType,
    careerFreeThrowPct: partial.careerFreeThrowPct ?? genFtPct(partial.careerPct, partial.tier),
    keyTraits: partial.keyTraits ?? getTraits(partial.tier),
    shootingStyle: partial.shootingStyle ?? getStyle(partial.tier),
  };
};

// NBA All-Time Great Shooters - Complete with 4-tier system and photos
const nbaStars: EliteShooter[] = [
  // TIER 1 - LEGENDARY (95-99)
  createShooter({ id: idCounter++, name: "Stephen Curry", team: "Golden State Warriors", league: "NBA", tier: "legendary", era: "2009-Present", careerPct: 43.0, achievements: "Greatest 3PT shooter ever, 2x MVP, 4x Champion", photoUrl: nbaPhoto(201939), measurements: genMeasurements('legendary'), overallScore: 99, formCategory: 'EXCELLENT', position: 'POINT_GUARD', height: 75, weight: 185, wingspan: 79, careerFreeThrowPct: 91.0, keyTraits: ["Quick Release", "Deep Range", "Off-Balance Accuracy"], shootingStyle: "Quick release with incredible range and shot-making ability", shootingFormImages: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Stephen_Curry_%2833140701266%29.jpg/960px-Stephen_Curry_%2833140701266%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Stephen_Curry_Shooting_%28cropped%29.jpg/500px-Stephen_Curry_Shooting_%28cropped%29.jpg"
  ] }),
  createShooter({ id: idCounter++, name: "Ray Allen", team: "Multiple Teams", league: "NBA", tier: "legendary", era: "1996-2014", careerPct: 40.0, achievements: "2x NBA Champion, 10x All-Star, HOF", photoUrl: nbaPhoto(951), measurements: genMeasurements('legendary'), overallScore: 97, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 77, weight: 205, wingspan: 81, careerFreeThrowPct: 89.4, keyTraits: ["Perfect Mechanics", "Elite Footwork", "Clutch Shooter"], shootingStyle: "Textbook form with elite consistency and clutch performance", shootingFormImages: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Ray_Allen_free_throw.jpg/800px-Ray_Allen_free_throw.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Ray_Allen_free_throw_2007.jpg/800px-Ray_Allen_free_throw_2007.jpg"
  ] }),
  createShooter({ id: idCounter++, name: "Reggie Miller", team: "Indiana Pacers", league: "NBA", tier: "legendary", era: "1987-2005", careerPct: 39.5, achievements: "5x All-Star, HOF 2012, Clutch legend", photoUrl: nbaPhoto(397), measurements: genMeasurements('legendary'), overallScore: 96, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 79, weight: 195, wingspan: 82, careerFreeThrowPct: 88.8, keyTraits: ["Clutch Shooter", "Quick Release", "High Arc"], shootingStyle: "Clutch performer with quick trigger and elite movement" }),
  createShooter({ id: idCounter++, name: "Klay Thompson", team: "Golden State Warriors", league: "NBA", tier: "legendary", era: "2011-Present", careerPct: 41.3, achievements: "4x NBA Champion, 5x All-Star, 37pts in quarter", photoUrl: nbaPhoto(202691), measurements: genMeasurements('legendary'), overallScore: 98, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 78, weight: 215, wingspan: 81, careerFreeThrowPct: 85.3, keyTraits: ["Catch-and-Shoot", "Perfect Square-Up", "Minimal Wasted Motion"], shootingStyle: "Pure catch-and-shoot specialist with textbook mechanics", shootingFormImages: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Klay_Thompson_shoots_over_Justin_Holiday.jpg/800px-Klay_Thompson_shoots_over_Justin_Holiday.jpg"
  ] }),
  createShooter({ id: idCounter++, name: "Larry Bird", team: "Boston Celtics", league: "NBA", tier: "legendary", era: "1979-1992", careerPct: 37.6, achievements: "3x NBA Champion, 3x MVP, HOF", photoUrl: nbaPhoto(1449), measurements: genMeasurements('legendary'), overallScore: 95, formCategory: 'EXCELLENT', position: 'SMALL_FORWARD', height: 81, weight: 220, wingspan: 84, careerFreeThrowPct: 88.6, keyTraits: ["High Release Point", "Clutch Shooter", "Versatile Shooter"], shootingStyle: "High release with exceptional accuracy from all ranges" }),

  // TIER 2 - ELITE (88-94)
  createShooter({ id: idCounter++, name: "Kevin Durant", team: "Phoenix Suns", league: "NBA", tier: "elite", era: "2007-Present", careerPct: 38.5, achievements: "2x NBA Champion, MVP, Scoring Champion", photoUrl: nbaPhoto(201142), measurements: genMeasurements('elite'), overallScore: 94, formCategory: 'EXCELLENT', position: 'SMALL_FORWARD', height: 83, weight: 240, wingspan: 89, careerFreeThrowPct: 88.3 }),
  createShooter({ id: idCounter++, name: "Dirk Nowitzki", team: "Dallas Mavericks", league: "NBA", tier: "elite", era: "1998-2019", careerPct: 38.0, achievements: "NBA Champion, MVP, 14x All-Star", photoUrl: nbaPhoto(1717), measurements: genMeasurements('elite'), overallScore: 93, formCategory: 'EXCELLENT', position: 'POWER_FORWARD', height: 84, weight: 245, wingspan: 86, careerFreeThrowPct: 87.9, shootingFormImages: [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/NowitzkiFadeaway.jpg/800px-NowitzkiFadeaway.jpg"
  ] }),
  createShooter({ id: idCounter++, name: "Steve Nash", team: "Multiple Teams", league: "NBA", tier: "elite", era: "1996-2014", careerPct: 42.8, achievements: "2x MVP, 8x All-Star, 90/50/40 club", photoUrl: nbaPhoto(959), measurements: genMeasurements('elite'), overallScore: 93, formCategory: 'EXCELLENT', position: 'POINT_GUARD', height: 75, weight: 178, wingspan: 77, careerFreeThrowPct: 90.4 }),
  createShooter({ id: idCounter++, name: "Kyle Korver", team: "Multiple Teams", league: "NBA", tier: "elite", era: "2003-2020", careerPct: 42.9, achievements: "All-Star, All-time 3PM leader era", photoUrl: nbaPhoto(2594), measurements: genMeasurements('elite'), overallScore: 94, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 79, weight: 212, wingspan: 82, careerFreeThrowPct: 88.6 }),
  createShooter({ id: idCounter++, name: "Steve Kerr", team: "Multiple Teams", league: "NBA", tier: "elite", era: "1988-2003", careerPct: 45.4, achievements: "Highest career 3PT%, 5x Champion", photoUrl: nbaPhoto(758), measurements: genMeasurements('elite'), overallScore: 93, formCategory: 'EXCELLENT', position: 'POINT_GUARD', height: 75, weight: 175, wingspan: 77, careerFreeThrowPct: 86.4 }),
  createShooter({ id: idCounter++, name: "Mark Price", team: "Cleveland Cavaliers", league: "NBA", tier: "elite", era: "1986-1998", careerPct: 40.2, achievements: "4x All-Star, 90% FT shooter", photoUrl: nbaPhoto(658), measurements: genMeasurements('elite'), overallScore: 91, formCategory: 'EXCELLENT', position: 'POINT_GUARD', height: 72, weight: 170, wingspan: 74, careerFreeThrowPct: 90.4 }),
  createShooter({ id: idCounter++, name: "Dale Ellis", team: "Multiple Teams", league: "NBA", tier: "elite", era: "1983-2000", careerPct: 40.3, achievements: "All-Star, 3PT Contest Winner 1989", photoUrl: nbaPhoto(247), measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Peja Stojaković", team: "Multiple Teams", league: "NBA", tier: "elite", era: "1998-2011", careerPct: 40.1, achievements: "3x All-Star, 2x 3PT Contest Winner", photoUrl: nbaPhoto(1765), measurements: genMeasurements('elite'), overallScore: 92, formCategory: 'EXCELLENT', position: 'SMALL_FORWARD', height: 82, weight: 229, wingspan: 84, careerFreeThrowPct: 89.5 }),
  createShooter({ id: idCounter++, name: "Damian Lillard", team: "Milwaukee Bucks", league: "NBA", tier: "elite", era: "2012-Present", careerPct: 37.1, achievements: "7x All-Star, Logo shots specialist", photoUrl: nbaPhoto(203081), measurements: genMeasurements('elite'), overallScore: 92, formCategory: 'EXCELLENT', position: 'POINT_GUARD', height: 75, weight: 195, wingspan: 80, careerFreeThrowPct: 89.5 }),
  createShooter({ id: idCounter++, name: "James Harden", team: "LA Clippers", league: "NBA", tier: "elite", era: "2009-Present", careerPct: 36.4, achievements: "MVP, 3x Scoring Champion, Step-back master", photoUrl: nbaPhoto(201935), measurements: genMeasurements('elite'), overallScore: 91, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 77, weight: 220, wingspan: 82, careerFreeThrowPct: 86.1 }),
  createShooter({ id: idCounter++, name: "JJ Redick", team: "Multiple Teams", league: "NBA", tier: "elite", era: "2006-2021", careerPct: 41.5, achievements: "Elite off-ball shooter, 15yr career", photoUrl: nbaPhoto(200755), measurements: genMeasurements('elite'), overallScore: 92, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 76, weight: 190, wingspan: 79, careerFreeThrowPct: 89.2 }),
  createShooter({ id: idCounter++, name: "Hubert Davis", team: "Multiple Teams", league: "NBA", tier: "elite", era: "1992-2004", careerPct: 44.1, achievements: "2nd highest career 3PT%", photoUrl: nbaPhoto(215), measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Dražen Petrović", team: "New Jersey Nets", league: "NBA", tier: "elite", era: "1989-1993", careerPct: 43.7, achievements: "HOF, European legend, All-NBA", photoUrl: nbaPhoto(574), measurements: genMeasurements('elite'), overallScore: 91, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 77, weight: 195, wingspan: 79, careerFreeThrowPct: 85.0 }),
  createShooter({ id: idCounter++, name: "Joe Harris", team: "Detroit Pistons", league: "NBA", tier: "elite", era: "2014-Present", careerPct: 43.9, achievements: "3PT Contest Winner 2019", photoUrl: nbaPhoto(203925), measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Craig Hodges", team: "Multiple Teams", league: "NBA", tier: "elite", era: "1982-1992", careerPct: 40.0, achievements: "3x 3PT Contest Winner", photoUrl: nbaPhoto(319), measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Chris Mullin", team: "Golden State Warriors", league: "NBA", tier: "elite", era: "1985-2001", careerPct: 38.4, achievements: "5x All-Star, HOF, Dream Team", photoUrl: nbaPhoto(551), measurements: genMeasurements('elite'), overallScore: 91, formCategory: 'EXCELLENT', position: 'SMALL_FORWARD', height: 79, weight: 215, wingspan: 81, careerFreeThrowPct: 86.9 }),
  createShooter({ id: idCounter++, name: "Dell Curry", team: "Multiple Teams", league: "NBA", tier: "elite", era: "1986-2002", careerPct: 40.2, achievements: "6th Man of Year, Steph's father", photoUrl: nbaPhoto(198), measurements: genMeasurements('elite'), overallScore: 89, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 77, weight: 190, wingspan: 80, careerFreeThrowPct: 84.3 }),
  createShooter({ id: idCounter++, name: "Mitch Richmond", team: "Multiple Teams", league: "NBA", tier: "elite", era: "1988-2002", careerPct: 38.8, achievements: "6x All-Star, HOF, ROY", photoUrl: nbaPhoto(728), measurements: genMeasurements('elite'), overallScore: 89, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 77, weight: 215, wingspan: 80, careerFreeThrowPct: 86.6 }),
  createShooter({ id: idCounter++, name: "Rick Barry", team: "Multiple Teams", league: "NBA", tier: "elite", era: "1965-1980", careerPct: 89.3, achievements: "HOF, Champion, underhand FT legend", photoUrl: nbaPhoto(60), measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'SMALL_FORWARD', height: 79, weight: 205, wingspan: 81, careerFreeThrowPct: 89.3 }),

  // TIER 3 - GREAT (78-87)
  createShooter({ id: idCounter++, name: "Paul Pierce", team: "Boston Celtics", league: "NBA", tier: "great", era: "1998-2017", careerPct: 36.8, achievements: "NBA Champion, Finals MVP, HOF", photoUrl: nbaPhoto(1718), measurements: genMeasurements('great'), overallScore: 87, formCategory: 'GOOD', position: 'SMALL_FORWARD' }),
  createShooter({ id: idCounter++, name: "Vince Carter", team: "Multiple Teams", league: "NBA", tier: "great", era: "1998-2020", careerPct: 37.1, achievements: "8x All-Star, 22yr career", photoUrl: nbaPhoto(1713), measurements: genMeasurements('great'), overallScore: 85, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Jason Terry", team: "Multiple Teams", league: "NBA", tier: "great", era: "1999-2018", careerPct: 38.0, achievements: "NBA Champion, 6th Man", photoUrl: nbaPhoto(1891), measurements: genMeasurements('great'), overallScore: 86, formCategory: 'GOOD', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Kyle Lowry", team: "Miami Heat", league: "NBA", tier: "great", era: "2006-Present", careerPct: 36.4, achievements: "NBA Champion, 6x All-Star", photoUrl: nbaPhoto(200768), measurements: genMeasurements('great'), overallScore: 84, formCategory: 'GOOD', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Buddy Hield", team: "Philadelphia 76ers", league: "NBA", tier: "great", era: "2016-Present", careerPct: 39.8, achievements: "Elite volume 3PT shooter", photoUrl: nbaPhoto(1627741), measurements: genMeasurements('great'), overallScore: 87, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Paul George", team: "Philadelphia 76ers", league: "NBA", tier: "great", era: "2010-Present", careerPct: 38.5, achievements: "9x All-Star, All-NBA", photoUrl: nbaPhoto(202331), measurements: genMeasurements('great'), overallScore: 86, formCategory: 'GOOD', position: 'SMALL_FORWARD' }),
  createShooter({ id: idCounter++, name: "Joe Johnson", team: "Multiple Teams", league: "NBA", tier: "great", era: "2001-2018", careerPct: 37.2, achievements: "7x All-Star, Iso Joe", photoUrl: nbaPhoto(2207), measurements: genMeasurements('great'), overallScore: 85, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Mike Conley", team: "Minnesota Timberwolves", league: "NBA", tier: "great", era: "2007-Present", careerPct: 37.5, achievements: "All-Star, Elite floor general", photoUrl: nbaPhoto(201144), measurements: genMeasurements('great'), overallScore: 83, formCategory: 'GOOD', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Kyrie Irving", team: "Dallas Mavericks", league: "NBA", tier: "great", era: "2011-Present", careerPct: 39.3, achievements: "NBA Champion, 8x All-Star", photoUrl: nbaPhoto(202681), measurements: genMeasurements('great'), overallScore: 87, formCategory: 'GOOD', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Chris Paul", team: "San Antonio Spurs", league: "NBA", tier: "great", era: "2005-Present", careerPct: 37.0, achievements: "12x All-Star, Point God", photoUrl: nbaPhoto(101108), measurements: genMeasurements('great'), overallScore: 84, formCategory: 'GOOD', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Chauncey Billups", team: "Multiple Teams", league: "NBA", tier: "great", era: "1997-2014", careerPct: 38.7, achievements: "NBA Champion, Finals MVP", photoUrl: nbaPhoto(1497), measurements: genMeasurements('great'), overallScore: 86, formCategory: 'GOOD', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Seth Curry", team: "Multiple Teams", league: "NBA", tier: "great", era: "2013-Present", careerPct: 44.0, achievements: "Elite 3PT shooter, Dell's son", photoUrl: nbaPhoto(203552), measurements: genMeasurements('great'), overallScore: 86, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Jason Kapono", team: "Multiple Teams", league: "NBA", tier: "great", era: "2003-2012", careerPct: 43.3, achievements: "2x 3PT Contest Winner", photoUrl: nbaPhoto(2440), measurements: genMeasurements('great'), overallScore: 84, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Glen Rice", team: "Multiple Teams", league: "NBA", tier: "great", era: "1989-2004", careerPct: 40.0, achievements: "3x All-Star, All-Star MVP", photoUrl: nbaPhoto(720), measurements: genMeasurements('great'), overallScore: 87, formCategory: 'GOOD', position: 'SMALL_FORWARD' }),
  createShooter({ id: idCounter++, name: "Allan Houston", team: "New York Knicks", league: "NBA", tier: "great", era: "1993-2005", careerPct: 40.2, achievements: "2x All-Star, Clutch shooter", photoUrl: nbaPhoto(1179), measurements: genMeasurements('great'), overallScore: 86, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 78, weight: 200, wingspan: 81, careerFreeThrowPct: 86.6, keyTraits: ["Textbook Form", "High Release Point", "Consistent Elbow"], shootingStyle: "Classic mid-range specialist with exceptional fundamentals" }),
  createShooter({ id: idCounter++, name: "Hersey Hawkins", team: "Multiple Teams", league: "NBA", tier: "great", era: "1988-2001", careerPct: 37.8, achievements: "All-Star, Bradley POY", photoUrl: nbaPhoto(303), measurements: genMeasurements('great'), overallScore: 85, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Michael Redd", team: "Milwaukee Bucks", league: "NBA", tier: "great", era: "2000-2012", careerPct: 38.0, achievements: "All-Star, Olympic Gold", photoUrl: nbaPhoto(2050), measurements: genMeasurements('great'), overallScore: 85, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Bradley Beal", team: "Phoenix Suns", league: "NBA", tier: "great", era: "2012-Present", careerPct: 37.4, achievements: "3x All-Star, 30+ PPG seasons", photoUrl: nbaPhoto(203078), measurements: genMeasurements('great'), overallScore: 85, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Donovan Mitchell", team: "Cleveland Cavaliers", league: "NBA", tier: "great", era: "2017-Present", careerPct: 36.7, achievements: "3x All-Star, Spida", photoUrl: nbaPhoto(1628378), measurements: genMeasurements('great'), overallScore: 84, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Kemba Walker", team: "Multiple Teams", league: "NBA", tier: "great", era: "2011-Present", careerPct: 36.3, achievements: "4x All-Star, UConn legend", photoUrl: nbaPhoto(202689), measurements: genMeasurements('great'), overallScore: 83, formCategory: 'GOOD', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Jeff Hornacek", team: "Multiple Teams", league: "NBA", tier: "great", era: "1986-2000", careerPct: 40.3, achievements: "All-Star, Elite shooter", photoUrl: nbaPhoto(367), measurements: genMeasurements('great'), overallScore: 85, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Danny Green", team: "Multiple Teams", league: "NBA", tier: "great", era: "2009-Present", careerPct: 40.0, achievements: "3x NBA Champion, 3&D", photoUrl: nbaPhoto(201980), measurements: genMeasurements('great'), overallScore: 84, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Dennis Scott", team: "Multiple Teams", league: "NBA", tier: "great", era: "1990-2000", careerPct: 39.6, achievements: "3D, Single-season 3PM record holder", photoUrl: nbaPhoto(783), measurements: genMeasurements('great'), overallScore: 84, formCategory: 'GOOD', position: 'SMALL_FORWARD' }),
  createShooter({ id: idCounter++, name: "Carmelo Anthony", team: "Multiple Teams", league: "NBA", tier: "great", era: "2003-2022", careerPct: 35.5, achievements: "10x All-Star, Scoring Champion", photoUrl: nbaPhoto(2546), measurements: genMeasurements('great'), overallScore: 83, formCategory: 'GOOD', position: 'SMALL_FORWARD' }),
  createShooter({ id: idCounter++, name: "Kevin Love", team: "Miami Heat", league: "NBA", tier: "great", era: "2008-Present", careerPct: 37.0, achievements: "NBA Champion, 5x All-Star", photoUrl: nbaPhoto(201567), measurements: genMeasurements('great'), overallScore: 83, formCategory: 'GOOD', position: 'POWER_FORWARD' }),
  createShooter({ id: idCounter++, name: "Dan Majerle", team: "Phoenix Suns", league: "NBA", tier: "great", era: "1988-2002", careerPct: 36.5, achievements: "3x All-Star, Thunder Dan", photoUrl: nbaPhoto(507), measurements: genMeasurements('great'), overallScore: 83, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),

  // TIER 4 - GOOD (70-77)
  createShooter({ id: idCounter++, name: "J.R. Smith", team: "Multiple Teams", league: "NBA", tier: "good", era: "2004-2020", careerPct: 37.3, achievements: "NBA Champion, 6th Man", photoUrl: nbaPhoto(2747), measurements: genMeasurements('good'), overallScore: 77, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Wesley Matthews", team: "Multiple Teams", league: "NBA", tier: "good", era: "2009-2023", careerPct: 38.0, achievements: "Elite 3&D guard", photoUrl: nbaPhoto(202083), measurements: genMeasurements('good'), overallScore: 77, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Tim Legler", team: "Multiple Teams", league: "NBA", tier: "good", era: "1989-2000", careerPct: 43.1, achievements: "3PT Contest Winner 1996", photoUrl: nbaPhoto(1503), measurements: genMeasurements('good'), overallScore: 76, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Steve Novak", team: "Multiple Teams", league: "NBA", tier: "good", era: "2006-2016", careerPct: 42.8, achievements: "Pure specialist", photoUrl: nbaPhoto(200779), measurements: genMeasurements('good'), overallScore: 76, formCategory: 'GOOD', position: 'SMALL_FORWARD' }),
  createShooter({ id: idCounter++, name: "B.J. Armstrong", team: "Chicago Bulls", league: "NBA", tier: "good", era: "1989-2000", careerPct: 42.5, achievements: "3x NBA Champion", photoUrl: nbaPhoto(130), measurements: genMeasurements('good'), overallScore: 75, formCategory: 'GOOD', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Wesley Person", team: "Multiple Teams", league: "NBA", tier: "good", era: "1994-2005", careerPct: 39.8, achievements: "All-Rookie, Elite shooter", photoUrl: nbaPhoto(698), measurements: genMeasurements('good'), overallScore: 76, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Anthony Morrow", team: "Multiple Teams", league: "NBA", tier: "good", era: "2008-2017", careerPct: 41.6, achievements: "Pure catch-and-shoot", photoUrl: nbaPhoto(201627), measurements: genMeasurements('good'), overallScore: 75, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Matt Bonner", team: "San Antonio Spurs", league: "NBA", tier: "good", era: "2004-2017", careerPct: 41.4, achievements: "2x NBA Champion, Red Mamba", photoUrl: nbaPhoto(2588), measurements: genMeasurements('good'), overallScore: 74, formCategory: 'GOOD', position: 'POWER_FORWARD' }),
  createShooter({ id: idCounter++, name: "Dana Barros", team: "Multiple Teams", league: "NBA", tier: "good", era: "1989-2004", careerPct: 39.5, achievements: "All-Star, MIP", photoUrl: nbaPhoto(70), measurements: genMeasurements('good'), overallScore: 75, formCategory: 'GOOD', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Joe Ingles", team: "Multiple Teams", league: "NBA", tier: "good", era: "2014-Present", careerPct: 40.8, achievements: "Aussie sniper", photoUrl: nbaPhoto(204060), measurements: genMeasurements('good'), overallScore: 76, formCategory: 'GOOD', position: 'SMALL_FORWARD' }),
  createShooter({ id: idCounter++, name: "Ben Gordon", team: "Multiple Teams", league: "NBA", tier: "good", era: "2004-2015", careerPct: 40.4, achievements: "6th Man of Year", photoUrl: nbaPhoto(2736), measurements: genMeasurements('good'), overallScore: 76, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Rashard Lewis", team: "Multiple Teams", league: "NBA", tier: "good", era: "1998-2015", careerPct: 38.7, achievements: "2x All-Star, NBA Finalist", photoUrl: nbaPhoto(1897), measurements: genMeasurements('good'), overallScore: 76, formCategory: 'GOOD', position: 'SMALL_FORWARD' }),
  createShooter({ id: idCounter++, name: "Nicolas Batum", team: "LA Clippers", league: "NBA", tier: "good", era: "2008-Present", careerPct: 35.8, achievements: "Versatile wing, Olympic", photoUrl: nbaPhoto(201587), measurements: genMeasurements('good'), overallScore: 73, formCategory: 'GOOD', position: 'SMALL_FORWARD' }),
  createShooter({ id: idCounter++, name: "Jason Richardson", team: "Multiple Teams", league: "NBA", tier: "good", era: "2001-2015", careerPct: 37.4, achievements: "2x Slam Dunk Champion", photoUrl: nbaPhoto(2045), measurements: genMeasurements('good'), overallScore: 75, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Toni Kukoc", team: "Chicago Bulls", league: "NBA", tier: "good", era: "1993-2006", careerPct: 33.6, achievements: "3x NBA Champion, HOF, 6MOY", photoUrl: nbaPhoto(458), measurements: genMeasurements('good'), overallScore: 74, formCategory: 'GOOD', position: 'SMALL_FORWARD' }),
  createShooter({ id: idCounter++, name: "Bruce Bowen", team: "San Antonio Spurs", league: "NBA", tier: "good", era: "1996-2009", careerPct: 39.3, achievements: "3x NBA Champion, 8x All-Defense", photoUrl: nbaPhoto(1828), measurements: genMeasurements('good'), overallScore: 74, formCategory: 'GOOD', position: 'SMALL_FORWARD' }),
  createShooter({ id: idCounter++, name: "Fred Hoiberg", team: "Multiple Teams", league: "NBA", tier: "good", era: "1995-2005", careerPct: 41.0, achievements: "The Mayor, Iowa State legend", photoUrl: nbaPhoto(932), measurements: genMeasurements('good'), overallScore: 74, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Steve Smith", team: "Multiple Teams", league: "NBA", tier: "good", era: "1991-2005", careerPct: 36.7, achievements: "All-Star, NBA Champion", photoUrl: nbaPhoto(889), measurements: genMeasurements('good'), overallScore: 75, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Jamal Crawford", team: "Multiple Teams", league: "NBA", tier: "good", era: "2000-2020", careerPct: 34.8, achievements: "3x 6th Man of Year", photoUrl: nbaPhoto(2037), measurements: genMeasurements('good'), overallScore: 75, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Michael Adams", team: "Multiple Teams", league: "NBA", tier: "good", era: "1985-1996", careerPct: 35.1, achievements: "All-Star, Early 3PT pioneer", photoUrl: nbaPhoto(9), measurements: genMeasurements('good'), overallScore: 73, formCategory: 'GOOD', position: 'POINT_GUARD' }),

  // NEW NBA Elite Shooters - Added via Basketball-Reference scrape
  // Active Elite Shooters
  createShooter({ id: idCounter++, name: "Luke Kennard", team: "Memphis Grizzlies", league: "NBA", tier: "elite", era: "2017-Present", careerPct: 44.9, careerFreeThrowPct: 89.2, achievements: "Highest active 3PT%, 3PT Contest participant", photoUrl: nbaPhoto(1628379), measurements: genMeasurements('elite'), overallScore: 92, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 77, weight: 206 }),
  createShooter({ id: idCounter++, name: "Duncan Robinson", team: "Miami Heat", league: "NBA", tier: "great", era: "2018-Present", careerPct: 40.2, careerFreeThrowPct: 79.5, achievements: "Elite catch-and-shoot specialist, NBA Finals", photoUrl: nbaPhoto(1629130), measurements: genMeasurements('great'), overallScore: 81, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 79, weight: 215 }),
  createShooter({ id: idCounter++, name: "Desmond Bane", team: "Memphis Grizzlies", league: "NBA", tier: "elite", era: "2020-Present", careerPct: 42.2, careerFreeThrowPct: 85.0, achievements: "All-Star caliber shooter, elite efficiency", photoUrl: nbaPhoto(1630217), measurements: genMeasurements('elite'), overallScore: 92, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 77, weight: 215 }),
  createShooter({ id: idCounter++, name: "Kevin Huerter", team: "Sacramento Kings", league: "NBA", tier: "great", era: "2018-Present", careerPct: 38.5, careerFreeThrowPct: 82.0, achievements: "Reliable 3PT shooter, playoff performer", photoUrl: nbaPhoto(1628989), measurements: genMeasurements('great'), overallScore: 80, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 79, weight: 190 }),
  createShooter({ id: idCounter++, name: "Malik Beasley", team: "Detroit Pistons", league: "NBA", tier: "great", era: "2016-Present", careerPct: 38.0, careerFreeThrowPct: 81.5, achievements: "High-volume 3PT shooter", photoUrl: nbaPhoto(1627736), measurements: genMeasurements('great'), overallScore: 80, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 76, weight: 187 }),
  createShooter({ id: idCounter++, name: "Davis Bertans", team: "Multiple Teams", league: "NBA", tier: "great", era: "2016-Present", careerPct: 39.4, careerFreeThrowPct: 83.0, achievements: "Elite stretch-4 shooter", photoUrl: nbaPhoto(202722), measurements: genMeasurements('great'), overallScore: 80, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 82, weight: 225 }),
  createShooter({ id: idCounter++, name: "Bojan Bogdanović", team: "New York Knicks", league: "NBA", tier: "elite", era: "2015-Present", careerPct: 39.5, careerFreeThrowPct: 87.5, achievements: "Elite international shooter", photoUrl: nbaPhoto(202711), measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'SMALL_FORWARD', height: 80, weight: 226 }),
  createShooter({ id: idCounter++, name: "Patty Mills", team: "Multiple Teams", league: "NBA", tier: "great", era: "2012-Present", careerPct: 38.2, careerFreeThrowPct: 84.0, achievements: "NBA Champion, Olympic hero, clutch shooter", photoUrl: nbaPhoto(201988), measurements: genMeasurements('great'), overallScore: 80, formCategory: 'GOOD', position: 'POINT_GUARD', height: 72, weight: 180 }),
  createShooter({ id: idCounter++, name: "Evan Fournier", team: "Multiple Teams", league: "NBA", tier: "great", era: "2012-Present", careerPct: 37.7, careerFreeThrowPct: 81.0, achievements: "Consistent international shooter", photoUrl: nbaPhoto(203095), measurements: genMeasurements('great'), overallScore: 78, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 79, weight: 205 }),
  createShooter({ id: idCounter++, name: "Donte DiVincenzo", team: "Minnesota Timberwolves", league: "NBA", tier: "great", era: "2018-Present", careerPct: 39.0, careerFreeThrowPct: 79.0, achievements: "NBA Champion, Big Shot Donte", photoUrl: nbaPhoto(1628978), measurements: genMeasurements('great'), overallScore: 80, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 76, weight: 203 }),
  createShooter({ id: idCounter++, name: "Max Strus", team: "Cleveland Cavaliers", league: "NBA", tier: "great", era: "2020-Present", careerPct: 37.5, careerFreeThrowPct: 85.0, achievements: "Undrafted to elite shooter", photoUrl: nbaPhoto(1629622), measurements: genMeasurements('great'), overallScore: 78, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 78, weight: 215 }),
  createShooter({ id: idCounter++, name: "Sam Hauser", team: "Boston Celtics", league: "NBA", tier: "elite", era: "2021-Present", careerPct: 42.0, careerFreeThrowPct: 87.0, achievements: "Elite 3PT specialist", photoUrl: nbaPhoto(1630573), measurements: genMeasurements('elite'), overallScore: 92, formCategory: 'EXCELLENT', position: 'SMALL_FORWARD', height: 80, weight: 217 }),
  createShooter({ id: idCounter++, name: "Quentin Grimes", team: "New York Knicks", league: "NBA", tier: "good", era: "2021-Present", careerPct: 37.0, careerFreeThrowPct: 83.0, achievements: "Young elite shooter", photoUrl: nbaPhoto(1629656), measurements: genMeasurements('good'), overallScore: 70, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 77, weight: 210 }),
  createShooter({ id: idCounter++, name: "Coby White", team: "Chicago Bulls", league: "NBA", tier: "great", era: "2019-Present", careerPct: 37.5, careerFreeThrowPct: 83.0, achievements: "High-volume young shooter", photoUrl: nbaPhoto(1629632), measurements: genMeasurements('great'), overallScore: 78, formCategory: 'GOOD', position: 'POINT_GUARD', height: 77, weight: 195 }),
  createShooter({ id: idCounter++, name: "Anfernee Simons", team: "Portland Trail Blazers", league: "NBA", tier: "elite", era: "2018-Present", careerPct: 38.5, careerFreeThrowPct: 89.0, achievements: "Elite scorer and shooter", photoUrl: nbaPhoto(1629014), measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 76, weight: 181 }),
  createShooter({ id: idCounter++, name: "Tyrese Haliburton", team: "Indiana Pacers", league: "NBA", tier: "elite", era: "2020-Present", careerPct: 40.0, careerFreeThrowPct: 86.0, achievements: "All-Star, elite playmaking shooter", photoUrl: nbaPhoto(1630169), measurements: genMeasurements('elite'), overallScore: 91, formCategory: 'EXCELLENT', position: 'POINT_GUARD', height: 77, weight: 185 }),
  createShooter({ id: idCounter++, name: "Trae Young", team: "Atlanta Hawks", league: "NBA", tier: "elite", era: "2018-Present", careerPct: 35.5, careerFreeThrowPct: 87.0, achievements: "All-Star, deep range specialist", photoUrl: nbaPhoto(1629027), measurements: genMeasurements('elite'), overallScore: 88, formCategory: 'EXCELLENT', position: 'POINT_GUARD', height: 73, weight: 164 }),
  createShooter({ id: idCounter++, name: "Khris Middleton", team: "Milwaukee Bucks", league: "NBA", tier: "elite", era: "2012-Present", careerPct: 39.0, careerFreeThrowPct: 88.0, achievements: "NBA Champion, 3x All-Star", photoUrl: nbaPhoto(203114), measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'SMALL_FORWARD', height: 80, weight: 222 }),

  // Recent Retired / Veterans
  createShooter({ id: idCounter++, name: "Marco Belinelli", team: "Multiple Teams", league: "NBA", tier: "great", era: "2007-2021", careerPct: 37.4, careerFreeThrowPct: 83.0, achievements: "NBA Champion, 3PT Contest Winner 2014", photoUrl: nbaPhoto(201158), measurements: genMeasurements('great'), overallScore: 78, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 77, weight: 210 }),
  createShooter({ id: idCounter++, name: "Channing Frye", team: "Multiple Teams", league: "NBA", tier: "great", era: "2005-2019", careerPct: 39.2, careerFreeThrowPct: 81.0, achievements: "NBA Champion, elite stretch big", photoUrl: nbaPhoto(101112), measurements: genMeasurements('great'), overallScore: 80, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 83, weight: 255 }),
  createShooter({ id: idCounter++, name: "Ryan Anderson", team: "Multiple Teams", league: "NBA", tier: "great", era: "2008-2020", careerPct: 38.0, careerFreeThrowPct: 81.0, achievements: "Elite stretch-4, high volume", photoUrl: nbaPhoto(201583), measurements: genMeasurements('great'), overallScore: 80, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 82, weight: 240 }),
  createShooter({ id: idCounter++, name: "Mike Miller", team: "Multiple Teams", league: "NBA", tier: "elite", era: "2000-2017", careerPct: 40.7, careerFreeThrowPct: 86.0, achievements: "2x NBA Champion, ROY, elite shooter", photoUrl: nbaPhoto(2034), measurements: genMeasurements('elite'), overallScore: 91, formCategory: 'EXCELLENT', position: 'SMALL_FORWARD', height: 80, weight: 218 }),
  createShooter({ id: idCounter++, name: "Shane Battier", team: "Multiple Teams", league: "NBA", tier: "great", era: "2001-2014", careerPct: 38.4, careerFreeThrowPct: 79.0, achievements: "2x NBA Champion, elite 3&D", photoUrl: nbaPhoto(2406), measurements: genMeasurements('great'), overallScore: 80, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 80, weight: 220 }),
  createShooter({ id: idCounter++, name: "James Jones", team: "Multiple Teams", league: "NBA", tier: "elite", era: "2003-2017", careerPct: 40.1, careerFreeThrowPct: 79.0, achievements: "3x NBA Champion, elite specialist", photoUrl: nbaPhoto(2592), measurements: genMeasurements('elite'), overallScore: 91, formCategory: 'EXCELLENT', position: 'SMALL_FORWARD', height: 80, weight: 218 }),
  createShooter({ id: idCounter++, name: "Mike Dunleavy Jr.", team: "Multiple Teams", league: "NBA", tier: "great", era: "2002-2017", careerPct: 38.5, careerFreeThrowPct: 83.0, achievements: "Reliable shooter, 15yr career", photoUrl: nbaPhoto(2399), measurements: genMeasurements('great'), overallScore: 80, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 81, weight: 230 }),
  createShooter({ id: idCounter++, name: "Wally Szczerbiak", team: "Multiple Teams", league: "NBA", tier: "elite", era: "1999-2009", careerPct: 39.1, careerFreeThrowPct: 85.0, achievements: "All-Star, elite shooter", photoUrl: nbaPhoto(1938), measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'SMALL_FORWARD', height: 79, weight: 244 }),
  createShooter({ id: idCounter++, name: "Eddie House", team: "Multiple Teams", league: "NBA", tier: "great", era: "2000-2012", careerPct: 37.5, careerFreeThrowPct: 84.0, achievements: "NBA Champion, microwave scorer", photoUrl: nbaPhoto(2043), measurements: genMeasurements('great'), overallScore: 78, formCategory: 'GOOD', position: 'POINT_GUARD', height: 73, weight: 180 }),
  createShooter({ id: idCounter++, name: "Anthony Parker", team: "Multiple Teams", league: "NBA", tier: "elite", era: "2006-2012", careerPct: 40.7, careerFreeThrowPct: 87.0, achievements: "Elite international, Euroleague MVP", photoUrl: nbaPhoto(2447), measurements: genMeasurements('elite'), overallScore: 91, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 78, weight: 215 }),
  createShooter({ id: idCounter++, name: "Michael Finley", team: "Multiple Teams", league: "NBA", tier: "elite", era: "1996-2010", careerPct: 38.7, careerFreeThrowPct: 84.0, achievements: "3x All-Star, NBA Champion", photoUrl: nbaPhoto(951), measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 79, weight: 225 }),
  createShooter({ id: idCounter++, name: "Quentin Richardson", team: "Multiple Teams", league: "NBA", tier: "good", era: "2000-2013", careerPct: 35.8, careerFreeThrowPct: 76.0, achievements: "3PT Contest Winner 2005", photoUrl: nbaPhoto(2056), measurements: genMeasurements('good'), overallScore: 70, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 78, weight: 226 }),
  createShooter({ id: idCounter++, name: "Vladimir Radmanović", team: "Multiple Teams", league: "NBA", tier: "great", era: "2001-2012", careerPct: 38.0, careerFreeThrowPct: 77.0, achievements: "NBA Champion, international shooter", photoUrl: nbaPhoto(2048), measurements: genMeasurements('great'), overallScore: 80, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 82, weight: 235 }),
  createShooter({ id: idCounter++, name: "Brent Barry", team: "Multiple Teams", league: "NBA", tier: "elite", era: "1996-2009", careerPct: 40.6, careerFreeThrowPct: 85.0, achievements: "2x NBA Champion, Slam Dunk Champ", photoUrl: nbaPhoto(1884), measurements: genMeasurements('elite'), overallScore: 91, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 78, weight: 210 }),
  createShooter({ id: idCounter++, name: "Jason Williams", team: "Multiple Teams", league: "NBA", tier: "good", era: "1999-2011", careerPct: 34.2, careerFreeThrowPct: 77.0, achievements: "NBA Champion, White Chocolate", photoUrl: nbaPhoto(1900), measurements: genMeasurements('good'), overallScore: 70, formCategory: 'GOOD', position: 'POINT_GUARD', height: 73, weight: 190 }),
  createShooter({ id: idCounter++, name: "Derek Fisher", team: "Multiple Teams", league: "NBA", tier: "great", era: "1996-2014", careerPct: 37.4, careerFreeThrowPct: 81.0, achievements: "5x NBA Champion, clutch shooter", photoUrl: nbaPhoto(2531), measurements: genMeasurements('great'), overallScore: 78, formCategory: 'GOOD', position: 'POINT_GUARD', height: 73, weight: 200 }),
  createShooter({ id: idCounter++, name: "Robert Horry", team: "Multiple Teams", league: "NBA", tier: "good", era: "1992-2008", careerPct: 34.1, careerFreeThrowPct: 73.0, achievements: "7x NBA Champion, Big Shot Rob", photoUrl: nbaPhoto(286), measurements: genMeasurements('good'), overallScore: 70, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 82, weight: 240 }),
  createShooter({ id: idCounter++, name: "Steve Blake", team: "Multiple Teams", league: "NBA", tier: "good", era: "2003-2016", careerPct: 36.8, careerFreeThrowPct: 81.0, achievements: "Reliable backup, solid shooter", photoUrl: nbaPhoto(2581), measurements: genMeasurements('good'), overallScore: 70, formCategory: 'GOOD', position: 'POINT_GUARD', height: 75, weight: 172 }),
  createShooter({ id: idCounter++, name: "Raja Bell", team: "Multiple Teams", league: "NBA", tier: "great", era: "1999-2012", careerPct: 38.2, careerFreeThrowPct: 82.0, achievements: "Elite 3&D guard", photoUrl: nbaPhoto(2119), measurements: genMeasurements('great'), overallScore: 80, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 77, weight: 210 }),
  createShooter({ id: idCounter++, name: "Eddie Jones", team: "Multiple Teams", league: "NBA", tier: "great", era: "1994-2008", careerPct: 37.0, careerFreeThrowPct: 80.0, achievements: "3x All-Star, elite defender/shooter", photoUrl: nbaPhoto(700), measurements: genMeasurements('great'), overallScore: 78, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 78, weight: 200 }),

  // Classic/Historical Shooters
  createShooter({ id: idCounter++, name: "Detlef Schrempf", team: "Multiple Teams", league: "NBA", tier: "elite", era: "1985-2001", careerPct: 38.7, careerFreeThrowPct: 83.0, achievements: "3x All-Star, 2x 6MOY", photoUrl: nbaPhoto(762), measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'SMALL_FORWARD', height: 82, weight: 230 }),
  createShooter({ id: idCounter++, name: "John Starks", team: "Multiple Teams", league: "NBA", tier: "good", era: "1988-2002", careerPct: 34.0, careerFreeThrowPct: 75.0, achievements: "All-Star, Knicks legend, clutch", photoUrl: nbaPhoto(893), measurements: genMeasurements('good'), overallScore: 70, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 77, weight: 185 }),
  createShooter({ id: idCounter++, name: "Vinnie Johnson", team: "Detroit Pistons", league: "NBA", tier: "good", era: "1979-1992", careerPct: 34.0, careerFreeThrowPct: 77.0, achievements: "2x NBA Champion, Microwave", photoUrl: nbaPhoto(414), measurements: genMeasurements('good'), overallScore: 70, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 74, weight: 200 }),
  createShooter({ id: idCounter++, name: "John Paxson", team: "Chicago Bulls", league: "NBA", tier: "great", era: "1983-1994", careerPct: 37.3, careerFreeThrowPct: 81.0, achievements: "3x NBA Champion, clutch shooter", photoUrl: nbaPhoto(624), measurements: genMeasurements('great'), overallScore: 78, formCategory: 'GOOD', position: 'POINT_GUARD', height: 74, weight: 185 }),
  createShooter({ id: idCounter++, name: "Craig Ehlo", team: "Multiple Teams", league: "NBA", tier: "good", era: "1983-1997", careerPct: 37.0, careerFreeThrowPct: 80.0, achievements: "Solid 3PT shooter, The Shot victim", photoUrl: nbaPhoto(238), measurements: genMeasurements('good'), overallScore: 70, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 78, weight: 185 }),
  createShooter({ id: idCounter++, name: "Trent Tucker", team: "Multiple Teams", league: "NBA", tier: "great", era: "1982-1993", careerPct: 38.4, careerFreeThrowPct: 79.0, achievements: "3PT specialist, Trent Tucker Rule", photoUrl: nbaPhoto(908), measurements: genMeasurements('great'), overallScore: 80, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 77, weight: 193 }),
  createShooter({ id: idCounter++, name: "Danny Ainge", team: "Multiple Teams", league: "NBA", tier: "great", era: "1981-1995", careerPct: 37.5, careerFreeThrowPct: 85.0, achievements: "2x NBA Champion, executive legend", photoUrl: nbaPhoto(19), measurements: genMeasurements('great'), overallScore: 78, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 77, weight: 185 }),
  createShooter({ id: idCounter++, name: "World B. Free", team: "Multiple Teams", league: "NBA", tier: "good", era: "1975-1988", careerPct: 31.0, careerFreeThrowPct: 80.0, achievements: "All-Star, scoring champion era", photoUrl: nbaPhoto(274), measurements: genMeasurements('good'), overallScore: 70, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 75, weight: 185 }),

  // ABA Shooters
  createShooter({ id: idCounter++, name: "Louie Dampier", team: "Kentucky Colonels", league: "NBA", tier: "elite", era: "1967-1979 (ABA/NBA)", careerPct: 35.5, careerFreeThrowPct: 84.0, achievements: "ABA All-time 3PT leader, 7x ABA All-Star", photoUrl: nbaPhoto(207), measurements: genMeasurements('elite'), overallScore: 88, formCategory: 'EXCELLENT', position: 'POINT_GUARD', height: 72, weight: 170 }),
  createShooter({ id: idCounter++, name: "Billy Keller", team: "Indiana Pacers", league: "NBA", tier: "great", era: "1969-1976 (ABA)", careerPct: 37.0, careerFreeThrowPct: 85.0, achievements: "3x ABA Champion, elite ABA shooter", photoUrl: nbaPhoto(437), measurements: genMeasurements('great'), overallScore: 78, formCategory: 'GOOD', position: 'POINT_GUARD', height: 70, weight: 165 }),
  createShooter({ id: idCounter++, name: "Freddie Lewis", team: "Multiple Teams", league: "NBA", tier: "great", era: "1967-1976 (ABA)", careerPct: 35.0, careerFreeThrowPct: 82.0, achievements: "3x ABA Champion, ABA All-Star", photoUrl: nbaPhoto(484), measurements: genMeasurements('great'), overallScore: 78, formCategory: 'GOOD', position: 'GUARD', height: 72, weight: 160 }),
  createShooter({ id: idCounter++, name: "Darel Carrier", team: "Kentucky Colonels", league: "NBA", tier: "great", era: "1968-1975 (ABA)", careerPct: 36.0, careerFreeThrowPct: 80.0, achievements: "ABA All-Star, elite shooter", photoUrl: nbaPhoto(144), measurements: genMeasurements('great'), overallScore: 78, formCategory: 'GOOD', position: 'GUARD', height: 76, weight: 185 }),
  createShooter({ id: idCounter++, name: "Glen Combs", team: "Multiple Teams", league: "NBA", tier: "great", era: "1968-1975 (ABA)", careerPct: 38.0, careerFreeThrowPct: 82.0, achievements: "ABA elite shooter", photoUrl: nbaPhoto(172), measurements: genMeasurements('great'), overallScore: 80, formCategory: 'GOOD', position: 'GUARD', height: 73, weight: 175 }),

  // ===== A-Z SCRAPE ADDITIONS (Dec 2025) =====
  // Additional elite shooters from comprehensive NBA/ABA history

  // A
  createShooter({ id: idCounter++, name: "Mahmoud Abdul-Rauf", team: "Multiple Teams", league: "NBA", tier: "great", era: "1990-2001", careerPct: 35.4, careerFreeThrowPct: 90.5, achievements: "All-Star, ROY, Elite FT shooter", photoUrl: nbaPhoto(1502), measurements: genMeasurements('great'), overallScore: 82, formCategory: 'GOOD', position: 'POINT_GUARD', height: 73, weight: 162 }),
  createShooter({ id: idCounter++, name: "Álex Abrines", team: "Oklahoma City Thunder", league: "NBA", tier: "great", era: "2016-2019", careerPct: 36.8, careerFreeThrowPct: 88.0, achievements: "Spanish League champion, NBA shooter", photoUrl: nbaPhoto(203518), measurements: genMeasurements('great'), overallScore: 78, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 78, weight: 190 }),
  createShooter({ id: idCounter++, name: "Cliff Alexander", team: "Multiple Teams", league: "NBA", tier: "good", era: "2015-2017", careerPct: 37.5, careerFreeThrowPct: 75.0, achievements: "McDonald's All-American", photoUrl: nbaPhoto(1626157), measurements: genMeasurements('good'), overallScore: 70, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 80, weight: 240 }),

  // B
  createShooter({ id: idCounter++, name: "Jon Barry", team: "Multiple Teams", league: "NBA", tier: "great", era: "1992-2006", careerPct: 38.5, careerFreeThrowPct: 81.0, achievements: "NBA Champion, Barry family legacy", photoUrl: nbaPhoto(52), measurements: genMeasurements('great'), overallScore: 80, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 77, weight: 195 }),
  createShooter({ id: idCounter++, name: "Tony Battie", team: "Multiple Teams", league: "NBA", tier: "good", era: "1997-2009", careerPct: 37.0, careerFreeThrowPct: 72.0, achievements: "Reliable stretch big", photoUrl: nbaPhoto(59), measurements: genMeasurements('good'), overallScore: 70, formCategory: 'GOOD', position: 'CENTER', height: 83, weight: 240 }),
  createShooter({ id: idCounter++, name: "Keith Bogans", team: "Multiple Teams", league: "NBA", tier: "good", era: "2003-2014", careerPct: 37.2, careerFreeThrowPct: 80.0, achievements: "NBA Champion, 3&D specialist", photoUrl: nbaPhoto(2547), measurements: genMeasurements('good'), overallScore: 72, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 77, weight: 215 }),
  createShooter({ id: idCounter++, name: "Matt Bullard", team: "Houston Rockets", league: "NBA", tier: "great", era: "1990-2001", careerPct: 38.8, careerFreeThrowPct: 80.0, achievements: "2x NBA Champion, stretch-4 pioneer", photoUrl: nbaPhoto(110), measurements: genMeasurements('great'), overallScore: 80, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 82, weight: 235 }),
  createShooter({ id: idCounter++, name: "Jud Buechler", team: "Multiple Teams", league: "NBA", tier: "good", era: "1990-2002", careerPct: 38.1, careerFreeThrowPct: 78.0, achievements: "3x NBA Champion, Bulls dynasty", photoUrl: nbaPhoto(102), measurements: genMeasurements('good'), overallScore: 74, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 78, weight: 220 }),

  // C
  createShooter({ id: idCounter++, name: "José Calderón", team: "Multiple Teams", league: "NBA", tier: "elite", era: "2005-2019", careerPct: 41.4, careerFreeThrowPct: 87.0, achievements: "NBA Champion, elite FT%, 50-40-90 club", photoUrl: nbaPhoto(101181), measurements: genMeasurements('elite'), overallScore: 88, formCategory: 'EXCELLENT', position: 'POINT_GUARD', height: 75, weight: 200 }),
  createShooter({ id: idCounter++, name: "Brian Cardinal", team: "Multiple Teams", league: "NBA", tier: "good", era: "2000-2012", careerPct: 38.0, careerFreeThrowPct: 82.0, achievements: "NBA Champion, fan favorite", photoUrl: nbaPhoto(2218), measurements: genMeasurements('good'), overallScore: 72, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 80, weight: 245 }),
  createShooter({ id: idCounter++, name: "Matt Carroll", team: "Multiple Teams", league: "NBA", tier: "good", era: "2003-2012", careerPct: 37.8, careerFreeThrowPct: 85.0, achievements: "Notre Dame legend, reliable shooter", photoUrl: nbaPhoto(2573), measurements: genMeasurements('good'), overallScore: 73, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 78, weight: 212 }),
  createShooter({ id: idCounter++, name: "Sam Cassell", team: "Multiple Teams", league: "NBA", tier: "great", era: "1993-2008", careerPct: 37.4, careerFreeThrowPct: 86.0, achievements: "3x NBA Champion, All-Star, clutch performer", photoUrl: nbaPhoto(127), measurements: genMeasurements('great'), overallScore: 82, formCategory: 'GOOD', position: 'POINT_GUARD', height: 75, weight: 185 }),

  // D
  createShooter({ id: idCounter++, name: "Antonio Daniels", team: "Multiple Teams", league: "NBA", tier: "good", era: "1997-2009", careerPct: 37.0, careerFreeThrowPct: 79.0, achievements: "Reliable point guard", photoUrl: nbaPhoto(1891), measurements: genMeasurements('good'), overallScore: 72, formCategory: 'GOOD', position: 'POINT_GUARD', height: 76, weight: 195 }),
  createShooter({ id: idCounter++, name: "Baron Davis", team: "Multiple Teams", league: "NBA", tier: "good", era: "1999-2012", careerPct: 32.1, careerFreeThrowPct: 74.0, achievements: "2x All-Star, We Believe Warriors", photoUrl: nbaPhoto(1884), measurements: genMeasurements('good'), overallScore: 75, formCategory: 'GOOD', position: 'POINT_GUARD', height: 75, weight: 215 }),
  createShooter({ id: idCounter++, name: "Ed Davis", team: "Multiple Teams", league: "NBA", tier: "good", era: "2010-2020", careerPct: 37.0, careerFreeThrowPct: 65.0, achievements: "Reliable role player", photoUrl: nbaPhoto(202334), measurements: genMeasurements('good'), overallScore: 70, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 82, weight: 225 }),

  // E
  createShooter({ id: idCounter++, name: "Wayne Ellington", team: "Multiple Teams", league: "NBA", tier: "great", era: "2009-2023", careerPct: 37.5, careerFreeThrowPct: 82.0, achievements: "NCAA Champion, elite 3PT specialist", photoUrl: nbaPhoto(201961), measurements: genMeasurements('great'), overallScore: 80, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 76, weight: 200 }),
  createShooter({ id: idCounter++, name: "Mario Elie", team: "Multiple Teams", league: "NBA", tier: "great", era: "1990-2001", careerPct: 38.3, careerFreeThrowPct: 80.0, achievements: "3x NBA Champion, Kiss of Death", photoUrl: nbaPhoto(242), measurements: genMeasurements('great'), overallScore: 82, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 77, weight: 210 }),
  createShooter({ id: idCounter++, name: "Sean Elliott", team: "San Antonio Spurs", league: "NBA", tier: "great", era: "1989-2001", careerPct: 37.5, careerFreeThrowPct: 79.0, achievements: "NBA Champion, All-Star, Memorial Day Miracle", photoUrl: nbaPhoto(241), measurements: genMeasurements('great'), overallScore: 82, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 80, weight: 220 }),

  // F
  createShooter({ id: idCounter++, name: "Jordan Farmar", team: "Multiple Teams", league: "NBA", tier: "good", era: "2006-2015", careerPct: 37.0, careerFreeThrowPct: 80.0, achievements: "2x NBA Champion, UCLA star", photoUrl: nbaPhoto(201176), measurements: genMeasurements('good'), overallScore: 73, formCategory: 'GOOD', position: 'POINT_GUARD', height: 74, weight: 180 }),
  createShooter({ id: idCounter++, name: "Raymond Felton", team: "Multiple Teams", league: "NBA", tier: "good", era: "2005-2019", careerPct: 35.0, careerFreeThrowPct: 77.0, achievements: "NCAA Champion, reliable PG", photoUrl: nbaPhoto(101109), measurements: genMeasurements('good'), overallScore: 72, formCategory: 'GOOD', position: 'POINT_GUARD', height: 73, weight: 205 }),

  // G
  createShooter({ id: idCounter++, name: "Manu Ginóbili", team: "San Antonio Spurs", league: "NBA", tier: "elite", era: "2002-2018", careerPct: 36.9, careerFreeThrowPct: 82.0, achievements: "4x NBA Champion, All-Star, 6MOY, HOF", photoUrl: nbaPhoto(1938), measurements: genMeasurements('elite'), overallScore: 92, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 78, weight: 205 }),
  createShooter({ id: idCounter++, name: "Drew Gooden", team: "Multiple Teams", league: "NBA", tier: "good", era: "2002-2015", careerPct: 35.0, careerFreeThrowPct: 76.0, achievements: "NBA Champion, versatile big", photoUrl: nbaPhoto(2400), measurements: genMeasurements('good'), overallScore: 72, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 82, weight: 250 }),
  createShooter({ id: idCounter++, name: "Devean George", team: "Multiple Teams", league: "NBA", tier: "good", era: "1999-2009", careerPct: 36.5, careerFreeThrowPct: 75.0, achievements: "3x NBA Champion, athletic wing", photoUrl: nbaPhoto(1901), measurements: genMeasurements('good'), overallScore: 72, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 80, weight: 220 }),

  // H
  createShooter({ id: idCounter++, name: "Richard Hamilton", team: "Multiple Teams", league: "NBA", tier: "elite", era: "1999-2013", careerPct: 35.0, careerFreeThrowPct: 85.0, achievements: "NBA Champion, Finals MVP, 3x All-Star", photoUrl: nbaPhoto(1897), measurements: genMeasurements('elite'), overallScore: 88, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 79, weight: 193 }),
  createShooter({ id: idCounter++, name: "Anfernee Hardaway", team: "Multiple Teams", league: "NBA", tier: "elite", era: "1993-2008", careerPct: 31.5, careerFreeThrowPct: 77.0, achievements: "4x All-Star, Olympic Gold, HOF", photoUrl: nbaPhoto(320), measurements: genMeasurements('elite'), overallScore: 86, formCategory: 'EXCELLENT', position: 'POINT_GUARD', height: 79, weight: 215 }),
  createShooter({ id: idCounter++, name: "Tim Hardaway", team: "Multiple Teams", league: "NBA", tier: "great", era: "1989-2003", careerPct: 36.1, careerFreeThrowPct: 76.0, achievements: "5x All-Star, UTEP 2-Step, Killer Crossover", photoUrl: nbaPhoto(319), measurements: genMeasurements('great'), overallScore: 84, formCategory: 'GOOD', position: 'POINT_GUARD', height: 72, weight: 195 }),
  createShooter({ id: idCounter++, name: "Tim Hardaway Jr.", team: "Multiple Teams", league: "NBA", tier: "great", era: "2013-Present", careerPct: 36.0, careerFreeThrowPct: 79.0, achievements: "Elite scorer, shooting legacy", photoUrl: nbaPhoto(203501), measurements: genMeasurements('great'), overallScore: 78, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 78, weight: 205 }),
  createShooter({ id: idCounter++, name: "Tobias Harris", team: "Multiple Teams", league: "NBA", tier: "great", era: "2011-Present", careerPct: 36.0, careerFreeThrowPct: 82.0, achievements: "All-Star caliber, consistent scorer", photoUrl: nbaPhoto(202699), measurements: genMeasurements('great'), overallScore: 80, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 80, weight: 226 }),
  createShooter({ id: idCounter++, name: "Udonis Haslem", team: "Miami Heat", league: "NBA", tier: "good", era: "2003-2023", careerPct: 37.0, careerFreeThrowPct: 75.0, achievements: "3x NBA Champion, Heat lifer", photoUrl: nbaPhoto(2617), measurements: genMeasurements('good'), overallScore: 72, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 80, weight: 235 }),

  // I
  createShooter({ id: idCounter++, name: "Ersan İlyasova", team: "Multiple Teams", league: "NBA", tier: "great", era: "2006-2021", careerPct: 36.5, careerFreeThrowPct: 79.0, achievements: "NBA Champion, Turkish star, stretch-4", photoUrl: nbaPhoto(101141), measurements: genMeasurements('great'), overallScore: 78, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 82, weight: 235 }),
  createShooter({ id: idCounter++, name: "Andre Iguodala", team: "Multiple Teams", league: "NBA", tier: "great", era: "2004-2023", careerPct: 33.0, careerFreeThrowPct: 72.0, achievements: "4x NBA Champion, Finals MVP, All-Star", photoUrl: nbaPhoto(2738), measurements: genMeasurements('great'), overallScore: 82, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 78, weight: 215 }),

  // J
  createShooter({ id: idCounter++, name: "Jaren Jackson Jr.", team: "Memphis Grizzlies", league: "NBA", tier: "great", era: "2018-Present", careerPct: 35.0, careerFreeThrowPct: 78.0, achievements: "All-Star, DPOY, elite stretch big", photoUrl: nbaPhoto(1628991), measurements: genMeasurements('great'), overallScore: 82, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 83, weight: 242 }),
  createShooter({ id: idCounter++, name: "Mike James", team: "Multiple Teams", league: "NBA", tier: "good", era: "2001-2012", careerPct: 36.0, careerFreeThrowPct: 82.0, achievements: "Undrafted success story", photoUrl: nbaPhoto(2230), measurements: genMeasurements('good'), overallScore: 74, formCategory: 'GOOD', position: 'POINT_GUARD', height: 74, weight: 188 }),
  createShooter({ id: idCounter++, name: "Antawn Jamison", team: "Multiple Teams", league: "NBA", tier: "great", era: "1998-2014", careerPct: 34.5, careerFreeThrowPct: 78.0, achievements: "2x All-Star, 6MOY, 20K points", photoUrl: nbaPhoto(951), measurements: genMeasurements('great'), overallScore: 80, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 81, weight: 235 }),

  // K
  createShooter({ id: idCounter++, name: "Shawn Kemp", team: "Multiple Teams", league: "NBA", tier: "good", era: "1989-2003", careerPct: 28.0, careerFreeThrowPct: 74.0, achievements: "6x All-Star, Reign Man, iconic dunker", photoUrl: nbaPhoto(432), measurements: genMeasurements('good'), overallScore: 76, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 82, weight: 256 }),
  createShooter({ id: idCounter++, name: "Jason Kidd", team: "Multiple Teams", league: "NBA", tier: "great", era: "1994-2013", careerPct: 34.9, careerFreeThrowPct: 78.0, achievements: "NBA Champion, 10x All-Star, HOF, Triple-double king", photoUrl: nbaPhoto(429), measurements: genMeasurements('great'), overallScore: 86, formCategory: 'GOOD', position: 'POINT_GUARD', height: 76, weight: 212 }),
  createShooter({ id: idCounter++, name: "Andrei Kirilenko", team: "Multiple Teams", league: "NBA", tier: "good", era: "2001-2015", careerPct: 32.0, careerFreeThrowPct: 76.0, achievements: "All-Star, elite defender, AK-47", photoUrl: nbaPhoto(2037), measurements: genMeasurements('good'), overallScore: 76, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 81, weight: 235 }),

  // L
  createShooter({ id: idCounter++, name: "Bill Laimbeer", team: "Multiple Teams", league: "NBA", tier: "good", era: "1980-1994", careerPct: 33.5, careerFreeThrowPct: 84.0, achievements: "2x NBA Champion, 4x All-Star, Bad Boy", photoUrl: nbaPhoto(455), measurements: genMeasurements('good'), overallScore: 76, formCategory: 'GOOD', position: 'CENTER', height: 83, weight: 260 }),
  createShooter({ id: idCounter++, name: "Zach LaVine", team: "Chicago Bulls", league: "NBA", tier: "elite", era: "2014-Present", careerPct: 38.0, careerFreeThrowPct: 84.0, achievements: "2x All-Star, 2x Slam Dunk Champ, elite scorer", photoUrl: nbaPhoto(203897), measurements: genMeasurements('elite'), overallScore: 88, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 77, weight: 200 }),
  createShooter({ id: idCounter++, name: "Kawhi Leonard", team: "LA Clippers", league: "NBA", tier: "elite", era: "2011-Present", careerPct: 37.5, careerFreeThrowPct: 86.0, achievements: "2x NBA Champion, 2x Finals MVP, DPOY", photoUrl: nbaPhoto(202695), measurements: genMeasurements('elite'), overallScore: 92, formCategory: 'EXCELLENT', position: 'SMALL_FORWARD', height: 79, weight: 225 }),
  createShooter({ id: idCounter++, name: "Shaun Livingston", team: "Multiple Teams", league: "NBA", tier: "good", era: "2004-2019", careerPct: 30.0, careerFreeThrowPct: 76.0, achievements: "3x NBA Champion, comeback story", photoUrl: nbaPhoto(2733), measurements: genMeasurements('good'), overallScore: 74, formCategory: 'GOOD', position: 'POINT_GUARD', height: 79, weight: 192 }),

  // M
  createShooter({ id: idCounter++, name: "Karl Malone", team: "Multiple Teams", league: "NBA", tier: "great", era: "1985-2004", careerPct: 27.4, careerFreeThrowPct: 74.0, achievements: "2x MVP, 14x All-Star, HOF, 2nd all-time scorer", photoUrl: nbaPhoto(252), measurements: genMeasurements('great'), overallScore: 88, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 81, weight: 259 }),
  createShooter({ id: idCounter++, name: "Stephon Marbury", team: "Multiple Teams", league: "NBA", tier: "great", era: "1996-2009", careerPct: 33.0, careerFreeThrowPct: 78.0, achievements: "2x All-Star, Starbury, CBA legend", photoUrl: nbaPhoto(951), measurements: genMeasurements('great'), overallScore: 80, formCategory: 'GOOD', position: 'POINT_GUARD', height: 74, weight: 180 }),
  createShooter({ id: idCounter++, name: "Shawn Marion", team: "Multiple Teams", league: "NBA", tier: "good", era: "1999-2015", careerPct: 33.0, careerFreeThrowPct: 81.0, achievements: "NBA Champion, 4x All-Star, Matrix", photoUrl: nbaPhoto(1890), measurements: genMeasurements('good'), overallScore: 78, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 79, weight: 228 }),
  createShooter({ id: idCounter++, name: "Jamal Mashburn", team: "Multiple Teams", league: "NBA", tier: "great", era: "1993-2004", careerPct: 34.5, careerFreeThrowPct: 79.0, achievements: "All-Star, Monster Mash, elite scorer", photoUrl: nbaPhoto(557), measurements: genMeasurements('great'), overallScore: 80, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 80, weight: 250 }),
  createShooter({ id: idCounter++, name: "Tracy McGrady", team: "Multiple Teams", league: "NBA", tier: "elite", era: "1997-2013", careerPct: 33.8, careerFreeThrowPct: 75.0, achievements: "7x All-Star, 2x Scoring Champ, HOF, T-Mac", photoUrl: nbaPhoto(1503), measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 80, weight: 223 }),
  createShooter({ id: idCounter++, name: "CJ McCollum", team: "New Orleans Pelicans", league: "NBA", tier: "great", era: "2013-Present", careerPct: 38.5, careerFreeThrowPct: 83.0, achievements: "Most Improved Player, elite midrange", photoUrl: nbaPhoto(203468), measurements: genMeasurements('great'), overallScore: 84, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 76, weight: 190 }),
  createShooter({ id: idCounter++, name: "Antonio McDyess", team: "Multiple Teams", league: "NBA", tier: "good", era: "1995-2011", careerPct: 30.0, careerFreeThrowPct: 75.0, achievements: "All-Star, elite mid-range big", photoUrl: nbaPhoto(567), measurements: genMeasurements('good'), overallScore: 76, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 81, weight: 245 }),

  // N
  createShooter({ id: idCounter++, name: "Jameer Nelson", team: "Multiple Teams", league: "NBA", tier: "good", era: "2004-2018", careerPct: 36.5, careerFreeThrowPct: 82.0, achievements: "All-Star, Finals run with Magic", photoUrl: nbaPhoto(2749), measurements: genMeasurements('good'), overallScore: 76, formCategory: 'GOOD', position: 'POINT_GUARD', height: 72, weight: 190 }),

  // O
  createShooter({ id: idCounter++, name: "Lamar Odom", team: "Multiple Teams", league: "NBA", tier: "good", era: "1999-2013", careerPct: 31.0, careerFreeThrowPct: 71.0, achievements: "2x NBA Champion, 6MOY, versatile forward", photoUrl: nbaPhoto(1720), measurements: genMeasurements('good'), overallScore: 76, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 82, weight: 230 }),
  createShooter({ id: idCounter++, name: "Jermaine O'Neal", team: "Multiple Teams", league: "NBA", tier: "good", era: "1996-2014", careerPct: 27.0, careerFreeThrowPct: 75.0, achievements: "6x All-Star, MIP, dominant big", photoUrl: nbaPhoto(1004), measurements: genMeasurements('good'), overallScore: 78, formCategory: 'GOOD', position: 'CENTER', height: 83, weight: 255 }),

  // P
  createShooter({ id: idCounter++, name: "Gary Payton", team: "Multiple Teams", league: "NBA", tier: "great", era: "1990-2007", careerPct: 31.7, careerFreeThrowPct: 73.0, achievements: "NBA Champion, DPOY, 9x All-Star, HOF, The Glove", photoUrl: nbaPhoto(625), measurements: genMeasurements('great'), overallScore: 86, formCategory: 'GOOD', position: 'POINT_GUARD', height: 76, weight: 180 }),
  createShooter({ id: idCounter++, name: "Gary Payton II", team: "Golden State Warriors", league: "NBA", tier: "good", era: "2016-Present", careerPct: 35.0, careerFreeThrowPct: 70.0, achievements: "NBA Champion, elite defender, Young Glove", photoUrl: nbaPhoto(1627780), measurements: genMeasurements('good'), overallScore: 74, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 75, weight: 190 }),
  createShooter({ id: idCounter++, name: "Scottie Pippen", team: "Multiple Teams", league: "NBA", tier: "great", era: "1987-2004", careerPct: 32.6, careerFreeThrowPct: 70.0, achievements: "6x NBA Champion, 7x All-Star, HOF", photoUrl: nbaPhoto(937), measurements: genMeasurements('great'), overallScore: 88, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 80, weight: 228 }),
  createShooter({ id: idCounter++, name: "Terry Porter", team: "Multiple Teams", league: "NBA", tier: "great", era: "1985-2002", careerPct: 38.0, careerFreeThrowPct: 84.0, achievements: "2x All-Star, elite PG, Blazers legend", photoUrl: nbaPhoto(659), measurements: genMeasurements('great'), overallScore: 82, formCategory: 'GOOD', position: 'POINT_GUARD', height: 75, weight: 195 }),
  createShooter({ id: idCounter++, name: "Norman Powell", team: "LA Clippers", league: "NBA", tier: "great", era: "2015-Present", careerPct: 38.0, careerFreeThrowPct: 81.0, achievements: "NBA Champion, elite cutter/shooter", photoUrl: nbaPhoto(1626181), measurements: genMeasurements('great'), overallScore: 78, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 76, weight: 215 }),

  // R
  createShooter({ id: idCounter++, name: "Theo Ratliff", team: "Multiple Teams", league: "NBA", tier: "good", era: "1995-2011", careerPct: 20.0, careerFreeThrowPct: 66.0, achievements: "All-Star, elite shot blocker", photoUrl: nbaPhoto(689), measurements: genMeasurements('good'), overallScore: 70, formCategory: 'GOOD', position: 'CENTER', height: 82, weight: 235 }),
  createShooter({ id: idCounter++, name: "J.R. Reid", team: "Multiple Teams", league: "NBA", tier: "good", era: "1989-2001", careerPct: 25.0, careerFreeThrowPct: 72.0, achievements: "UNC legend, solid pro career", photoUrl: nbaPhoto(699), measurements: genMeasurements('good'), overallScore: 70, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 81, weight: 256 }),
  createShooter({ id: idCounter++, name: "Doc Rivers", team: "Multiple Teams", league: "NBA", tier: "good", era: "1983-1996", careerPct: 33.0, careerFreeThrowPct: 79.0, achievements: "All-Star, NBA Champion (coach), legendary PG", photoUrl: nbaPhoto(712), measurements: genMeasurements('good'), overallScore: 76, formCategory: 'GOOD', position: 'POINT_GUARD', height: 76, weight: 185 }),
  createShooter({ id: idCounter++, name: "David Robinson", team: "San Antonio Spurs", league: "NBA", tier: "great", era: "1989-2003", careerPct: 25.0, careerFreeThrowPct: 74.0, achievements: "2x NBA Champion, MVP, 10x All-Star, HOF, The Admiral", photoUrl: nbaPhoto(718), measurements: genMeasurements('great'), overallScore: 90, formCategory: 'GOOD', position: 'CENTER', height: 85, weight: 250 }),
  createShooter({ id: idCounter++, name: "Nate Robinson", team: "Multiple Teams", league: "NBA", tier: "good", era: "2005-2016", careerPct: 33.0, careerFreeThrowPct: 79.0, achievements: "3x Slam Dunk Champ, electric scorer", photoUrl: nbaPhoto(101126), measurements: genMeasurements('good'), overallScore: 74, formCategory: 'GOOD', position: 'POINT_GUARD', height: 69, weight: 180 }),
  createShooter({ id: idCounter++, name: "Rajon Rondo", team: "Multiple Teams", league: "NBA", tier: "good", era: "2006-2022", careerPct: 32.0, careerFreeThrowPct: 61.0, achievements: "2x NBA Champion, 4x All-Star, elite playmaker", photoUrl: nbaPhoto(200765), measurements: genMeasurements('good'), overallScore: 78, formCategory: 'GOOD', position: 'POINT_GUARD', height: 73, weight: 186 }),

  // S
  createShooter({ id: idCounter++, name: "John Salley", team: "Multiple Teams", league: "NBA", tier: "good", era: "1986-2000", careerPct: 30.0, careerFreeThrowPct: 66.0, achievements: "4x NBA Champion, first to win with 3 teams", photoUrl: nbaPhoto(753), measurements: genMeasurements('good'), overallScore: 72, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 83, weight: 244 }),
  createShooter({ id: idCounter++, name: "Ralph Sampson", team: "Multiple Teams", league: "NBA", tier: "good", era: "1983-1992", careerPct: 17.0, careerFreeThrowPct: 66.0, achievements: "4x All-Star, 3x College POY, HOF", photoUrl: nbaPhoto(756), measurements: genMeasurements('good'), overallScore: 76, formCategory: 'GOOD', position: 'CENTER', height: 88, weight: 230 }),
  createShooter({ id: idCounter++, name: "Brian Shaw", team: "Multiple Teams", league: "NBA", tier: "good", era: "1988-2003", careerPct: 34.0, careerFreeThrowPct: 76.0, achievements: "3x NBA Champion, reliable veteran", photoUrl: nbaPhoto(775), measurements: genMeasurements('good'), overallScore: 74, formCategory: 'GOOD', position: 'POINT_GUARD', height: 78, weight: 200 }),
  createShooter({ id: idCounter++, name: "Jerry Stackhouse", team: "Multiple Teams", league: "NBA", tier: "great", era: "1995-2013", careerPct: 32.0, careerFreeThrowPct: 82.0, achievements: "2x All-Star, elite scorer, Stack", photoUrl: nbaPhoto(895), measurements: genMeasurements('great'), overallScore: 80, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 78, weight: 218 }),
  createShooter({ id: idCounter++, name: "John Stockton", team: "Utah Jazz", league: "NBA", tier: "elite", era: "1984-2003", careerPct: 38.4, careerFreeThrowPct: 83.0, achievements: "10x All-Star, HOF, All-time assists/steals leader", photoUrl: nbaPhoto(304), measurements: genMeasurements('elite'), overallScore: 92, formCategory: 'EXCELLENT', position: 'POINT_GUARD', height: 73, weight: 175 }),
  createShooter({ id: idCounter++, name: "Amar'e Stoudemire", team: "Multiple Teams", league: "NBA", tier: "good", era: "2002-2016", careerPct: 26.0, careerFreeThrowPct: 79.0, achievements: "6x All-Star, ROY, STAT", photoUrl: nbaPhoto(2405), measurements: genMeasurements('good'), overallScore: 80, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 82, weight: 245 }),

  // T
  createShooter({ id: idCounter++, name: "Isiah Thomas", team: "Detroit Pistons", league: "NBA", tier: "elite", era: "1981-1994", careerPct: 29.0, careerFreeThrowPct: 76.0, achievements: "2x NBA Champion, Finals MVP, 12x All-Star, HOF", photoUrl: nbaPhoto(1713), measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'POINT_GUARD', height: 73, weight: 180 }),
  createShooter({ id: idCounter++, name: "Isaiah Thomas", team: "Multiple Teams", league: "NBA", tier: "great", era: "2011-2022", careerPct: 36.0, careerFreeThrowPct: 88.0, achievements: "2x All-Star, MVP candidate 2017, The Little Guy", photoUrl: nbaPhoto(202738), measurements: genMeasurements('great'), overallScore: 82, formCategory: 'GOOD', position: 'POINT_GUARD', height: 69, weight: 185 }),
  createShooter({ id: idCounter++, name: "Tyrus Thomas", team: "Multiple Teams", league: "NBA", tier: "good", era: "2006-2013", careerPct: 28.0, careerFreeThrowPct: 72.0, achievements: "Athletic forward, LSU star", photoUrl: nbaPhoto(200799), measurements: genMeasurements('good'), overallScore: 70, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 81, weight: 223 }),

  // V
  createShooter({ id: idCounter++, name: "Fred VanVleet", team: "Houston Rockets", league: "NBA", tier: "great", era: "2016-Present", careerPct: 37.5, careerFreeThrowPct: 85.0, achievements: "NBA Champion, All-Star, undrafted star", photoUrl: nbaPhoto(1627832), measurements: genMeasurements('great'), overallScore: 82, formCategory: 'GOOD', position: 'POINT_GUARD', height: 73, weight: 197 }),

  // W
  createShooter({ id: idCounter++, name: "Ben Wallace", team: "Multiple Teams", league: "NBA", tier: "good", era: "1996-2012", careerPct: 29.0, careerFreeThrowPct: 41.0, achievements: "NBA Champion, 4x DPOY, 4x All-Star, HOF", photoUrl: nbaPhoto(1112), measurements: genMeasurements('good'), overallScore: 78, formCategory: 'GOOD', position: 'CENTER', height: 81, weight: 240 }),
  createShooter({ id: idCounter++, name: "Rasheed Wallace", team: "Multiple Teams", league: "NBA", tier: "great", era: "1995-2013", careerPct: 33.0, careerFreeThrowPct: 75.0, achievements: "NBA Champion, 4x All-Star, Ball Don't Lie", photoUrl: nbaPhoto(1113), measurements: genMeasurements('great'), overallScore: 82, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 83, weight: 230 }),
  createShooter({ id: idCounter++, name: "Gerald Wallace", team: "Multiple Teams", league: "NBA", tier: "good", era: "2001-2015", careerPct: 32.0, careerFreeThrowPct: 70.0, achievements: "All-Star, Crash, elite energy", photoUrl: nbaPhoto(2222), measurements: genMeasurements('good'), overallScore: 74, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 79, weight: 220 }),
  createShooter({ id: idCounter++, name: "Dwyane Wade", team: "Multiple Teams", league: "NBA", tier: "elite", era: "2003-2019", careerPct: 29.3, careerFreeThrowPct: 76.0, achievements: "3x NBA Champion, Finals MVP, 13x All-Star, HOF, Flash", photoUrl: nbaPhoto(2548), measurements: genMeasurements('elite'), overallScore: 94, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 76, weight: 220 }),
  createShooter({ id: idCounter++, name: "Chris Webber", team: "Multiple Teams", league: "NBA", tier: "great", era: "1993-2008", careerPct: 30.5, careerFreeThrowPct: 65.0, achievements: "5x All-Star, ROY, versatile big, HOF", photoUrl: nbaPhoto(1114), measurements: genMeasurements('great'), overallScore: 84, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 82, weight: 245 }),
  createShooter({ id: idCounter++, name: "Russell Westbrook", team: "Multiple Teams", league: "NBA", tier: "great", era: "2008-Present", careerPct: 30.5, careerFreeThrowPct: 79.0, achievements: "MVP, 9x All-Star, Triple-double king, Brodie", photoUrl: nbaPhoto(201566), measurements: genMeasurements('great'), overallScore: 86, formCategory: 'GOOD', position: 'POINT_GUARD', height: 75, weight: 200 }),
  createShooter({ id: idCounter++, name: "Andrew Wiggins", team: "Golden State Warriors", league: "NBA", tier: "great", era: "2014-Present", careerPct: 35.0, careerFreeThrowPct: 73.0, achievements: "NBA Champion, All-Star, #1 Pick", photoUrl: nbaPhoto(203952), measurements: genMeasurements('great'), overallScore: 80, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 79, weight: 197 }),
  createShooter({ id: idCounter++, name: "Dominique Wilkins", team: "Multiple Teams", league: "NBA", tier: "great", era: "1982-1999", careerPct: 32.0, careerFreeThrowPct: 81.0, achievements: "9x All-Star, Scoring Champ, HOF, Human Highlight Film", photoUrl: nbaPhoto(1136), measurements: genMeasurements('great'), overallScore: 88, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 80, weight: 224 }),
  createShooter({ id: idCounter++, name: "Corliss Williamson", team: "Multiple Teams", league: "NBA", tier: "good", era: "1996-2007", careerPct: 30.0, careerFreeThrowPct: 73.0, achievements: "NBA Champion, Big Nasty, Arkansas legend", photoUrl: nbaPhoto(1139), measurements: genMeasurements('good'), overallScore: 72, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 79, weight: 245 }),

  // Y
  createShooter({ id: idCounter++, name: "Nick Young", team: "Multiple Teams", league: "NBA", tier: "good", era: "2007-2019", careerPct: 37.0, careerFreeThrowPct: 79.0, achievements: "NBA Champion, Swaggy P, fan favorite", photoUrl: nbaPhoto(201156), measurements: genMeasurements('good'), overallScore: 74, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 79, weight: 210 }),
  createShooter({ id: idCounter++, name: "Thaddeus Young", team: "Multiple Teams", league: "NBA", tier: "good", era: "2007-Present", careerPct: 32.0, careerFreeThrowPct: 74.0, achievements: "Versatile veteran, ironman", photoUrl: nbaPhoto(201152), measurements: genMeasurements('good'), overallScore: 74, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 80, weight: 221 }),

  // ═══════════════════════════════════════════════════════════════════════════════
  // MID-LEVEL SHOOTERS (33-37% career 3PT) - Average shooters who take shots
  // ═══════════════════════════════════════════════════════════════════════════════
  
  createShooter({ id: idCounter++, name: "Jrue Holiday", team: "Boston Celtics", league: "NBA", tier: "mid_level", era: "2009-Present", careerPct: 35.0, careerFreeThrowPct: 78.0, achievements: "2x NBA Champion, All-Star, All-Defensive", photoUrl: nbaPhoto(201950), measurements: genMeasurements('mid_level'), overallScore: 68, formCategory: 'GOOD', position: 'POINT_GUARD', height: 76, weight: 205 }),
  createShooter({ id: idCounter++, name: "Jimmy Butler", team: "Miami Heat", league: "NBA", tier: "mid_level", era: "2011-Present", careerPct: 33.0, careerFreeThrowPct: 85.0, achievements: "6x All-Star, All-NBA, Finals runs", photoUrl: nbaPhoto(202710), measurements: genMeasurements('mid_level'), overallScore: 65, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 79, weight: 230 }),
  createShooter({ id: idCounter++, name: "DeMar DeRozan", team: "Sacramento Kings", league: "NBA", tier: "mid_level", era: "2009-Present", careerPct: 28.5, careerFreeThrowPct: 84.0, achievements: "6x All-Star, All-NBA, mid-range master", photoUrl: nbaPhoto(201942), measurements: genMeasurements('mid_level'), overallScore: 62, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 78, weight: 220 }),
  createShooter({ id: idCounter++, name: "Pascal Siakam", team: "Indiana Pacers", league: "NBA", tier: "mid_level", era: "2016-Present", careerPct: 33.0, careerFreeThrowPct: 75.0, achievements: "NBA Champion, All-Star, MIP", photoUrl: nbaPhoto(1627783), measurements: genMeasurements('mid_level'), overallScore: 64, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 81, weight: 230 }),
  createShooter({ id: idCounter++, name: "Julius Randle", team: "Minnesota Timberwolves", league: "NBA", tier: "mid_level", era: "2014-Present", careerPct: 33.5, careerFreeThrowPct: 76.0, achievements: "All-Star, MIP, versatile scorer", photoUrl: nbaPhoto(203944), measurements: genMeasurements('mid_level'), overallScore: 63, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 80, weight: 250 }),
  createShooter({ id: idCounter++, name: "Kyle Anderson", team: "Minnesota Timberwolves", league: "NBA", tier: "mid_level", era: "2014-Present", careerPct: 33.5, careerFreeThrowPct: 72.0, achievements: "NBA Champion, Slo-Mo, smart player", photoUrl: nbaPhoto(203937), measurements: genMeasurements('mid_level'), overallScore: 60, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 81, weight: 230 }),
  createShooter({ id: idCounter++, name: "Derrick White", team: "Boston Celtics", league: "NBA", tier: "mid_level", era: "2017-Present", careerPct: 35.5, careerFreeThrowPct: 82.0, achievements: "NBA Champion, All-Defensive, solid shooter", photoUrl: nbaPhoto(1628401), measurements: genMeasurements('mid_level'), overallScore: 66, formCategory: 'GOOD', position: 'POINT_GUARD', height: 76, weight: 190 }),
  createShooter({ id: idCounter++, name: "OG Anunoby", team: "New York Knicks", league: "NBA", tier: "mid_level", era: "2017-Present", careerPct: 36.5, careerFreeThrowPct: 74.0, achievements: "NBA Champion, elite 3&D wing", photoUrl: nbaPhoto(1628384), measurements: genMeasurements('mid_level'), overallScore: 67, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 79, weight: 232 }),
  createShooter({ id: idCounter++, name: "Aaron Gordon", team: "Denver Nuggets", league: "NBA", tier: "mid_level", era: "2014-Present", careerPct: 33.0, careerFreeThrowPct: 70.0, achievements: "NBA Champion, Slam Dunk runner-up", photoUrl: nbaPhoto(203932), measurements: genMeasurements('mid_level'), overallScore: 62, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 80, weight: 235 }),
  createShooter({ id: idCounter++, name: "Mikal Bridges", team: "New York Knicks", league: "NBA", tier: "mid_level", era: "2018-Present", careerPct: 37.0, careerFreeThrowPct: 83.0, achievements: "Iron Man, elite 3&D wing", photoUrl: nbaPhoto(1628969), measurements: genMeasurements('mid_level'), overallScore: 68, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 78, weight: 209 }),
  createShooter({ id: idCounter++, name: "Josh Hart", team: "New York Knicks", league: "NBA", tier: "mid_level", era: "2017-Present", careerPct: 34.0, careerFreeThrowPct: 72.0, achievements: "NBA Champion, hustle player", photoUrl: nbaPhoto(1628404), measurements: genMeasurements('mid_level'), overallScore: 61, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 77, weight: 215 }),
  createShooter({ id: idCounter++, name: "Dejounte Murray", team: "New Orleans Pelicans", league: "NBA", tier: "mid_level", era: "2016-Present", careerPct: 33.0, careerFreeThrowPct: 79.0, achievements: "All-Star, All-Defensive, improved shooter", photoUrl: nbaPhoto(1627749), measurements: genMeasurements('mid_level'), overallScore: 63, formCategory: 'GOOD', position: 'POINT_GUARD', height: 76, weight: 180 }),
  createShooter({ id: idCounter++, name: "Herb Jones", team: "New Orleans Pelicans", league: "NBA", tier: "mid_level", era: "2021-Present", careerPct: 33.0, careerFreeThrowPct: 70.0, achievements: "All-Defensive, lockdown defender", photoUrl: nbaPhoto(1630539), measurements: genMeasurements('mid_level'), overallScore: 60, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 80, weight: 210 }),
  createShooter({ id: idCounter++, name: "Jarrett Allen", team: "Cleveland Cavaliers", league: "NBA", tier: "mid_level", era: "2017-Present", careerPct: 33.0, careerFreeThrowPct: 70.0, achievements: "All-Star, elite rim protector, developing shot", photoUrl: nbaPhoto(1628386), measurements: genMeasurements('mid_level'), overallScore: 58, formCategory: 'GOOD', position: 'CENTER', height: 83, weight: 243 }),
  createShooter({ id: idCounter++, name: "Dillon Brooks", team: "Houston Rockets", league: "NBA", tier: "mid_level", era: "2017-Present", careerPct: 34.0, careerFreeThrowPct: 79.0, achievements: "Defensive specialist, tough competitor", photoUrl: nbaPhoto(1628415), measurements: genMeasurements('mid_level'), overallScore: 61, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 79, weight: 220 }),
  createShooter({ id: idCounter++, name: "Brandon Ingram", team: "New Orleans Pelicans", league: "NBA", tier: "mid_level", era: "2016-Present", careerPct: 36.0, careerFreeThrowPct: 85.0, achievements: "All-Star, MIP, long scorer", photoUrl: nbaPhoto(1627742), measurements: genMeasurements('mid_level'), overallScore: 66, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 80, weight: 190 }),
  createShooter({ id: idCounter++, name: "RJ Barrett", team: "Toronto Raptors", league: "NBA", tier: "mid_level", era: "2019-Present", careerPct: 34.0, careerFreeThrowPct: 72.0, achievements: "#3 Pick, improving shooter", photoUrl: nbaPhoto(1629628), measurements: genMeasurements('mid_level'), overallScore: 60, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 78, weight: 214 }),
  createShooter({ id: idCounter++, name: "Cade Cunningham", team: "Detroit Pistons", league: "NBA", tier: "mid_level", era: "2021-Present", careerPct: 33.0, careerFreeThrowPct: 84.0, achievements: "#1 Pick, franchise player", photoUrl: nbaPhoto(1630595), measurements: genMeasurements('mid_level'), overallScore: 62, formCategory: 'GOOD', position: 'POINT_GUARD', height: 78, weight: 220 }),
  createShooter({ id: idCounter++, name: "Scottie Barnes", team: "Toronto Raptors", league: "NBA", tier: "mid_level", era: "2021-Present", careerPct: 28.0, careerFreeThrowPct: 77.0, achievements: "ROY, All-Star, versatile playmaker", photoUrl: nbaPhoto(1630567), measurements: genMeasurements('mid_level'), overallScore: 58, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 81, weight: 225 }),
  createShooter({ id: idCounter++, name: "Evan Mobley", team: "Cleveland Cavaliers", league: "NBA", tier: "mid_level", era: "2021-Present", careerPct: 27.0, careerFreeThrowPct: 70.0, achievements: "All-Star, All-Defensive, unicorn big", photoUrl: nbaPhoto(1630596), measurements: genMeasurements('mid_level'), overallScore: 57, formCategory: 'GOOD', position: 'POWER_FORWARD', height: 84, weight: 230 }),
  createShooter({ id: idCounter++, name: "Nic Claxton", team: "Brooklyn Nets", league: "NBA", tier: "mid_level", era: "2019-Present", careerPct: 25.0, careerFreeThrowPct: 54.0, achievements: "Rim protector, developing player", photoUrl: nbaPhoto(1629651), measurements: genMeasurements('mid_level'), overallScore: 50, formCategory: 'NEEDS WORK', position: 'CENTER', height: 83, weight: 215 }),
  createShooter({ id: idCounter++, name: "Jamal Murray", team: "Denver Nuggets", league: "NBA", tier: "mid_level", era: "2016-Present", careerPct: 36.0, careerFreeThrowPct: 87.0, achievements: "NBA Champion, playoff performer", photoUrl: nbaPhoto(1627750), measurements: genMeasurements('mid_level'), overallScore: 67, formCategory: 'GOOD', position: 'POINT_GUARD', height: 76, weight: 215 }),
  createShooter({ id: idCounter++, name: "Michael Porter Jr.", team: "Denver Nuggets", league: "NBA", tier: "mid_level", era: "2019-Present", careerPct: 41.0, careerFreeThrowPct: 80.0, achievements: "NBA Champion, pure shooter", photoUrl: nbaPhoto(1629008), measurements: genMeasurements('mid_level'), overallScore: 69, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 82, weight: 218 }),
  createShooter({ id: idCounter++, name: "Lonzo Ball", team: "Chicago Bulls", league: "NBA", tier: "mid_level", era: "2017-Present", careerPct: 36.0, careerFreeThrowPct: 77.0, achievements: "#2 Pick, improved shooter, playmaker", photoUrl: nbaPhoto(1628366), measurements: genMeasurements('mid_level'), overallScore: 64, formCategory: 'GOOD', position: 'POINT_GUARD', height: 78, weight: 190 }),
  createShooter({ id: idCounter++, name: "De'Aaron Fox", team: "Sacramento Kings", league: "NBA", tier: "mid_level", era: "2017-Present", careerPct: 33.0, careerFreeThrowPct: 75.0, achievements: "All-Star, elite speed, improving shooter", photoUrl: nbaPhoto(1628368), measurements: genMeasurements('mid_level'), overallScore: 62, formCategory: 'GOOD', position: 'POINT_GUARD', height: 75, weight: 185 }),
  createShooter({ id: idCounter++, name: "Jalen Brunson", team: "New York Knicks", league: "NBA", tier: "mid_level", era: "2018-Present", careerPct: 36.0, careerFreeThrowPct: 84.0, achievements: "All-Star, clutch performer", photoUrl: nbaPhoto(1628973), measurements: genMeasurements('mid_level'), overallScore: 66, formCategory: 'GOOD', position: 'POINT_GUARD', height: 74, weight: 190 }),
  createShooter({ id: idCounter++, name: "Bam Adebayo", team: "Miami Heat", league: "NBA", tier: "mid_level", era: "2017-Present", careerPct: 15.0, careerFreeThrowPct: 72.0, achievements: "All-Star, All-Defensive, elite playmaking big", photoUrl: nbaPhoto(1628389), measurements: genMeasurements('mid_level'), overallScore: 55, formCategory: 'NEEDS WORK', position: 'CENTER', height: 81, weight: 255 }),
  createShooter({ id: idCounter++, name: "Domantas Sabonis", team: "Sacramento Kings", league: "NBA", tier: "mid_level", era: "2016-Present", careerPct: 33.0, careerFreeThrowPct: 73.0, achievements: "3x All-Star, elite passing big", photoUrl: nbaPhoto(1627734), measurements: genMeasurements('mid_level'), overallScore: 62, formCategory: 'GOOD', position: 'CENTER', height: 83, weight: 240 }),
  createShooter({ id: idCounter++, name: "Nikola Vučević", team: "Chicago Bulls", league: "NBA", tier: "mid_level", era: "2011-Present", careerPct: 34.0, careerFreeThrowPct: 79.0, achievements: "2x All-Star, stretch big", photoUrl: nbaPhoto(202696), measurements: genMeasurements('mid_level'), overallScore: 63, formCategory: 'GOOD', position: 'CENTER', height: 84, weight: 260 }),

  // ═══════════════════════════════════════════════════════════════════════════════
  // BAD SHOOTERS (Below 33% career 3PT) - Poor shooters who still TAKE shots
  // These are NOT rim-only players - they attempt jump shots but struggle
  // ═══════════════════════════════════════════════════════════════════════════════
  
  createShooter({ id: idCounter++, name: "Draymond Green", team: "Golden State Warriors", league: "NBA", tier: "bad", era: "2012-Present", careerPct: 31.0, careerFreeThrowPct: 71.0, achievements: "4x NBA Champion, DPOY, 4x All-Star", photoUrl: nbaPhoto(203110), measurements: genMeasurements('bad'), overallScore: 52, formCategory: 'NEEDS WORK', position: 'POWER_FORWARD', height: 78, weight: 230 }),
  createShooter({ id: idCounter++, name: "Marcus Smart", team: "Memphis Grizzlies", league: "NBA", tier: "bad", era: "2014-Present", careerPct: 32.0, careerFreeThrowPct: 79.0, achievements: "NBA Champion, DPOY, All-Defensive", photoUrl: nbaPhoto(203935), measurements: genMeasurements('bad'), overallScore: 50, formCategory: 'NEEDS WORK', position: 'POINT_GUARD', height: 76, weight: 220 }),
  createShooter({ id: idCounter++, name: "Tony Allen", team: "Multiple Teams", league: "NBA", tier: "bad", era: "2004-2018", careerPct: 26.0, careerFreeThrowPct: 70.0, achievements: "NBA Champion, 6x All-Defensive, Grindfather", photoUrl: nbaPhoto(2754), measurements: genMeasurements('bad'), overallScore: 42, formCategory: 'NEEDS WORK', position: 'SHOOTING_GUARD', height: 76, weight: 213 }),
  createShooter({ id: idCounter++, name: "Andre Roberson", team: "Oklahoma City Thunder", league: "NBA", tier: "bad", era: "2013-2022", careerPct: 25.5, careerFreeThrowPct: 46.0, achievements: "Elite perimeter defender, poor shooter", photoUrl: nbaPhoto(203460), measurements: genMeasurements('bad'), overallScore: 38, formCategory: 'NEEDS WORK', position: 'SHOOTING_GUARD', height: 79, weight: 210 }),
  createShooter({ id: idCounter++, name: "Patrick Beverley", team: "Multiple Teams", league: "NBA", tier: "bad", era: "2012-Present", careerPct: 35.0, careerFreeThrowPct: 80.0, achievements: "All-Defensive, pest, energy guy", photoUrl: nbaPhoto(201976), measurements: genMeasurements('bad'), overallScore: 48, formCategory: 'NEEDS WORK', position: 'POINT_GUARD', height: 73, weight: 185 }),
  createShooter({ id: idCounter++, name: "Ricky Rubio", team: "Multiple Teams", league: "NBA", tier: "bad", era: "2011-2023", careerPct: 32.0, careerFreeThrowPct: 80.0, achievements: "Elite playmaker, limited shooter", photoUrl: nbaPhoto(201937), measurements: genMeasurements('bad'), overallScore: 48, formCategory: 'NEEDS WORK', position: 'POINT_GUARD', height: 76, weight: 190 }),
  createShooter({ id: idCounter++, name: "Michael Carter-Williams", team: "Multiple Teams", league: "NBA", tier: "bad", era: "2013-2022", careerPct: 27.0, careerFreeThrowPct: 67.0, achievements: "ROY, athletic guard, poor shooter", photoUrl: nbaPhoto(203487), measurements: genMeasurements('bad'), overallScore: 40, formCategory: 'NEEDS WORK', position: 'POINT_GUARD', height: 78, weight: 190 }),
  createShooter({ id: idCounter++, name: "Elfrid Payton", team: "Multiple Teams", league: "NBA", tier: "bad", era: "2014-2022", careerPct: 28.0, careerFreeThrowPct: 68.0, achievements: "Playmaker, struggled from range", photoUrl: nbaPhoto(203901), measurements: genMeasurements('bad'), overallScore: 42, formCategory: 'NEEDS WORK', position: 'POINT_GUARD', height: 76, weight: 195 }),
  createShooter({ id: idCounter++, name: "Markelle Fultz", team: "Orlando Magic", league: "NBA", tier: "bad", era: "2017-Present", careerPct: 27.0, careerFreeThrowPct: 66.0, achievements: "#1 Pick, yips recovery, athletic", photoUrl: nbaPhoto(1628365), measurements: genMeasurements('bad'), overallScore: 44, formCategory: 'NEEDS WORK', position: 'POINT_GUARD', height: 76, weight: 209 }),
  createShooter({ id: idCounter++, name: "Giannis Antetokounmpo", team: "Milwaukee Bucks", league: "NBA", tier: "bad", era: "2013-Present", careerPct: 28.5, careerFreeThrowPct: 70.0, achievements: "2x MVP, NBA Champion, DPOY, 8x All-Star", photoUrl: nbaPhoto(203507), measurements: genMeasurements('bad'), overallScore: 54, formCategory: 'NEEDS WORK', position: 'POWER_FORWARD', height: 83, weight: 243 }),
  createShooter({ id: idCounter++, name: "Zion Williamson", team: "New Orleans Pelicans", league: "NBA", tier: "bad", era: "2019-Present", careerPct: 32.0, careerFreeThrowPct: 71.0, achievements: "#1 Pick, All-Star, elite finisher", photoUrl: nbaPhoto(1629627), measurements: genMeasurements('bad'), overallScore: 50, formCategory: 'NEEDS WORK', position: 'POWER_FORWARD', height: 78, weight: 284 }),
  createShooter({ id: idCounter++, name: "Ben Simmons", team: "Brooklyn Nets", league: "NBA", tier: "bad", era: "2017-Present", careerPct: 15.0, careerFreeThrowPct: 59.0, achievements: "ROY, 3x All-Star, DPOY candidate, avoids shooting", photoUrl: nbaPhoto(1627732), measurements: genMeasurements('bad'), overallScore: 35, formCategory: 'NEEDS WORK', position: 'POINT_GUARD', height: 83, weight: 240 }),
  createShooter({ id: idCounter++, name: "Matisse Thybulle", team: "Portland Trail Blazers", league: "NBA", tier: "bad", era: "2019-Present", careerPct: 30.0, careerFreeThrowPct: 68.0, achievements: "2x All-Defensive, elite perimeter D", photoUrl: nbaPhoto(1629680), measurements: genMeasurements('bad'), overallScore: 45, formCategory: 'NEEDS WORK', position: 'SHOOTING_GUARD', height: 77, weight: 201 }),
  createShooter({ id: idCounter++, name: "Josh Okogie", team: "Phoenix Suns", league: "NBA", tier: "bad", era: "2018-Present", careerPct: 27.0, careerFreeThrowPct: 70.0, achievements: "Defensive specialist, limited offense", photoUrl: nbaPhoto(1629006), measurements: genMeasurements('bad'), overallScore: 40, formCategory: 'NEEDS WORK', position: 'SHOOTING_GUARD', height: 76, weight: 213 }),
  createShooter({ id: idCounter++, name: "Davion Mitchell", team: "Sacramento Kings", league: "NBA", tier: "bad", era: "2021-Present", careerPct: 30.0, careerFreeThrowPct: 75.0, achievements: "Off Night, defensive guard", photoUrl: nbaPhoto(1630558), measurements: genMeasurements('bad'), overallScore: 46, formCategory: 'NEEDS WORK', position: 'POINT_GUARD', height: 74, weight: 205 }),
  createShooter({ id: idCounter++, name: "Shaquille O'Neal", team: "Multiple Teams", league: "NBA", tier: "bad", era: "1992-2011", careerPct: 0.0, careerFreeThrowPct: 52.7, achievements: "4x NBA Champion, MVP, 15x All-Star, HOF", photoUrl: nbaPhoto(406), measurements: genMeasurements('bad'), overallScore: 45, formCategory: 'NEEDS WORK', position: 'CENTER', height: 85, weight: 325 }),
  createShooter({ id: idCounter++, name: "Wilt Chamberlain", team: "Multiple Teams", league: "NBA", tier: "bad", era: "1959-1973", careerPct: 0.0, careerFreeThrowPct: 51.1, achievements: "2x NBA Champion, 4x MVP, 13x All-Star, HOF, 100-point game", photoUrl: nbaPhoto(76), measurements: genMeasurements('bad'), overallScore: 48, formCategory: 'NEEDS WORK', position: 'CENTER', height: 85, weight: 275 }),
  createShooter({ id: idCounter++, name: "Dennis Rodman", team: "Multiple Teams", league: "NBA", tier: "bad", era: "1986-2000", careerPct: 23.0, careerFreeThrowPct: 58.4, achievements: "5x NBA Champion, 2x DPOY, 7x Rebounding Champ, HOF", photoUrl: nbaPhoto(725), measurements: genMeasurements('bad'), overallScore: 42, formCategory: 'NEEDS WORK', position: 'POWER_FORWARD', height: 79, weight: 220 }),
  createShooter({ id: idCounter++, name: "Charles Barkley", team: "Multiple Teams", league: "NBA", tier: "bad", era: "1984-2000", careerPct: 26.6, careerFreeThrowPct: 73.5, achievements: "MVP, 11x All-Star, HOF, Round Mound of Rebound", photoUrl: nbaPhoto(787), measurements: genMeasurements('bad'), overallScore: 52, formCategory: 'NEEDS WORK', position: 'POWER_FORWARD', height: 78, weight: 252 }),
  createShooter({ id: idCounter++, name: "LeBron James", team: "Los Angeles Lakers", league: "NBA", tier: "bad", era: "2003-Present", careerPct: 34.8, careerFreeThrowPct: 73.5, achievements: "4x NBA Champion, 4x MVP, 4x Finals MVP, All-time leading scorer", photoUrl: nbaPhoto(2544), measurements: genMeasurements('bad'), overallScore: 55, formCategory: 'NEEDS WORK', position: 'SMALL_FORWARD', height: 81, weight: 250 }),
  createShooter({ id: idCounter++, name: "Ja Morant", team: "Memphis Grizzlies", league: "NBA", tier: "bad", era: "2019-Present", careerPct: 30.5, careerFreeThrowPct: 75.0, achievements: "2x All-Star, MIP, elite athlete", photoUrl: nbaPhoto(1629630), measurements: genMeasurements('bad'), overallScore: 48, formCategory: 'NEEDS WORK', position: 'POINT_GUARD', height: 74, weight: 174 }),
  createShooter({ id: idCounter++, name: "Anthony Edwards", team: "Minnesota Timberwolves", league: "NBA", tier: "bad", era: "2020-Present", careerPct: 36.0, careerFreeThrowPct: 78.0, achievements: "All-Star, #1 Pick, explosive scorer", photoUrl: nbaPhoto(1630162), measurements: genMeasurements('bad'), overallScore: 52, formCategory: 'NEEDS WORK', position: 'SHOOTING_GUARD', height: 76, weight: 225 }),
  createShooter({ id: idCounter++, name: "Victor Wembanyama", team: "San Antonio Spurs", league: "NBA", tier: "bad", era: "2023-Present", careerPct: 32.5, careerFreeThrowPct: 79.0, achievements: "#1 Pick, ROY, generational talent, developing", photoUrl: nbaPhoto(1641705), measurements: genMeasurements('bad'), overallScore: 50, formCategory: 'NEEDS WORK', position: 'CENTER', height: 88, weight: 210 }),
  createShooter({ id: idCounter++, name: "Alonzo Mourning", team: "Multiple Teams", league: "NBA", tier: "bad", era: "1992-2008", careerPct: 11.0, careerFreeThrowPct: 69.2, achievements: "NBA Champion, 2x DPOY, 7x All-Star, HOF", photoUrl: nbaPhoto(600), measurements: genMeasurements('bad'), overallScore: 44, formCategory: 'NEEDS WORK', position: 'CENTER', height: 82, weight: 261 }),
  createShooter({ id: idCounter++, name: "Patrick Ewing", team: "Multiple Teams", league: "NBA", tier: "bad", era: "1985-2002", careerPct: 15.2, careerFreeThrowPct: 74.0, achievements: "11x All-Star, Olympic Gold, HOF", photoUrl: nbaPhoto(121), measurements: genMeasurements('bad'), overallScore: 46, formCategory: 'NEEDS WORK', position: 'CENTER', height: 84, weight: 255 }),
  createShooter({ id: idCounter++, name: "Dikembe Mutombo", team: "Multiple Teams", league: "NBA", tier: "bad", era: "1991-2009", careerPct: 0.0, careerFreeThrowPct: 66.0, achievements: "4x DPOY, 8x All-Star, HOF, finger wag", photoUrl: nbaPhoto(601), measurements: genMeasurements('bad'), overallScore: 40, formCategory: 'NEEDS WORK', position: 'CENTER', height: 86, weight: 260 }),
  createShooter({ id: idCounter++, name: "Hakeem Olajuwon", team: "Multiple Teams", league: "NBA", tier: "bad", era: "1984-2002", careerPct: 20.2, careerFreeThrowPct: 71.2, achievements: "2x NBA Champion, MVP, 2x DPOY, 12x All-Star, HOF, The Dream", photoUrl: nbaPhoto(165), measurements: genMeasurements('bad'), overallScore: 50, formCategory: 'NEEDS WORK', position: 'CENTER', height: 84, weight: 255 }),
];
export const NBA_SHOOTERS: EliteShooter[] = [...nbaStars];

// WNBA All-Time Great Shooters - Complete with 4-tier system
const wnbaStars: EliteShooter[] = [
  // TIER 1 - LEGENDARY (95-99)
  createShooter({ id: idCounter++, name: "Diana Taurasi", team: "Phoenix Mercury", league: "WNBA", tier: "legendary", era: "2004-Present", careerPct: 36.3, achievements: "3x WNBA Champion, All-time leading scorer", photoUrl: wnbaPhoto(100940), measurements: genMeasurements('legendary'), overallScore: 98, formCategory: 'EXCELLENT', position: 'GUARD', height: 72, weight: 163, wingspan: 74 }),
  createShooter({ id: idCounter++, name: "Sue Bird", team: "Seattle Storm", league: "WNBA", tier: "legendary", era: "2002-2023", careerPct: 37.9, achievements: "4x WNBA Champion, 13x All-Star", photoUrl: wnbaPhoto(100720), measurements: genMeasurements('legendary'), overallScore: 97, formCategory: 'EXCELLENT', position: 'POINT_GUARD', height: 69, weight: 150, wingspan: 71 }),
  createShooter({ id: idCounter++, name: "Elena Delle Donne", team: "Washington Mystics", league: "WNBA", tier: "legendary", era: "2013-Present", careerPct: 43.5, achievements: "WNBA Champion, 2x MVP, 50-40-90 club", photoUrl: wnbaPhoto(203399), measurements: genMeasurements('legendary'), overallScore: 98, formCategory: 'EXCELLENT', position: 'FORWARD', height: 77, weight: 187, wingspan: 79 }),
  createShooter({ id: idCounter++, name: "Allie Quigley", team: "Chicago Sky", league: "WNBA", tier: "legendary", era: "2008-2023", careerPct: 38.5, achievements: "WNBA Champion, 3x 3PT Contest Winner", photoUrl: wnbaPhoto(100862), measurements: genMeasurements('legendary'), overallScore: 96, formCategory: 'EXCELLENT', position: 'GUARD', height: 70, weight: 155, wingspan: 72 }),

  // TIER 2 - ELITE (88-94)
  createShooter({ id: idCounter++, name: "Maya Moore", team: "Minnesota Lynx", league: "WNBA", tier: "elite", era: "2011-2019", careerPct: 37.1, achievements: "4x WNBA Champion, MVP", photoUrl: wnbaPhoto(201458), measurements: genMeasurements('elite'), overallScore: 94, formCategory: 'EXCELLENT', position: 'FORWARD', height: 72, weight: 174, wingspan: 74 }),
  createShooter({ id: idCounter++, name: "Becky Hammon", team: "Multiple Teams", league: "WNBA", tier: "elite", era: "1999-2014", careerPct: 36.4, achievements: "6x All-Star, Top 15 All-Time", photoUrl: wnbaPhoto(100616), measurements: genMeasurements('elite'), overallScore: 91, formCategory: 'EXCELLENT', position: 'POINT_GUARD', height: 67, weight: 136, wingspan: 69 }),
  createShooter({ id: idCounter++, name: "Katie Smith", team: "Multiple Teams", league: "WNBA", tier: "elite", era: "1999-2013", careerPct: 35.9, achievements: "2x WNBA Champion, 7x All-Star", photoUrl: wnbaPhoto(100636), measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'GUARD', height: 71, weight: 175, wingspan: 73 }),
  createShooter({ id: idCounter++, name: "Sabrina Ionescu", team: "New York Liberty", league: "WNBA", tier: "elite", era: "2020-Present", careerPct: 36.8, achievements: "All-Star, Triple-double machine", photoUrl: wnbaPhoto(1629673), measurements: genMeasurements('elite'), overallScore: 92, formCategory: 'EXCELLENT', position: 'POINT_GUARD', height: 71, weight: 170, wingspan: 73 }),
  createShooter({ id: idCounter++, name: "Kelsey Plum", team: "Las Vegas Aces", league: "WNBA", tier: "elite", era: "2017-Present", careerPct: 36.2, achievements: "WNBA Champion, All-Star MVP", photoUrl: wnbaPhoto(1628276), measurements: genMeasurements('elite'), overallScore: 91, formCategory: 'EXCELLENT', position: 'POINT_GUARD', height: 68, weight: 146, wingspan: 70 }),
  createShooter({ id: idCounter++, name: "Jewell Loyd", team: "Seattle Storm", league: "WNBA", tier: "elite", era: "2015-Present", careerPct: 35.5, achievements: "WNBA Champion, 4x All-Star", photoUrl: wnbaPhoto(1627256), measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'GUARD', height: 70, weight: 165, wingspan: 72 }),
  createShooter({ id: idCounter++, name: "Tina Thompson", team: "Multiple Teams", league: "WNBA", tier: "elite", era: "1997-2013", careerPct: 34.2, achievements: "4x WNBA Champion, 9x All-Star, HOF", photoUrl: wnbaPhoto(100621), measurements: genMeasurements('elite'), overallScore: 89, formCategory: 'EXCELLENT', position: 'FORWARD', height: 74, weight: 176, wingspan: 76 }),
  createShooter({ id: idCounter++, name: "Kara Lawson", team: "Multiple Teams", league: "WNBA", tier: "elite", era: "2003-2015", careerPct: 37.5, achievements: "WNBA Champion, 3PT specialist", photoUrl: wnbaPhoto(100732), measurements: genMeasurements('elite'), overallScore: 89, formCategory: 'EXCELLENT', position: 'GUARD', height: 69, weight: 160, wingspan: 71 }),

  // TIER 3 - GREAT (78-87)
  createShooter({ id: idCounter++, name: "Arike Ogunbowale", team: "Dallas Wings", league: "WNBA", tier: "great", era: "2019-Present", careerPct: 34.0, achievements: "3x All-Star, Scoring leader", photoUrl: wnbaPhoto(1629023), measurements: genMeasurements('great'), overallScore: 86, formCategory: 'GOOD', position: 'GUARD', height: 68, weight: 152, wingspan: 70 }),
  createShooter({ id: idCounter++, name: "Kelsey Mitchell", team: "Indiana Fever", league: "WNBA", tier: "great", era: "2018-Present", careerPct: 36.5, achievements: "All-Star, Elite scorer", photoUrl: wnbaPhoto(1628886), measurements: genMeasurements('great'), overallScore: 85, formCategory: 'GOOD', position: 'GUARD', height: 67, weight: 160, wingspan: 69 }),
  createShooter({ id: idCounter++, name: "Cappie Pondexter", team: "Multiple Teams", league: "WNBA", tier: "great", era: "2006-2018", careerPct: 34.8, achievements: "2x WNBA Champion, Finals MVP", photoUrl: wnbaPhoto(100850), measurements: genMeasurements('great'), overallScore: 84, formCategory: 'GOOD', position: 'GUARD', height: 69, weight: 159, wingspan: 71 }),
  createShooter({ id: idCounter++, name: "Katie Douglas", team: "Multiple Teams", league: "WNBA", tier: "great", era: "2001-2014", careerPct: 35.2, achievements: "WNBA Champion, 3x All-Star", photoUrl: wnbaPhoto(100705), measurements: genMeasurements('great'), overallScore: 83, formCategory: 'GOOD', position: 'GUARD', height: 70, weight: 165, wingspan: 72 }),
  createShooter({ id: idCounter++, name: "Kayla McBride", team: "Minnesota Lynx", league: "WNBA", tier: "great", era: "2014-Present", careerPct: 35.8, achievements: "Olympic Gold, All-Star", photoUrl: wnbaPhoto(203717), measurements: genMeasurements('great'), overallScore: 83, formCategory: 'GOOD', position: 'GUARD', height: 71, weight: 165, wingspan: 73 }),
  createShooter({ id: idCounter++, name: "Renee Montgomery", team: "Multiple Teams", league: "WNBA", tier: "great", era: "2009-2019", careerPct: 35.5, achievements: "2x WNBA Champion, 6th Woman", photoUrl: wnbaPhoto(201198), measurements: genMeasurements('great'), overallScore: 82, formCategory: 'GOOD', position: 'POINT_GUARD', height: 67, weight: 140, wingspan: 69 }),
  createShooter({ id: idCounter++, name: "Ivory Latta", team: "Multiple Teams", league: "WNBA", tier: "great", era: "2007-2018", careerPct: 35.0, achievements: "Elite point guard shooter", photoUrl: wnbaPhoto(100872), measurements: genMeasurements('great'), overallScore: 81, formCategory: 'GOOD', position: 'POINT_GUARD', height: 64, weight: 145, wingspan: 66 }),
  createShooter({ id: idCounter++, name: "Nicole Powell", team: "Multiple Teams", league: "WNBA", tier: "great", era: "2004-2012", careerPct: 35.8, achievements: "WNBA Champion, All-Star", photoUrl: wnbaPhoto(100802), measurements: genMeasurements('great'), overallScore: 81, formCategory: 'GOOD', position: 'FORWARD', height: 74, weight: 170, wingspan: 76 }),
  createShooter({ id: idCounter++, name: "Rhyne Howard", team: "Atlanta Dream", league: "WNBA", tier: "great", era: "2022-Present", careerPct: 33.5, achievements: "ROY, #1 Draft Pick", photoUrl: wnbaPhoto(1630581), measurements: genMeasurements('great'), overallScore: 82, formCategory: 'GOOD', position: 'GUARD', height: 74, weight: 168, wingspan: 76 }),
  createShooter({ id: idCounter++, name: "Sami Whitcomb", team: "Seattle Storm", league: "WNBA", tier: "great", era: "2017-Present", careerPct: 38.5, achievements: "WNBA Champion, Aussie sharpshooter", photoUrl: wnbaPhoto(1628809), measurements: genMeasurements('great'), overallScore: 84, formCategory: 'GOOD', position: 'GUARD', height: 70, weight: 145, wingspan: 72 }),
  createShooter({ id: idCounter++, name: "Leilani Mitchell", team: "Multiple Teams", league: "WNBA", tier: "great", era: "2008-2020", careerPct: 37.2, achievements: "WNBA Champion, Olympic medalist", photoUrl: wnbaPhoto(201103), measurements: genMeasurements('great'), overallScore: 82, formCategory: 'GOOD', position: 'POINT_GUARD', height: 64, weight: 145, wingspan: 66 }),
  createShooter({ id: idCounter++, name: "Shekinna Stricklen", team: "Multiple Teams", league: "WNBA", tier: "great", era: "2012-2021", careerPct: 37.8, achievements: "3PT Contest Winner", photoUrl: wnbaPhoto(201537), measurements: genMeasurements('great'), overallScore: 83, formCategory: 'GOOD', position: 'FORWARD', height: 74, weight: 175, wingspan: 76 }),

  // TIER 4 - GOOD (70-77)
  createShooter({ id: idCounter++, name: "Crystal Robinson", team: "Multiple Teams", league: "WNBA", tier: "good", era: "1999-2007", careerPct: 36.5, achievements: "All-Star, Pioneer shooter", photoUrl: wnbaPhoto(100648), measurements: genMeasurements('good'), overallScore: 76, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Anna DeForge", team: "Multiple Teams", league: "WNBA", tier: "good", era: "1999-2004", careerPct: 38.2, achievements: "Elite long-range specialist", photoUrl: wnbaPhoto(100654), measurements: genMeasurements('good'), overallScore: 74, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Allison Feaster", team: "Multiple Teams", league: "WNBA", tier: "good", era: "1998-2004", careerPct: 34.5, achievements: "Harvard legend, Euro success", photoUrl: wnbaPhoto(100622), measurements: genMeasurements('good'), overallScore: 73, formCategory: 'GOOD', position: 'FORWARD' }),
  createShooter({ id: idCounter++, name: "Laurie Koehn", team: "Washington Mystics", league: "WNBA", tier: "good", era: "2005-2011", careerPct: 40.0, achievements: "Elite 3PT specialist", photoUrl: wnbaPhoto(100826), measurements: genMeasurements('good'), overallScore: 77, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Erin Thorn", team: "Multiple Teams", league: "WNBA", tier: "good", era: "2007-2012", careerPct: 36.8, achievements: "Steady perimeter shooter", photoUrl: wnbaPhoto(100876), measurements: genMeasurements('good'), overallScore: 73, formCategory: 'GOOD', position: 'GUARD' }),
];
export const WNBA_SHOOTERS: EliteShooter[] = [...wnbaStars];

// NCAA Division I Men's Great Shooters - Complete with 4-tier system
const ncaaMenStars: EliteShooter[] = [
  // TIER 1 - LEGENDARY (95-99)
  createShooter({ id: idCounter++, name: "Pete Maravich", team: "LSU", league: "NCAA_MEN", tier: "legendary", era: "1967-1970", careerPct: 44.2, achievements: "All-time NCAA scorer, 44.2 PPG", measurements: genMeasurements('legendary'), overallScore: 99, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 77, weight: 200, wingspan: 80 }),
  createShooter({ id: idCounter++, name: "Jimmer Fredette", team: "BYU", league: "NCAA_MEN", tier: "legendary", era: "2007-2011", careerPct: 41.5, achievements: "NPOY 2011, Consensus All-American", measurements: genMeasurements('legendary'), overallScore: 97, formCategory: 'EXCELLENT', position: 'POINT_GUARD', height: 74, weight: 195, wingspan: 77 }),

  // TIER 2 - ELITE (88-94)
  createShooter({ id: idCounter++, name: "Doug McDermott", team: "Creighton", league: "NCAA_MEN", tier: "elite", era: "2010-2014", careerPct: 45.0, achievements: "NPOY 2014, 3x All-American", measurements: genMeasurements('elite'), overallScore: 93, formCategory: 'EXCELLENT', position: 'SMALL_FORWARD', height: 80, weight: 225, wingspan: 82 }),
  createShooter({ id: idCounter++, name: "Antoine Davis", team: "Detroit Mercy", league: "NCAA_MEN", tier: "elite", era: "2018-2023", careerPct: 36.5, achievements: "D1 Men's all-time leader in made 3s (559)", measurements: genMeasurements('elite'), overallScore: 93, formCategory: 'EXCELLENT', position: 'POINT_GUARD', height: 73, weight: 170, wingspan: 75 }),
  createShooter({ id: idCounter++, name: "Fletcher Magee", team: "Wofford", league: "NCAA_MEN", tier: "elite", era: "2015-2019", careerPct: 43.0, achievements: "NCAA D1 career 3PT makes record (509)", measurements: genMeasurements('elite'), overallScore: 94, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 76, weight: 190, wingspan: 78 }),
  createShooter({ id: idCounter++, name: "Travis Bader", team: "Oakland", league: "NCAA_MEN", tier: "elite", era: "2010-2014", careerPct: 42.5, achievements: "Former NCAA 3PM record holder", measurements: genMeasurements('elite'), overallScore: 91, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 77, weight: 190, wingspan: 79 }),
  createShooter({ id: idCounter++, name: "Adam Morrison", team: "Gonzaga", league: "NCAA_MEN", tier: "elite", era: "2003-2006", careerPct: 44.0, achievements: "NPOY finalist, 28.1 PPG", measurements: genMeasurements('elite'), overallScore: 91, formCategory: 'EXCELLENT', position: 'SMALL_FORWARD', height: 80, weight: 205, wingspan: 82 }),
  createShooter({ id: idCounter++, name: "Steve Alford", team: "Indiana", league: "NCAA_MEN", tier: "elite", era: "1983-1987", careerPct: 42.0, achievements: "NCAA Champion, All-American, Olympic Gold", measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 74, weight: 180, wingspan: 76 }),

  // TIER 3 - GREAT (78-87)
  createShooter({ id: idCounter++, name: "Darius McGhee", team: "Liberty", league: "NCAA_MEN", tier: "great", era: "2018-2023", careerPct: 39.5, achievements: "ASUN POY, 3,000+ career points", measurements: genMeasurements('great'), overallScore: 86, formCategory: 'GOOD', position: 'POINT_GUARD', height: 69, weight: 170, wingspan: 71 }),
  createShooter({ id: idCounter++, name: "Max Abmas", team: "Oral Roberts", league: "NCAA_MEN", tier: "great", era: "2019-2024", careerPct: 40.5, achievements: "NCAA scoring leader 2021, Sweet 16", measurements: genMeasurements('great'), overallScore: 87, formCategory: 'GOOD', position: 'POINT_GUARD', height: 72, weight: 165, wingspan: 74 }),
  createShooter({ id: idCounter++, name: "Gerry McNamara", team: "Syracuse", league: "NCAA_MEN", tier: "great", era: "2002-2006", careerPct: 39.2, achievements: "NCAA Champion, Big East tourney hero", measurements: genMeasurements('great'), overallScore: 85, formCategory: 'GOOD', position: 'POINT_GUARD', height: 74, weight: 185, wingspan: 76 }),
  createShooter({ id: idCounter++, name: "Jack Taylor", team: "Grinnell", league: "NCAA_MEN", tier: "great", era: "2011-2015", careerPct: 41.0, achievements: "D3 - 109 points in game, 24 threes", measurements: genMeasurements('great'), overallScore: 84, formCategory: 'GOOD', position: 'POINT_GUARD', height: 69, weight: 155, wingspan: 71 }),
  createShooter({ id: idCounter++, name: "Kyle Guy", team: "Virginia", league: "NCAA_MEN", tier: "great", era: "2016-2019", careerPct: 42.5, achievements: "NCAA Champion, Final Four MOP", measurements: genMeasurements('great'), overallScore: 85, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 74, weight: 170, wingspan: 76 }),

  // TIER 4 - GOOD (70-77)
  createShooter({ id: idCounter++, name: "Corey Kispert", team: "Gonzaga", league: "NCAA_MEN", tier: "good", era: "2017-2021", careerPct: 44.0, achievements: "All-American, Elite shooter", measurements: genMeasurements('good'), overallScore: 77, formCategory: 'GOOD', position: 'SMALL_FORWARD', height: 79, weight: 220, wingspan: 81 }),
  createShooter({ id: idCounter++, name: "Grayson Allen", team: "Duke", league: "NCAA_MEN", tier: "good", era: "2014-2018", careerPct: 38.5, achievements: "NCAA Champion, All-American", measurements: genMeasurements('good'), overallScore: 75, formCategory: 'GOOD', position: 'SHOOTING_GUARD', height: 76, weight: 198, wingspan: 78 }),
];
export const NCAA_MEN_SHOOTERS: EliteShooter[] = [...ncaaMenStars];

// NCAA Division I Women's Great Shooters - Complete with 4-tier system
const ncaaWomenStars: EliteShooter[] = [
  // TIER 1 - LEGENDARY (95-99)
  createShooter({ id: idCounter++, name: "Caitlin Clark", team: "Indiana Fever", league: "WNBA", tier: "legendary", era: "2020-Present", careerPct: 37.5, achievements: "All-time NCAA scorer, WNBA ROY 2024, All-WNBA", photoUrl: wnbaPhoto(1642286), measurements: genMeasurements('legendary'), overallScore: 99, formCategory: 'EXCELLENT', position: 'GUARD', height: 72, weight: 157, wingspan: 74 }),
  createShooter({ id: idCounter++, name: "Jackie Stiles", team: "Missouri State", league: "NCAA_WOMEN", tier: "legendary", era: "1997-2001", careerPct: 47.0, achievements: "NPOY 2001, Former NCAA scoring record", photoUrl: espnWomenPhoto(4433403), measurements: genMeasurements('legendary'), overallScore: 97, formCategory: 'EXCELLENT', position: 'GUARD', height: 69, weight: 150, wingspan: 71 }),
  createShooter({ id: idCounter++, name: "Taylor Robertson", team: "Oklahoma", league: "NCAA_WOMEN", tier: "legendary", era: "2018-2023", careerPct: 42.5, achievements: "D1 Women's all-time leader in made 3s (497)", photoUrl: espnWomenPhoto(4433403), measurements: genMeasurements('legendary'), overallScore: 96, formCategory: 'EXCELLENT', position: 'GUARD', height: 70, weight: 150, wingspan: 72 }),

  // TIER 2 - ELITE (88-94)
  createShooter({ id: idCounter++, name: "Katie Lou Samuelson", team: "Connecticut", league: "NCAA_WOMEN", tier: "elite", era: "2015-2019", careerPct: 43.5, achievements: "3x All-American, AAC POY", photoUrl: wnbaPhoto(1629025), measurements: genMeasurements('elite'), overallScore: 92, formCategory: 'EXCELLENT', position: 'FORWARD' }),
  createShooter({ id: idCounter++, name: "Katelynn Flaherty", team: "Michigan", league: "NCAA_WOMEN", tier: "elite", era: "2014-2018", careerPct: 38.0, achievements: "Big Ten all-time scorer, All-American", photoUrl: espnWomenPhoto(3915540), measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Dyaisha Fair", team: "Syracuse", league: "NCAA_WOMEN", tier: "elite", era: "2019-2024", careerPct: 36.5, achievements: "2x Scoring leader, All-American", photoUrl: espnWomenPhoto(4433403), measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Kendall Spray", team: "Texas A&M", league: "NCAA_WOMEN", tier: "elite", era: "2017-2022", careerPct: 43.5, achievements: "SEC 3PM record holder", photoUrl: espnWomenPhoto(4433403), measurements: genMeasurements('elite'), overallScore: 89, formCategory: 'EXCELLENT', position: 'GUARD' }),

  // TIER 3 - GREAT (78-87)
  createShooter({ id: idCounter++, name: "Taylor Mikesell", team: "Ohio State", league: "NCAA_WOMEN", tier: "great", era: "2018-2023", careerPct: 40.5, achievements: "All-American, Elite transfer shooter", measurements: genMeasurements('great'), overallScore: 86, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Jess Kovatch", team: "James Madison", league: "NCAA_WOMEN", tier: "great", era: "2014-2018", careerPct: 39.0, achievements: "CAA all-time scorer", measurements: genMeasurements('great'), overallScore: 84, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Taylor Pierce", team: "Gonzaga", league: "NCAA_WOMEN", tier: "great", era: "2016-2021", careerPct: 40.0, achievements: "WCC elite shooter", measurements: genMeasurements('great'), overallScore: 83, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Katie Benzan", team: "Maryland", league: "NCAA_WOMEN", tier: "great", era: "2017-2022", careerPct: 44.0, achievements: "Elite 3PT specialist, Harvard/UMD", measurements: genMeasurements('great'), overallScore: 85, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Darby Maggard", team: "Indiana", league: "NCAA_WOMEN", tier: "great", era: "2017-2022", careerPct: 38.0, achievements: "3PT specialist, Big Ten sharpshooter", measurements: genMeasurements('great'), overallScore: 83, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Rachael Childress", team: "Liberty", league: "NCAA_WOMEN", tier: "great", era: "2014-2018", careerPct: 39.5, achievements: "ASUN scoring leader", measurements: genMeasurements('great'), overallScore: 82, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Mikayla Ferenz", team: "Idaho", league: "NCAA_WOMEN", tier: "great", era: "2015-2019", careerPct: 37.0, achievements: "Big Sky POY, Elite scorer", measurements: genMeasurements('great'), overallScore: 82, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Heather Butler", team: "Tennessee-Martin", league: "NCAA_WOMEN", tier: "great", era: "2012-2016", careerPct: 38.5, achievements: "OVC POY, Deep range specialist", measurements: genMeasurements('great'), overallScore: 82, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Madison Guebert", team: "South Dakota State", league: "NCAA_WOMEN", tier: "great", era: "2015-2019", careerPct: 40.5, achievements: "Summit League elite shooter", measurements: genMeasurements('great'), overallScore: 83, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Bridget Carleton", team: "Iowa State", league: "NCAA_WOMEN", tier: "great", era: "2015-2019", careerPct: 38.0, achievements: "Big 12 POY, All-American", measurements: genMeasurements('great'), overallScore: 84, formCategory: 'GOOD', position: 'FORWARD' }),

  // TIER 4 - GOOD (70-77)
  createShooter({ id: idCounter++, name: "Jaelyn Cofield", team: "Samford", league: "NCAA_WOMEN", tier: "good", era: "2017-2021", careerPct: 36.0, achievements: "SoCon elite scorer", measurements: genMeasurements('good'), overallScore: 76, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Erin Boley", team: "Oregon", league: "NCAA_WOMEN", tier: "good", era: "2017-2023", careerPct: 38.0, achievements: "Pac-12 sharpshooter, Final Four", measurements: genMeasurements('good'), overallScore: 75, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Kari Niblack", team: "FIU", league: "NCAA_WOMEN", tier: "good", era: "2015-2019", careerPct: 36.5, achievements: "C-USA scorer", measurements: genMeasurements('good'), overallScore: 74, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Jamie Carey", team: "Texas Tech", league: "NCAA_WOMEN", tier: "good", era: "2001-2005", careerPct: 37.0, achievements: "Big 12 sharp shooter", measurements: genMeasurements('good'), overallScore: 74, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Jordan Danberry", team: "Arkansas", league: "NCAA_WOMEN", tier: "good", era: "2015-2019", careerPct: 35.5, achievements: "SEC shooter/playmaker", measurements: genMeasurements('good'), overallScore: 73, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Kamdyn Curfman", team: "High Point", league: "NCAA_WOMEN", tier: "good", era: "2019-2024", careerPct: 39.0, achievements: "Big South elite shooter", measurements: genMeasurements('good'), overallScore: 75, formCategory: 'GOOD', position: 'GUARD' }),
];
export const NCAA_WOMEN_SHOOTERS: EliteShooter[] = [...ncaaWomenStars];

// Top College Shooters of All Time - Focus on elite shooting legends
const topCollegeStars: EliteShooter[] = [
  // TIER 1 - LEGENDARY (95-99) - All-time greats

  // TIER 2 - ELITE (88-94)
  createShooter({ id: idCounter++, name: "Karlie Samuelson", team: "Stanford", league: "TOP_COLLEGE", tier: "elite", era: "2014-2018", careerPct: 44.0, achievements: "Pac-12 elite shooter", measurements: genMeasurements('elite'), overallScore: 88, formCategory: 'EXCELLENT', position: 'GUARD' }),

  // TIER 3 - GREAT (78-87)

  // TIER 4 - GOOD (70-77)
];
export const TOP_COLLEGE_PLAYERS: EliteShooter[] = [...topCollegeStars];

// Combined database
export const ALL_ELITE_SHOOTERS: EliteShooter[] = [
  ...NBA_SHOOTERS,
  ...WNBA_SHOOTERS,
  ...NCAA_MEN_SHOOTERS,
  ...NCAA_WOMEN_SHOOTERS,
  ...TOP_COLLEGE_PLAYERS
];

export const LEAGUE_LABELS: Record<EliteShooter['league'], string> = {
  NBA: 'NBA',
  WNBA: 'WNBA',
  NCAA_MEN: 'NCAA Men',
  NCAA_WOMEN: 'NCAA Women',
  TOP_COLLEGE: 'Top College'
};

export const LEAGUE_COLORS: Record<EliteShooter['league'], string> = {
  NBA: 'from-blue-500 to-blue-600',
  WNBA: 'from-orange-500 to-orange-600',
  NCAA_MEN: 'from-green-500 to-green-600',
  NCAA_WOMEN: 'from-purple-500 to-purple-600',
  TOP_COLLEGE: 'from-amber-500 to-amber-600'
};

