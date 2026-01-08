'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Star, Crown, Sparkles } from 'lucide-react';

/**
 * Level 9 Sneaker Badge Test Page
 * 
 * Background style: Dense typography/graffiti collage like Houston Rockets socks
 * - FILLS THE ENTIRE SPACE - no gaps
 * - MULTIPLE DIFFERENT FONTS - handwritten, graffiti, bold, cursive, block
 * - Words overlapping and tightly packed
 * - WHITE text, subtle opacity
 */

// Word associations for each sneaker
const WORD_ASSOCIATIONS: Record<string, string[]> = {
  'Aqua Splash': ['AQUA', 'SPLASH', 'WATER', 'WAVE', 'OCEAN', 'DRIP', 'FLOW', 'SURF', 'TIDE', 'DEEP', 'WET', 'SEA', 'BLUE', 'COOL', 'FRESH', 'DIVE', 'POOL', 'RAIN', 'H2O', 'LIQUID'],
  'Black Panther': ['WAKANDA', 'PANTHER', 'FOREVER', 'KING', 'POWER', 'TCHALLA', 'BLACK', 'WARRIOR', 'VIBRANIUM', 'CLAWS', 'AFRICA', 'ROYAL', 'HERO', 'CROWN', 'FIERCE', 'LEGEND', 'JUNGLE', 'STRENGTH'],
  'Bluey': ['BLUEY', 'BINGO', 'PLAY', 'FUN', 'FAMILY', 'HEELER', 'GAMES', 'MAGIC', 'AUSSIE', 'PUPPY', 'DANCE', 'JOY', 'LOVE', 'HAPPY', 'DREAM', 'FRIENDS', 'ADVENTURE', 'BLUE'],
  'Cool-Aid Orange': ['COOL', 'AID', 'ORANGE', 'FRESH', 'JUICE', 'CITRUS', 'SWEET', 'SUMMER', 'THIRST', 'FLAVOR', 'BURST', 'TANGY', 'ZESTY', 'FRUITY', 'COLD', 'ICE', 'DRINK', 'REFRESHING'],
  'Crimson': ['CRIMSON', 'RED', 'FIRE', 'PASSION', 'BLOOD', 'FLAME', 'SCARLET', 'RUBY', 'BOLD', 'INTENSE', 'POWER', 'FIERCE', 'DARK', 'HOT', 'BURN', 'ELEGANT', 'ROSE', 'DEEP'],
  'Incredible Hulk': ['HULK', 'SMASH', 'INCREDIBLE', 'GREEN', 'GAMMA', 'BANNER', 'STRONG', 'ANGRY', 'POWER', 'RAGE', 'BEAST', 'MONSTER', 'STRENGTH', 'FURY', 'GIANT', 'CRUSH', 'ROAR', 'MUSCLE'],
  'Kryptonite': ['KRYPTONITE', 'SUPERMAN', 'SUPER', 'HERO', 'KRYPTON', 'POWER', 'CLARK', 'KENT', 'CRYSTAL', 'GREEN', 'WEAKNESS', 'ALIEN', 'FORTRESS', 'CAPE', 'FLY', 'STEEL', 'HOPE', 'JUSTICE'],
  'Loch Ness Monster': ['NESSIE', 'LOCH', 'NESS', 'MONSTER', 'SCOTLAND', 'LEGEND', 'MYSTERY', 'LAKE', 'DEEP', 'CREATURE', 'MYTH', 'WATER', 'ANCIENT', 'HIDDEN', 'BEAST', 'SECRET', 'DARK', 'SHADOW'],
  'Orange Crush': ['ORANGE', 'CRUSH', 'SODA', 'FIZZ', 'BUBBLES', 'SWEET', 'CITRUS', 'POP', 'REFRESHING', 'CARBONATED', 'BURST', 'FLAVOR', 'ZEST', 'SPARKLING', 'COLD', 'DRINK', 'JUICE', 'TANG'],
  'Pink Panther': ['PINK', 'PANTHER', 'COOL', 'SMOOTH', 'DETECTIVE', 'MYSTERY', 'SUAVE', 'SLEEK', 'CLASSIC', 'JAZZY', 'STYLE', 'DIAMOND', 'CLOUSEAU', 'SPY', 'SLICK', 'CAT', 'GROOVY', 'CHIC'],
  'Purple Rain': ['PURPLE', 'RAIN', 'PRINCE', 'MUSIC', 'LEGEND', 'GUITAR', 'FUNK', 'SOUL', 'ICON', 'MINNEAPOLIS', 'DOVE', 'SYMBOL', 'GENIUS', 'LOVE', 'SEXY', 'DREAM', 'NIGHT', 'STAR'],
  'Hulkmania': ['HULKMANIA', 'HOGAN', 'WRESTLING', 'BROTHER', 'CHAMPION', 'HULK', 'MANIA', 'RING', 'BELT', 'LEGEND', 'POWER', 'YELLOW', 'RED', 'SLAM', 'VICTORY', 'FLEX', 'STRONG', 'ICON'],
};

