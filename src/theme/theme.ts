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
  };
}

export const darkTheme: AppTheme = {
  mode: 'dark',
  colors: {
    background: '#0B0B10',
    surface: '#16161F',
    surfaceAlt: '#1F1F2B',
    text: '#F2F1F7',
    textMuted: '#9391A8',
    border: '#2A2A38',
    primary: '#7C3AED',
    primaryText: '#FFFFFF',
    danger: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
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
    primary: '#7C3AED',
    primaryText: '#FFFFFF',
    danger: '#DC2626',
    success: '#16A34A',
    warning: '#D97706',
  },
};
