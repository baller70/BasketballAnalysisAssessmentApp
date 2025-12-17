// ============================================
// PHASE 8: COMPREHENSIVE DRILL DATABASE
// 50+ drills across 5 skill levels
// ============================================

export type SkillLevel = 'ELEMENTARY' | 'MIDDLE_SCHOOL' | 'HIGH_SCHOOL' | 'COLLEGE' | 'PROFESSIONAL'

export type DrillFocusArea = 
  | 'ELBOW_ALIGNMENT'
  | 'KNEE_BEND'
  | 'RELEASE_POINT'
  | 'FOLLOW_THROUGH'
  | 'BALANCE'
  | 'ARC_TRAJECTORY'
  | 'FOOTWORK'
  | 'CONSISTENCY'
  | 'FATIGUE'
  | 'GAME_SITUATION'
  | 'MICRO_ADJUSTMENT'

export interface Drill {
  id: string
  title: string
  level: SkillLevel
  focusArea: DrillFocusArea
  difficulty: 1 | 2 | 3 | 4 | 5 // Stars
  duration: number // minutes
  description: string
  whyItMatters: string
  steps: string[]
  expectedOutcomes: string[]
  icon: string // emoji
  color: string // tailwind color
  prerequisites?: string[]
  videoUrl?: string
  technicalNote?: string
}

// ============================================
// ELEMENTARY LEVEL DRILLS (Ages 6-11)
// Focus: Basic mechanics, fun, encouragement
// ============================================

const ELEMENTARY_DRILLS: Drill[] = [
  {
    id: 'elem-1',
    title: 'Elbow In Challenge',
    level: 'ELEMENTARY',
    focusArea: 'ELBOW_ALIGNMENT',
    difficulty: 1,
    duration: 5,
    description: 'A fun game to learn keeping your elbow tucked in like holding a pizza box!',
    whyItMatters: 'Keeping your elbow in helps your shot go straight to the basket!',
    steps: [
      'Stand 6 feet from the basket',
      'Pretend you\'re holding a pizza box - elbow under your hand',
      'Take 10 shots keeping that pizza box feeling',
      'Count how many shots feel "right"',
      'Try to beat your score next time!'
    ],
    expectedOutcomes: [
      'Better elbow position',
      'Straighter shots',
      'More confidence'
    ],
    icon: '🍕',
    color: 'orange'
  },
  {
    id: 'elem-2',
    title: 'Follow-Through Freeze',
    level: 'ELEMENTARY',
    focusArea: 'FOLLOW_THROUGH',
    difficulty: 1,
    duration: 5,
    description: 'Hold your follow-through like you\'re reaching into a cookie jar on a high shelf!',
    whyItMatters: 'A good follow-through helps guide your shot into the basket!',
    steps: [
      'Stand close to the basket (5 feet)',
      'Shoot the ball and FREEZE your arm up high',
      'Count to 3 while your arm is frozen',
      'Your fingers should point at the basket',
      'Do 10 shots with the freeze!'
    ],
    expectedOutcomes: [
      'Better follow-through habit',
      'More accurate shots',
      'Muscle memory building'
    ],
    icon: '🍪',
    color: 'amber'
  },
  {
    id: 'elem-3',
    title: 'Balance Beam Shooting',
    level: 'ELEMENTARY',
    focusArea: 'BALANCE',
    difficulty: 2,
    duration: 8,
    description: 'Practice shooting while standing on one foot like a flamingo!',
    whyItMatters: 'Good balance helps you make shots even when defenders are close!',
    steps: [
      'Stand on your shooting-side foot only',
      'Hold the ball at your shoulder',
      'Try to stay balanced for 5 seconds',
      'Now shoot while staying balanced',
      'Do 5 shots on each foot!'
    ],
    expectedOutcomes: [
      'Improved balance',
      'Stronger legs',
      'Better body control'
    ],
    icon: '🦩',
    color: 'pink'
  },
  {
    id: 'elem-4',
    title: 'Target Practice Game',
    level: 'ELEMENTARY',
    focusArea: 'CONSISTENCY',
    difficulty: 1,
    duration: 10,
    description: 'Aim at different spots around the basket like a target game!',
    whyItMatters: 'Learning to aim at different spots makes you a better shooter!',
    steps: [
      'Start at the center, close to the basket',
      'Make 2 shots from the center',
      'Move to the right side, make 2 shots',
      'Move to the left side, make 2 shots',
      'Count your total makes out of 6!'
    ],
    expectedOutcomes: [
      'Better aim from different spots',
      'More comfortable shooting',
      'Fun practice routine'
    ],
    icon: '🎯',
    color: 'red'
  },
  {
    id: 'elem-5',
    title: 'Knee Bend Bounce',
    level: 'ELEMENTARY',
    focusArea: 'KNEE_BEND',
    difficulty: 1,
    duration: 5,
    description: 'Bounce like a bunny before you shoot to get power in your legs!',
    whyItMatters: 'Bending your knees gives you power to shoot from farther away!',
    steps: [
      'Stand with feet shoulder-width apart',
      'Bounce down like a bunny 3 times',
      'On the 3rd bounce, shoot the ball',
      'Feel the power from your legs',
      'Do 10 bunny-bounce shots!'
    ],
    expectedOutcomes: [
      'Better leg power',
      'More natural knee bend',
      'Stronger shots'
    ],
    icon: '🐰',
    color: 'purple'
  },
  {
    id: 'elem-6',
    title: 'Rainbow Arc Practice',
    level: 'ELEMENTARY',
    focusArea: 'ARC_TRAJECTORY',
    difficulty: 2,
    duration: 8,
    description: 'Make your shots go up high like a rainbow in the sky!',
    whyItMatters: 'A high rainbow arc helps the ball drop into the basket!',
    steps: [
      'Stand 8 feet from the basket',
      'Try to shoot the ball UP high',
      'Watch it come DOWN into the basket',
      'If it hits the front rim, shoot higher!',
      'Make 5 rainbow shots!'
    ],
    expectedOutcomes: [
      'Better shot arc',
      'Softer shots',
      'More makes'
    ],
    icon: '🌈',
    color: 'indigo'
  },
  {
    id: 'elem-7',
    title: 'Statue Stance',
    level: 'ELEMENTARY',
    focusArea: 'FOOTWORK',
    difficulty: 1,
    duration: 5,
    description: 'Stand like a statue with perfect feet position before every shot!',
    whyItMatters: 'Good foot position helps you stay balanced and shoot straight!',
    steps: [
      'Stand with feet shoulder-width apart',
      'Point your toes toward the basket',
      'Hold this "statue" position for 5 seconds',
      'Now shoot without moving your feet',
      'Practice 10 statue shots!'
    ],
    expectedOutcomes: [
      'Consistent foot placement',
      'Better balance',
      'More accurate shots'
    ],
    icon: '🗽',
    color: 'teal'
  },
  {
    id: 'elem-8',
    title: 'Counting Confidence',
    level: 'ELEMENTARY',
    focusArea: 'CONSISTENCY',
    difficulty: 1,
    duration: 10,
    description: 'Count your makes in a row to build confidence!',
    whyItMatters: 'Making shots in a row builds your confidence and focus!',
    steps: [
      'Start close to the basket (4 feet)',
      'Try to make shots in a row',
      'Count out loud: "One! Two! Three!"',
      'If you miss, start counting over',
      'Try to get to 5 in a row!'
    ],
    expectedOutcomes: [
      'More confidence',
      'Better focus',
      'Fun challenge'
    ],
    icon: '🔢',
    color: 'blue'
  },
  {
    id: 'elem-9',
    title: 'Mirror Check',
    level: 'ELEMENTARY',
    focusArea: 'ELBOW_ALIGNMENT',
    difficulty: 2,
    duration: 5,
    description: 'Use a mirror or window to check your shooting form!',
    whyItMatters: 'Seeing yourself helps you fix your form faster!',
    steps: [
      'Stand sideways to a mirror or window',
      'Hold the ball in shooting position',
      'Check that your elbow is under the ball',
      'Practice the shooting motion slowly',
      'Do 10 slow-motion practice shots!'
    ],
    expectedOutcomes: [
      'Visual feedback',
      'Better form awareness',
      'Self-correction skills'
    ],
    icon: '🪞',
    color: 'cyan'
  },
  {
    id: 'elem-10',
    title: 'High Five Finish',
    level: 'ELEMENTARY',
    focusArea: 'FOLLOW_THROUGH',
    difficulty: 1,
    duration: 5,
    description: 'Finish every shot like you\'re giving the basket a high five!',
    whyItMatters: 'A good finish helps guide your shot perfectly!',
    steps: [
      'Stand 5 feet from the basket',
      'Shoot and reach UP toward the basket',
      'Pretend you\'re giving it a high five',
      'Hold your hand up until the ball goes in',
      'Do 10 high five shots!'
    ],
    expectedOutcomes: [
      'Better follow-through',
      'More makes',
      'Fun routine'
    ],
    icon: '✋',
    color: 'yellow'
  }
]

