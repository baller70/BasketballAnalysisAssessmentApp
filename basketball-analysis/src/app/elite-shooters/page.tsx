"use client"

import React, { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import { ALL_ELITE_SHOOTERS, TIER_LABELS, TIER_COLORS, POSITION_LABELS, LEAGUE_LABELS, LEAGUE_COLORS, type EliteShooter, type ShooterTier, type Position } from "@/data/eliteShooters"
import { Users, Ruler, Zap, Search, ChevronDown, ArrowUpDown, RotateCcw, HelpCircle, X, Camera, ImageOff, Settings } from "lucide-react"
import Link from "next/link"
import PlayerBioPopup from "@/components/PlayerBioPopup"
import ShootingFormGallery from "@/components/ShootingFormGallery"

// Helper to format height from inches to feet/inches
const formatHeight = (inches: number) => {
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${feet}'${remainingInches}"`;
};

// Calculate WSI (Weighted Shooting Index) for a player
const calculateWSI = (shooter: EliteShooter): number => {
  const threePct = shooter.careerPct || 0;
  const ftPct = shooter.careerFreeThrowPct || 0;
  const estimatedMidRange = ftPct * 0.55;
  const estimatedRim = Math.min(70, ftPct * 0.75 + 10);
  const wsi = (0.45 * threePct) + (0.35 * estimatedMidRange) + (0.15 * ftPct) + (0.05 * estimatedRim);
  return Math.round(wsi * 10) / 10;
};

// Get era category from era string
const getEraCategory = (era: string): string => {
  const years = era.match(/\d{4}/g);
  if (!years || years.length === 0) return 'Unknown';
  const startYear = parseInt(years[0]);
  if (era.includes('Present') || startYear >= 2020) return '2020s';
  if (startYear >= 2010) return '2010s';
  if (startYear >= 2000) return '2000s';
  if (startYear >= 1990) return '1990s';
  if (startYear >= 1980) return '1980s';
  if (startYear >= 1970) return '1970s';
  return 'Classic';
};

// Mock user profile for similarity comparison
const USER_PROFILE = {
  height: 75, weight: 195, wingspan: 79,
  measurements: { shoulderAngle: 170, elbowAngle: 90, hipAngle: 172, kneeAngle: 145, ankleAngle: 88, releaseHeight: 108, releaseAngle: 52, entryAngle: 46 }
};

// Calculate similarity score
const calculateSimilarity = (shooter: EliteShooter): number => {
  const weights = { height: 0.15, wingspan: 0.15, weight: 0.10, elbowAngle: 0.15, releaseAngle: 0.12, kneeAngle: 0.10, releaseHeight: 0.10, shoulderAngle: 0.08, entryAngle: 0.05 };
  const heightDiff = Math.abs(shooter.height - USER_PROFILE.height) / 20;
  const wingspanDiff = Math.abs(shooter.wingspan - USER_PROFILE.wingspan) / 20;
  const weightDiff = Math.abs(shooter.weight - USER_PROFILE.weight) / 100;
  const elbowDiff = Math.abs(shooter.measurements.elbowAngle - USER_PROFILE.measurements.elbowAngle) / 30;
  const releaseDiff = Math.abs(shooter.measurements.releaseAngle - USER_PROFILE.measurements.releaseAngle) / 20;
  const kneeDiff = Math.abs(shooter.measurements.kneeAngle - USER_PROFILE.measurements.kneeAngle) / 30;
  const releaseHeightDiff = Math.abs(shooter.measurements.releaseHeight - USER_PROFILE.measurements.releaseHeight) / 20;
  const shoulderDiff = Math.abs(shooter.measurements.shoulderAngle - USER_PROFILE.measurements.shoulderAngle) / 20;
  const entryDiff = Math.abs(shooter.measurements.entryAngle - USER_PROFILE.measurements.entryAngle) / 15;
  const similarity = 1 - (heightDiff * weights.height + wingspanDiff * weights.wingspan + weightDiff * weights.weight + elbowDiff * weights.elbowAngle + releaseDiff * weights.releaseAngle + kneeDiff * weights.kneeAngle + releaseHeightDiff * weights.releaseHeight + shoulderDiff * weights.shoulderAngle + entryDiff * weights.entryAngle);
  return Math.max(0, Math.min(100, Math.round(similarity * 100)));
};

// Filter options
const TIER_OPTIONS: ShooterTier[] = ['legendary', 'elite', 'great', 'good', 'mid_level', 'bad'];
const LEAGUE_OPTIONS: EliteShooter['league'][] = ['NBA', 'WNBA', 'NCAA_MEN', 'NCAA_WOMEN', 'TOP_COLLEGE'];
const POSITION_OPTIONS: Position[] = ['POINT_GUARD', 'SHOOTING_GUARD', 'SMALL_FORWARD', 'POWER_FORWARD', 'CENTER', 'GUARD', 'FORWARD'];
const ERA_OPTIONS = ['2020s', '2010s', '2000s', '1990s', '1980s', '1970s', 'Classic'];

type SortOption = 'similarity' | 'name_asc' | 'name_desc' | 'threePct_desc' | 'threePct_asc' | 'ftPct_desc' | 'ftPct_asc' | 'wsi_desc' | 'wsi_asc' | 'score_desc' | 'tier_best' | 'tier_worst';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'similarity', label: 'Form Similarity' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'threePct_desc', label: '3PT% (High to Low)' },
  { value: 'threePct_asc', label: '3PT% (Low to High)' },
  { value: 'ftPct_desc', label: 'FT% (High to Low)' },
  { value: 'ftPct_asc', label: 'FT% (Low to High)' },
  { value: 'wsi_desc', label: 'WSI (High to Low)' },
  { value: 'wsi_asc', label: 'WSI (Low to High)' },
  { value: 'score_desc', label: 'Overall Score (High to Low)' },
  { value: 'tier_best', label: 'Tier (Best to Worst)' },
  { value: 'tier_worst', label: 'Tier (Worst to Best)' },
];

