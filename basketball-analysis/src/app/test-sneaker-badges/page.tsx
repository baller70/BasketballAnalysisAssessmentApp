'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Trophy, Star, Zap, Crown, Sparkles } from 'lucide-react';

/**
 * Level 9 Sneaker Badge Test Page
 * 
 * Displays Air Jordan 1 sneaker collection in vertical card layout
 * for badge/achievement system preview.
 * 
 * Each card has a subtle thematic background based on the sneaker's
 * name and colorway to complement the circular logo.
 */

// Thematic background configurations based on sneaker name/colorway
const BACKGROUND_THEMES: Record<string, {
  gradient: string;
  pattern?: string;
  overlay?: string;
  accent?: string;
}> = {
  'Aqua Splash': {
    // Water/ocean theme - subtle waves and aqua tones
    gradient: 'bg-gradient-to-br from-cyan-900/20 via-teal-900/10 to-blue-900/20',
    pattern: 'radial-gradient(ellipse at 30% 20%, rgba(34, 211, 238, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(6, 182, 212, 0.06) 0%, transparent 50%)',
    accent: 'rgba(34, 211, 238, 0.15)',
  },
  'Black Panther': {
    // Wakanda vibes - dark with purple/silver accents
    gradient: 'bg-gradient-to-br from-purple-900/25 via-slate-900/20 to-violet-900/20',
    pattern: 'radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.12) 0%, transparent 60%), linear-gradient(180deg, rgba(192, 192, 192, 0.03) 0%, transparent 30%)',
    accent: 'rgba(139, 92, 246, 0.2)',
  },
  'Bluey': {
    // Playful sky blue - clouds and light
    gradient: 'bg-gradient-to-br from-sky-900/20 via-blue-900/15 to-cyan-900/15',
    pattern: 'radial-gradient(circle at 20% 30%, rgba(56, 189, 248, 0.1) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(125, 211, 252, 0.08) 0%, transparent 40%)',
    accent: 'rgba(56, 189, 248, 0.15)',
  },
  'Cool-Aid Orange': {
    // Refreshing orange drink vibes - citrus burst
    gradient: 'bg-gradient-to-br from-orange-900/25 via-amber-900/15 to-yellow-900/10',
    pattern: 'radial-gradient(ellipse at 60% 20%, rgba(251, 146, 60, 0.12) 0%, transparent 50%), radial-gradient(circle at 30% 80%, rgba(253, 186, 116, 0.08) 0%, transparent 40%)',
    accent: 'rgba(251, 146, 60, 0.2)',
  },
  'Crimson': {
    // Deep red intensity - blood red elegance
    gradient: 'bg-gradient-to-br from-red-900/25 via-rose-900/15 to-red-950/20',
    pattern: 'radial-gradient(ellipse at 50% 30%, rgba(220, 38, 38, 0.1) 0%, transparent 50%), linear-gradient(180deg, rgba(127, 29, 29, 0.1) 0%, transparent 50%)',
    accent: 'rgba(220, 38, 38, 0.15)',
  },
  'Incredible Hulk': {
    // Gamma radiation - green and purple energy
    gradient: 'bg-gradient-to-br from-green-900/25 via-emerald-900/15 to-purple-900/20',
    pattern: 'radial-gradient(ellipse at 40% 20%, rgba(34, 197, 94, 0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)',
    accent: 'rgba(34, 197, 94, 0.2)',
  },
  'Kryptonite': {
    // Superman's weakness - glowing green radioactive
    gradient: 'bg-gradient-to-br from-lime-900/25 via-green-900/20 to-emerald-950/20',
    pattern: 'radial-gradient(ellipse at 50% 50%, rgba(163, 230, 53, 0.15) 0%, transparent 60%), radial-gradient(circle at 30% 70%, rgba(132, 204, 22, 0.08) 0%, transparent 40%)',
    accent: 'rgba(163, 230, 53, 0.2)',
  },
  'Loch Ness Monster': {
    // Deep mysterious waters - dark teal and murky depths
    gradient: 'bg-gradient-to-br from-teal-900/25 via-slate-900/20 to-cyan-950/25',
    pattern: 'radial-gradient(ellipse at 50% 80%, rgba(20, 184, 166, 0.1) 0%, transparent 50%), linear-gradient(180deg, rgba(15, 23, 42, 0.3) 0%, transparent 50%)',
    accent: 'rgba(20, 184, 166, 0.15)',
  },
  'Orange Crush': {
    // Soda crush - fizzy orange bubbles
    gradient: 'bg-gradient-to-br from-orange-900/30 via-red-900/15 to-amber-900/20',
    pattern: 'radial-gradient(circle at 25% 25%, rgba(249, 115, 22, 0.12) 0%, transparent 35%), radial-gradient(circle at 75% 75%, rgba(234, 88, 12, 0.1) 0%, transparent 35%)',
    accent: 'rgba(249, 115, 22, 0.2)',
  },
  'Pink Panther': {
    // Smooth and sleek - pink elegance with style
    gradient: 'bg-gradient-to-br from-pink-900/25 via-rose-900/15 to-fuchsia-900/20',
    pattern: 'radial-gradient(ellipse at 60% 30%, rgba(236, 72, 153, 0.1) 0%, transparent 50%), radial-gradient(ellipse at 30% 70%, rgba(244, 114, 182, 0.08) 0%, transparent 40%)',
    accent: 'rgba(236, 72, 153, 0.15)',
  },
  'Purple Rain': {
    // Prince tribute - purple with golden rain drops
    gradient: 'bg-gradient-to-br from-purple-900/30 via-violet-900/20 to-indigo-900/25',
    pattern: 'radial-gradient(ellipse at 50% 20%, rgba(147, 51, 234, 0.15) 0%, transparent 50%), linear-gradient(180deg, rgba(234, 179, 8, 0.05) 0%, transparent 30%)',
    accent: 'rgba(147, 51, 234, 0.2)',
  },
  'Hulkmania': {
    // Wrestling energy - yellow and green power
    gradient: 'bg-gradient-to-br from-yellow-900/25 via-lime-900/15 to-green-900/20',
    pattern: 'radial-gradient(ellipse at 40% 30%, rgba(250, 204, 21, 0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(132, 204, 22, 0.1) 0%, transparent 50%)',
    accent: 'rgba(250, 204, 21, 0.2)',
  },
};

