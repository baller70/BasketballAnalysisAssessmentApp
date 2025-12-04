// Elite Shooters Database - Comprehensive database with physical attributes & matching algorithm
// 4-TIER CLASSIFICATION SYSTEM:
// - LEGENDARY (Tier 1): Greatest shooters ever (95-99 score)
// - ELITE (Tier 2): Exceptional shooters (88-94 score)
// - GREAT (Tier 3): Very good shooters (78-87 score)
// - GOOD (Tier 4): Competent shooters (70-77 score)

export type ShooterTier = 'legendary' | 'elite' | 'great' | 'good';
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _wnbaPhoto = (id: number) => `https://cdn.wnba.com/headshots/wnba/latest/1040x760/${id}.png`;

// Generate biomechanics based on tier and some variance
const genBio = (tier: ShooterTier, heightMod = 0) => {
  const base = {
    legendary: { sa: 172, ea: 90, ha: 174, ka: 142, aa: 88, rh: 110 + heightMod, ra: 51, ena: 46 },
    elite:     { sa: 170, ea: 89, ha: 172, ka: 140, aa: 87, rh: 108 + heightMod, ra: 50, ena: 45 },
    great:     { sa: 168, ea: 87, ha: 170, ka: 138, aa: 85, rh: 105 + heightMod, ra: 48, ena: 44 },
    good:      { sa: 165, ea: 85, ha: 168, ka: 135, aa: 83, rh: 102 + heightMod, ra: 46, ena: 42 }
  }[tier];
  const v = (n: number, r: number) => n + Math.floor(Math.random() * r * 2) - r;
  return {
    shoulderAngle: v(base.sa, 3), elbowAngle: v(base.ea, 2), hipAngle: v(base.ha, 3),
    kneeAngle: v(base.ka, 3), ankleAngle: v(base.aa, 2), releaseHeight: v(base.rh, 3),
    releaseAngle: v(base.ra, 2), entryAngle: v(base.ena, 2)
  };
};

// Tier display
export const TIER_LABELS: Record<ShooterTier, string> = {
  legendary: 'LEGENDARY', elite: 'ELITE', great: 'GREAT', good: 'GOOD'
};

export const TIER_COLORS: Record<ShooterTier, string> = {
  legendary: '#FFD700', elite: '#C0C0C0', great: '#CD7F32', good: '#4A90D9'
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
  const v = (n: number, r: number) => n + Math.floor(Math.random() * r * 2) - r;
  return { height: v(b.h, 2), weight: v(b.w, 10), wingspan: v(b.ws, 2), bodyType: b.bt };
};

// Generate FT% based on 3PT% (shooters typically have correlated FT%)
const genFtPct = (threePct?: number, tier?: ShooterTier): number => {
  if (threePct) return Math.min(95, threePct + 42 + Math.floor(Math.random() * 8));
  const baseFt = { legendary: 88, elite: 85, great: 82, good: 78 };
  return baseFt[tier || 'good'] + Math.floor(Math.random() * 6);
};

// Get random traits for a tier
const getTraits = (tier: ShooterTier): string[] => {
  const options = TRAITS_BY_TIER[tier];
  return options[Math.floor(Math.random() * options.length)];
};