// Different font families for variety
const FONTS = [
  'Permanent Marker',
  'Bangers',
  'Satisfy',
  'Pacifico',
  'Bebas Neue',
  'Oswald',
  'Anton',
  'Righteous',
  'Russo One',
  'Black Ops One',
];

// READABLE WORD CLOUD - Words fill space but DON'T OVERLAP
// Carefully positioned so each word is readable
function generateInterlockingTypography(words: string[]): React.ReactNode {
  const elements: React.ReactNode[] = [];
  
  // Carefully laid out words - each positioned to not overlap but fill space
  // Row by row, alternating horizontal and vertical words
  const placements = [
    // Row 1
    { word: words[0], x: 5, y: 28, size: 24, rotate: 0 },
    { word: words[1], x: 85, y: 22, size: 18, rotate: -90 },
    { word: words[2], x: 110, y: 30, size: 20, rotate: 0 },
    { word: words[3], x: 200, y: 24, size: 16, rotate: -90 },
    { word: words[4], x: 230, y: 28, size: 22, rotate: 0 },
    { word: words[5], x: 340, y: 20, size: 14, rotate: -90 },
    { word: words[6], x: 365, y: 32, size: 18, rotate: 0 },
    
    // Row 2
    { word: words[7], x: 5, y: 55, size: 20, rotate: 0 },
    { word: words[8], x: 100, y: 52, size: 16, rotate: 0 },
    { word: words[9], x: 175, y: 48, size: 22, rotate: -90 },
    { word: words[10], x: 200, y: 58, size: 18, rotate: 0 },
    { word: words[11], x: 295, y: 50, size: 14, rotate: -90 },
    { word: words[12], x: 320, y: 55, size: 20, rotate: 0 },
    
    // Row 3
    { word: words[13], x: 5, y: 82, size: 28, rotate: 0 },
    { word: words[14], x: 120, y: 78, size: 16, rotate: -90 },
    { word: words[15], x: 145, y: 85, size: 22, rotate: 0 },
    { word: words[16], x: 260, y: 80, size: 18, rotate: 0 },
    { word: words[17], x: 355, y: 75, size: 20, rotate: -90 },
    
    // Row 4
    { word: words[0], x: 5, y: 112, size: 18, rotate: 0 },
    { word: words[1], x: 80, y: 108, size: 24, rotate: 0 },
    { word: words[2], x: 185, y: 105, size: 16, rotate: -90 },
    { word: words[3], x: 210, y: 115, size: 20, rotate: 0 },
    { word: words[4], x: 310, y: 110, size: 22, rotate: 0 },
    
    // Row 5
    { word: words[5], x: 5, y: 142, size: 22, rotate: 0 },
    { word: words[6], x: 95, y: 138, size: 18, rotate: -90 },
    { word: words[7], x: 120, y: 145, size: 26, rotate: 0 },
    { word: words[8], x: 240, y: 140, size: 16, rotate: 0 },
    { word: words[9], x: 320, y: 135, size: 20, rotate: -90 },
    { word: words[10], x: 345, y: 145, size: 18, rotate: 0 },
    
    // Row 6
    { word: words[11], x: 5, y: 175, size: 30, rotate: 0 },
    { word: words[12], x: 130, y: 170, size: 18, rotate: 0 },
    { word: words[13], x: 215, y: 168, size: 22, rotate: -90 },
    { word: words[14], x: 245, y: 178, size: 24, rotate: 0 },
    { word: words[15], x: 370, y: 172, size: 16, rotate: -90 },
    
    // Row 7
    { word: words[16], x: 5, y: 208, size: 20, rotate: 0 },
    { word: words[17], x: 90, y: 202, size: 16, rotate: -90 },
    { word: words[0], x: 115, y: 210, size: 24, rotate: 0 },
    { word: words[1], x: 225, y: 205, size: 20, rotate: 0 },
    { word: words[2], x: 320, y: 200, size: 18, rotate: -90 },
    { word: words[3], x: 345, y: 212, size: 22, rotate: 0 },
    
    // Row 8
    { word: words[4], x: 5, y: 240, size: 26, rotate: 0 },
    { word: words[5], x: 110, y: 235, size: 18, rotate: 0 },
    { word: words[6], x: 190, y: 232, size: 22, rotate: -90 },
    { word: words[7], x: 220, y: 242, size: 20, rotate: 0 },
    { word: words[8], x: 315, y: 238, size: 24, rotate: 0 },
    
    // Row 9
    { word: words[9], x: 5, y: 272, size: 18, rotate: 0 },
    { word: words[10], x: 75, y: 268, size: 28, rotate: 0 },
    { word: words[11], x: 185, y: 265, size: 16, rotate: -90 },
    { word: words[12], x: 210, y: 275, size: 22, rotate: 0 },
    { word: words[13], x: 320, y: 270, size: 20, rotate: -90 },
    { word: words[14], x: 350, y: 275, size: 18, rotate: 0 },
    
    // Row 10
    { word: words[15], x: 5, y: 305, size: 24, rotate: 0 },
    { word: words[16], x: 105, y: 300, size: 20, rotate: -90 },
    { word: words[17], x: 130, y: 308, size: 26, rotate: 0 },
    { word: words[0], x: 255, y: 302, size: 18, rotate: 0 },
    { word: words[1], x: 340, y: 298, size: 22, rotate: -90 },
    
    // Row 11
    { word: words[2], x: 5, y: 338, size: 20, rotate: 0 },
    { word: words[3], x: 85, y: 335, size: 24, rotate: 0 },
    { word: words[4], x: 190, y: 330, size: 18, rotate: -90 },
    { word: words[5], x: 215, y: 340, size: 22, rotate: 0 },
    { word: words[6], x: 320, y: 335, size: 20, rotate: 0 },
    
    // Row 12
    { word: words[7], x: 5, y: 370, size: 28, rotate: 0 },
    { word: words[8], x: 120, y: 365, size: 16, rotate: -90 },
    { word: words[9], x: 145, y: 372, size: 20, rotate: 0 },
    { word: words[10], x: 245, y: 368, size: 24, rotate: 0 },
    { word: words[11], x: 365, y: 362, size: 18, rotate: -90 },
    
    // Row 13
    { word: words[12], x: 5, y: 402, size: 22, rotate: 0 },
    { word: words[13], x: 100, y: 398, size: 18, rotate: 0 },
    { word: words[14], x: 180, y: 395, size: 26, rotate: -90 },
    { word: words[15], x: 210, y: 405, size: 20, rotate: 0 },
    { word: words[16], x: 310, y: 400, size: 22, rotate: 0 },
    
    // Row 14
    { word: words[17], x: 5, y: 435, size: 18, rotate: 0 },
    { word: words[0], x: 80, y: 430, size: 24, rotate: -90 },
    { word: words[1], x: 110, y: 438, size: 28, rotate: 0 },
    { word: words[2], x: 230, y: 432, size: 20, rotate: 0 },
    { word: words[3], x: 320, y: 428, size: 16, rotate: -90 },
    { word: words[4], x: 345, y: 438, size: 22, rotate: 0 },
    
    // Row 15
    { word: words[5], x: 5, y: 468, size: 26, rotate: 0 },
    { word: words[6], x: 115, y: 462, size: 18, rotate: 0 },
    { word: words[7], x: 195, y: 458, size: 22, rotate: -90 },
    { word: words[8], x: 225, y: 470, size: 24, rotate: 0 },
    { word: words[9], x: 345, y: 465, size: 20, rotate: 0 },
    
    // Row 16
    { word: words[10], x: 5, y: 500, size: 20, rotate: 0 },
    { word: words[11], x: 85, y: 495, size: 16, rotate: -90 },
    { word: words[12], x: 110, y: 502, size: 28, rotate: 0 },
    { word: words[13], x: 235, y: 498, size: 22, rotate: 0 },
    { word: words[14], x: 350, y: 492, size: 18, rotate: -90 },
    
    // Row 17
    { word: words[15], x: 5, y: 532, size: 24, rotate: 0 },
    { word: words[16], x: 105, y: 528, size: 20, rotate: 0 },
    { word: words[17], x: 195, y: 525, size: 18, rotate: -90 },
    { word: words[0], x: 220, y: 535, size: 26, rotate: 0 },
    { word: words[1], x: 345, y: 530, size: 22, rotate: 0 },
    
    // Row 18
    { word: words[2], x: 5, y: 565, size: 22, rotate: 0 },
    { word: words[3], x: 90, y: 560, size: 28, rotate: -90 },
    { word: words[4], x: 120, y: 568, size: 20, rotate: 0 },
    { word: words[5], x: 220, y: 562, size: 24, rotate: 0 },
    { word: words[6], x: 340, y: 558, size: 18, rotate: -90 },
    { word: words[7], x: 365, y: 568, size: 20, rotate: 0 },
    
    // Row 19
    { word: words[8], x: 5, y: 598, size: 26, rotate: 0 },
    { word: words[9], x: 115, y: 592, size: 18, rotate: 0 },
    { word: words[10], x: 190, y: 588, size: 22, rotate: -90 },
    { word: words[11], x: 220, y: 600, size: 24, rotate: 0 },
    { word: words[12], x: 340, y: 595, size: 20, rotate: 0 },
  ];

  placements.forEach((p, idx) => {
    const font = FONTS[idx % FONTS.length];
    // Vary opacity slightly for depth but keep readable
    const opacity = 0.15 + (idx % 3) * 0.05;
    
    elements.push(
      <text
        key={idx}
        x={p.x}
        y={p.y}
        transform={p.rotate !== 0 ? `rotate(${p.rotate}, ${p.x}, ${p.y})` : undefined}
        fill="white"
        fontSize={p.size}
        fontFamily={font}
        fontWeight="bold"
        opacity={opacity}
      >
        {p.word}
      </text>
    );
  });

  return (
    <svg 
      className="absolute inset-0 w-full h-full overflow-hidden" 
      viewBox="0 0 400 620" 
      preserveAspectRatio="xMidYMid slice"
      style={{ minHeight: '100%', minWidth: '100%' }}
    >
      <defs>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Bangers&family=Satisfy&family=Pacifico&family=Bebas+Neue&family=Oswald:wght@700&family=Anton&family=Righteous&family=Russo+One&family=Black+Ops+One&display=swap');
          `}
        </style>
      </defs>
      {elements}
    </svg>
  );
}

// Theme configuration - colors for UI elements
const SNEAKER_THEMES: Record<string, {
  primaryColor: string;
  buttonGradient: string;
  borderColor: string;
  glowColor: string;
  titleGradient: string;
  iconBg: string;
}> = {
  'Aqua Splash': {
    primaryColor: '#22d3ee',
    buttonGradient: 'from-cyan-500 via-cyan-400 to-teal-400',
    borderColor: 'border-cyan-500/60',
    glowColor: 'shadow-cyan-500/40',
    titleGradient: 'from-cyan-400 via-cyan-300 to-teal-400',
    iconBg: 'bg-gradient-to-br from-cyan-500 to-teal-500',
  },
  'Black Panther': {
    primaryColor: '#9333ea', // Purple outline for black sneaker
    buttonGradient: 'from-gray-900 via-gray-800 to-purple-900',
    borderColor: 'border-purple-600/80',
    glowColor: 'shadow-purple-600/50',
    titleGradient: 'from-gray-200 via-purple-300 to-gray-100',
    iconBg: 'bg-gradient-to-br from-gray-800 to-purple-900',
  },
  'Bluey': {
    primaryColor: '#38bdf8',
    buttonGradient: 'from-sky-500 via-sky-400 to-blue-400',
    borderColor: 'border-sky-500/60',
    glowColor: 'shadow-sky-500/40',
    titleGradient: 'from-sky-400 via-sky-300 to-blue-400',
    iconBg: 'bg-gradient-to-br from-sky-500 to-blue-500',
  },
  'Cool-Aid Orange': {
    primaryColor: '#fb923c',
    buttonGradient: 'from-orange-500 via-orange-400 to-amber-400',
    borderColor: 'border-orange-500/60',
    glowColor: 'shadow-orange-500/40',
    titleGradient: 'from-orange-400 via-orange-300 to-amber-400',
    iconBg: 'bg-gradient-to-br from-orange-500 to-amber-500',
  },
  'Crimson': {
    primaryColor: '#ef4444',
    buttonGradient: 'from-red-600 via-red-500 to-rose-500',
    borderColor: 'border-red-500/60',
    glowColor: 'shadow-red-500/40',
    titleGradient: 'from-red-400 via-red-300 to-rose-400',
    iconBg: 'bg-gradient-to-br from-red-600 to-rose-600',
  },
  'Incredible Hulk': {
    primaryColor: '#22c55e',
    buttonGradient: 'from-green-600 via-green-500 to-emerald-500',
    borderColor: 'border-green-500/60',
    glowColor: 'shadow-green-500/40',
    titleGradient: 'from-green-400 via-emerald-400 to-green-300',
    iconBg: 'bg-gradient-to-br from-green-600 to-emerald-600',
  },
  'Kryptonite': {
    primaryColor: '#a3e635',
    buttonGradient: 'from-lime-500 via-lime-400 to-green-400',
    borderColor: 'border-lime-500/60',
    glowColor: 'shadow-lime-500/40',
    titleGradient: 'from-lime-400 via-lime-300 to-green-400',
    iconBg: 'bg-gradient-to-br from-lime-500 to-green-500',
  },
  'Loch Ness Monster': {
    primaryColor: '#14b8a6',
    buttonGradient: 'from-teal-600 via-teal-500 to-cyan-500',
    borderColor: 'border-teal-500/60',
    glowColor: 'shadow-teal-500/40',
    titleGradient: 'from-teal-400 via-teal-300 to-cyan-400',
    iconBg: 'bg-gradient-to-br from-teal-600 to-cyan-600',
  },
  'Orange Crush': {
    primaryColor: '#f97316',
    buttonGradient: 'from-orange-600 via-orange-500 to-red-500',
    borderColor: 'border-orange-500/60',
    glowColor: 'shadow-orange-500/40',
    titleGradient: 'from-orange-400 via-orange-300 to-red-400',
    iconBg: 'bg-gradient-to-br from-orange-600 to-red-600',
  },
  'Pink Panther': {
    primaryColor: '#ec4899',
    buttonGradient: 'from-pink-600 via-pink-500 to-rose-500',
    borderColor: 'border-pink-500/60',
    glowColor: 'shadow-pink-500/40',
    titleGradient: 'from-pink-400 via-pink-300 to-rose-400',
    iconBg: 'bg-gradient-to-br from-pink-600 to-rose-600',
  },
  'Purple Rain': {
    primaryColor: '#a855f7',
    buttonGradient: 'from-purple-600 via-purple-500 to-violet-500',
    borderColor: 'border-purple-500/60',
    glowColor: 'shadow-purple-500/40',
    titleGradient: 'from-purple-400 via-violet-400 to-purple-300',
    iconBg: 'bg-gradient-to-br from-purple-600 to-violet-600',
  },
  'Hulkmania': {
    primaryColor: '#facc15',
    buttonGradient: 'from-yellow-500 via-yellow-400 to-lime-400',
    borderColor: 'border-yellow-500/60',
    glowColor: 'shadow-yellow-500/40',
    titleGradient: 'from-yellow-400 via-yellow-300 to-lime-400',
    iconBg: 'bg-gradient-to-br from-yellow-500 to-lime-500',
  },
};

// Level 9 sneaker data
const LEVEL_9_SNEAKERS = [
  { id: 1, name: 'Aqua Splash', fileName: 'Air Jordan 1 Aqua Splash.png', colorway: 'Aqua / White / Black', rarity: 'Legendary', xp: 5000 },
  { id: 2, name: 'Black Panther', fileName: 'Air Jordan 1 Black Panther.png', colorway: 'Black / Purple / Silver', rarity: 'Mythic', xp: 7500 },
  { id: 3, name: 'Bluey', fileName: 'Air Jordan 1 Bluey .png', colorway: 'Sky Blue / White', rarity: 'Legendary', xp: 5000 },
  { id: 4, name: 'Cool-Aid Orange', fileName: 'Air Jordan 1 Cool-Aid Orange.png', colorway: 'Orange / White', rarity: 'Epic', xp: 3500 },
  { id: 5, name: 'Crimson', fileName: 'Air Jordan 1 Crimson.png', colorway: 'Crimson Red / Black', rarity: 'Legendary', xp: 5000 },
  { id: 6, name: 'Incredible Hulk', fileName: 'Air Jordan 1 Incredible Hulk .png', colorway: 'Green / Purple', rarity: 'Mythic', xp: 7500 },
  { id: 7, name: 'Kryptonite', fileName: 'Air Jordan 1 Kyptionitepng.png', colorway: 'Neon Green / Black', rarity: 'Legendary', xp: 5000 },
  { id: 8, name: 'Loch Ness Monster', fileName: 'Air Jordan 1 Loch Ness Monster.png', colorway: 'Deep Sea Blue / Green', rarity: 'Mythic', xp: 7500 },
  { id: 9, name: 'Orange Crush', fileName: 'Air Jordan 1 Orange Crush.png', colorway: 'Orange / Black', rarity: 'Epic', xp: 3500 },
  { id: 10, name: 'Pink Panther', fileName: 'Air Jordan 1 Pink Pather.png', colorway: 'Hot Pink / White', rarity: 'Legendary', xp: 5000 },
  { id: 11, name: 'Purple Rain', fileName: 'air Jordan 1 purple rain v1.png', colorway: 'Purple / Gold', rarity: 'Mythic', xp: 7500 },
  { id: 12, name: 'Hulkmania', fileName: 'Air Jordan 1 rHulkmania.png', colorway: 'Yellow / Green', rarity: 'Legendary', xp: 5000 },
];

// Sneaker Card Component
function SneakerBadgeCard({ sneaker, index }: { sneaker: typeof LEVEL_9_SNEAKERS[0]; index: number }) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const theme = SNEAKER_THEMES[sneaker.name];
  const words = WORD_ASSOCIATIONS[sneaker.name] || [];

  useEffect(() => {
    // Load Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Bangers&family=Satisfy&family=Pacifico&family=Bebas+Neue&family=Oswald:wght@700&family=Anton&family=Righteous&family=Russo+One&family=Black+Ops+One&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    link.onload = () => setFontsLoaded(true);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  if (!theme) return null;

  return (
    <div
      className={`
        relative group cursor-pointer
        transform transition-all duration-500 ease-out
        ${isHovered ? 'scale-105 -translate-y-2' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Glow Effect on Hover */}
      <div 
        className={`
          absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100
          blur-xl transition-opacity duration-500
        `}
        style={{ background: theme.primaryColor }}
      />

      {/* Main Card */}
      <div 
        className={`
          relative overflow-hidden rounded-2xl
          border-2 ${theme.borderColor}
          bg-[#0d0d0d]
          shadow-2xl ${isHovered ? `shadow-xl ${theme.glowColor}` : ''}
          transition-all duration-300
        `}
      >
        {/* Interlocking Typography Background - NO GAPS - words packed tight */}
        <div className="absolute inset-0">
          {fontsLoaded && generateInterlockingTypography(words)}
        </div>

        {/* Top Color Bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-1 z-10"
          style={{ background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.primaryColor}88)` }}
        />

        {/* Level Badge */}
        <div className="absolute top-3 left-3 z-20">
          <div 
            className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-bold shadow-lg"
            style={{ background: theme.primaryColor }}
          >
            <Crown className="w-5 h-5" />
            <span>LEVEL 9</span>
          </div>
        </div>

        {/* Rarity Badge - moved to second row */}
        <div className="absolute top-14 left-3 z-20">
          <div 
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/60 backdrop-blur-sm border text-sm font-semibold"
            style={{ borderColor: `${theme.primaryColor}60`, color: theme.primaryColor }}
          >
            <Sparkles className="w-4 h-4" />
            {sneaker.rarity.toUpperCase()}
          </div>
        </div>

        {/* Badge Number - top right */}
        <div className="absolute top-3 right-3 z-20">
          <div 
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/60 backdrop-blur-sm border text-sm font-bold"
            style={{ borderColor: `${theme.primaryColor}60`, color: 'white' }}
          >
            <span style={{ color: theme.primaryColor }}>#</span>{sneaker.id}
          </div>
        </div>

        {/* Sneaker Image Container */}
        <div className="relative pt-14 pb-4 px-4 z-10">
          <div className={`
            relative w-full aspect-square flex items-center justify-center
            transition-transform duration-500
            ${isHovered ? 'scale-110 rotate-3' : ''}
          `}>
            {!imageError ? (
              <Image
                src={`/sneakers/Level 9/${encodeURIComponent(sneaker.fileName)}`}
                alt={`Air Jordan 1 ${sneaker.name}`}
                width={220}
                height={220}
                className="relative z-10 object-contain drop-shadow-2xl"
                onError={() => setImageError(true)}
                priority={index < 4}
              />
            ) : (
              <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                <span className="text-4xl">👟</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="relative px-5 pb-5 space-y-3 z-10">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm -mx-5" />
          
          <div className="relative z-10 space-y-3 pt-2">
            {/* Sneaker Name */}
            <div className="text-center">
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">
                Air Jordan 1
              </p>
              <h3 className={`
                text-xl font-black uppercase tracking-wide
                bg-gradient-to-r ${theme.titleGradient} bg-clip-text text-transparent
              `}>
                {sneaker.name}
              </h3>
            </div>

            {/* Colorway */}
            <p className="text-center text-gray-400 text-sm">
              {sneaker.colorway}
            </p>

            {/* XP Reward - Big and Eye-catching */}
            <div 
              className="text-center py-4 rounded-xl relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${theme.primaryColor}20, ${theme.primaryColor}40)` }}
            >
              <div 
                className="absolute inset-0 opacity-20"
                style={{ 
                  background: `radial-gradient(circle at 50% 50%, ${theme.primaryColor}, transparent 70%)`
                }}
              />
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-1 relative z-10">XP REWARD</p>
              <p 
                className="text-4xl font-black relative z-10 animate-pulse"
                style={{ 
                  color: theme.primaryColor,
                  textShadow: `0 0 20px ${theme.primaryColor}80, 0 0 40px ${theme.primaryColor}40`
                }}
              >
                +{sneaker.xp.toLocaleString()}
              </p>
              <p className="text-gray-500 text-[10px] uppercase mt-1 relative z-10">Points</p>
            </div>

            {/* Unlock Button */}
            <button className={`
              w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider
              bg-gradient-to-r ${theme.buttonGradient}
              text-white shadow-lg
              transform transition-all duration-300
              hover:shadow-xl hover:scale-[1.02]
              active:scale-[0.98]
            `}>
              <span className="flex items-center justify-center gap-2">
                <Star className="w-4 h-4" />
                Unlock Badge
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SneakerBadgesTestPage() {
  const [filter, setFilter] = useState<'all' | 'Epic' | 'Legendary' | 'Mythic'>('all');

  const filteredSneakers = filter === 'all' 
    ? LEVEL_9_SNEAKERS 
    : LEVEL_9_SNEAKERS.filter(s => s.rarity === filter);

  const rarityCount = {
    Epic: LEVEL_9_SNEAKERS.filter(s => s.rarity === 'Epic').length,
    Legendary: LEVEL_9_SNEAKERS.filter(s => s.rarity === 'Legendary').length,
    Mythic: LEVEL_9_SNEAKERS.filter(s => s.rarity === 'Mythic').length,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 via-transparent to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
              <Crown className="w-6 h-6 text-white" />
              <span className="text-white font-black text-xl uppercase tracking-wider">Level 9</span>
              <Crown className="w-6 h-6 text-white" />
            </div>
          </div>

          <h1 className="text-center text-5xl md:text-6xl font-black uppercase tracking-tight mb-4">
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Air Jordan 1
            </span>
            <br />
            <span className="text-white text-3xl md:text-4xl">Collection</span>
          </h1>

          <p className="text-center text-gray-500 text-lg max-w-2xl mx-auto mb-8">
            Unlock exclusive sneaker badges by reaching Level 9. 
            Each colorway represents a unique achievement in your basketball journey.
          </p>

          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <p className="text-4xl font-black text-white">{LEVEL_9_SNEAKERS.length}</p>
              <p className="text-gray-600 text-sm uppercase tracking-wider">Total Badges</p>
            </div>
            <div className="w-px bg-gray-800" />
            <div className="text-center">
              <p className="text-4xl font-black text-amber-400">{rarityCount.Legendary}</p>
              <p className="text-gray-600 text-sm uppercase tracking-wider">Legendary</p>
            </div>
            <div className="w-px bg-gray-800" />
            <div className="text-center">
              <p className="text-4xl font-black text-rose-400">{rarityCount.Mythic}</p>
              <p className="text-gray-600 text-sm uppercase tracking-wider">Mythic</p>
            </div>
          </div>

          <div className="flex justify-center gap-2 flex-wrap">
            {(['all', 'Epic', 'Legendary', 'Mythic'] as const).map((rarity) => (
              <button
                key={rarity}
                onClick={() => setFilter(rarity)}
                className={`
                  px-5 py-2.5 rounded-full font-bold text-sm uppercase tracking-wider
                  transition-all duration-300
                  ${filter === rarity
                    ? rarity === 'all'
                      ? 'bg-white text-black'
                      : rarity === 'Epic'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                        : rarity === 'Legendary'
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white'
                          : 'bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white'
                    : 'bg-[#1a1a1a] text-gray-500 hover:bg-[#252525] hover:text-white'
                  }
                `}
              >
                {rarity === 'all' ? 'All Badges' : rarity}
                {rarity !== 'all' && (
                  <span className="ml-2 opacity-70">({rarityCount[rarity as keyof typeof rarityCount]})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sneaker Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSneakers.map((sneaker, index) => (
            <SneakerBadgeCard key={sneaker.id} sneaker={sneaker} index={index} />
          ))}
        </div>

        {filteredSneakers.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">No badges found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
