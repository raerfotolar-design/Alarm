import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { PrimaryButton, ScreenContainer, ScreenTitle, TextField } from '../components/ui';
import { getSettings, updateSettings } from '../storage/settingsRepository';
import { theme } from '../theme/theme';

export default function SettingsScreen() {
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then((s) => {
      setBaseUrl(s.baseUrl);
      setModel(s.model);
      setApiKey(s.apiKey);
    });
  }, []);

  const save = async () => {
    await updateSettings({ baseUrl: baseUrl.trim(), model: model.trim(), apiKey: apiKey.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <ScreenContainer>
      <ScreenTitle>Ayarlar</ScreenTitle>

      <TextField
        label="Model Sunucu Adresi"
        value={baseUrl}
        onChangeText={setBaseUrl}
        placeholder="örn. https://senin-sunucun.com/v1"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextField
        label="Model Adı"
        value={model}
        onChangeText={setModel}
        placeholder="örn. senin-egittigin-model adı"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextField
        label="API Anahtarı (varsa)"
        value={apiKey}
        onChangeText={setApiKey}
        placeholder="Sunucun anahtar istemiyorsa boş bırak"
        secureTextEntry
        autoCapitalize="none"
      />
      <Text style={{ color: theme.colors.textMuted, fontSize: 11.5, marginBottom: 16, marginTop: -6 }}>
        Bu uygulama OpenAI uyumlu bir "chat completions" adresine bağlanır — kendi eğittiğin
        modeli vLLM, Ollama ya da bir kiralık çıkarım servisiyle yayınladığında adresini ve
        model adını buraya gir.
      </Text>

      <PrimaryButton title={saved ? 'Kaydedildi ✓' : 'Kaydet'} onPress={save} />
    </ScreenContainer>
  );
}