// ============================================
// MIDDLE SCHOOL LEVEL DRILLS (Ages 12-14)
// Focus: Skill-building, form emphasis
// ============================================

const MIDDLE_SCHOOL_DRILLS: Drill[] = [
  {
    id: 'ms-1',
    title: 'Arc Trajectory Builder',
    level: 'MIDDLE_SCHOOL',
    focusArea: 'ARC_TRAJECTORY',
    difficulty: 2,
    duration: 12,
    description: 'Learn to shoot with the optimal arc angle for more makes.',
    whyItMatters: 'The right arc (45-52°) helps your shot go in more often by giving you a bigger target.',
    steps: [
      'Stand at the 3-point line',
      'Focus on releasing at a 45° angle',
      'Take 15 shots, tracking arc height',
      'Adjust if arc is too flat or too high',
      'Aim for the ball to peak above the rim'
    ],
    expectedOutcomes: [
      'Optimal shot arc',
      'Higher shooting percentage',
      'Better range'
    ],
    icon: '📐',
    color: 'blue',
    technicalNote: 'Optimal arc is 45-52° for most shooters'
  },
  {
    id: 'ms-2',
    title: 'Footwork Progression',
    level: 'MIDDLE_SCHOOL',
    focusArea: 'FOOTWORK',
    difficulty: 2,
    duration: 15,
    description: 'Develop consistent foot placement for every shot.',
    whyItMatters: 'Consistent footwork is the foundation of consistent shooting.',
    steps: [
      'Start with feet together',
      'Step into your shot with shooting foot first',
      'Land with feet shoulder-width apart',
      'Toes pointing at the basket',
      'Practice this footwork 20 times without the ball, then 20 with'
    ],
    expectedOutcomes: [
      'Consistent stance',
      'Better balance',
      'Quicker setup'
    ],
    icon: '👟',
    color: 'green'
  },
  {
    id: 'ms-3',
    title: 'Release Point Consistency',
    level: 'MIDDLE_SCHOOL',
    focusArea: 'RELEASE_POINT',
    difficulty: 3,
    duration: 15,
    description: 'Train yourself to release at the same point every time.',
    whyItMatters: 'A consistent release point leads to consistent accuracy.',
    steps: [
      'Stand at the free-throw line',
      'Mark a spot on the wall at your release height',
      'Practice releasing at that exact height',
      'Take 20 shots focusing on identical release',
      'Track how many feel the same'
    ],
    expectedOutcomes: [
      'Consistent release',
      'Better accuracy',
      'Muscle memory'
    ],
    icon: '📍',
    color: 'red'
  },
  {
    id: 'ms-4',
    title: 'Form Breakdown Drill',
    level: 'MIDDLE_SCHOOL',
    focusArea: 'CONSISTENCY',
    difficulty: 2,
    duration: 12,
    description: 'Break down your shot into phases: dip, rise, release.',
    whyItMatters: 'Understanding each phase helps you identify and fix problems.',
    steps: [
      'Phase 1: Dip - bring ball down to waist',
      'Phase 2: Rise - bring ball up smoothly',
      'Phase 3: Release - extend arm fully',
      'Practice each phase separately (10 reps each)',
      'Combine all phases for 10 full shots'
    ],
    expectedOutcomes: [
      'Better shot understanding',
      'Smoother motion',
      'Easier troubleshooting'
    ],
    icon: '🔄',
    color: 'purple'
  },
  {
    id: 'ms-5',
    title: 'Elbow Alignment Check',
    level: 'MIDDLE_SCHOOL',
    focusArea: 'ELBOW_ALIGNMENT',
    difficulty: 2,
    duration: 10,
    description: 'Use a partner or video to check your elbow position.',
    whyItMatters: 'An aligned elbow (under the ball) creates a straight shot path.',
    steps: [
      'Have a partner watch from the front',
      'Or set up your phone to record',
      'Take 10 shots at normal speed',
      'Review: Is elbow under the ball?',
      'Adjust and repeat until consistent'
    ],
    expectedOutcomes: [
      'Proper elbow alignment',
      'Straighter shots',
      'Visual feedback skills'
    ],
    icon: '📹',
    color: 'indigo'
  },
  {
    id: 'ms-6',
    title: 'Knee Bend Power',
    level: 'MIDDLE_SCHOOL',
    focusArea: 'KNEE_BEND',
    difficulty: 2,
    duration: 12,
    description: 'Develop proper knee bend for power and consistency.',
    whyItMatters: 'Proper knee bend (35-45°) generates power for longer shots.',
    steps: [
      'Stand in shooting stance',
      'Bend knees to 45° angle (thighs almost parallel)',
      'Hold for 3 seconds',
      'Rise up and shoot',
      'Take 20 shots focusing on knee bend depth'
    ],
    expectedOutcomes: [
      'More leg power',
      'Better range',
      'Consistent form'
    ],
    icon: '🦵',
    color: 'orange',
    technicalNote: 'Optimal knee bend is 35-45° for most shooters'
  },
  {
    id: 'ms-7',
    title: 'Spot Shooting Circuit',
    level: 'MIDDLE_SCHOOL',
    focusArea: 'CONSISTENCY',
    difficulty: 3,
    duration: 20,
    description: 'Practice from 5 different spots to build all-around shooting.',
    whyItMatters: 'Being able to shoot from anywhere makes you a complete player.',
    steps: [
      'Set up at 5 spots: corners, wings, top of key',
      'Take 5 shots from each spot',
      'Track makes from each location',
      'Identify your weakest spot',
      'Spend extra time on weak spots'
    ],
    expectedOutcomes: [
      'Well-rounded shooting',
      'Know your strengths/weaknesses',
      'Game-ready skills'
    ],
    icon: '🎪',
    color: 'teal'
  },
  {
    id: 'ms-8',
    title: 'Follow-Through Hold',
    level: 'MIDDLE_SCHOOL',
    focusArea: 'FOLLOW_THROUGH',
    difficulty: 2,
    duration: 10,
    description: 'Train yourself to hold your follow-through until the ball hits the rim.',
    whyItMatters: 'A complete follow-through improves arc and accuracy.',
    steps: [
      'Take a shot from the free-throw line',
      'Hold your follow-through (hand up, wrist snapped)',
      'Keep it there until ball hits rim',
      'Check: Is your hand pointing at the basket?',
      'Do 20 shots with held follow-through'
    ],
    expectedOutcomes: [
      'Complete follow-through',
      'Better arc control',
      'More makes'
    ],
    icon: '🖐️',
    color: 'yellow'
  },
  {
    id: 'ms-9',
    title: 'One-Hand Form Shooting',
    level: 'MIDDLE_SCHOOL',
    focusArea: 'RELEASE_POINT',
    difficulty: 2,
    duration: 10,
    description: 'Shoot with only your shooting hand to perfect your release.',
    whyItMatters: 'One-hand shooting isolates your release mechanics.',
    steps: [
      'Stand 5 feet from basket',
      'Hold ball with shooting hand only',
      'Guide hand behind your back',
      'Shoot 20 one-hand shots',
      'Focus on wrist snap and follow-through'
    ],
    expectedOutcomes: [
      'Better release mechanics',
      'Stronger shooting hand',
      'Cleaner form'
    ],
    icon: '☝️',
    color: 'pink'
  },
  {
    id: 'ms-10',
    title: 'Balance and Shoot',
    level: 'MIDDLE_SCHOOL',
    focusArea: 'BALANCE',
    difficulty: 3,
    duration: 12,
    description: 'Practice maintaining balance through your entire shot.',
    whyItMatters: 'Good balance leads to consistent, repeatable shots.',
    steps: [
      'Start in athletic stance',
      'Take a shot and land in the same spot',
      'If you drift, your balance is off',
      'Practice until you can land on balance',
      'Do 20 shots tracking your landing'
    ],
    expectedOutcomes: [
      'Better balance',
      'More consistent shots',
      'Body control'
    ],
    icon: '⚖️',
    color: 'cyan'
  }
]

