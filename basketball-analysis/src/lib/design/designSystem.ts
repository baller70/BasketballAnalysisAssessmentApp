/**
 * Design System Constants
 * 
 * Comprehensive design tokens for the Basketball Analysis Tool.
 * These values ensure consistency across all components.
 */

// ==========================================
// COLOR PALETTE
// ==========================================

export const COLORS = {
  // Primary colors
  primary: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    300: "#93C5FD",
    400: "#60A5FA",
    500: "#3B82F6",
    600: "#2563EB",
    700: "#1D4ED8",
    800: "#1E40AF", // Main primary
    900: "#1E3A8A",
  },
  
  // Success colors (green)
  success: {
    50: "#F0FDF4",
    100: "#DCFCE7",
    200: "#BBF7D0",
    300: "#86EFAC",
    400: "#4ADE80",
    500: "#22C55E",
    600: "#16A34A", // Main success
    700: "#15803D",
    800: "#166534",
    900: "#14532D",
  },
  
  // Warning colors (yellow)
  warning: {
    50: "#FEFCE8",
    100: "#FEF9C3",
    200: "#FEF08A",
    300: "#FDE047",
    400: "#FACC15",
    500: "#EAB308", // Main warning
    600: "#CA8A04",
    700: "#A16207",
    800: "#854D0E",
    900: "#713F12",
  },
  
  // Critical/Error colors (red)
  critical: {
    50: "#FEF2F2",
    100: "#FEE2E2",
    200: "#FECACA",
    300: "#FCA5A5",
    400: "#F87171",
    500: "#EF4444",
    600: "#DC2626", // Main critical
    700: "#B91C1C",
    800: "#991B1B",
    900: "#7F1D1D",
  },
  
  // Neutral colors (gray)
  neutral: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280", // Main neutral
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
  
  // Background colors
  background: {
    white: "#FFFFFF",
    light: "#F9FAFB",
    card: "#FFFFFF",
    overlay: "rgba(0, 0, 0, 0.5)",
  },
} as const

// Main color shortcuts
export const COLOR_TOKENS = {
  primaryBlue: COLORS.primary[800],
  successGreen: COLORS.success[600],
  warningYellow: COLORS.warning[500],
  criticalRed: COLORS.critical[600],
  neutralGray: COLORS.neutral[500],
  textPrimary: COLORS.neutral[800],
  textSecondary: COLORS.neutral[600],
  textMuted: COLORS.neutral[500],
  border: COLORS.neutral[200],
  background: COLORS.background.white,
  backgroundLight: COLORS.background.light,
} as const

// ==========================================
// TYPOGRAPHY
// ==========================================

export const TYPOGRAPHY = {
  fontFamily: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
  },
  
  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const

// Typography presets
export const TEXT_STYLES = {
  // Headings
  h1: {
    fontSize: TYPOGRAPHY.fontSize["3xl"],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    lineHeight: TYPOGRAPHY.lineHeight.tight,
    color: COLOR_TOKENS.textPrimary,
  },
  h2: {
    fontSize: TYPOGRAPHY.fontSize["2xl"],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    lineHeight: TYPOGRAPHY.lineHeight.tight,
    color: COLOR_TOKENS.textPrimary,
  },
  h3: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    lineHeight: TYPOGRAPHY.lineHeight.tight,
    color: COLOR_TOKENS.textPrimary,
  },
  h4: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    lineHeight: TYPOGRAPHY.lineHeight.tight,
    color: COLOR_TOKENS.textPrimary,
  },
  
  // Body text
  body: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.normal,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
    color: COLOR_TOKENS.textPrimary,
  },
  bodySmall: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.normal,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
    color: COLOR_TOKENS.textSecondary,
  },
  
  // Labels and helpers
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
    color: COLOR_TOKENS.textPrimary,
  },
  helper: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.normal,
    lineHeight: TYPOGRAPHY.lineHeight.normal,
    color: COLOR_TOKENS.textMuted,
  },
  
  // Card heading (for flashcards)
  cardHeading: {
    fontSize: TYPOGRAPHY.fontSize["2xl"],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    lineHeight: TYPOGRAPHY.lineHeight.tight,
    color: COLOR_TOKENS.primaryBlue,
  },
} as const

// ==========================================
// SPACING
// ==========================================

export const SPACING = {
  0: "0",
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
} as const

// ==========================================
// LAYOUT
// ==========================================

export const LAYOUT = {
  // Max widths
  maxWidth: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
  },
  
  // Card dimensions
  card: {
    width: "100%",
    maxWidth: "600px",
    minHeight: "500px",
    padding: SPACING[6], // 24px
    borderRadius: "12px",
    shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  },
  
  // Touch targets (accessibility)
  touchTarget: {
    min: "44px",
    recommended: "48px",
  },
  
  // Breakpoints
  breakpoints: {
    mobile: "375px",
    tablet: "768px",
    desktop: "1024px",
    wide: "1280px",
  },
} as const

// ==========================================
// ANIMATION
// ==========================================

