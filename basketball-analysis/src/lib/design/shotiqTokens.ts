/* GENERATED from the canonical HoopTrackLayoutSidecar design tokens.
   Source: 92 embedded screens, batch shotiq-white-court-imagegen2-2026-07-30-v2.
   Verified identical across all 92 screens (zero drift).
   Regenerate with tools/shotiq-sidecar/emit.py - do not hand-edit. */

export const shotiqColors = {
  "analysisBlue": "#2D6CDF",
  "confirmGreen": "#168A55",
  "graphite": "#5F646B",
  "ink": "#111111",
  "muted": "#A7AAB0",
  "paper": "#FFFFFF",
  "reviewRed": "#D92D20",
  "rule": "#D9D9D4",
  // Kept in lockstep with --shotiq-color-shotiqOrange in styles/shotiq-tokens.css.
  // The previously emitted #FF5A1F was a yellow-shifted approximation; the canonical
  // desktop renders measure a redder #FD3701 for the flat primary fill.
  "shotiqOrange": "#FD3701",
  "warmCanvas": "#F7F7F4"
} as const

export const shotiqSpacing = {
  "lg": 24,
  "md": 16,
  "sm": 8,
  "xl": 32,
  "xs": 4
} as const

export const shotiqRadii = {
  "card": 8,
  "control": 6,
  "none": 0,
  "pill": 999
} as const

export const shotiqTypography = {
  "body": {
    "fontFamily": "Inter",
    "fontSize": 16,
    "fontWeight": 400,
    "letterSpacing": 0,
    "lineHeight": 22
  },
  "brand": {
    "fontFamily": "Inter",
    "fontSize": 28,
    "fontWeight": 900,
    "letterSpacing": 0,
    "lineHeight": 32
  },
  "button": {
    "fontFamily": "Inter",
    "fontSize": 16,
    "fontWeight": 700,
    "letterSpacing": 0,
    "lineHeight": 22
  },
  "caption": {
    "fontFamily": "Inter",
    "fontSize": 12,
    "fontWeight": 500,
    "letterSpacing": 0,
    "lineHeight": 16
  },
  "h1": {
    "fontFamily": "Bebas Neue",
    "fontSize": 64,
    "fontWeight": 900,
    "letterSpacing": 0,
    "lineHeight": 70
  },
  "h2": {
    "fontFamily": "Bebas Neue",
    "fontSize": 40,
    "fontWeight": 900,
    "letterSpacing": 0,
    "lineHeight": 46
  },
  "h3": {
    "fontFamily": "Bebas Neue",
    "fontSize": 28,
    "fontWeight": 800,
    "letterSpacing": 0,
    "lineHeight": 34
  },
  "h4": {
    "fontFamily": "Inter",
    "fontSize": 18,
    "fontWeight": 700,
    "letterSpacing": 0,
    "lineHeight": 24
  },
  "h5": {
    "fontFamily": "Inter",
    "fontSize": 14,
    "fontWeight": 700,
    "letterSpacing": 0,
    "lineHeight": 20
  },
  "label": {
    "fontFamily": "Inter",
    "fontSize": 12,
    "fontWeight": 700,
    "letterSpacing": 0,
    "lineHeight": 16
  },
  "numeric": {
    "fontFamily": "DIN Condensed",
    "fontSize": 40,
    "fontWeight": 800,
    "letterSpacing": 0,
    "lineHeight": 44
  }
} as const

export type ShotIQColorToken = keyof typeof shotiqColors
export type ShotIQTypographyRole = keyof typeof shotiqTypography
export const SHOTIQ_CANVAS = { ios: { width: 853, height: 1844 }, desktop: { width: 1440, height: 900 } } as const
