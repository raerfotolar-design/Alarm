import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import LockGateScreen from './src/screens/settings/LockGateScreen';
import { getSettings } from './src/storage/settingsRepository';
import { ensureNotificationSetup } from './src/services/notifications';
import { JarvisVoiceAssistant } from './src/services/JarvisVoiceAssistant';
import { SplashIntro } from './src/components/SplashIntro';

function AppContent() {
  const { theme } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [pinHash, setPinHash] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    (async () => {
      const settings = await getSettings();
      setLockEnabled(settings.lockEnabled && !!settings.pinHash);
      setPinHash(settings.pinHash);
      setBiometricEnabled(settings.biometricEnabled);
      setLoading(false);
      ensureNotificationSetup().catch(() => {});
    })();
  }, []);

  if (loading) return null;

  if (lockEnabled && !unlocked) {
    return <LockGateScreen pinHash={pinHash} biometricEnabled={biometricEnabled} onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <>
      <RootNavigator />
      <JarvisVoiceAssistant />
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      {showIntro ? <SplashIntro onFinish={() => setShowIntro(false)} /> : null}
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
