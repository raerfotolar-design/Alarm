import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { AppTheme, darkTheme, lightTheme } from './theme';
import { ThemePreference } from '../types';
import { getSettings, updateSettings } from '../storage/settingsRepository';

interface ThemeContextValue {
  theme: AppTheme;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('dark');

  useEffect(() => {
    getSettings().then((s) => setPreferenceState(s.theme));
  }, []);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    updateSettings({ theme: pref });
  }, []);

  // "system" used to mean "follow the phone's light/dark setting", but the
  // app's neon-dark look is the whole point of the redesign, so both
  // "system" and "dark" resolve to it — "light" is kept as an explicit
  // opt-out for anyone who wants it.
  const theme = preference === 'light' ? lightTheme : darkTheme;

  const value = useMemo(() => ({ theme, preference, setPreference }), [theme, preference, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
}

/** Wrap a subtree to override just the accent colors (primary/border/glow)
 * on top of whatever the active theme is — used by SleepScreen to give its
 * two modes distinct accent colors without a separate theme system. */
export function AccentScope({
  accent,
  children,
}: {
  accent: Partial<AppTheme['colors']>;
  children: React.ReactNode;
}) {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('AccentScope must be used within ThemeProvider');
  const scoped = useMemo(
    () => ({ ...ctx, theme: { ...ctx.theme, colors: { ...ctx.theme.colors, ...accent } } }),
    [ctx, accent]
  );
  return <ThemeContext.Provider value={scoped}>{children}</ThemeContext.Provider>;
}