// Level 9 sneaker data
const LEVEL_9_SNEAKERS = [
  {
    id: 1,
    name: 'Aqua Splash',
    fileName: 'Air Jordan 1 Aqua Splash.png',
    colorway: 'Aqua / White / Black',
    rarity: 'Legendary',
    xp: 5000,
  },
  {
    id: 2,
    name: 'Black Panther',
    fileName: 'Air Jordan 1 Black Panther.png',
    colorway: 'Black / Purple / Silver',
    rarity: 'Mythic',
    xp: 7500,
  },
  {
    id: 3,
    name: 'Bluey',
    fileName: 'Air Jordan 1 Bluey .png',
    colorway: 'Sky Blue / White',
    rarity: 'Legendary',
    xp: 5000,
  },
  {
    id: 4,
    name: 'Cool-Aid Orange',
    fileName: 'Air Jordan 1 Cool-Aid Orange.png',
    colorway: 'Orange / White',
    rarity: 'Epic',
    xp: 3500,
  },
  {
    id: 5,
    name: 'Crimson',
    fileName: 'Air Jordan 1 Crimson.png',
    colorway: 'Crimson Red / Black',
    rarity: 'Legendary',
    xp: 5000,
  },
  {
    id: 6,
    name: 'Incredible Hulk',
    fileName: 'Air Jordan 1 Incredible Hulk .png',
    colorway: 'Green / Purple',
    rarity: 'Mythic',
    xp: 7500,
  },
  {
    id: 7,
    name: 'Kryptonite',
    fileName: 'Air Jordan 1 Kyptionitepng.png',
    colorway: 'Neon Green / Black',
    rarity: 'Legendary',
    xp: 5000,
  },
  {
    id: 8,
    name: 'Loch Ness Monster',
    fileName: 'Air Jordan 1 Locness Monster.png',
    colorway: 'Deep Sea Blue / Green',
    rarity: 'Mythic',
    xp: 7500,
  },
  {
    id: 9,
    name: 'Orange Crush',
    fileName: 'Air Jordan 1 Orange Crush.png',
    colorway: 'Orange / Black',
    rarity: 'Epic',
    xp: 3500,
  },
  {
    id: 10,
    name: 'Pink Panther',
    fileName: 'Air Jordan 1 Pink Pather.png',
    colorway: 'Hot Pink / White',
    rarity: 'Legendary',
    xp: 5000,
  },
  {
    id: 11,
    name: 'Purple Rain',
    fileName: 'air Jordan 1 purple rain v1.png',
    colorway: 'Purple / Gold',
    rarity: 'Mythic',
    xp: 7500,
  },
  {
    id: 12,
    name: 'Hulkmania',
    fileName: 'Air Jordan 1 rHulkmania.png',
    colorway: 'Yellow / Green',
    rarity: 'Legendary',
    xp: 5000,
  },
];

