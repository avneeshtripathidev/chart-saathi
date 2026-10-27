// Design tokens for ChartSaathi
// Curated Luxury Rail Palette

export const colors = {
  // Backgrounds - crisp, solid, deep luxury rail tones
  bg: {
    primary: '#19181B',     // Deep, rich, clean charcoal base
    secondary: '#242227',   // Solid, crisp elevated card surface
    tertiary: '#2E2B32',    // Nested boxes, inputs & chips
    card: '#242227',
    overlay: 'rgba(25, 24, 27, 0.95)',
  },

  // Brand / Accents
  brand: {
    primary: '#E45F60',     // Confident Coral — CTA, active states
    secondary: '#E8B943',   // Warm Marigold — warning, vacancy accent
    wine: '#7E3044',        // Wine Red — authority badges
    roseStone: '#D4C6BA',   // Rose Stone — crisp subtitles & borders
    gradient: ['#E45F60', '#E8B943'] as const,
  },

  // Status indicators
  status: {
    vacant: '#22C55E',      // Emerald green available status
    vacantAccent: '#E45F60',// Coral highlight
    occupied: '#7E3044',    // Wine Red reserved
    partial: '#E8B943',     // Marigold partial
    unknown: '#78737C',     // Muted stone
    stale: '#A855F7',       // Stale
    demo: '#E45F60',        // Demo
  },

  // Chart preparation status
  chart: {
    prepared: '#22C55E',
    notPrepared: '#78737C',
    firstChart: '#E8B943',
    finalChart: '#22C55E',
  },

  // Typography - razor sharp contrast
  text: {
    primary: '#F8F6F2',     // Crisp Warm Ivory
    secondary: '#CEC5BC',   // Crisp Rose Stone
    tertiary: '#948D96',    // Muted stone
    inverse: '#19181B',     // Dark text on bright badges
    link: '#E45F60',        // Coral links
    onBrand: '#FFFFFF',     // White
  },

  // Borders & Dividers - solid, clean hairline outlines
  border: {
    default: '#36333C',     // Crisp 1px card border
    subtle: '#2A2730',      // Inner separator line
    focus: '#E45F60',       // Coral focus
    roseStone: '#D4C6BA',
  },

  // Utilities
  white: '#FFFFFF',
  ivory: '#F8F6F2',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },

  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    huge: 38,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  lg: {
    shadowColor: '#E45F60',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const glass = {
  panel: {
    backgroundColor: 'rgba(52, 49, 54, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(216, 196, 182, 0.16)',
  },
  panelElevated: {
    backgroundColor: 'rgba(61, 58, 63, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(216, 196, 182, 0.24)',
  },
  chip: {
    backgroundColor: 'rgba(216, 196, 182, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(216, 196, 182, 0.18)',
  },
} as const;

