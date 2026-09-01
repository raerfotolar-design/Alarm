import React, { useCallback, useState } from 'react';
import { View, Switch, Linking, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { File } from 'expo-file-system';
import { Screen, Title, Subtitle, Card, BodyText, PrimaryButton, Field } from '../../components/ui';
import { useAppTheme } from '../../theme/ThemeContext';
import { getLullabySettings, updateLullabySettings } from '../../storage/lullabyRepository';
import { playLullaby, stopLullaby, isLullabyPlaying } from '../../services/lullabyPlayer';

export default function NinniScreen() {
  const { theme } = useAppTheme();
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loop, setLoop] = useState(true);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState('30');
  const [playing, setPlaying] = useState(false);

  const load = useCallback(async () => {
    const settings = await getLullabySettings();
    setAudioUri(settings.audioUri);
    setYoutubeUrl(settings.youtubeUrl);
    setLoop(settings.loop);
    setSleepTimerMinutes(String(settings.sleepTimerMinutes));
    setPlaying(isLullabyPlaying());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function pickAudio() {
    try {
      const result = await File.pickFileAsync({ mimeTypes: ['audio/*'] });
      if (!result.canceled) {
        setAudioUri(result.result.uri);
        await updateLullabySettings({ audioUri: result.result.uri });
      }
    } catch {
      // cancelled
    }
  }

  async function toggleLoop(value: boolean) {
    setLoop(value);
    await updateLullabySettings({ loop: value });
  }

  async function saveTimer() {
    const minutes = Math.max(0, parseInt(sleepTimerMinutes, 10) || 0);
    await updateLullabySettings({ sleepTimerMinutes: minutes });
  }

  async function saveYoutubeUrl() {
    await updateLullabySettings({ youtubeUrl });
  }

  async function handlePlay() {
    if (!audioUri) {
      Alert.alert('Önce bir ses dosyası seç', 'Ninnini Files\'tan seçip yükledikten sonra çalabilirsin.');
      return;
    }
    const result = await playLullaby();
    if (result.ok) setPlaying(true);
  }

  function handleStop() {
    stopLullaby();
    setPlaying(false);
  }

  async function openYoutube() {
    if (!youtubeUrl) return;
    await Linking.openURL(youtubeUrl);
  }

  return (
    <Screen>
      <Title>🎵 Ninni</Title>
      <Subtitle>Uykuya dalmak için ninnin bir dokunuşta hazır.</Subtitle>

      <Card>
        <BodyText style={{ marginBottom: 10 }}>{audioUri ? '✅ Ninni dosyası yüklü' : 'Henüz ninni yüklemedin.'}</BodyText>
        <PrimaryButton title={audioUri ? 'Değiştir' : 'Files\'tan Seç'} variant="outline" onPress={pickAudio} />

        {playing ? (
          <PrimaryButton title="⏹️ Durdur" variant="danger" onPress={handleStop} />
        ) : (
          <PrimaryButton title="▶️ Ninniyi Çal" onPress={handlePlay} />
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <BodyText>Bitince baştan başlasın (döngü)</BodyText>
          <Switch value={loop} onValueChange={toggleLoop} />
        </View>
      </Card>

      <Card>
        <Subtitle style={{ marginBottom: 10 }}>Uyku Zamanlayıcı</Subtitle>
        <Field
          label="Kaç dakika sonra otomatik dursun (0 = hiç durmasın)"
          keyboardType="number-pad"
          value={sleepTimerMinutes}
          onChangeText={setSleepTimerMinutes}
          onBlur={saveTimer}
        />
      </Card>

      <Card>
        <Subtitle style={{ marginBottom: 10 }}>YouTube Linki</Subtitle>
        <Field
          label="Ninni videosunun linki"
          placeholder="https://youtube.com/..."
          value={youtubeUrl}
          onChangeText={setYoutubeUrl}
          onBlur={saveYoutubeUrl}
        />
        <PrimaryButton title="▶️ YouTube'da Aç" variant="outline" onPress={openYoutube} />
      </Card>

      <BodyText style={{ color: theme.colors.textMuted }}>
        Jarvis'e "ninnimi çal" dersen de bu ekranı açmadan başlatabilir.
      </BodyText>
    </Screen>
  );
}