// Rarity colors and effects
const RARITY_CONFIG = {
  Epic: {
    gradient: 'from-purple-600 via-purple-500 to-indigo-600',
    border: 'border-purple-500/50',
    glow: 'shadow-purple-500/30',
    badge: 'bg-purple-500',
    textColor: 'text-purple-400',
  },
  Legendary: {
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    border: 'border-amber-500/50',
    glow: 'shadow-amber-500/30',
    badge: 'bg-gradient-to-r from-amber-500 to-yellow-500',
    textColor: 'text-amber-400',
  },
  Mythic: {
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
    border: 'border-rose-500/50',
    glow: 'shadow-rose-500/30',
    badge: 'bg-gradient-to-r from-rose-500 to-fuchsia-500',
    textColor: 'text-rose-400',
  },
};

// Sneaker Card Component
function SneakerBadgeCard({ sneaker, index }: { sneaker: typeof LEVEL_9_SNEAKERS[0]; index: number }) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const rarity = RARITY_CONFIG[sneaker.rarity as keyof typeof RARITY_CONFIG];
  const theme = BACKGROUND_THEMES[sneaker.name] || BACKGROUND_THEMES['Aqua Splash'];

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
      {/* Glow Effect */}
      <div className={`
        absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100
        bg-gradient-to-r ${rarity.gradient} blur-xl
        transition-opacity duration-500
      `} />

      {/* Main Card */}
      <div className={`
        relative overflow-hidden rounded-2xl
        border-2 ${rarity.border}
        shadow-2xl ${isHovered ? `shadow-xl ${rarity.glow}` : ''}
        transition-all duration-300
      `}>
        {/* Thematic Background Layer */}
        <div className={`absolute inset-0 ${theme.gradient}`} />
        
        {/* Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-100"
          style={{ background: theme.pattern }}
        />
        
        {/* Subtle Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />

        {/* Rarity Banner */}
        <div className={`
          absolute top-0 left-0 right-0 h-1
          bg-gradient-to-r ${rarity.gradient}
        `} />

        {/* Level Badge */}
        <div className="absolute top-3 left-3 z-10">
          <div className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full
            ${rarity.badge} text-white text-xs font-bold
            shadow-lg backdrop-blur-sm
          `}>
            <Crown className="w-3.5 h-3.5" />
            <span>LEVEL 9</span>
          </div>
        </div>

        {/* Rarity Badge */}
        <div className="absolute top-3 right-3 z-10">
          <div className={`
            flex items-center gap-1 px-2.5 py-1 rounded-full
            bg-black/60 backdrop-blur-sm border ${rarity.border}
            text-xs font-semibold ${rarity.textColor}
          `}>
            <Sparkles className="w-3 h-3" />
            {sneaker.rarity.toUpperCase()}
          </div>
        </div>

        {/* Sneaker Image Container */}
        <div className="relative pt-14 pb-4 px-4">
          <div className={`
            relative w-full aspect-square flex items-center justify-center
            transition-transform duration-500
            ${isHovered ? 'scale-110 rotate-3' : ''}
          `}>
            {/* Accent Glow Behind Sneaker */}
            <div 
              className="absolute inset-0 rounded-full blur-3xl opacity-50"
              style={{ background: `radial-gradient(circle, ${theme.accent} 0%, transparent 70%)` }}
            />
            
            {!imageError ? (
              <Image
                src={`/sneakers/Level 9/${encodeURIComponent(sneaker.fileName)}`}
                alt={`Air Jordan 1 ${sneaker.name}`}
                width={280}
                height={280}
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

        {/* Content Section - with frosted glass effect */}
        <div className="relative px-5 pb-5 space-y-3">
          {/* Frosted background for text readability */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm -mx-5" />
          
          <div className="relative z-10 space-y-3 pt-2">
            {/* Sneaker Name */}
            <div className="text-center">
              <p className="text-[#888] text-xs uppercase tracking-widest mb-1">
                Air Jordan 1
              </p>
              <h3 className={`
                text-xl font-black uppercase tracking-wide
                bg-gradient-to-r ${rarity.gradient} bg-clip-text text-transparent
              `}>
                {sneaker.name}
              </h3>
            </div>

            {/* Colorway */}
            <p className="text-center text-[#aaa] text-sm">
              {sneaker.colorway}
            </p>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />

            {/* Stats Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center
                  bg-gradient-to-br ${rarity.gradient}
                `}>
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-[#888] text-[10px] uppercase">XP Reward</p>
                  <p className="text-white font-bold text-sm">+{sneaker.xp.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div>
                  <p className="text-[#888] text-[10px] uppercase text-right">Badge #</p>
                  <p className="text-white font-bold text-sm text-right">#{sneaker.id.toString().padStart(3, '0')}</p>
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 backdrop-blur-sm">
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>
              </div>
            </div>

            {/* Unlock Button */}
            <button className={`
              w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider
              bg-gradient-to-r ${rarity.gradient}
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
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 via-transparent to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          {/* Level Badge */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
              <Crown className="w-6 h-6 text-white" />
              <span className="text-white font-black text-xl uppercase tracking-wider">Level 9</span>
              <Crown className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-center text-5xl md:text-6xl font-black uppercase tracking-tight mb-4">
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Air Jordan 1
            </span>
            <br />
            <span className="text-white text-3xl md:text-4xl">Collection</span>
          </h1>

          <p className="text-center text-[#888] text-lg max-w-2xl mx-auto mb-8">
            Unlock exclusive sneaker badges by reaching Level 9. 
            Each colorway represents a unique achievement in your basketball journey.
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <p className="text-4xl font-black text-white">{LEVEL_9_SNEAKERS.length}</p>
              <p className="text-[#666] text-sm uppercase tracking-wider">Total Badges</p>
            </div>
            <div className="w-px bg-gray-800" />
            <div className="text-center">
              <p className="text-4xl font-black text-amber-400">{rarityCount.Legendary}</p>
              <p className="text-[#666] text-sm uppercase tracking-wider">Legendary</p>
            </div>
            <div className="w-px bg-gray-800" />
            <div className="text-center">
              <p className="text-4xl font-black text-rose-400">{rarityCount.Mythic}</p>
              <p className="text-[#666] text-sm uppercase tracking-wider">Mythic</p>
            </div>
          </div>

          {/* Filter Tabs */}
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
                      : `bg-gradient-to-r ${RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG]?.gradient || ''} text-white`
                    : 'bg-[#1a1a1a] text-[#888] hover:bg-[#252525] hover:text-white'
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
            <p className="text-[#666] text-lg">No badges found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