// ============================================
// HIGH SCHOOL LEVEL DRILLS (Ages 15-18)
// Focus: Performance, consistency, game situations
// ============================================

const HIGH_SCHOOL_DRILLS: Drill[] = [
  {
    id: 'hs-1',
    title: 'Game-Situation Shooting',
    level: 'HIGH_SCHOOL',
    focusArea: 'GAME_SITUATION',
    difficulty: 3,
    duration: 20,
    description: 'Simulate game fatigue and pressure while shooting.',
    whyItMatters: 'Games aren\'t played at rest—this builds real-world shooting skills.',
    steps: [
      'Run a suicide (baseline to baseline)',
      'Immediately catch and shoot from the wing',
      'Repeat 5 times from each wing',
      'Track your percentage under fatigue',
      'Compare to your rested percentage'
    ],
    expectedOutcomes: [
      'Better fatigue shooting',
      'Game-ready conditioning',
      'Mental toughness'
    ],
    icon: '🏀',
    color: 'red',
    technicalNote: 'Your release time is 0.3s faster than average HS player'
  },
  {
    id: 'hs-2',
    title: 'Consistency Challenge',
    level: 'HIGH_SCHOOL',
    focusArea: 'CONSISTENCY',
    difficulty: 4,
    duration: 25,
    description: 'Make 10 consecutive shots from the same spot.',
    whyItMatters: 'Consistency separates good shooters from great ones.',
    steps: [
      'Pick a spot (free throw, elbow, or 3-point)',
      'Must make 10 in a row',
      'If you miss, start over at 0',
      'Track how many attempts it takes',
      'Try to beat your record each session'
    ],
    expectedOutcomes: [
      'Elite consistency',
      'Mental focus',
      'Pressure handling'
    ],
    icon: '🎯',
    color: 'purple'
  },
  {
    id: 'hs-3',
    title: 'Pressure Free Throws',
    level: 'HIGH_SCHOOL',
    focusArea: 'GAME_SITUATION',
    difficulty: 3,
    duration: 15,
    description: 'Simulate end-of-game free throw pressure.',
    whyItMatters: 'Free throws win games—practice them under pressure.',
    steps: [
      'Run a sprint before each free throw',
      'Imagine the game is on the line',
      'Take 2 free throws (like a game)',
      'Track your 1-and-1 percentage',
      'Do 10 sets of 2 free throws'
    ],
    expectedOutcomes: [
      'Clutch free throw shooting',
      'Pressure management',
      'Game-ready skills'
    ],
    icon: '⏱️',
    color: 'orange'
  },
  {
    id: 'hs-4',
    title: 'Catch and Shoot Speed',
    level: 'HIGH_SCHOOL',
    focusArea: 'RELEASE_POINT',
    difficulty: 3,
    duration: 15,
    description: 'Decrease your catch-to-release time.',
    whyItMatters: 'Faster release = less time for defenders to close out.',
    steps: [
      'Have a partner pass to you',
      'Catch and shoot as quickly as possible',
      'Maintain good form despite speed',
      'Time your catch-to-release',
      'Target: under 0.8 seconds'
    ],
    expectedOutcomes: [
      'Faster release',
      'Better against defense',
      'Game-speed shooting'
    ],
    icon: '⚡',
    color: 'yellow',
    technicalNote: 'Elite catch-and-shoot time is 0.4-0.6 seconds'
  },
  {
    id: 'hs-5',
    title: 'Off-Screen Shooting',
    level: 'HIGH_SCHOOL',
    focusArea: 'FOOTWORK',
    difficulty: 4,
    duration: 20,
    description: 'Practice shooting off screens like in a game.',
    whyItMatters: 'Most open shots come off screens—master this skill.',
    steps: [
      'Set up a chair as a "screen"',
      'Curl around the screen',
      'Catch the pass and shoot',
      'Practice both directions',
      'Do 10 shots each way'
    ],
    expectedOutcomes: [
      'Better off-screen shooting',
      'Game-realistic practice',
      'Footwork improvement'
    ],
    icon: '🪑',
    color: 'blue'
  },
  {
    id: 'hs-6',
    title: 'Contested Shot Practice',
    level: 'HIGH_SCHOOL',
    focusArea: 'GAME_SITUATION',
    difficulty: 4,
    duration: 20,
    description: 'Practice shooting with a hand in your face.',
    whyItMatters: 'In games, you rarely get open looks—practice contested shots.',
    steps: [
      'Partner holds hand up near your release',
      'Don\'t change your form due to the hand',
      'Focus on your normal release point',
      'Take 20 contested shots',
      'Track percentage vs. open shots'
    ],
    expectedOutcomes: [
      'Confidence against defense',
      'Consistent form under pressure',
      'Game-ready shooting'
    ],
    icon: '🖐️',
    color: 'red'
  },
  {
    id: 'hs-7',
    title: 'Shot Fake to Shoot',
    level: 'HIGH_SCHOOL',
    focusArea: 'GAME_SITUATION',
    difficulty: 3,
    duration: 15,
    description: 'Use shot fakes to create better shooting opportunities.',
    whyItMatters: 'A good shot fake can get defenders in the air, creating open looks.',
    steps: [
      'Catch the ball in triple threat',
      'Execute a convincing shot fake',
      'If defender jumps, take one dribble and shoot',
      'If not, shoot immediately',
      'Practice reading the defense'
    ],
    expectedOutcomes: [
      'Better shot creation',
      'Reading defenders',
      'More open looks'
    ],
    icon: '🎭',
    color: 'green'
  },
  {
    id: 'hs-8',
    title: 'Baseline to Baseline',
    level: 'HIGH_SCHOOL',
    focusArea: 'CONSISTENCY',
    difficulty: 4,
    duration: 25,
    description: 'Shoot from every spot on the court systematically.',
    whyItMatters: 'Complete shooters can score from anywhere.',
    steps: [
      'Start at right corner',
      'Take 3 shots, move to next spot',
      'Go all the way around the 3-point line',
      'Track makes from each spot',
      'Identify and improve weak areas'
    ],
    expectedOutcomes: [
      'All-around shooting',
      'Spot identification',
      'Complete game'
    ],
    icon: '🔄',
    color: 'indigo'
  },
  {
    id: 'hs-9',
    title: 'Pull-Up Jumper',
    level: 'HIGH_SCHOOL',
    focusArea: 'FOOTWORK',
    difficulty: 4,
    duration: 20,
    description: 'Master the pull-up jump shot off the dribble.',
    whyItMatters: 'The pull-up is one of the hardest shots to defend.',
    steps: [
      'Start at half court with the ball',
      'Dribble toward the basket at game speed',
      'Pull up for a jump shot at the elbow',
      'Focus on gathering your feet quickly',
      'Do 10 from each side'
    ],
    expectedOutcomes: [
      'Pull-up shooting ability',
      'Shot creation',
      'Offensive versatility'
    ],
    icon: '🏃',
    color: 'teal'
  },
  {
    id: 'hs-10',
    title: 'Form Under Fatigue',
    level: 'HIGH_SCHOOL',
    focusArea: 'FATIGUE',
    difficulty: 4,
    duration: 30,
    description: 'Maintain shooting form when tired.',
    whyItMatters: 'Form breakdown under fatigue costs games—train to prevent it.',
    steps: [
      'Do 20 jumping jacks',
      'Immediately take 5 shots',
      'Check: Did your form stay the same?',
      'Repeat 5 times',
      'Track form consistency when tired'
    ],
    expectedOutcomes: [
      'Fatigue-resistant form',
      '4th quarter readiness',
      'Mental toughness'
    ],
    icon: '💪',
    color: 'pink'
  }
]

