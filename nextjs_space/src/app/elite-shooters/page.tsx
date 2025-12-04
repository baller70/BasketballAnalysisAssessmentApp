"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { ALL_ELITE_SHOOTERS, TIER_LABELS, TIER_COLORS, POSITION_LABELS, LEAGUE_LABELS, LEAGUE_COLORS, type EliteShooter } from "@/data/eliteShooters"
import { Users, Trophy, Ruler, Zap } from "lucide-react"

// Helper to format height from inches to feet/inches
const formatHeight = (inches: number) => {
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${feet}'${remainingInches}"`;
};

// Mock user profile for similarity comparison (represents average/reference shooter)
const USER_PROFILE = {
  height: 75,        // 6'3"
  weight: 195,
  wingspan: 79,
  measurements: {
    shoulderAngle: 170,
    elbowAngle: 90,
    hipAngle: 172,
    kneeAngle: 145,
    ankleAngle: 88,
    releaseHeight: 108,
    releaseAngle: 52,
    entryAngle: 46,
  }
};

// Calculate similarity score between user and a shooter (0-100)
const calculateSimilarity = (shooter: EliteShooter): number => {
  const weights = {
    height: 0.15,
    wingspan: 0.15,
    weight: 0.10,
    elbowAngle: 0.15,
    releaseAngle: 0.12,
    kneeAngle: 0.10,
    releaseHeight: 0.10,
    shoulderAngle: 0.08,
    entryAngle: 0.05,
  };

  const heightDiff = Math.abs(shooter.height - USER_PROFILE.height) / 20;
  const wingspanDiff = Math.abs(shooter.wingspan - USER_PROFILE.wingspan) / 20;
  const weightDiff = Math.abs(shooter.weight - USER_PROFILE.weight) / 100;
  const elbowDiff = Math.abs(shooter.measurements.elbowAngle - USER_PROFILE.measurements.elbowAngle) / 30;
  const releaseDiff = Math.abs(shooter.measurements.releaseAngle - USER_PROFILE.measurements.releaseAngle) / 20;
  const kneeDiff = Math.abs(shooter.measurements.kneeAngle - USER_PROFILE.measurements.kneeAngle) / 30;
  const releaseHeightDiff = Math.abs(shooter.measurements.releaseHeight - USER_PROFILE.measurements.releaseHeight) / 20;
  const shoulderDiff = Math.abs(shooter.measurements.shoulderAngle - USER_PROFILE.measurements.shoulderAngle) / 20;
  const entryDiff = Math.abs(shooter.measurements.entryAngle - USER_PROFILE.measurements.entryAngle) / 15;

  const similarity = 1 - (
    heightDiff * weights.height +
    wingspanDiff * weights.wingspan +
    weightDiff * weights.weight +
    elbowDiff * weights.elbowAngle +
    releaseDiff * weights.releaseAngle +
    kneeDiff * weights.kneeAngle +
    releaseHeightDiff * weights.releaseHeight +
    shoulderDiff * weights.shoulderAngle +
    entryDiff * weights.entryAngle
  );

  return Math.max(0, Math.min(100, Math.round(similarity * 100)));
};

