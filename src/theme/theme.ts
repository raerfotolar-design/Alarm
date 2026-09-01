export interface AppTheme {
  mode: 'light' | 'dark';
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    textMuted: string;
    border: string;
    primary: string;
    primaryText: string;
    danger: string;
    success: string;
    warning: string;
    glow: string;
  };
}

/** The app's signature look: near-black background, glowing cyan accents. */
export const darkTheme: AppTheme = {
  mode: 'dark',
  colors: {
    background: '#05070C',
    surface: '#0B1220',
    surfaceAlt: '#101A2C',
    text: '#E8F6FF',
    textMuted: '#7C8DA6',
    border: '#1B3346',
    primary: '#2DD4EA',
    primaryText: '#03141A',
    danger: '#FF4D6D',
    success: '#34D399',
    warning: '#FBBF24',
    glow: 'rgba(45, 212, 234, 0.35)',
  },
};

export const lightTheme: AppTheme = {
  mode: 'light',
  colors: {
    background: '#F6F5FA',
    surface: '#FFFFFF',
    surfaceAlt: '#EFEDF7',
    text: '#17161F',
    textMuted: '#6B6980',
    border: '#E1DEEC',
    primary: '#0EA5C0',
    primaryText: '#FFFFFF',
    danger: '#DC2626',
    success: '#16A34A',
    warning: '#D97706',
    glow: 'rgba(14, 165, 192, 0.2)',
  },
};

/** Accent-only overrides for the two Sleep sub-modes — applied on top of the
 * active theme's colors within SleepScreen only, so the rest of the app
 * keeps its normal palette. */
export const sleepModeAccent = {
  primary: '#8B7CFF',
  border: '#2A2350',
  glow: 'rgba(139, 124, 255, 0.35)',
};

export const awakeModeAccent = {
  primary: '#FF6B45',
  border: '#4A2416',
  glow: 'rgba(255, 107, 69, 0.35)',
};

export function withAccent(theme: AppTheme, accent: Partial<AppTheme['colors']>): AppTheme {
  return { ...theme, colors: { ...theme.colors, ...accent } };
}