// ============================================
// COLLEGE LEVEL DRILLS
// Focus: Advanced mechanics, NCAA standards
// ============================================

const COLLEGE_DRILLS: Drill[] = [
  {
    id: 'col-1',
    title: 'NCAA Standard Refinement',
    level: 'COLLEGE',
    focusArea: 'CONSISTENCY',
    difficulty: 4,
    duration: 30,
    description: 'Refine your form to meet NCAA shooting standards.',
    whyItMatters: 'NCAA-level shooting requires elite consistency and mechanics.',
    steps: [
      'Perform 50 shots from game spots',
      'Analyze shot load and release mechanics',
      'Compare to NCAA database standards',
      'Identify micro-adjustments needed',
      'Focus on the smallest details'
    ],
    expectedOutcomes: [
      'NCAA-ready form',
      'Elite consistency',
      'Professional mechanics'
    ],
    icon: '🎓',
    color: 'blue',
    technicalNote: 'NCAA optimal arc is 45-50°'
  },
  {
    id: 'col-2',
    title: 'Shot Load Optimization',
    level: 'COLLEGE',
    focusArea: 'KNEE_BEND',
    difficulty: 4,
    duration: 25,
    description: 'Perfect the timing of your shot load (dip and rise).',
    whyItMatters: 'Proper shot load timing creates fluid, efficient shooting motion.',
    steps: [
      'Film yourself shooting 10 shots',
      'Analyze the dip-to-release timing',
      'Target: 0.3-0.4 seconds for shot load',
      'Adjust knee bend depth and speed',
      'Practice until timing is consistent'
    ],
    expectedOutcomes: [
      'Optimized shot load',
      'Faster release',
      'More efficient motion'
    ],
    icon: '⏱️',
    color: 'purple',
    technicalNote: 'Hip extension should occur 0.3s before release'
  },
  {
    id: 'col-3',
    title: 'Pressure Performance',
    level: 'COLLEGE',
    focusArea: 'GAME_SITUATION',
    difficulty: 5,
    duration: 35,
    description: 'Simulate high-stakes shooting scenarios.',
    whyItMatters: 'College games are decided in pressure moments—train for them.',
    steps: [
      'Set up a consequence for misses (sprints)',
      'Take 10 "game-winning" shots',
      'Each miss = 1 sprint',
      'Track your percentage under pressure',
      'Build mental toughness'
    ],
    expectedOutcomes: [
      'Clutch shooting',
      'Pressure management',
      'Mental strength'
    ],
    icon: '🏆',
    color: 'gold'
  },
  {
    id: 'col-4',
    title: 'Advanced Biomechanics',
    level: 'COLLEGE',
    focusArea: 'MICRO_ADJUSTMENT',
    difficulty: 5,
    duration: 30,
    description: 'Make micro-adjustments to optimize your shooting mechanics.',
    whyItMatters: 'At the college level, small adjustments make big differences.',
    steps: [
      'Use video analysis to identify issues',
      'Focus on one micro-adjustment per session',
      'Examples: release angle, wrist snap timing',
      'Take 50 shots focusing on that adjustment',
      'Re-analyze to confirm improvement'
    ],
    expectedOutcomes: [
      'Refined mechanics',
      'Higher efficiency',
      'Professional-level form'
    ],
    icon: '🔬',
    color: 'indigo'
  },
  {
    id: 'col-5',
    title: 'Shot Selection Mastery',
    level: 'COLLEGE',
    focusArea: 'GAME_SITUATION',
    difficulty: 4,
    duration: 25,
    description: 'Practice choosing optimal shots in game flow.',
    whyItMatters: 'Good shot selection is as important as good shooting.',
    steps: [
      'Have a partner call out scenarios',
      '"Open 3" = shoot immediately',
      '"Contested" = shot fake first',
      '"Closeout" = drive or pull-up',
      'Practice reading and reacting'
    ],
    expectedOutcomes: [
      'Better shot selection',
      'Game IQ improvement',
      'Efficient scoring'
    ],
    icon: '🧠',
    color: 'teal'
  },
  {
    id: 'col-6',
    title: 'Fatigue Recovery Analysis',
    level: 'COLLEGE',
    focusArea: 'FATIGUE',
    difficulty: 4,
    duration: 40,
    description: 'Track and improve performance across multiple sessions.',
    whyItMatters: 'Understanding your fatigue patterns helps optimize training.',
    steps: [
      'Shoot 100 shots in a session',
      'Track percentage every 20 shots',
      'Identify when form breaks down',
      'Develop strategies to delay breakdown',
      'Compare across multiple sessions'
    ],
    expectedOutcomes: [
      'Fatigue awareness',
      'Extended peak performance',
      'Training optimization'
    ],
    icon: '📊',
    color: 'green'
  },
  {
    id: 'col-7',
    title: 'Release Velocity Optimization',
    level: 'COLLEGE',
    focusArea: 'RELEASE_POINT',
    difficulty: 5,
    duration: 30,
    description: 'Optimize your release velocity for different shot types.',
    whyItMatters: 'Proper release velocity affects arc and accuracy.',
    steps: [
      'Use a shot tracker or video analysis',
      'Measure release velocity on different shots',
      'Compare to optimal ranges (7-9 m/s)',
      'Adjust leg power and arm speed',
      'Find your optimal velocity'
    ],
    expectedOutcomes: [
      'Optimized release',
      'Better arc control',
      'Consistent power'
    ],
    icon: '🚀',
    color: 'orange',
    technicalNote: 'Optimal release velocity is 8.2 m/s for most shooters'
  },
  {
    id: 'col-8',
    title: 'Defensive Pressure Adaptation',
    level: 'COLLEGE',
    focusArea: 'GAME_SITUATION',
    difficulty: 5,
    duration: 30,
    description: 'Adapt your shot to different defensive pressures.',
    whyItMatters: 'Elite shooters adjust to defensive schemes.',
    steps: [
      'Partner provides varying defensive pressure',
      'Light pressure: normal shot',
      'Medium pressure: quicker release',
      'Heavy pressure: fade or step-back',
      'Practice reading and adapting'
    ],
    expectedOutcomes: [
      'Adaptive shooting',
      'Defensive reading',
      'Versatile scoring'
    ],
    icon: '🛡️',
    color: 'red'
  },
  {
    id: 'col-9',
    title: 'Transition 3-Point Shooting',
    level: 'COLLEGE',
    focusArea: 'FOOTWORK',
    difficulty: 4,
    duration: 25,
    description: 'Master shooting 3s in transition.',
    whyItMatters: 'Transition 3s are high-value shots in modern basketball.',
    steps: [
      'Sprint from half court',
      'Receive pass at 3-point line',
      'Set feet quickly and shoot',
      'Practice both wings and top',
      'Track percentage in transition'
    ],
    expectedOutcomes: [
      'Transition shooting',
      'Quick setup',
      'Fast-break scoring'
    ],
    icon: '🏃‍♂️',
    color: 'cyan'
  },
  {
    id: 'col-10',
    title: 'Film Study Integration',
    level: 'COLLEGE',
    focusArea: 'CONSISTENCY',
    difficulty: 4,
    duration: 45,
    description: 'Combine film study with practice for maximum improvement.',
    whyItMatters: 'Visual feedback accelerates improvement.',
    steps: [
      'Film 20 shots from multiple angles',
      'Review immediately after shooting',
      'Identify one area to improve',
      'Shoot 30 more focusing on that area',
      'Re-film and compare'
    ],
    expectedOutcomes: [
      'Visual learning',
      'Rapid improvement',
      'Self-coaching skills'
    ],
    icon: '🎬',
    color: 'pink'
  }
]

