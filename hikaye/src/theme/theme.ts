/** A warm, book-inspired dark theme — deliberately distinct from the other RAER apps. */
export const theme = {
  colors: {
    background: '#0F0B08',
    surface: '#1A130E',
    surfaceAlt: '#241A12',
    text: '#F5E9D9',
    textMuted: '#A6927B',
    border: '#3A2C1E',
    primary: '#E0A458',
    primaryText: '#241608',
    danger: '#E5726B',
    success: '#7FBF8E',
    glow: 'rgba(224, 164, 88, 0.3)',
  },
  radius: { sm: 10, md: 16, lg: 22 },
  spacing: (n: number) => n * 4,
};

export type AppTheme = typeof theme;
