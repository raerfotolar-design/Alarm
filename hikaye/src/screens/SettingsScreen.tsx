import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { PrimaryButton, ScreenContainer, ScreenTitle, TextField } from '../components/ui';
import { getSettings, updateSettings } from '../storage/settingsRepository';
import { theme } from '../theme/theme';

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then((s) => setApiKey(s.geminiApiKey));
  }, []);

  const save = async () => {
    await updateSettings({ geminiApiKey: apiKey.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <ScreenContainer>
      <ScreenTitle>Ayarlar</ScreenTitle>

      <TextField
        label="Gemini API Anahtarı"
        value={apiKey}
        onChangeText={setApiKey}
        placeholder="AIza..."
        secureTextEntry
        autoCapitalize="none"
      />
      <Text style={{ color: theme.colors.textMuted, fontSize: 11.5, marginBottom: 16, marginTop: -6 }}>
        Hikayelerinin içine girip AI ile rol yapabilmen için gerekli. Ücretsiz bir anahtarı
        aistudio.google.com adresinden alabilirsin.
      </Text>

      <PrimaryButton title={saved ? 'Kaydedildi ✓' : 'Kaydet'} onPress={save} />
    </ScreenContainer>
  );
}
