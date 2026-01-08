'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Trophy, Star, Zap, Crown, Sparkles } from 'lucide-react';

/**
 * Level 9 Sneaker Badge Test Page
 * 
 * Displays Air Jordan 1 sneaker collection in vertical card layout
 * for badge/achievement system preview.
 */

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
        bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d]
        border-2 ${rarity.border}
        shadow-2xl ${isHovered ? `shadow-xl ${rarity.glow}` : ''}
        transition-all duration-300
      `}>
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
            shadow-lg
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
            {/* Radial Glow Behind Sneaker */}
            <div className={`
              absolute inset-0 rounded-full opacity-30
              bg-gradient-radial ${rarity.gradient} blur-2xl
            `} />
            
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

        {/* Content Section */}
        <div className="px-5 pb-5 space-y-3">
          {/* Sneaker Name */}
          <div className="text-center">
            <p className="text-[#666] text-xs uppercase tracking-widest mb-1">
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
          <p className="text-center text-[#888] text-sm">
            {sneaker.colorway}
          </p>

          {/* Divider */}
          <div className={`h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent`} />

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
                <p className="text-[#666] text-[10px] uppercase">XP Reward</p>
                <p className="text-white font-bold text-sm">+{sneaker.xp.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div>
                <p className="text-[#666] text-[10px] uppercase text-right">Badge #</p>
                <p className="text-white font-bold text-sm text-right">#{sneaker.id.toString().padStart(3, '0')}</p>
              </div>
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center
                bg-gradient-to-br from-gray-700 to-gray-800
              `}>
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