export const ANIMATION = {
  duration: {
    fast: "150ms",
    normal: "300ms",
    slow: "500ms",
  },
  
  easing: {
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  },
  
  // Framer Motion variants
  variants: {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },
    slideRight: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
    cardEntrance: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { duration: 0.3, ease: [0, 0, 0.2, 1] },
    },
  },
} as const

// ==========================================
// SHADOWS
// ==========================================

export const SHADOWS = {
  none: "none",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
  focus: `0 0 0 3px ${COLORS.primary[200]}`,
  focusError: `0 0 0 3px ${COLORS.critical[200]}`,
} as const

// ==========================================
// BORDERS
// ==========================================

export const BORDERS = {
  width: {
    thin: "1px",
    medium: "2px",
    thick: "4px",
  },
  
  radius: {
    none: "0",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "9999px",
  },
  
  color: {
    default: COLORS.neutral[200],
    focus: COLORS.primary[500],
    error: COLORS.critical[500],
    success: COLORS.success[500],
  },
} as const

// ==========================================
// Z-INDEX
// ==========================================

export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
} as const

// ==========================================
// ICON SYSTEM TOKENS
// ==========================================

export const ICON_TOKENS = {
  sizes: {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  },
  
  colors: {
    primary: COLOR_TOKENS.primaryBlue,
    success: COLOR_TOKENS.successGreen,
    warning: COLOR_TOKENS.warningYellow,
    critical: COLOR_TOKENS.criticalRed,
    neutral: COLOR_TOKENS.neutralGray,
  },
  
  strokeWidth: 2,
} as const

// ==========================================
// FORM ELEMENTS
// ==========================================

export const FORM = {
  input: {
    height: "48px",
    padding: SPACING[4],
    fontSize: TYPOGRAPHY.fontSize.base,
    borderRadius: BORDERS.radius.md,
    borderColor: BORDERS.color.default,
    focusBorderColor: BORDERS.color.focus,
    errorBorderColor: BORDERS.color.error,
    backgroundColor: COLORS.background.white,
    placeholderColor: COLORS.neutral[400],
  },
  
  select: {
    height: "48px",
    padding: SPACING[4],
    fontSize: TYPOGRAPHY.fontSize.base,
    borderRadius: BORDERS.radius.md,
  },
  
  button: {
    height: {
      sm: "36px",
      md: "44px",
      lg: "52px",
    },
    padding: {
      sm: `${SPACING[2]} ${SPACING[4]}`,
      md: `${SPACING[3]} ${SPACING[6]}`,
      lg: `${SPACING[4]} ${SPACING[8]}`,
    },
    fontSize: {
      sm: TYPOGRAPHY.fontSize.sm,
      md: TYPOGRAPHY.fontSize.base,
      lg: TYPOGRAPHY.fontSize.lg,
    },
    borderRadius: BORDERS.radius.md,
  },
  
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING[2],
  },
  
  helperText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: SPACING[1],
    color: COLOR_TOKENS.textMuted,
  },
  
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: SPACING[1],
    color: COLOR_TOKENS.criticalRed,
  },
} as const

// ==========================================
// FLASHCARD SPECIFIC
// ==========================================

export const FLASHCARD = {
  container: {
    width: "100%",
    maxWidth: LAYOUT.card.maxWidth,
    minHeight: "600px",
    padding: SPACING[6],
    borderRadius: BORDERS.radius.lg,
    backgroundColor: COLORS.background.card,
    shadow: SHADOWS.lg,
  },
  
  header: {
    marginBottom: SPACING[6],
  },
  
  progress: {
    height: "8px",
    borderRadius: BORDERS.radius.full,
    backgroundColor: COLORS.neutral[200],
    fillColor: COLOR_TOKENS.primaryBlue,
  },
  
  content: {
    minHeight: "400px",
    padding: SPACING[4],
  },
  
  footer: {
    marginTop: SPACING[6],
    paddingTop: SPACING[4],
    borderTop: `1px solid ${COLOR_TOKENS.border}`,
  },
  
  navigation: {
    buttonGap: SPACING[4],
  },
} as const

// ==========================================
// ACCESSIBILITY
// ==========================================

export const ACCESSIBILITY = {
  // WCAG AA contrast ratios
  contrastRatio: {
    normal: 4.5,
    large: 3,
  },
  
  // Focus indicators
  focusOutline: `2px solid ${COLOR_TOKENS.primaryBlue}`,
  focusOutlineOffset: "2px",
  
  // Minimum touch target
  minTouchTarget: "44px",
  
  // Reduced motion
  reducedMotion: {
    transition: "none",
    animation: "none",
  },
} as const

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Get status color based on analysis status
 */
export function getStatusColor(status: "excellent" | "good" | "warning" | "critical"): string {
  switch (status) {
    case "excellent":
    case "good":
      return COLOR_TOKENS.successGreen
    case "warning":
      return COLOR_TOKENS.warningYellow
    case "critical":
      return COLOR_TOKENS.criticalRed
    default:
      return COLOR_TOKENS.neutralGray
  }
}

/**
 * Get tier color
 */
export function getTierColor(tier: string): string {
  return COLOR_TOKENS.primaryBlue
}

/**
 * Create CSS variable string for a color
 */
export function cssVar(color: string): string {
  return color
}


