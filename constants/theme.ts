/**
 * Theme configuration for the Music Player
 * Spotify-inspired dark theme with vibrant accent colors
 */

// =============================================================================
// Colors
// =============================================================================

export const Colors = {
  // Primary palette (Spotify-inspired)
  primary: '#1DB954', // Spotify green
  primaryDark: '#1AA34A', // Darker green for pressed states
  primaryLight: '#1ED760', // Lighter green for highlights

  // Background colors
  background: '#121212', // Main background (pure dark)
  backgroundElevated: '#181818', // Cards, elevated surfaces
  backgroundHighlight: '#282828', // Hover states, selected items
  backgroundPressed: '#333333', // Pressed states

  // Surface colors
  surface: '#1E1E1E', // Modals, sheets
  surfaceLight: '#242424', // Lighter surfaces
  surfaceBorder: '#2A2A2A', // Subtle borders

  // Text colors
  textPrimary: '#FFFFFF', // Primary text
  textSecondary: '#B3B3B3', // Secondary text
  textMuted: '#6A6A6A', // Muted text
  textDisabled: '#404040', // Disabled text

  // Status colors
  error: '#FF4444',
  warning: '#FFAA00',
  success: '#1DB954',
  info: '#4688F1',

  // Gradient colors for visual effects
  gradientStart: '#1DB954',
  gradientMiddle: '#191414',
  gradientEnd: '#121212',

  // Player specific
  playerBackground: '#0D0D0D',
  progressBar: '#535353',
  progressBarFilled: '#1DB954',
  sliderThumb: '#FFFFFF',
} as const;

// =============================================================================
// Typography
// =============================================================================

export const Typography = {
  // Font families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },

  // Font sizes
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// =============================================================================
// Spacing
// =============================================================================

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

// =============================================================================
// Border Radius
// =============================================================================

export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

// =============================================================================
// Shadows
// =============================================================================

export const Shadows = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
} as const;

// =============================================================================
// Layout
// =============================================================================

export const Layout = {
  // Screen padding
  screenPaddingHorizontal: 16,
  screenPaddingTop: 16,
  screenPaddingBottom: 140, // Space for mini player and tab bar (increased)

  // Mini player height
  miniPlayerHeight: 64,

  // Tab bar height
  tabBarHeight: 56,

  // Full player
  fullPlayerArtworkSize: 300,
  fullPlayerControlsHeight: 180,

  // Grid
  folderCardWidth: 160,
  folderCardHeight: 200,
  trackItemHeight: 64,
} as const;

// =============================================================================
// Animations
// =============================================================================

export const Animations = {
  // Durations in ms
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },

  // Easing presets
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

// =============================================================================
// Theme Export
// =============================================================================

export const theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  layout: Layout,
  animations: Animations,
} as const;

export type Theme = typeof theme;

export default theme;