// ============================================
// PROFESSIONAL LEVEL DRILLS
// Focus: Elite micro-adjustments, NBA/WNBA standards
// ============================================

const PROFESSIONAL_DRILLS: Drill[] = [
  {
    id: 'pro-1',
    title: 'Elite Fatigue Management',
    level: 'PROFESSIONAL',
    focusArea: 'FATIGUE',
    difficulty: 5,
    duration: 45,
    description: 'Maintain elite form under extreme fatigue conditions.',
    whyItMatters: 'Your form degrades 8% in 4th quarter—let\'s address this.',
    steps: [
      'Perform intense conditioning (simulate 4th quarter)',
      'Take 40 shots under fatigue',
      'Compare form to fresh baseline',
      'Identify degradation patterns',
      'Develop fatigue-specific mechanics'
    ],
    expectedOutcomes: [
      'Fatigue-resistant shooting',
      '4th quarter dominance',
      'Elite conditioning'
    ],
    icon: '🏆',
    color: 'gold',
    technicalNote: 'NBA data shows elite shooters maintain form degradation below 5%'
  },
  {
    id: 'pro-2',
    title: 'Micro-Adjustment Protocol',
    level: 'PROFESSIONAL',
    focusArea: 'MICRO_ADJUSTMENT',
    difficulty: 5,
    duration: 40,
    description: 'Fine-tune release based on defender positioning.',
    whyItMatters: 'Elite shooters make micro-adjustments based on defensive distance.',
    steps: [
      'Assess defender proximity (0-2, 2-4, 4+ feet)',
      'Tight defense: raise release point 1-2 inches',
      'Medium: maintain normal form',
      'Open: can lower slightly for quicker release',
      'Practice reading and adjusting automatically'
    ],
    expectedOutcomes: [
      'Adaptive shooting',
      'Defender-proof form',
      'Elite efficiency'
    ],
    icon: '🎯',
    color: 'purple'
  },
  {
    id: 'pro-3',
    title: 'NBA Comparison Drill',
    level: 'PROFESSIONAL',
    focusArea: 'CONSISTENCY',
    difficulty: 5,
    duration: 50,
    description: 'Match your form to elite NBA shooters.',
    whyItMatters: 'Learn from the best to become the best.',
    steps: [
      'Study film of an elite shooter (Curry, Thompson)',
      'Identify 3 key mechanics to emulate',
      'Practice each mechanic in isolation',
      'Combine into full shooting motion',
      'Compare side-by-side with video'
    ],
    expectedOutcomes: [
      'Elite mechanics',
      'NBA-level form',
      'Professional technique'
    ],
    icon: '⭐',
    color: 'blue'
  },
  {
    id: 'pro-4',
    title: 'Situational Pattern Recognition',
    level: 'PROFESSIONAL',
    focusArea: 'GAME_SITUATION',
    difficulty: 5,
    duration: 45,
    description: 'Identify and optimize shooting patterns in game situations.',
    whyItMatters: 'Recognizing patterns leads to better shot selection.',
    steps: [
      'Review game film of your last 5 games',
      'Identify your most common shot types',
      'Track percentage for each type',
      'Practice your most frequent shots',
      'Develop counters for defended shots'
    ],
    expectedOutcomes: [
      'Pattern awareness',
      'Optimized shot selection',
      'Higher efficiency'
    ],
    icon: '📈',
    color: 'green'
  },
  {
    id: 'pro-5',
    title: 'Release Timing Precision',
    level: 'PROFESSIONAL',
    focusArea: 'RELEASE_POINT',
    difficulty: 5,
    duration: 35,
    description: 'Perfect your release timing to the millisecond.',
    whyItMatters: 'At the pro level, 0.1 second can mean the difference between make and miss.',
    steps: [
      'Use high-speed video (240fps if possible)',
      'Measure exact release timing',
      'Target: release at peak of jump',
      'Adjust for different shot types',
      'Develop consistent timing cues'
    ],
    expectedOutcomes: [
      'Precise timing',
      'Consistent release',
      'Elite accuracy'
    ],
    icon: '⏱️',
    color: 'red',
    technicalNote: 'Elite release time variance should be under 0.05 seconds'
  },
  {
    id: 'pro-6',
    title: 'Defender Distance Adaptation',
    level: 'PROFESSIONAL',
    focusArea: 'MICRO_ADJUSTMENT',
    difficulty: 5,
    duration: 40,
    description: 'Automatically adjust form based on defender distance.',
    whyItMatters: 'Your accuracy varies 6% based on defender distance—normalize this.',
    steps: [
      'Partner provides varying closeout speeds',
      'Practice reading defender distance instantly',
      'Tight (0-2 ft): higher, quicker release',
      'Medium (2-4 ft): normal form',
      'Open (4+ ft): comfortable, rhythmic shot'
    ],
    expectedOutcomes: [
      'Distance-adaptive shooting',
      'Consistent accuracy',
      'Defensive reading'
    ],
    icon: '👁️',
    color: 'indigo'
  },
  {
    id: 'pro-7',
    title: 'Shot Arc Optimization',
    level: 'PROFESSIONAL',
    focusArea: 'ARC_TRAJECTORY',
    difficulty: 5,
    duration: 35,
    description: 'Fine-tune your arc for maximum efficiency.',
    whyItMatters: 'The optimal arc (45-50°) maximizes your make percentage.',
    steps: [
      'Use shot tracking technology',
      'Measure your current average arc',
      'Compare to optimal range (45-50°)',
      'Adjust knee bend and release angle',
      'Practice until arc is consistent'
    ],
    expectedOutcomes: [
      'Optimal arc',
      'Higher percentage',
      'Consistent trajectory'
    ],
    icon: '🌙',
    color: 'teal',
    technicalNote: 'Your current arc: 47°, optimal for your body type: 49-51°'
  },
  {
    id: 'pro-8',
    title: 'Mental Reset Protocol',
    level: 'PROFESSIONAL',
    focusArea: 'CONSISTENCY',
    difficulty: 4,
    duration: 30,
    description: 'Develop a mental reset routine for after misses.',
    whyItMatters: 'Elite shooters have short memories—develop yours.',
    steps: [
      'Create a physical reset cue (touch shorts, etc.)',
      'Pair with a mental cue ("next shot")',
      'Practice missing intentionally',
      'Execute reset routine',
      'Shoot with confidence on next shot'
    ],
    expectedOutcomes: [
      'Mental toughness',
      'Quick recovery',
      'Consistent mindset'
    ],
    icon: '🧘',
    color: 'cyan'
  },
  {
    id: 'pro-9',
    title: 'Game-Speed Integration',
    level: 'PROFESSIONAL',
    focusArea: 'GAME_SITUATION',
    difficulty: 5,
    duration: 50,
    description: 'Practice all shots at game speed with game intensity.',
    whyItMatters: 'Practice at game speed to perform at game speed.',
    steps: [
      'Every drill at 100% intensity',
      'Include defensive pressure',
      'Add consequences for misses',
      'Track percentage at game speed',
      'Compare to practice speed'
    ],
    expectedOutcomes: [
      'Game-speed shooting',
      'Transfer to games',
      'Elite performance'
    ],
    icon: '🔥',
    color: 'orange'
  },
  {
    id: 'pro-10',
    title: 'Biomechanical Efficiency Audit',
    level: 'PROFESSIONAL',
    focusArea: 'MICRO_ADJUSTMENT',
    difficulty: 5,
    duration: 60,
    description: 'Comprehensive audit of your shooting mechanics.',
    whyItMatters: 'Annual audits ensure you\'re not developing bad habits.',
    steps: [
      'Full video analysis from all angles',
      'Compare to your baseline form',
      'Identify any drift or changes',
      'Consult with shooting coach',
      'Create correction plan if needed'
    ],
    expectedOutcomes: [
      'Form maintenance',
      'Early problem detection',
      'Long-term consistency'
    ],
    icon: '📋',
    color: 'pink'
  }
]