const TIER_ORDER: Record<ShooterTier, number> = { legendary: 1, elite: 2, great: 3, good: 4, mid_level: 5, bad: 6 };

// WSI Info Popup Component
const WSIInfoPopup = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/30 shadow-2xl" onClick={e => e.stopPropagation()}>
      <div className="p-6 border-b border-purple-500/30 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-purple-400">Weighted Shooting Index (WSI)</h2>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
      <div className="p-6 space-y-6">
        {/* Formula */}
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-purple-500/20">
          <h3 className="text-purple-300 font-semibold mb-2">The Formula</h3>
          <p className="text-white font-mono text-lg">WSI = (0.45 × 3P%) + (0.35 × Mid-Range%) + (0.15 × FT%) + (0.05 × Rim%)</p>
        </div>
        
        {/* Explanation */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold text-lg">What Each Component Means</h3>
          <div className="grid gap-3">
            <div className="flex items-start gap-3 bg-green-500/10 rounded-lg p-3 border border-green-500/20">
              <span className="bg-green-500 text-black font-bold text-xs px-2 py-1 rounded">45%</span>
              <div>
                <p className="text-green-400 font-semibold">3-Point Percentage</p>
                <p className="text-[#888] text-sm">The primary indicator of modern shooting skill. Heavily weighted because it&apos;s the most valuable shot in today&apos;s game.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
              <span className="bg-yellow-500 text-black font-bold text-xs px-2 py-1 rounded">35%</span>
              <div>
                <p className="text-yellow-400 font-semibold">Mid-Range Percentage</p>
                <p className="text-[#888] text-sm">Captures &quot;touch&quot; and ability to hit pull-ups. Shows versatility and shot-making ability from different distances.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
              <span className="bg-blue-500 text-black font-bold text-xs px-2 py-1 rounded">15%</span>
              <div>
                <p className="text-blue-400 font-semibold">Free Throw Percentage</p>
                <p className="text-[#888] text-sm">The purest measure of shooting mechanics. No defense, same distance every time - shows true form consistency.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-gray-500/10 rounded-lg p-3 border border-gray-500/20">
              <span className="bg-gray-500 text-white font-bold text-xs px-2 py-1 rounded">5%</span>
              <div>
                <p className="text-gray-400 font-semibold">Rim Percentage</p>
                <p className="text-[#888] text-sm">Minimized to just 5%. A player gets a small boost for finishing well, but rim-runners who can&apos;t shoot will still score low.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tier Thresholds */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold text-lg">WSI Tier Thresholds</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#FFD70020', border: '1px solid #FFD70060' }}>
              <p className="text-[#FFD700] font-bold">LEGENDARY</p>
              <p className="text-white text-lg font-mono">50+</p>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#C0C0C020', border: '1px solid #C0C0C060' }}>
              <p className="text-[#C0C0C0] font-bold">ELITE</p>
              <p className="text-white text-lg font-mono">45-49</p>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#CD7F3220', border: '1px solid #CD7F3260' }}>
              <p className="text-[#CD7F32] font-bold">GREAT</p>
              <p className="text-white text-lg font-mono">40-44</p>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#4A90D920', border: '1px solid #4A90D960' }}>
              <p className="text-[#4A90D9] font-bold">GOOD</p>
              <p className="text-white text-lg font-mono">35-39</p>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#80808020', border: '1px solid #80808060' }}>
              <p className="text-[#808080] font-bold">MID-LEVEL</p>
              <p className="text-white text-lg font-mono">28-34</p>
            </div>
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#8B000020', border: '1px solid #8B000060' }}>
              <p className="text-[#ff4444] font-bold">BAD</p>
              <p className="text-white text-lg font-mono">&lt;28</p>
            </div>
          </div>
        </div>

        <p className="text-[#666] text-sm text-center">This formula ensures that true shooters are rated highly, while players who primarily score at the rim are rated appropriately for their shooting ability.</p>
      </div>
    </div>
  </div>
);