// Get random style for a tier
const getStyle = (tier: ShooterTier): string => {
  const options = STYLES_BY_TIER[tier];
  return options[Math.floor(Math.random() * options.length)];
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
  createShooter({ id: idCounter++, name: "Stephen Curry", team: "Golden State Warriors", league: "NBA", tier: "legendary", era: "2009-Present", careerPct: 43.0, achievements: "Greatest 3PT shooter ever, 2x MVP, 4x Champion", photoUrl: nbaPhoto(201939), measurements: genMeasurements('legendary'), overallScore: 99, formCategory: 'EXCELLENT', position: 'POINT_GUARD', height: 75, weight: 185, wingspan: 79, careerFreeThrowPct: 91.0, keyTraits: ["Quick Release", "Deep Range", "Off-Balance Accuracy"], shootingStyle: "Quick release with incredible range and shot-making ability" }),
  createShooter({ id: idCounter++, name: "Ray Allen", team: "Multiple Teams", league: "NBA", tier: "legendary", era: "1996-2014", careerPct: 40.0, achievements: "2x NBA Champion, 10x All-Star, HOF", photoUrl: nbaPhoto(951), measurements: genMeasurements('legendary'), overallScore: 97, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 77, weight: 205, wingspan: 81, careerFreeThrowPct: 89.4, keyTraits: ["Perfect Mechanics", "Elite Footwork", "Clutch Shooter"], shootingStyle: "Textbook form with elite consistency and clutch performance" }),
  createShooter({ id: idCounter++, name: "Reggie Miller", team: "Indiana Pacers", league: "NBA", tier: "legendary", era: "1987-2005", careerPct: 39.5, achievements: "5x All-Star, HOF 2012, Clutch legend", photoUrl: nbaPhoto(397), measurements: genMeasurements('legendary'), overallScore: 96, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 79, weight: 195, wingspan: 82, careerFreeThrowPct: 88.8, keyTraits: ["Clutch Shooter", "Quick Release", "High Arc"], shootingStyle: "Clutch performer with quick trigger and elite movement" }),
  createShooter({ id: idCounter++, name: "Klay Thompson", team: "Golden State Warriors", league: "NBA", tier: "legendary", era: "2011-Present", careerPct: 41.3, achievements: "4x NBA Champion, 5x All-Star, 37pts in quarter", photoUrl: nbaPhoto(202691), measurements: genMeasurements('legendary'), overallScore: 98, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD', height: 78, weight: 215, wingspan: 81, careerFreeThrowPct: 85.3, keyTraits: ["Catch-and-Shoot", "Perfect Square-Up", "Minimal Wasted Motion"], shootingStyle: "Pure catch-and-shoot specialist with textbook mechanics" }),
  createShooter({ id: idCounter++, name: "Larry Bird", team: "Boston Celtics", league: "NBA", tier: "legendary", era: "1979-1992", careerPct: 37.6, achievements: "3x NBA Champion, 3x MVP, HOF", photoUrl: nbaPhoto(1449), measurements: genMeasurements('legendary'), overallScore: 95, formCategory: 'EXCELLENT', position: 'SMALL_FORWARD', height: 81, weight: 220, wingspan: 84, careerFreeThrowPct: 88.6, keyTraits: ["High Release Point", "Clutch Shooter", "Versatile Shooter"], shootingStyle: "High release with exceptional accuracy from all ranges" }),

  // TIER 2 - ELITE (88-94)
  createShooter({ id: idCounter++, name: "Kevin Durant", team: "Phoenix Suns", league: "NBA", tier: "elite", era: "2007-Present", careerPct: 38.5, achievements: "2x NBA Champion, MVP, Scoring Champion", photoUrl: nbaPhoto(201142), measurements: genMeasurements('elite'), overallScore: 94, formCategory: 'EXCELLENT', position: 'SMALL_FORWARD', height: 83, weight: 240, wingspan: 89, careerFreeThrowPct: 88.3 }),
  createShooter({ id: idCounter++, name: "Dirk Nowitzki", team: "Dallas Mavericks", league: "NBA", tier: "elite", era: "1998-2019", careerPct: 38.0, achievements: "NBA Champion, MVP, 14x All-Star", photoUrl: nbaPhoto(1717), measurements: genMeasurements('elite'), overallScore: 93, formCategory: 'EXCELLENT', position: 'POWER_FORWARD', height: 84, weight: 245, wingspan: 86, careerFreeThrowPct: 87.9 }),
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
];
export const NBA_SHOOTERS: EliteShooter[] = [...nbaStars];

// WNBA All-Time Great Shooters - Complete with 4-tier system
const wnbaStars: EliteShooter[] = [
  // TIER 1 - LEGENDARY (95-99)
  createShooter({ id: idCounter++, name: "Diana Taurasi", team: "Phoenix Mercury", league: "WNBA", tier: "legendary", era: "2004-Present", careerPct: 36.3, achievements: "3x WNBA Champion, All-time leading scorer", measurements: genMeasurements('legendary'), overallScore: 98, formCategory: 'EXCELLENT', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Sue Bird", team: "Seattle Storm", league: "WNBA", tier: "legendary", era: "2002-2023", careerPct: 37.9, achievements: "4x WNBA Champion, 13x All-Star", measurements: genMeasurements('legendary'), overallScore: 97, formCategory: 'EXCELLENT', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Elena Delle Donne", team: "Washington Mystics", league: "WNBA", tier: "legendary", era: "2013-Present", careerPct: 43.5, achievements: "WNBA Champion, 2x MVP, 50-40-90 club", measurements: genMeasurements('legendary'), overallScore: 98, formCategory: 'EXCELLENT', position: 'FORWARD' }),
  createShooter({ id: idCounter++, name: "Allie Quigley", team: "Chicago Sky", league: "WNBA", tier: "legendary", era: "2008-2023", careerPct: 38.5, achievements: "WNBA Champion, 3x 3PT Contest Winner", measurements: genMeasurements('legendary'), overallScore: 96, formCategory: 'EXCELLENT', position: 'GUARD' }),

  // TIER 2 - ELITE (88-94)
  createShooter({ id: idCounter++, name: "Maya Moore", team: "Minnesota Lynx", league: "WNBA", tier: "elite", era: "2011-2019", careerPct: 37.1, achievements: "4x WNBA Champion, MVP", measurements: genMeasurements('elite'), overallScore: 94, formCategory: 'EXCELLENT', position: 'FORWARD' }),
  createShooter({ id: idCounter++, name: "Becky Hammon", team: "Multiple Teams", league: "WNBA", tier: "elite", era: "1999-2014", careerPct: 36.4, achievements: "6x All-Star, Top 15 All-Time", measurements: genMeasurements('elite'), overallScore: 91, formCategory: 'EXCELLENT', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Katie Smith", team: "Multiple Teams", league: "WNBA", tier: "elite", era: "1999-2013", careerPct: 35.9, achievements: "2x WNBA Champion, 7x All-Star", measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Sabrina Ionescu", team: "New York Liberty", league: "WNBA", tier: "elite", era: "2020-Present", careerPct: 36.8, achievements: "All-Star, Triple-double machine", measurements: genMeasurements('elite'), overallScore: 92, formCategory: 'EXCELLENT', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Kelsey Plum", team: "Las Vegas Aces", league: "WNBA", tier: "elite", era: "2017-Present", careerPct: 36.2, achievements: "WNBA Champion, All-Star MVP", measurements: genMeasurements('elite'), overallScore: 91, formCategory: 'EXCELLENT', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Jewell Loyd", team: "Seattle Storm", league: "WNBA", tier: "elite", era: "2015-Present", careerPct: 35.5, achievements: "WNBA Champion, 4x All-Star", measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Tina Thompson", team: "Multiple Teams", league: "WNBA", tier: "elite", era: "1997-2013", careerPct: 34.2, achievements: "4x WNBA Champion, 9x All-Star, HOF", measurements: genMeasurements('elite'), overallScore: 89, formCategory: 'EXCELLENT', position: 'FORWARD' }),
  createShooter({ id: idCounter++, name: "Kara Lawson", team: "Multiple Teams", league: "WNBA", tier: "elite", era: "2003-2015", careerPct: 37.5, achievements: "WNBA Champion, 3PT specialist", measurements: genMeasurements('elite'), overallScore: 89, formCategory: 'EXCELLENT', position: 'GUARD' }),

  // TIER 3 - GREAT (78-87)
  createShooter({ id: idCounter++, name: "Arike Ogunbowale", team: "Dallas Wings", league: "WNBA", tier: "great", era: "2019-Present", careerPct: 34.0, achievements: "3x All-Star, Scoring leader", measurements: genMeasurements('great'), overallScore: 86, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Kelsey Mitchell", team: "Indiana Fever", league: "WNBA", tier: "great", era: "2018-Present", careerPct: 36.5, achievements: "All-Star, Elite scorer", measurements: genMeasurements('great'), overallScore: 85, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Cappie Pondexter", team: "Multiple Teams", league: "WNBA", tier: "great", era: "2006-2018", careerPct: 34.8, achievements: "2x WNBA Champion, Finals MVP", measurements: genMeasurements('great'), overallScore: 84, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Katie Douglas", team: "Multiple Teams", league: "WNBA", tier: "great", era: "2001-2014", careerPct: 35.2, achievements: "WNBA Champion, 3x All-Star", measurements: genMeasurements('great'), overallScore: 83, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Kayla McBride", team: "Minnesota Lynx", league: "WNBA", tier: "great", era: "2014-Present", careerPct: 35.8, achievements: "Olympic Gold, All-Star", measurements: genMeasurements('great'), overallScore: 83, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Renee Montgomery", team: "Multiple Teams", league: "WNBA", tier: "great", era: "2009-2019", careerPct: 35.5, achievements: "2x WNBA Champion, 6th Woman", measurements: genMeasurements('great'), overallScore: 82, formCategory: 'GOOD', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Ivory Latta", team: "Multiple Teams", league: "WNBA", tier: "great", era: "2007-2018", careerPct: 35.0, achievements: "Elite point guard shooter", measurements: genMeasurements('great'), overallScore: 81, formCategory: 'GOOD', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Nicole Powell", team: "Multiple Teams", league: "WNBA", tier: "great", era: "2004-2012", careerPct: 35.8, achievements: "WNBA Champion, All-Star", measurements: genMeasurements('great'), overallScore: 81, formCategory: 'GOOD', position: 'FORWARD' }),
  createShooter({ id: idCounter++, name: "Rhyne Howard", team: "Atlanta Dream", league: "WNBA", tier: "great", era: "2022-Present", careerPct: 33.5, achievements: "ROY, #1 Draft Pick", measurements: genMeasurements('great'), overallScore: 82, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Sami Whitcomb", team: "Seattle Storm", league: "WNBA", tier: "great", era: "2017-Present", careerPct: 38.5, achievements: "WNBA Champion, Aussie sharpshooter", measurements: genMeasurements('great'), overallScore: 84, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Leilani Mitchell", team: "Multiple Teams", league: "WNBA", tier: "great", era: "2008-2020", careerPct: 37.2, achievements: "WNBA Champion, Olympic medalist", measurements: genMeasurements('great'), overallScore: 82, formCategory: 'GOOD', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Shekinna Stricklen", team: "Multiple Teams", league: "WNBA", tier: "great", era: "2012-2021", careerPct: 37.8, achievements: "3PT Contest Winner", measurements: genMeasurements('great'), overallScore: 83, formCategory: 'GOOD', position: 'FORWARD' }),

  // TIER 4 - GOOD (70-77)
  createShooter({ id: idCounter++, name: "Crystal Robinson", team: "Multiple Teams", league: "WNBA", tier: "good", era: "1999-2007", careerPct: 36.5, achievements: "All-Star, Pioneer shooter", measurements: genMeasurements('good'), overallScore: 76, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Anna DeForge", team: "Multiple Teams", league: "WNBA", tier: "good", era: "1999-2004", careerPct: 38.2, achievements: "Elite long-range specialist", measurements: genMeasurements('good'), overallScore: 74, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Allison Feaster", team: "Multiple Teams", league: "WNBA", tier: "good", era: "1998-2004", careerPct: 34.5, achievements: "Harvard legend, Euro success", measurements: genMeasurements('good'), overallScore: 73, formCategory: 'GOOD', position: 'FORWARD' }),
  createShooter({ id: idCounter++, name: "Laurie Koehn", team: "Washington Mystics", league: "WNBA", tier: "good", era: "2005-2011", careerPct: 40.0, achievements: "Elite 3PT specialist", measurements: genMeasurements('good'), overallScore: 77, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Erin Thorn", team: "Multiple Teams", league: "WNBA", tier: "good", era: "2007-2012", careerPct: 36.8, achievements: "Steady perimeter shooter", measurements: genMeasurements('good'), overallScore: 73, formCategory: 'GOOD', position: 'GUARD' }),
];
export const WNBA_SHOOTERS: EliteShooter[] = [...wnbaStars];

// NCAA Division I Men's Great Shooters - Complete with 4-tier system
const ncaaMenStars: EliteShooter[] = [
  // TIER 1 - LEGENDARY (95-99)
  createShooter({ id: idCounter++, name: "Pete Maravich", team: "LSU", league: "NCAA_MEN", tier: "legendary", era: "1967-1970", careerPct: 44.2, achievements: "All-time NCAA scorer, 44.2 PPG", measurements: genMeasurements('legendary'), overallScore: 99, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Stephen Curry", team: "Davidson", league: "NCAA_MEN", tier: "legendary", era: "2006-2009", careerPct: 43.2, achievements: "NCAA tourney star, Elite 8, All-American", measurements: genMeasurements('legendary'), overallScore: 98, formCategory: 'EXCELLENT', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "JJ Redick", team: "Duke", league: "NCAA_MEN", tier: "legendary", era: "2002-2006", careerPct: 42.0, achievements: "2x NPOY, ACC all-time scorer", measurements: genMeasurements('legendary'), overallScore: 97, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Jimmer Fredette", team: "BYU", league: "NCAA_MEN", tier: "legendary", era: "2007-2011", careerPct: 41.5, achievements: "NPOY 2011, Consensus All-American", measurements: genMeasurements('legendary'), overallScore: 97, formCategory: 'EXCELLENT', position: 'POINT_GUARD' }),

  // TIER 2 - ELITE (88-94)
  createShooter({ id: idCounter++, name: "Buddy Hield", team: "Oklahoma", league: "NCAA_MEN", tier: "elite", era: "2012-2016", careerPct: 46.5, achievements: "NPOY 2016, Consensus All-American", measurements: genMeasurements('elite'), overallScore: 94, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Doug McDermott", team: "Creighton", league: "NCAA_MEN", tier: "elite", era: "2010-2014", careerPct: 45.0, achievements: "NPOY 2014, 3x All-American", measurements: genMeasurements('elite'), overallScore: 93, formCategory: 'EXCELLENT', position: 'SMALL_FORWARD' }),
  createShooter({ id: idCounter++, name: "Antoine Davis", team: "Detroit Mercy", league: "NCAA_MEN", tier: "elite", era: "2018-2023", careerPct: 36.5, achievements: "D1 Men's all-time leader in made 3s (559)", measurements: genMeasurements('elite'), overallScore: 93, formCategory: 'EXCELLENT', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Fletcher Magee", team: "Wofford", league: "NCAA_MEN", tier: "elite", era: "2015-2019", careerPct: 43.0, achievements: "NCAA D1 career 3PT makes record (509)", measurements: genMeasurements('elite'), overallScore: 94, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Travis Bader", team: "Oakland", league: "NCAA_MEN", tier: "elite", era: "2010-2014", careerPct: 42.5, achievements: "Former NCAA 3PM record holder", measurements: genMeasurements('elite'), overallScore: 91, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Trae Young", team: "Oklahoma", league: "NCAA_MEN", tier: "elite", era: "2017-2018", careerPct: 42.2, achievements: "NCAA scoring/assist leader, Consensus AA", measurements: genMeasurements('elite'), overallScore: 92, formCategory: 'EXCELLENT', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Adam Morrison", team: "Gonzaga", league: "NCAA_MEN", tier: "elite", era: "2003-2006", careerPct: 44.0, achievements: "NPOY finalist, 28.1 PPG", measurements: genMeasurements('elite'), overallScore: 91, formCategory: 'EXCELLENT', position: 'SMALL_FORWARD' }),
  createShooter({ id: idCounter++, name: "Steve Alford", team: "Indiana", league: "NCAA_MEN", tier: "elite", era: "1983-1987", careerPct: 42.0, achievements: "NCAA Champion, All-American, Olympic Gold", measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Dell Curry", team: "Virginia Tech", league: "NCAA_MEN", tier: "elite", era: "1982-1986", careerPct: 40.0, achievements: "3x Metro Conference POY", measurements: genMeasurements('elite'), overallScore: 89, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Wesley Person", team: "Auburn", league: "NCAA_MEN", tier: "elite", era: "1990-1994", careerPct: 42.0, achievements: "SEC All-time 3PM leader", measurements: genMeasurements('elite'), overallScore: 89, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD' }),

  // TIER 3 - GREAT (78-87)
  createShooter({ id: idCounter++, name: "Darius McGhee", team: "Liberty", league: "NCAA_MEN", tier: "great", era: "2018-2023", careerPct: 39.5, achievements: "ASUN POY, 3,000+ career points", measurements: genMeasurements('great'), overallScore: 86, formCategory: 'GOOD', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Max Abmas", team: "Oral Roberts", league: "NCAA_MEN", tier: "great", era: "2019-2024", careerPct: 40.5, achievements: "NCAA scoring leader 2021, Sweet 16", measurements: genMeasurements('great'), overallScore: 87, formCategory: 'GOOD', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Gerry McNamara", team: "Syracuse", league: "NCAA_MEN", tier: "great", era: "2002-2006", careerPct: 39.2, achievements: "NCAA Champion, Big East tourney hero", measurements: genMeasurements('great'), overallScore: 85, formCategory: 'GOOD', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Glen Rice", team: "Michigan", league: "NCAA_MEN", tier: "great", era: "1985-1989", careerPct: 47.0, achievements: "NCAA Champion, MOP 1989", measurements: genMeasurements('great'), overallScore: 87, formCategory: 'GOOD', position: 'SMALL_FORWARD' }),
  createShooter({ id: idCounter++, name: "Jack Taylor", team: "Grinnell", league: "NCAA_MEN", tier: "great", era: "2011-2015", careerPct: 41.0, achievements: "D3 - 109 points in game, 24 threes", measurements: genMeasurements('great'), overallScore: 84, formCategory: 'GOOD', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Kemba Walker", team: "Connecticut", league: "NCAA_MEN", tier: "great", era: "2008-2011", careerPct: 38.0, achievements: "NCAA Champion, Big East tourney legend", measurements: genMeasurements('great'), overallScore: 86, formCategory: 'GOOD', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Kyle Guy", team: "Virginia", league: "NCAA_MEN", tier: "great", era: "2016-2019", careerPct: 42.5, achievements: "NCAA Champion, Final Four MOP", measurements: genMeasurements('great'), overallScore: 85, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),

  // TIER 4 - GOOD (70-77)
  createShooter({ id: idCounter++, name: "Corey Kispert", team: "Gonzaga", league: "NCAA_MEN", tier: "good", era: "2017-2021", careerPct: 44.0, achievements: "All-American, Elite shooter", measurements: genMeasurements('good'), overallScore: 77, formCategory: 'GOOD', position: 'SMALL_FORWARD' }),
  createShooter({ id: idCounter++, name: "Luke Kennard", team: "Duke", league: "NCAA_MEN", tier: "good", era: "2015-2017", careerPct: 43.8, achievements: "All-American, Lottery pick", measurements: genMeasurements('good'), overallScore: 76, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Grayson Allen", team: "Duke", league: "NCAA_MEN", tier: "good", era: "2014-2018", careerPct: 38.5, achievements: "NCAA Champion, All-American", measurements: genMeasurements('good'), overallScore: 75, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
];
export const NCAA_MEN_SHOOTERS: EliteShooter[] = [...ncaaMenStars];

// NCAA Division I Women's Great Shooters - Complete with 4-tier system
const ncaaWomenStars: EliteShooter[] = [
  // TIER 1 - LEGENDARY (95-99)
  createShooter({ id: idCounter++, name: "Caitlin Clark", team: "Iowa", league: "NCAA_WOMEN", tier: "legendary", era: "2020-2024", careerPct: 37.5, achievements: "All-time NCAA scorer (Men & Women), 3x NPOY", measurements: genMeasurements('legendary'), overallScore: 99, formCategory: 'EXCELLENT', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Kelsey Plum", team: "Washington", league: "NCAA_WOMEN", tier: "legendary", era: "2013-2017", careerPct: 43.0, achievements: "Former NCAA women's scoring record", measurements: genMeasurements('legendary'), overallScore: 97, formCategory: 'EXCELLENT', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Jackie Stiles", team: "Missouri State", league: "NCAA_WOMEN", tier: "legendary", era: "1997-2001", careerPct: 47.0, achievements: "NPOY 2001, Former NCAA scoring record", measurements: genMeasurements('legendary'), overallScore: 97, formCategory: 'EXCELLENT', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Diana Taurasi", team: "Connecticut", league: "NCAA_WOMEN", tier: "legendary", era: "2000-2004", careerPct: 38.0, achievements: "3x NCAA Champion, 2x MOP", measurements: genMeasurements('legendary'), overallScore: 98, formCategory: 'EXCELLENT', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Taylor Robertson", team: "Oklahoma", league: "NCAA_WOMEN", tier: "legendary", era: "2018-2023", careerPct: 42.5, achievements: "D1 Women's all-time leader in made 3s (497)", measurements: genMeasurements('legendary'), overallScore: 96, formCategory: 'EXCELLENT', position: 'GUARD' }),

  // TIER 2 - ELITE (88-94)
  createShooter({ id: idCounter++, name: "Sabrina Ionescu", team: "Oregon", league: "NCAA_WOMEN", tier: "elite", era: "2016-2020", careerPct: 39.5, achievements: "NPOY 2020, Triple-double record", measurements: genMeasurements('elite'), overallScore: 94, formCategory: 'EXCELLENT', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Maya Moore", team: "Connecticut", league: "NCAA_WOMEN", tier: "elite", era: "2007-2011", careerPct: 42.0, achievements: "2x NCAA Champion, NPOY", measurements: genMeasurements('elite'), overallScore: 94, formCategory: 'EXCELLENT', position: 'FORWARD' }),
  createShooter({ id: idCounter++, name: "Elena Delle Donne", team: "Delaware", league: "NCAA_WOMEN", tier: "elite", era: "2009-2013", careerPct: 41.0, achievements: "All-American, Elite efficiency", measurements: genMeasurements('elite'), overallScore: 93, formCategory: 'EXCELLENT', position: 'FORWARD' }),
  createShooter({ id: idCounter++, name: "Katie Lou Samuelson", team: "Connecticut", league: "NCAA_WOMEN", tier: "elite", era: "2015-2019", careerPct: 43.5, achievements: "3x All-American, AAC POY", measurements: genMeasurements('elite'), overallScore: 92, formCategory: 'EXCELLENT', position: 'FORWARD' }),
  createShooter({ id: idCounter++, name: "Kelsey Mitchell", team: "Ohio State", league: "NCAA_WOMEN", tier: "elite", era: "2014-2018", careerPct: 40.0, achievements: "All-time Big Ten scorer, 2x Big Ten POY", measurements: genMeasurements('elite'), overallScore: 91, formCategory: 'EXCELLENT', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Katelynn Flaherty", team: "Michigan", league: "NCAA_WOMEN", tier: "elite", era: "2014-2018", careerPct: 38.0, achievements: "Big Ten all-time scorer, All-American", measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Dyaisha Fair", team: "Syracuse", league: "NCAA_WOMEN", tier: "elite", era: "2019-2024", careerPct: 36.5, achievements: "2x Scoring leader, All-American", measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Kendall Spray", team: "Texas A&M", league: "NCAA_WOMEN", tier: "elite", era: "2017-2022", careerPct: 43.5, achievements: "SEC 3PM record holder", measurements: genMeasurements('elite'), overallScore: 89, formCategory: 'EXCELLENT', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Laurie Koehn", team: "Kansas State", league: "NCAA_WOMEN", tier: "elite", era: "2001-2005", careerPct: 41.0, achievements: "Big 12 3PM record, All-American", measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'GUARD' }),

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
  createShooter({ id: idCounter++, name: "Arike Ogunbowale", team: "Notre Dame", league: "NCAA_WOMEN", tier: "great", era: "2015-2019", careerPct: 35.0, achievements: "NCAA Champion, Final Four MOP, Clutch shots", measurements: genMeasurements('great'), overallScore: 86, formCategory: 'GOOD', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Rhyne Howard", team: "Kentucky", league: "NCAA_WOMEN", tier: "great", era: "2018-2022", careerPct: 35.5, achievements: "2x SEC POY, #1 Draft Pick", measurements: genMeasurements('great'), overallScore: 85, formCategory: 'GOOD', position: 'GUARD' }),

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
  createShooter({ id: idCounter++, name: "Pete Maravich", team: "LSU", league: "TOP_COLLEGE", tier: "legendary", era: "1967-1970", careerPct: 44.2, achievements: "All-time NCAA scorer (3,667 pts), 44.2 PPG", measurements: genMeasurements('legendary'), overallScore: 99, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Caitlin Clark", team: "Iowa", league: "TOP_COLLEGE", tier: "legendary", era: "2020-2024", careerPct: 37.5, achievements: "All-time NCAA scorer, 3x NPOY, 3,951 points", measurements: genMeasurements('legendary'), overallScore: 99, formCategory: 'EXCELLENT', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Stephen Curry", team: "Davidson", league: "TOP_COLLEGE", tier: "legendary", era: "2006-2009", careerPct: 43.2, achievements: "Elite 8 heroics, All-American, Changed the game", measurements: genMeasurements('legendary'), overallScore: 98, formCategory: 'EXCELLENT', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "JJ Redick", team: "Duke", league: "TOP_COLLEGE", tier: "legendary", era: "2002-2006", careerPct: 42.0, achievements: "ACC all-time scorer, 2x NPOY finalist", measurements: genMeasurements('legendary'), overallScore: 97, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Jimmer Fredette", team: "BYU", league: "TOP_COLLEGE", tier: "legendary", era: "2007-2011", careerPct: 41.5, achievements: "NPOY 2011, Jimmermania, Deep range", measurements: genMeasurements('legendary'), overallScore: 97, formCategory: 'EXCELLENT', position: 'POINT_GUARD' }),

  // TIER 2 - ELITE (88-94)
  createShooter({ id: idCounter++, name: "Fletcher Magee", team: "Wofford", league: "TOP_COLLEGE", tier: "elite", era: "2015-2019", careerPct: 43.0, achievements: "NCAA D1 career 3PM record (509)", measurements: genMeasurements('elite'), overallScore: 94, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Antoine Davis", team: "Detroit Mercy", league: "TOP_COLLEGE", tier: "elite", era: "2018-2023", careerPct: 36.5, achievements: "D1 Men's all-time 3PM leader (559)", measurements: genMeasurements('elite'), overallScore: 93, formCategory: 'EXCELLENT', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Taylor Robertson", team: "Oklahoma", league: "TOP_COLLEGE", tier: "elite", era: "2018-2023", careerPct: 42.5, achievements: "D1 Women's all-time 3PM leader (497)", measurements: genMeasurements('elite'), overallScore: 93, formCategory: 'EXCELLENT', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Travis Bader", team: "Oakland", league: "TOP_COLLEGE", tier: "elite", era: "2010-2014", careerPct: 42.5, achievements: "Former NCAA 3PM record holder (504)", measurements: genMeasurements('elite'), overallScore: 92, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Kelsey Plum", team: "Washington", league: "TOP_COLLEGE", tier: "elite", era: "2013-2017", careerPct: 43.0, achievements: "Former NCAA women's scoring record", measurements: genMeasurements('elite'), overallScore: 93, formCategory: 'EXCELLENT', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Jackie Stiles", team: "Missouri State", league: "TOP_COLLEGE", tier: "elite", era: "1997-2001", careerPct: 47.0, achievements: "NPOY 2001, Former scoring record", measurements: genMeasurements('elite'), overallScore: 92, formCategory: 'EXCELLENT', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Sabrina Ionescu", team: "Oregon", league: "TOP_COLLEGE", tier: "elite", era: "2016-2020", careerPct: 39.5, achievements: "NPOY, Triple-double record (26)", measurements: genMeasurements('elite'), overallScore: 92, formCategory: 'EXCELLENT', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Kelsey Mitchell", team: "Ohio State", league: "TOP_COLLEGE", tier: "elite", era: "2014-2018", careerPct: 40.0, achievements: "Big Ten all-time scorer", measurements: genMeasurements('elite'), overallScore: 91, formCategory: 'EXCELLENT', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Buddy Hield", team: "Oklahoma", league: "TOP_COLLEGE", tier: "elite", era: "2012-2016", careerPct: 46.5, achievements: "NPOY 2016, Final Four", measurements: genMeasurements('elite'), overallScore: 92, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Doug McDermott", team: "Creighton", league: "TOP_COLLEGE", tier: "elite", era: "2010-2014", careerPct: 45.0, achievements: "NPOY 2014, 3x All-American", measurements: genMeasurements('elite'), overallScore: 91, formCategory: 'EXCELLENT', position: 'SMALL_FORWARD' }),
  createShooter({ id: idCounter++, name: "Steve Alford", team: "Indiana", league: "TOP_COLLEGE", tier: "elite", era: "1983-1987", careerPct: 42.0, achievements: "NCAA Champion, Olympic Gold, All-American", measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Dell Curry", team: "Virginia Tech", league: "TOP_COLLEGE", tier: "elite", era: "1982-1986", careerPct: 40.0, achievements: "3x Metro Conference POY", measurements: genMeasurements('elite'), overallScore: 89, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Glen Rice", team: "Michigan", league: "TOP_COLLEGE", tier: "elite", era: "1985-1989", careerPct: 51.6, achievements: "NCAA Champion, MOP 1989", measurements: genMeasurements('elite'), overallScore: 91, formCategory: 'EXCELLENT', position: 'SMALL_FORWARD' }),
  createShooter({ id: idCounter++, name: "Hersey Hawkins", team: "Bradley", league: "TOP_COLLEGE", tier: "elite", era: "1984-1988", careerPct: 52.8, achievements: "NPOY 1988, 3,008 career points", measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Wesley Person", team: "Auburn", league: "TOP_COLLEGE", tier: "elite", era: "1990-1994", careerPct: 42.0, achievements: "SEC all-time 3PM leader", measurements: genMeasurements('elite'), overallScore: 89, formCategory: 'EXCELLENT', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Laurie Koehn", team: "Kansas State", league: "TOP_COLLEGE", tier: "elite", era: "2001-2005", careerPct: 41.0, achievements: "Big 12 3PM record, All-American", measurements: genMeasurements('elite'), overallScore: 90, formCategory: 'EXCELLENT', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Karlie Samuelson", team: "Stanford", league: "TOP_COLLEGE", tier: "elite", era: "2014-2018", careerPct: 44.0, achievements: "Pac-12 elite shooter", measurements: genMeasurements('elite'), overallScore: 88, formCategory: 'EXCELLENT', position: 'GUARD' }),
  createShooter({ id: idCounter++, name: "Allie Quigley", team: "DePaul", league: "TOP_COLLEGE", tier: "elite", era: "2004-2008", careerPct: 38.5, achievements: "Big East elite scorer", measurements: genMeasurements('elite'), overallScore: 88, formCategory: 'EXCELLENT', position: 'GUARD' }),

  // TIER 3 - GREAT (78-87)
  createShooter({ id: idCounter++, name: "Max Abmas", team: "Oral Roberts", league: "TOP_COLLEGE", tier: "great", era: "2019-2024", careerPct: 40.5, achievements: "NCAA scoring leader 2021, Sweet 16", measurements: genMeasurements('great'), overallScore: 87, formCategory: 'GOOD', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Darius McGhee", team: "Liberty", league: "TOP_COLLEGE", tier: "great", era: "2018-2023", careerPct: 39.5, achievements: "ASUN POY, 3,000+ points", measurements: genMeasurements('great'), overallScore: 86, formCategory: 'GOOD', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Gerry McNamara", team: "Syracuse", league: "TOP_COLLEGE", tier: "great", era: "2002-2006", careerPct: 39.2, achievements: "NCAA Champion, Big East tourney hero", measurements: genMeasurements('great'), overallScore: 85, formCategory: 'GOOD', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Trae Young", team: "Oklahoma", league: "TOP_COLLEGE", tier: "great", era: "2017-2018", careerPct: 42.2, achievements: "NCAA scoring/assist leader, Consensus AA", measurements: genMeasurements('great'), overallScore: 86, formCategory: 'GOOD', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Jack Taylor", team: "Grinnell", league: "TOP_COLLEGE", tier: "great", era: "2011-2015", careerPct: 41.0, achievements: "D3 - 109 point game with 24 3s", measurements: genMeasurements('great'), overallScore: 84, formCategory: 'GOOD', position: 'POINT_GUARD' }),
  createShooter({ id: idCounter++, name: "Adam Morrison", team: "Gonzaga", league: "TOP_COLLEGE", tier: "great", era: "2003-2006", careerPct: 44.0, achievements: "NPOY finalist, 28.1 PPG", measurements: genMeasurements('great'), overallScore: 85, formCategory: 'GOOD', position: 'SMALL_FORWARD' }),
  createShooter({ id: idCounter++, name: "Katie Lou Samuelson", team: "Connecticut", league: "TOP_COLLEGE", tier: "great", era: "2015-2019", careerPct: 43.5, achievements: "3x All-American, AAC POY", measurements: genMeasurements('great'), overallScore: 86, formCategory: 'GOOD', position: 'FORWARD' }),

  // TIER 4 - GOOD (70-77)
  createShooter({ id: idCounter++, name: "Kyle Guy", team: "Virginia", league: "TOP_COLLEGE", tier: "good", era: "2016-2019", careerPct: 42.5, achievements: "NCAA Champion, Final Four MOP", measurements: genMeasurements('good'), overallScore: 77, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
  createShooter({ id: idCounter++, name: "Corey Kispert", team: "Gonzaga", league: "TOP_COLLEGE", tier: "good", era: "2017-2021", careerPct: 44.0, achievements: "All-American, WCC POY", measurements: genMeasurements('good'), overallScore: 76, formCategory: 'GOOD', position: 'SMALL_FORWARD' }),
  createShooter({ id: idCounter++, name: "Luke Kennard", team: "Duke", league: "TOP_COLLEGE", tier: "good", era: "2015-2017", careerPct: 43.8, achievements: "All-American, ACC POY finalist", measurements: genMeasurements('good'), overallScore: 75, formCategory: 'GOOD', position: 'SHOOTING_GUARD' }),
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