// ============================================
// COMBINED DRILL DATABASE
// ============================================

export const ALL_DRILLS: Drill[] = [
  ...ELEMENTARY_DRILLS,
  ...MIDDLE_SCHOOL_DRILLS,
  ...HIGH_SCHOOL_DRILLS,
  ...COLLEGE_DRILLS,
  ...PROFESSIONAL_DRILLS
]

// ============================================
// DRILL SELECTION FUNCTIONS
// ============================================

export function getDrillsByLevel(level: SkillLevel): Drill[] {
  return ALL_DRILLS.filter(drill => drill.level === level)
}

export function getDrillsByFocusArea(focusArea: DrillFocusArea): Drill[] {
  return ALL_DRILLS.filter(drill => drill.focusArea === focusArea)
}

export function getRecommendedDrills(
  level: SkillLevel,
  weakAreas: DrillFocusArea[],
  limit: number = 5
): Drill[] {
  const levelDrills = getDrillsByLevel(level)
  
  // Prioritize drills that address weak areas
  const prioritized = levelDrills.sort((a, b) => {
    const aMatch = weakAreas.includes(a.focusArea) ? 1 : 0
    const bMatch = weakAreas.includes(b.focusArea) ? 1 : 0
    return bMatch - aMatch
  })
  
  return prioritized.slice(0, limit)
}