// Dropdown Filter Component
const FilterDropdown = ({ 
  label, 
  options, 
  selected, 
  onSelect, 
  getLabel,
  getColor
}: { 
  label: string; 
  options: string[]; 
  selected: string[]; 
  onSelect: (value: string) => void;
  getLabel?: (value: string) => string;
  getColor?: (value: string) => string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
          selected.length > 0 
            ? 'bg-[#FFD700]/20 border-[#FFD700]/50 text-[#FFD700]' 
            : 'bg-[#1a1a1a] border-[#3a3a3a] text-white hover:border-[#FFD700]/30'
        }`}
      >
        <span className="font-medium">{label}</span>
        {selected.length > 0 && (
          <span className="bg-[#FFD700] text-black text-xs font-bold px-1.5 py-0.5 rounded-full">{selected.length}</span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg shadow-xl z-50 min-w-[180px] py-2 max-h-[300px] overflow-y-auto">
            {options.map(option => {
              const isSelected = selected.includes(option);
              const displayLabel = getLabel ? getLabel(option) : option;
              const color = getColor ? getColor(option) : null;
              
              return (
                <button
                  key={option}
                  onClick={() => { onSelect(option); }}
                  className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-[#3a3a3a] transition-colors ${
                    isSelected ? 'bg-[#FFD700]/10' : ''
                  }`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    isSelected ? 'border-[#FFD700] bg-[#FFD700]' : 'border-[#666]'
                  }`}>
                    {isSelected && <span className="text-black text-xs">✓</span>}
                  </div>
                  {color && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />}
                  <span className={isSelected ? 'text-[#FFD700]' : 'text-white'}>{displayLabel}</span>
                </button>
              );
            })}
            {selected.length > 0 && (
              <button
                onClick={() => { options.forEach(o => { if (selected.includes(o)) onSelect(o); }); }}
                className="w-full px-4 py-2 text-left text-[#888] hover:text-white hover:bg-[#3a3a3a] border-t border-[#3a3a3a] mt-1"
              >
                Clear all
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default function EliteShootersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTiers, setSelectedTiers] = useState<ShooterTier[]>([]);
  const [selectedLeagues, setSelectedLeagues] = useState<EliteShooter['league'][]>([]);
  const [selectedPositions, setSelectedPositions] = useState<Position[]>([]);
  const [selectedEras, setSelectedEras] = useState<string[]>([]);
  const [threePctRange, setThreePctRange] = useState<[number, number]>([0, 50]);
  const [ftPctRange, setFtPctRange] = useState<[number, number]>([0, 100]);
  const [wsiRange, setWsiRange] = useState<[number, number]>([0, 60]);
  const [sortBy, setSortBy] = useState<SortOption>('similarity');
  const [selectedPlayer, setSelectedPlayer] = useState<(EliteShooter & { wsi: number; similarity: number; eraCategory: string }) | null>(null);
  const [showWSIInfo, setShowWSIInfo] = useState(false);
  const [shootingFormPlayer, setShootingFormPlayer] = useState<(EliteShooter & { wsi: number; similarity: number; eraCategory: string }) | null>(null);
  const [approvedImages, setApprovedImages] = useState<Record<number, string[]>>({});
  const [excludedImages, setExcludedImages] = useState<Record<number, string[]>>({});

  // Load approved and excluded images from localStorage on mount
  useEffect(() => {
    const approvedKey = 'approved_shooting_forms';
    const stored = localStorage.getItem(approvedKey);
    if (stored) {
      try {
        setApprovedImages(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load approved images:', e);
      }
    }
    
    const excludedKey = 'excluded_shooting_forms';
    const storedExcluded = localStorage.getItem(excludedKey);
    if (storedExcluded) {
      try {
        setExcludedImages(JSON.parse(storedExcluded));
      } catch (e) {
        console.error('Failed to load excluded images:', e);
      }
    }
  }, []);
  
  // Helper to get total shooting form images count (database + approved - excluded)
  const getShootingFormCount = (shooter: EliteShooter): number => {
    // Get database images, filtering out excluded ones
    const excluded = excludedImages[shooter.id] || [];
    const dbImages = (shooter.shootingFormImages || []).filter(url => !excluded.includes(url));
    const approved = approvedImages[shooter.id] || [];
    // Combine and deduplicate
    const allImages = [...new Set([...dbImages, ...approved])];
    return allImages.length;
  };

  const processedShooters = useMemo(() => {
    return ALL_ELITE_SHOOTERS.map(shooter => ({
      ...shooter,
      similarity: calculateSimilarity(shooter),
      wsi: calculateWSI(shooter),
      eraCategory: getEraCategory(shooter.era),
    }));
  }, []);

  const filteredShooters = useMemo(() => {
    let result = processedShooters;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(query) || s.team.toLowerCase().includes(query));
    }
    if (selectedTiers.length > 0) result = result.filter(s => selectedTiers.includes(s.tier));
    if (selectedLeagues.length > 0) result = result.filter(s => selectedLeagues.includes(s.league));
    if (selectedPositions.length > 0) result = result.filter(s => selectedPositions.includes(s.position));
    if (selectedEras.length > 0) result = result.filter(s => selectedEras.includes(s.eraCategory));
    result = result.filter(s => (s.careerPct || 0) >= threePctRange[0] && (s.careerPct || 0) <= threePctRange[1]);
    result = result.filter(s => (s.careerFreeThrowPct || 0) >= ftPctRange[0] && (s.careerFreeThrowPct || 0) <= ftPctRange[1]);
    result = result.filter(s => s.wsi >= wsiRange[0] && s.wsi <= wsiRange[1]);

    switch (sortBy) {
      case 'similarity': result.sort((a, b) => b.similarity - a.similarity); break;
      case 'name_asc': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name_desc': result.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'threePct_desc': result.sort((a, b) => (b.careerPct || 0) - (a.careerPct || 0)); break;
      case 'threePct_asc': result.sort((a, b) => (a.careerPct || 0) - (b.careerPct || 0)); break;
      case 'ftPct_desc': result.sort((a, b) => b.careerFreeThrowPct - a.careerFreeThrowPct); break;
      case 'ftPct_asc': result.sort((a, b) => a.careerFreeThrowPct - b.careerFreeThrowPct); break;
      case 'wsi_desc': result.sort((a, b) => b.wsi - a.wsi); break;
      case 'wsi_asc': result.sort((a, b) => a.wsi - b.wsi); break;
      case 'score_desc': result.sort((a, b) => b.overallScore - a.overallScore); break;
      case 'tier_best': result.sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]); break;
      case 'tier_worst': result.sort((a, b) => TIER_ORDER[b.tier] - TIER_ORDER[a.tier]); break;
    }
    return result;
  }, [processedShooters, searchQuery, selectedTiers, selectedLeagues, selectedPositions, selectedEras, threePctRange, ftPctRange, wsiRange, sortBy]);

  const threePtRanks = useMemo(() => {
    const ranks = new Map<number, number>();
    const sorted = [...filteredShooters].filter(s => s.careerPct != null).sort((a, b) => (b.careerPct ?? 0) - (a.careerPct ?? 0));
    sorted.forEach((shooter, idx) => ranks.set(shooter.id, idx + 1));
    return ranks;
  }, [filteredShooters]);

  const ftRanks = useMemo(() => {
    const ranks = new Map<number, number>();
    const sorted = [...filteredShooters].sort((a, b) => b.careerFreeThrowPct - a.careerFreeThrowPct);
    sorted.forEach((shooter, idx) => ranks.set(shooter.id, idx + 1));
    return ranks;
  }, [filteredShooters]);

  const resetFilters = () => {
    setSearchQuery(''); setSelectedTiers([]); setSelectedLeagues([]); setSelectedPositions([]); setSelectedEras([]);
    setThreePctRange([0, 50]); setFtPctRange([0, 100]); setWsiRange([0, 60]); setSortBy('similarity');
  };

  const hasActiveFilters = searchQuery || selectedTiers.length > 0 || selectedLeagues.length > 0 || 
    selectedPositions.length > 0 || selectedEras.length > 0 || 
    threePctRange[0] > 0 || threePctRange[1] < 50 || ftPctRange[0] > 0 || ftPctRange[1] < 100 || wsiRange[0] > 0 || wsiRange[1] < 60;

  const toggleTier = (tier: ShooterTier) => setSelectedTiers(prev => prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]);
  const toggleLeague = (league: EliteShooter['league']) => setSelectedLeagues(prev => prev.includes(league) ? prev.filter(l => l !== league) : [...prev, league]);
  const togglePosition = (position: Position) => setSelectedPositions(prev => prev.includes(position) ? prev.filter(p => p !== position) : [...prev, position]);
  const toggleEra = (era: string) => setSelectedEras(prev => prev.includes(era) ? prev.filter(e => e !== era) : [...prev, era]);

  return (
    <main className="min-h-[calc(100vh-200px)] py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="bg-[#2C2C2C] rounded-lg overflow-hidden shadow-lg">
          {/* Header */}
          <div className="p-6 border-b border-[#3a3a3a]">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-7 h-7 text-[#FFD700]" />
                  <h1 className="text-2xl font-bold text-[#FFD700] uppercase tracking-wider">ELITE SHOOTERS DATABASE</h1>
                </div>
                <p className="text-[#E5E5E5]">Reference database of basketball players across all skill levels.</p>
                <p className="text-[#888] text-sm mt-1">
                  Showing <span className="text-[#FFD700] font-bold">{filteredShooters.length}</span> of {processedShooters.length} players
                  {hasActiveFilters && <span className="text-[#FFD700]"> (filtered)</span>}
                </p>
              </div>
              <Link 
                href="/admin/shooting-forms"
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white"
              >
                <Settings size={18} />
                <span>Manage Images</span>
              </Link>
            </div>
          </div>

          {/* Filters Section - Clean Dropdowns */}
          <div className="p-4 bg-[#252525] border-b border-[#3a3a3a]">
            {/* Row 1: Search + Sort + Reset */}
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#888]" />
                <input
                  type="text"
                  placeholder="Search by name or team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-[#FFD700] transition-colors"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="relative min-w-[200px]">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full pl-9 pr-8 py-2.5 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-[#FFD700]"
                >
                  {SORT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888] pointer-events-none" />
              </div>
              {hasActiveFilters && (
                <button onClick={resetFilters} className="flex items-center gap-2 px-4 py-2.5 bg-[#8B0000] hover:bg-[#a00000] rounded-lg text-white transition-colors">
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
              )}
            </div>

            {/* Row 2: Dropdown Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <FilterDropdown
                label="Tier"
                options={TIER_OPTIONS}
                selected={selectedTiers}
                onSelect={(t) => toggleTier(t as ShooterTier)}
                getLabel={(t) => TIER_LABELS[t as ShooterTier]}
                getColor={(t) => TIER_COLORS[t as ShooterTier]}
              />
              <FilterDropdown
                label="League"
                options={LEAGUE_OPTIONS}
                selected={selectedLeagues}
                onSelect={(l) => toggleLeague(l as EliteShooter['league'])}
                getLabel={(l) => LEAGUE_LABELS[l as EliteShooter['league']]}
              />
              <FilterDropdown
                label="Position"
                options={POSITION_OPTIONS}
                selected={selectedPositions}
                onSelect={(p) => togglePosition(p as Position)}
                getLabel={(p) => POSITION_LABELS[p as Position]}
              />
              <FilterDropdown
                label="Era"
                options={ERA_OPTIONS}
                selected={selectedEras}
                onSelect={(e) => toggleEra(e)}
              />
              
              {/* WSI Info Button */}
              <button
                onClick={() => setShowWSIInfo(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600/30 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="font-medium">What is WSI?</span>
              </button>
            </div>

            {/* Row 3: Range Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 pt-4 border-t border-[#3a3a3a]">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-green-400 text-sm font-semibold">3PT%</span>
                  <span className="text-white text-sm font-mono">{threePctRange[0]}% - {threePctRange[1]}%</span>
                </div>
                <div className="flex gap-2">
                  <input type="range" min="0" max="50" value={threePctRange[0]} onChange={(e) => setThreePctRange([parseInt(e.target.value), threePctRange[1]])} className="flex-1 h-2 bg-[#3a3a3a] rounded-lg appearance-none cursor-pointer accent-green-500" />
                  <input type="range" min="0" max="50" value={threePctRange[1]} onChange={(e) => setThreePctRange([threePctRange[0], parseInt(e.target.value)])} className="flex-1 h-2 bg-[#3a3a3a] rounded-lg appearance-none cursor-pointer accent-green-500" />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-blue-400 text-sm font-semibold">FT%</span>
                  <span className="text-white text-sm font-mono">{ftPctRange[0]}% - {ftPctRange[1]}%</span>
                </div>
                <div className="flex gap-2">
                  <input type="range" min="0" max="100" value={ftPctRange[0]} onChange={(e) => setFtPctRange([parseInt(e.target.value), ftPctRange[1]])} className="flex-1 h-2 bg-[#3a3a3a] rounded-lg appearance-none cursor-pointer accent-blue-500" />
                  <input type="range" min="0" max="100" value={ftPctRange[1]} onChange={(e) => setFtPctRange([ftPctRange[0], parseInt(e.target.value)])} className="flex-1 h-2 bg-[#3a3a3a] rounded-lg appearance-none cursor-pointer accent-blue-500" />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-purple-400 text-sm font-semibold">WSI Score</span>
                  <span className="text-white text-sm font-mono">{wsiRange[0]} - {wsiRange[1]}</span>
                </div>
                <div className="flex gap-2">
                  <input type="range" min="0" max="60" value={wsiRange[0]} onChange={(e) => setWsiRange([parseInt(e.target.value), wsiRange[1]])} className="flex-1 h-2 bg-[#3a3a3a] rounded-lg appearance-none cursor-pointer accent-purple-500" />
                  <input type="range" min="0" max="60" value={wsiRange[1]} onChange={(e) => setWsiRange([wsiRange[0], parseInt(e.target.value)])} className="flex-1 h-2 bg-[#3a3a3a] rounded-lg appearance-none cursor-pointer accent-purple-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Shooters Grid */}
          <div className="p-6">
            {filteredShooters.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#888] text-lg">No players match your filters.</p>
                <button onClick={resetFilters} className="mt-4 px-6 py-2 bg-[#FFD700] text-black rounded-lg font-semibold hover:bg-[#e5c200] transition-colors">
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredShooters.map((shooter) => {
                  const photoUrl = shooter.photoUrl || null;
                  const tierColor = TIER_COLORS[shooter.tier];
                  const threePct = shooter.careerPct ?? null;
                  const threeWidth = Math.min(100, (threePct || 0) * 2.5);
                  const ftWidth = Math.min(100, shooter.careerFreeThrowPct);
                  const threePtRank = threePtRanks.get(shooter.id) ?? null;
                  const ftRank = ftRanks.get(shooter.id) ?? null;

                  return (
                    <div 
                      key={shooter.id} 
                      className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-xl overflow-hidden border border-[#3a3a3a] hover:border-[#FFD700]/60 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(255,215,0,0.15)] group cursor-pointer"
                      onClick={() => setSelectedPlayer(shooter)}
                    >
                      {/* Player Header */}
                      <div className="relative p-4 pt-8">
                        {/* WSI Badge - positioned at top */}
                        <div className="absolute top-2 right-3 bg-purple-600 text-white font-bold text-[11px] px-2 py-0.5 rounded">
                          WSI {shooter.wsi}
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {/* Photo with hover effect */}
                          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#FFD700]/50 bg-[#3a3a3a] flex-shrink-0 group-hover:border-[#FFD700] transition-colors">
                            {photoUrl ? (
                              <Image src={photoUrl} alt={shooter.name} fill className="object-cover object-top" unoptimized />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-2xl font-bold text-[#FFD700]">{shooter.name.split(' ').map(n => n[0]).join('')}</span>
                              </div>
                            )}
                            {/* Hover overlay for bio hint */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-xs font-semibold">View Bio</span>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-white uppercase tracking-wide truncate">{shooter.name}</h3>
                            <p className="text-[#888] text-sm truncate">{shooter.team}</p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-[#3a3a3a] text-[#E5E5E5]">
                                {POSITION_LABELS[shooter.position]}
                              </span>
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-gradient-to-r ${LEAGUE_COLORS[shooter.league]} text-white`}>
                                {LEAGUE_LABELS[shooter.league]}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 rounded text-xs font-semibold uppercase" style={{ backgroundColor: `${tierColor}20`, border: `1px solid ${tierColor}60`, color: tierColor }}>
                                {TIER_LABELS[shooter.tier]}
                              </span>
                              <span className="text-[#888] text-xs">{shooter.era}</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-center gap-1 mt-2">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${tierColor}20`, border: `2px solid ${tierColor}` }}>
                              <span className="text-lg font-bold" style={{ color: tierColor }}>{shooter.overallScore}</span>
                            </div>
                            <span className="text-[10px] text-[#888] font-bold">OVR</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 pt-0 space-y-4">
                        {/* Key Traits */}
                        <div>
                          <p className="text-[#888] text-xs mb-2 uppercase tracking-wider flex items-center gap-1">
                            <Zap className="w-3 h-3 text-[#FFD700]" /> Key Traits
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {shooter.keyTraits.map((trait, idx) => (
                              <span key={idx} className="px-2 py-1 rounded-full text-[10px] font-semibold bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30">
                                {trait}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Shooting Stats - 3PT% and FT% (SPAR-style horizontal bars) */}
                        <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#FFD700]/20 space-y-3">
                          {/* 3PT% */}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex gap-0.5">
                                <span className="w-1 h-1 rounded-full bg-[#666]" />
                                <span className="w-1 h-1 rounded-full bg-[#666]" />
                                <span className="w-1 h-1 rounded-full bg-[#666]" />
                              </div>
                              <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">Career 3PT%</span>
                              <div className="flex gap-0.5">
                                <span className="w-1 h-1 rounded-full bg-[#666]" />
                                <span className="w-1 h-1 rounded-full bg-[#666]" />
                                <span className="w-1 h-1 rounded-full bg-[#666]" />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-white w-8 text-right">
                                {threePct != null ? Math.round(threePct) : "—"}
                              </span>
                              <div
                                className="relative flex-1 h-5 overflow-hidden"
                                style={{ borderLeft: "3px solid #22c55e", borderRight: "3px solid #22c55e" }}
                              >
                                <div className="absolute inset-0 bg-[#1a1a1a]">
                                  <div
                                    className="absolute inset-0 opacity-40"
                                    style={{
                                      backgroundImage: `repeating-linear-gradient(-60deg, transparent, transparent 2px, #333 2px, #333 4px)`
                                    }}
                                  />
                                </div>
                                <div
                                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-600"
                                  style={{ width: `${threeWidth}%` }}
                                >
                                  <div
                                    className="absolute inset-0"
                                    style={{
                                      backgroundImage: `repeating-linear-gradient(-60deg, transparent, transparent 3px, rgba(0,0,0,0.3) 3px, rgba(0,0,0,0.3) 6px)`
                                    }}
                                  />
                                  <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent" />
                                </div>
                                <div className="absolute inset-y-0 right-0 w-[14%] bg-[#0a0a0a]" />
                                <div className="absolute top-0 bottom-0 w-0.5 bg-white/50" style={{ left: "86%" }} />
                              </div>
                              <div className="flex flex-col items-center w-8">
                                <span className="text-sm font-bold text-[#888]">{threePtRank ?? "—"}</span>
                                <span className="text-[8px] text-[#666] uppercase">Rank</span>
                              </div>
                            </div>
                          </div>

                          {/* FT% */}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex gap-0.5">
                                <span className="w-1 h-1 rounded-full bg-[#666]" />
                                <span className="w-1 h-1 rounded-full bg-[#666]" />
                                <span className="w-1 h-1 rounded-full bg-[#666]" />
                              </div>
                              <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">Career FT%</span>
                              <div className="flex gap-0.5">
                                <span className="w-1 h-1 rounded-full bg-[#666]" />
                                <span className="w-1 h-1 rounded-full bg-[#666]" />
                                <span className="w-1 h-1 rounded-full bg-[#666]" />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-white w-8 text-right">
                                {Math.round(shooter.careerFreeThrowPct)}
                              </span>
                              <div
                                className="relative flex-1 h-5 overflow-hidden"
                                style={{ borderLeft: "3px solid #3b82f6", borderRight: "3px solid #3b82f6" }}
                              >
                                <div className="absolute inset-0 bg-[#1a1a1a]">
                                  <div
                                    className="absolute inset-0 opacity-40"
                                    style={{
                                      backgroundImage: `repeating-linear-gradient(-60deg, transparent, transparent 2px, #333 2px, #333 4px)`
                                    }}
                                  />
                                </div>
                                <div
                                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600"
                                  style={{ width: `${ftWidth}%` }}
                                >
                                  <div
                                    className="absolute inset-0"
                                    style={{
                                      backgroundImage: `repeating-linear-gradient(-60deg, transparent, transparent 3px, rgba(0,0,0,0.3) 3px, rgba(0,0,0,0.3) 6px)`
                                    }}
                                  />
                                  <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent" />
                                </div>
                                <div className="absolute inset-y-0 right-0 w-[14%] bg-[#0a0a0a]" />
                                <div className="absolute top-0 bottom-0 w-0.5 bg-white/50" style={{ left: "86%" }} />
                              </div>
                              <div className="flex flex-col items-center w-8">
                                <span className="text-sm font-bold text-[#888]">{ftRank ?? "—"}</span>
                                <span className="text-[8px] text-[#666] uppercase">Rank</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Physical Stats */}
                        <div>
                          <p className="text-[#888] text-xs mb-2 uppercase tracking-wider flex items-center gap-1">
                            <Ruler className="w-3 h-3" /> Physical Stats
                          </p>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-[#2a2a2a] rounded-lg p-2">
                              <p className="text-[#FFD700] font-bold text-sm">{formatHeight(shooter.height)}</p>
                              <p className="text-[#888] text-[10px] uppercase">Height</p>
                            </div>
                            <div className="bg-[#2a2a2a] rounded-lg p-2">
                              <p className="text-[#FFD700] font-bold text-sm">{formatHeight(shooter.wingspan)}</p>
                              <p className="text-[#888] text-[10px] uppercase">Wingspan</p>
                            </div>
                            <div className="bg-[#2a2a2a] rounded-lg p-2">
                              <p className="text-[#FFD700] font-bold text-sm">{shooter.weight} lbs</p>
                              <p className="text-[#888] text-[10px] uppercase">Weight</p>
                            </div>
                          </div>
                        </div>

                        {/* Biomechanics */}
                        <div className="border-t border-[#3a3a3a] pt-3">
                          <p className="text-[#888] text-xs mb-2 uppercase tracking-wider">Biomechanics</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between bg-[#2a2a2a] rounded px-2 py-1">
                              <span className="text-[#888]">Elbow:</span>
                              <span className="text-[#FFD700] font-semibold">{shooter.measurements.elbowAngle}°</span>
                            </div>
                            <div className="flex justify-between bg-[#2a2a2a] rounded px-2 py-1">
                              <span className="text-[#888]">Release:</span>
                              <span className="text-[#FFD700] font-semibold">{shooter.measurements.releaseAngle}°</span>
                            </div>
                            <div className="flex justify-between bg-[#2a2a2a] rounded px-2 py-1">
                              <span className="text-[#888]">Knee:</span>
                              <span className="text-[#FFD700] font-semibold">{shooter.measurements.kneeAngle}°</span>
                            </div>
                            <div className="flex justify-between bg-[#2a2a2a] rounded px-2 py-1">
                              <span className="text-[#888]">Entry:</span>
                              <span className="text-[#FFD700] font-semibold">{shooter.measurements.entryAngle}°</span>
                            </div>
                          </div>
                        </div>

                        {/* Shooting Form Button */}
                        <div className="border-t border-[#3a3a3a] pt-3 mt-auto">
                          {(() => {
                            const imageCount = getShootingFormCount(shooter);
                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShootingFormPlayer(shooter);
                                }}
                                className={`w-full py-2.5 rounded-lg font-semibold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                  imageCount > 0
                                    ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black hover:from-[#FFE44D] hover:to-[#FFB733] shadow-lg shadow-[#FFD700]/20'
                                    : 'bg-[#2a2a2a] text-[#888] border border-[#3a3a3a] hover:border-[#555] hover:text-white'
                                }`}
                              >
                                {imageCount > 0 ? (
                                  <>
                                    <Camera className="w-4 h-4" />
                                    View Shooting Form ({imageCount})
                                  </>
                                ) : (
                                  <>
                                    <ImageOff className="w-4 h-4" />
                                    No Pictures Found
                                  </>
                                )}
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* WSI Info Popup */}
      {showWSIInfo && <WSIInfoPopup onClose={() => setShowWSIInfo(false)} />}
      
      {/* Player Bio Popup */}
      {selectedPlayer && <PlayerBioPopup shooter={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
      
      {/* Shooting Form Gallery */}
      {shootingFormPlayer && <ShootingFormGallery shooter={shootingFormPlayer} onClose={() => setShootingFormPlayer(null)} />}
    </main>
  )
}
