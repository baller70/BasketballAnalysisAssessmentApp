/**
 * @file MedalIcons.tsx
 * @description Medal icons for ranking display (Gold, Silver, Bronze, Copper, Iron)
 * 
 * PURPOSE:
 * - Provides outline-style medal SVG icons for elite shooter ranking
 * - Used in elite shooter matching display
 * - Shows performance tier with clean outline design
 * 
 * DESIGN STYLE:
 * - Pure outline/wireframe aesthetic
 * - NO solid fills - transparent interiors only
 * - Colored gradient strokes for visual hierarchy
 * - Glowing effect on outlines for premium look
 * - Simple V-shaped ribbon strap at top
 * - Circular medal body with multiple outline rings
 * 
 * TIERS:
 * - Gold: Rank 1 (Yellow/Gold gradient strokes)
 * - Silver: Rank 2 (Silver/Gray gradient strokes)
 * - Bronze: Rank 3 (Bronze/Orange gradient strokes)
 * - Copper: Rank 4 (Blue gradient strokes)
 * - Iron: Rank 5 (Green gradient strokes)
 */
"use client"

import React from "react"

export type MedalTier = "gold" | "silver" | "bronze" | "copper" | "iron"

interface MedalIconProps {
  tier: MedalTier
  className?: string
  size?: number
  rankNumber?: number
}

// Outline color gradients for each tier (used for strokes only)
const OUTLINE_COLORS = {
  gold: {
    primary: "#FFD700",    // Bright gold
    secondary: "#FDB931",  // Mid gold
    tertiary: "#D4AF37",   // Dark gold
    glow: "#FFD700"        // Glow color
  },
  silver: {
    primary: "#E0E0E0",    // Bright silver
    secondary: "#C0C0C0",  // Mid silver
    tertiary: "#A9A9A9",   // Dark silver
    glow: "#C0C0C0"
  },
  bronze: {
    primary: "#FFA07A",    // Light bronze
    secondary: "#CD7F32",  // Mid bronze
    tertiary: "#A0522D",   // Dark bronze
    glow: "#CD7F32"
  },
  copper: {
    primary: "#87CEFA",    // Light blue
    secondary: "#4682B4",  // Steel blue
    tertiary: "#2E6DB4",   // Dark blue
    glow: "#4682B4"
  },
  iron: {
    primary: "#90EE90",    // Light green
    secondary: "#3CB371",  // Medium green
    tertiary: "#228B22",   // Forest green
    glow: "#3CB371"
  }
}

export function MedalIcon({ tier, className = "", size = 48, rankNumber }: MedalIconProps) {
  const colors = OUTLINE_COLORS[tier]
  const baseId = React.useId()
  const uniqueId = `medal-${tier}-${baseId.replace(/:/g, '')}`
  const strokeWidth = 2.5 // Consistent stroke width for all outlines
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: 'block',
        // Glowing outline effect
        filter: `drop-shadow(0px 0px 4px ${colors.glow}80) drop-shadow(0px 0px 8px ${colors.glow}40)`
      }}
    >
      <defs>
        {/* Gradient for outer medal ring stroke */}
        <linearGradient id={`${uniqueId}-outer-stroke`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.primary} />
          <stop offset="50%" stopColor={colors.secondary} />
          <stop offset="100%" stopColor={colors.tertiary} />
        </linearGradient>

        {/* Gradient for inner medal ring stroke */}
        <linearGradient id={`${uniqueId}-inner-stroke`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.secondary} />
          <stop offset="100%" stopColor={colors.tertiary} />
        </linearGradient>

        {/* Gradient for ribbon stroke */}
        <linearGradient id={`${uniqueId}-ribbon-stroke`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.primary} />
          <stop offset="100%" stopColor={colors.secondary} />
        </linearGradient>

        {/* Gradient for rank number stroke */}
        <linearGradient id={`${uniqueId}-text-stroke`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.primary} />
          <stop offset="100%" stopColor={colors.secondary} />
        </linearGradient>
      </defs>

      {/* --- RIBBON STRAP (V-Shape Outline) --- */}
      <g transform="translate(12, 0)">
        {/* Left strap line */}
        <line
          x1="0"
          y1="0"
          x2="20"
          y2="28"
          stroke={`url(#${uniqueId}-ribbon-stroke)`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Right strap line */}
        <line
          x1="40"
          y1="0"
          x2="20"
          y2="28"
          stroke={`url(#${uniqueId}-ribbon-stroke)`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Connecting line to medal */}
        <line
          x1="20"
          y1="28"
          x2="20"
          y2="32"
          stroke={`url(#${uniqueId}-ribbon-stroke)`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </g>

      {/* --- MEDAL BODY (Multiple Outline Rings) --- */}
      <g transform="translate(32, 48)">
        {/* Outer ring */}
        <circle
          r="24"
          fill="none"
          stroke={`url(#${uniqueId}-outer-stroke)`}
          strokeWidth={strokeWidth}
        />

        {/* Middle ring */}
        <circle
          r="20"
          fill="none"
          stroke={`url(#${uniqueId}-outer-stroke)`}
          strokeWidth={strokeWidth * 0.8}
          opacity="0.8"
        />

        {/* Inner ring */}
        <circle
          r="16"
          fill="none"
          stroke={`url(#${uniqueId}-inner-stroke)`}
          strokeWidth={strokeWidth * 0.6}
          opacity="0.6"
        />

        {/* Decorative star pattern outline */}
        <path
          d="M0 -12 L3 -3 L12 0 L3 3 L0 12 L-3 3 L-12 0 L-3 -3 Z"
          fill="none"
          stroke={`url(#${uniqueId}-inner-stroke)`}
          strokeWidth={strokeWidth * 0.5}
          opacity="0.4"
        />
      </g>

      {/* --- RANK NUMBER (Outline Text) --- */}
      {rankNumber !== undefined && (
        <g transform="translate(32, 56)">
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fill="none"
            stroke={`url(#${uniqueId}-text-stroke)`}
            strokeWidth="2"
            fontSize="28"
            fontWeight="900"
            fontFamily="'Arial Black', 'Impact', sans-serif"
            style={{
              filter: `drop-shadow(0px 0px 2px ${colors.glow}80)`
            }}
          >
            {rankNumber}
          </text>
        </g>
      )}
    </svg>
  )
}

// Individual medal components for convenience
export function GoldMedal(props: Omit<MedalIconProps, "tier">) { return <MedalIcon tier="gold" {...props} /> }
export function SilverMedal(props: Omit<MedalIconProps, "tier">) { return <MedalIcon tier="silver" {...props} /> }
export function BronzeMedal(props: Omit<MedalIconProps, "tier">) { return <MedalIcon tier="bronze" {...props} /> }
export function CopperMedal(props: Omit<MedalIconProps, "tier">) { return <MedalIcon tier="copper" {...props} /> }
export function IronMedal(props: Omit<MedalIconProps, "tier">) { return <MedalIcon tier="iron" {...props} /> }