export function mapAgeToLevel(age: number): SkillLevel {
  if (age <= 11) return 'ELEMENTARY'
  if (age <= 14) return 'MIDDLE_SCHOOL'
  if (age <= 18) return 'HIGH_SCHOOL'
  if (age <= 22) return 'COLLEGE'
  return 'PROFESSIONAL'
}

export function mapSkillLevelToLevel(skillLevel: string): SkillLevel {
  switch (skillLevel?.toUpperCase()) {
    case 'BEGINNER':
      return 'ELEMENTARY'
    case 'INTERMEDIATE':
      return 'MIDDLE_SCHOOL'
    case 'ADVANCED':
      return 'HIGH_SCHOOL'
    case 'ELITE':
    case 'PROFESSIONAL':
      return 'PROFESSIONAL'
    default:
      return 'HIGH_SCHOOL'
  }
}

// Map detected flaws to focus areas
export function mapFlawToFocusArea(flawId: string): DrillFocusArea {
  const mapping: Record<string, DrillFocusArea> = {
    'elbow_flare': 'ELBOW_ALIGNMENT',
    'elbow_too_high': 'ELBOW_ALIGNMENT',
    'elbow_too_low': 'ELBOW_ALIGNMENT',
    'insufficient_knee_bend': 'KNEE_BEND',
    'excessive_knee_bend': 'KNEE_BEND',
    'poor_balance': 'BALANCE',
    'inconsistent_release': 'RELEASE_POINT',
    'low_release': 'RELEASE_POINT',
    'poor_follow_through': 'FOLLOW_THROUGH',
    'flat_arc': 'ARC_TRAJECTORY',
    'high_arc': 'ARC_TRAJECTORY',
    'inconsistent_footwork': 'FOOTWORK',
    'poor_stance': 'FOOTWORK'
  }
  
  return mapping[flawId] || 'CONSISTENCY'
}