export default function EliteShootersPage() {
  const [mounted, setMounted] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleImageError = (shooterId: number) => {
    setFailedImages(prev => new Set(prev).add(shooterId));
  };

  // Calculate similarity for all shooters and sort by similarity (highest first)
  const shooters = ALL_ELITE_SHOOTERS.map(shooter => ({
    ...shooter,
    similarity: calculateSimilarity(shooter),
  })).sort((a, b) => b.similarity - a.similarity);

  // Wait for client-side mount to prevent hydration issues with random data
  if (!mounted) {
    return (
      <main className="min-h-[calc(100vh-200px)] py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="bg-[#2C2C2C] rounded-lg overflow-hidden shadow-lg p-6">
            <div className="flex items-center justify-center py-20">
              <div className="text-[#FFD700] text-lg">Loading elite shooters...</div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Calculate ranks for 3PT% and FT% (rank 1 = highest)
  const threePtRanks = new Map<number, number>();
  const ftRanks = new Map<number, number>();

  // Sort by 3PT% descending and assign ranks
  const sortedByThreePt = [...shooters]
    .filter(s => s.careerPct != null)
    .sort((a, b) => (b.careerPct ?? 0) - (a.careerPct ?? 0));
  sortedByThreePt.forEach((shooter, idx) => {
    threePtRanks.set(shooter.id, idx + 1);
  });

  // Sort by FT% descending and assign ranks
  const sortedByFt = [...shooters]
    .sort((a, b) => b.careerFreeThrowPct - a.careerFreeThrowPct);
  sortedByFt.forEach((shooter, idx) => {
    ftRanks.set(shooter.id, idx + 1);
  });

  return (
    <main className="min-h-[calc(100vh-200px)] py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Main Card Container */}
        <div className="bg-[#2C2C2C] rounded-lg overflow-hidden shadow-lg">
          {/* Header */}
          <div className="p-6 border-b border-[#3a3a3a]">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-7 h-7 text-[#FFD700]" />
              <h1 className="text-2xl font-bold text-[#FFD700] uppercase tracking-wider">ELITE SHOOTERS DATABASE</h1>
            </div>
            <p className="text-[#E5E5E5]">
              Reference database of professional basketball players with exceptional shooting form.
              Your shooting analysis is compared against these elite shooters.
            </p>
            <p className="text-[#888] text-sm mt-2">
              Showing {shooters.length} elite shooters across NBA, WNBA, NCAA Men&apos;s, NCAA Women&apos;s, and Top College — sorted by form similarity
            </p>
          </div>

          {/* Shooters Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shooters.map((shooter) => {
                const photoUrl = shooter.photoUrl || null;
                const tierColor = TIER_COLORS[shooter.tier];
                const threePct = shooter.careerPct ?? null;
                const threeWidth = Math.min(100, (threePct || 0) * 2.5);
                const ftWidth = Math.min(100, shooter.careerFreeThrowPct);
                const threePtRank = threePtRanks.get(shooter.id) ?? null;
                const ftRank = ftRanks.get(shooter.id) ?? null;

                return (
                  <div key={shooter.id} className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-xl overflow-hidden border border-[#FFD700]/30 hover:border-[#FFD700]/60 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(255,215,0,0.15)]">
                    {/* Player Header with Photo */}
                    <div className="relative bg-gradient-to-r from-[#FFD700]/10 to-transparent p-4">
                      <div className="flex items-center gap-4">
                        {/* Player Photo */}
                        <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#FFD700]/50 bg-[#3a3a3a] flex-shrink-0">
                          {photoUrl && !failedImages.has(shooter.id) ? (
                            <Image
                              src={photoUrl}
                              alt={shooter.name}
                              fill
                              className="object-cover object-top"
                              unoptimized
                              onError={() => handleImageError(shooter.id)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-2xl font-bold text-[#FFD700]">
                                {shooter.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Player Info */}
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white uppercase tracking-wide">{shooter.name}</h3>
                          <p className="text-[#888] text-sm">{shooter.team}</p>
                          {/* Position & League Badges */}
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-[#3a3a3a] text-[#E5E5E5] border border-[#4a4a4a]">
                              {POSITION_LABELS[shooter.position]}
                            </span>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-gradient-to-r ${LEAGUE_COLORS[shooter.league]} text-white`}>
                              {LEAGUE_LABELS[shooter.league]}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="px-2 py-0.5 rounded text-xs font-semibold uppercase"
                              style={{
                                backgroundColor: `${tierColor}20`,
                                border: `1px solid ${tierColor}60`,
                                color: tierColor
                              }}
                            >
                              {TIER_LABELS[shooter.tier]}
                            </span>
                            <span className="text-[#888] text-xs">{shooter.era}</span>
                          </div>
                        </div>

                        {/* Trophy Icon + Score Badge */}
                        <div className="flex flex-col items-center gap-1">
                          <Trophy className="w-5 h-5" style={{ color: tierColor }} />
                          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${tierColor}20`, border: `2px solid ${tierColor}` }}>
                            <span className="text-lg font-bold" style={{ color: tierColor }}>{shooter.overallScore}</span>
                          </div>
                          <span className="text-[10px] text-[#888] font-bold">OVR</span>
                        </div>
                      </div>

                      {/* Similarity Badge */}
                      <div className="absolute top-2 right-2 bg-[#FFD700] text-black font-bold text-xs px-2 py-1 rounded-full">
                        {shooter.similarity}% Match
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-4">
                      {/* Key Traits */}
                      <div>
                        <p className="text-[#888] text-xs mb-2 uppercase tracking-wider flex items-center gap-1">
                          <Zap className="w-3 h-3 text-[#FFD700]" />
                          Key Traits
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
                          <Ruler className="w-3 h-3 text-[#888]" />
                          Physical Stats
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

                      {/* Biomechanics Summary */}
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
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
