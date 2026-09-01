import React, { useCallback, useState } from 'react';
import { View, Switch, Image, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { Screen, Title, Subtitle, Card, BodyText, PrimaryButton, Field, Chip } from '../../components/ui';
import { useAppTheme } from '../../theme/ThemeContext';
import { getSettings, updateSettings } from '../../storage/settingsRepository';
import { hashPin, isBiometricAvailable } from '../../services/lockService';
import { isWakeWordSupported } from '../../services/wakeWordService';
import { listSleepEntries } from '../../storage/sleepRepository';
import { listStories, listSongs, listNotes } from '../../storage/creativeRepository';
import { exportAllAsFile } from '../../services/exportService';
import { formatMinutes } from '../../services/stats';
import { ThemePreference, AppSettings } from '../../types';

export default function SettingsScreen() {
  const { theme, preference, setPreference } = useAppTheme();
  const [bedtimeHour, setBedtimeHour] = useState('23');
  const [bedtimeMinute, setBedtimeMinute] = useState('0');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [tmdbApiKey, setTmdbApiKey] = useState('');
  const [jarvisTone, setJarvisTone] = useState<AppSettings['jarvisTone']>('samimi');
  const [picovoiceAccessKey, setPicovoiceAccessKey] = useState('');
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [defaultAlarmSound, setDefaultAlarmSound] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [settings, bioAvailable] = await Promise.all([getSettings(), isBiometricAvailable()]);
        setBedtimeHour(String(settings.bedtimeGoalHour));
        setBedtimeMinute(String(settings.bedtimeGoalMinute));
        setGeminiApiKey(settings.geminiApiKey);
        setTmdbApiKey(settings.tmdbApiKey);
        setJarvisTone(settings.jarvisTone);
        setPicovoiceAccessKey(settings.picovoiceAccessKey);
        setWakeWordEnabled(settings.wakeWordEnabled);
        setLockEnabled(settings.lockEnabled);
        setBiometricEnabled(settings.biometricEnabled);
        setCustomImage(settings.customAppImageUri);
        setDefaultAlarmSound(settings.defaultAlarmSoundUri);
        setBiometricAvailable(bioAvailable);
      })();
    }, [])
  );

  async function persistCore() {
    await updateSettings({
      bedtimeGoalHour: Math.min(23, Math.max(0, parseInt(bedtimeHour, 10) || 0)),
      bedtimeGoalMinute: Math.min(59, Math.max(0, parseInt(bedtimeMinute, 10) || 0)),
      geminiApiKey,
      tmdbApiKey,
      jarvisTone,
      picovoiceAccessKey,
      wakeWordEnabled,
      defaultAlarmSoundUri: defaultAlarmSound,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function pickAppImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, aspect: [1, 1] });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setCustomImage(uri);
      await updateSettings({ customAppImageUri: uri });
    }
  }

  async function pickDefaultAlarmSound() {
    try {
      const result = await File.pickFileAsync({ mimeTypes: ['audio/*'] });
      if (!result.canceled) {
        setDefaultAlarmSound(result.result.uri);
      }
    } catch {
      // cancelled
    }
  }

  async function handleSetPin() {
    if (newPin.length < 4) {
      Alert.alert('Çok kısa', 'PIN en az 4 haneli olmalı.');
      return;
    }
    const hash = await hashPin(newPin);
    await updateSettings({ pinHash: hash, lockEnabled: true });
    setLockEnabled(true);
    setNewPin('');
    Alert.alert('Tamam', 'PIN kilidi ayarlandı.');
  }

  async function handleToggleLock(value: boolean) {
    if (!value) {
      await updateSettings({ lockEnabled: false });
      setLockEnabled(false);
    } else if (!newPin) {
      Alert.alert('Önce PIN belirle', 'Kilidi açmadan önce aşağıdan bir PIN belirlemelisin.');
    }
  }

  async function handleExportAll() {
    const [entries, stories, songs, notes] = await Promise.all([
      listSleepEntries(),
      listStories(),
      listSongs(),
      listNotes(),
    ]);
    const sleepSummary = entries
      .map((e) => `${new Date(e.sleepAt).toLocaleString('tr-TR')} -> ${e.durationMinutes != null ? formatMinutes(e.durationMinutes) : 'devam ediyor'}`)
      .join('\n');
    await exportAllAsFile('RAER-yedek', [
      { heading: 'Uyku Kayıtları', body: sleepSummary || 'Kayıt yok' },
      { heading: 'Hikayeler', body: stories.map((s) => `${s.title}\n${s.content}`).join('\n\n') || 'Yok' },
      { heading: 'Şarkı Sözleri', body: songs.map((s) => `${s.title}\n${s.lyrics}`).join('\n\n') || 'Yok' },
      { heading: 'Notlar', body: notes.map((n) => `${n.title}\n${n.content}`).join('\n\n') || 'Yok' },
    ]);
  }

  return (
    <Screen>
      <Title>Ayarlar</Title>

      <Card>
        <Subtitle style={{ marginBottom: 10 }}>Uygulama Görseli</Subtitle>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          {customImage ? <Image source={{ uri: customImage }} style={{ width: 56, height: 56, borderRadius: 16, marginRight: 12 }} /> : null}
          <BodyText style={{ flex: 1, color: theme.colors.textMuted }}>
            Ana sayfada görünen görseli değiştir. Telefonun ana ekranındaki gerçek uygulama ikonunu değiştirmek için ise APK'nın yeniden derlenmesi gerekir (assets/icon.jpg dosyasını değiştirip tekrar build alman yeterli).
          </BodyText>
        </View>
        <PrimaryButton title="Görsel seç" variant="outline" onPress={pickAppImage} />
      </Card>

      <Card>
        <Subtitle style={{ marginBottom: 10 }}>Görünüm</Subtitle>
        <View style={{ flexDirection: 'row' }}>
          {(['dark', 'light'] as ThemePreference[]).map((p) => (
            <Chip key={p} label={p === 'light' ? 'Açık' : 'Koyu (Neon)'} selected={preference === p || (preference === 'system' && p === 'dark')} onPress={() => setPreference(p)} />
          ))}
        </View>
      </Card>

      <Card>
        <Subtitle style={{ marginBottom: 10 }}>Uyku Hedefi</Subtitle>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Field label="Hedef yatma saati" keyboardType="number-pad" value={bedtimeHour} onChangeText={setBedtimeHour} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Dakika" keyboardType="number-pad" value={bedtimeMinute} onChangeText={setBedtimeMinute} />
          </View>
        </View>
      </Card>

      <Card>
        <Subtitle style={{ marginBottom: 10 }}>Varsayılan Alarm Sesi</Subtitle>
        <PrimaryButton title={defaultAlarmSound ? 'Değiştir' : 'Ses seç'} variant="outline" onPress={pickDefaultAlarmSound} />
      </Card>

      <Card>
        <Subtitle style={{ marginBottom: 10 }}>Jarvis (Gemini API)</Subtitle>
        <Field label="Gemini API Anahtarı" value={geminiApiKey} onChangeText={setGeminiApiKey} secureTextEntry placeholder="AIza..." />
        <BodyText style={{ marginBottom: 8 }}>Jarvis'in tonu</BodyText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {(['samimi', 'resmi', 'esprili'] as AppSettings['jarvisTone'][]).map((t) => (
            <Chip
              key={t}
              label={t === 'samimi' ? 'Samimi' : t === 'resmi' ? 'Resmi' : 'Esprili'}
              selected={jarvisTone === t}
              onPress={() => setJarvisTone(t)}
            />
          ))}
        </View>
      </Card>

      <Card>
        <Subtitle style={{ marginBottom: 10 }}>Hobi — Kapak Görseli (TMDb)</Subtitle>
        <Field label="TMDb API Anahtarı (film/dizi kapakları için)" value={tmdbApiKey} onChangeText={setTmdbApiKey} secureTextEntry placeholder="themoviedb.org'dan ücretsiz al" />
        <BodyText style={{ color: theme.colors.textMuted }}>Anime/manga (AniList) ve kitap (Open Library) kapakları için anahtar gerekmez.</BodyText>
      </Card>

      <Card>
        <Subtitle style={{ marginBottom: 10 }}>Jarvis Sesli Asistan ("Jarvis" de, uyansın)</Subtitle>
        <Field label="Picovoice AccessKey" value={picovoiceAccessKey} onChangeText={setPicovoiceAccessKey} secureTextEntry placeholder="Picovoice Console'dan al" />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <BodyText>Arka planda "Jarvis" dinle</BodyText>
          <Switch value={wakeWordEnabled} onValueChange={setWakeWordEnabled} />
        </View>
        {!isWakeWordSupported() ? (
          <BodyText style={{ color: theme.colors.warning }}>
            Bu özellik yalnızca EAS ile derlenmiş APK'da çalışır, şu an Expo Go'dasın.
          </BodyText>
        ) : null}
        <BodyText style={{ color: theme.colors.textMuted, marginTop: 6 }}>
          Kurulum adımları: assets/wakeword/README.md
        </BodyText>
      </Card>

      <Card>
        <Subtitle style={{ marginBottom: 10 }}>Gizlilik Kilidi</Subtitle>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <BodyText>Uygulama açılışında kilit iste</BodyText>
          <Switch value={lockEnabled} onValueChange={handleToggleLock} />
        </View>
        <Field label="Yeni PIN belirle" value={newPin} onChangeText={setNewPin} secureTextEntry keyboardType="number-pad" />
        <PrimaryButton title="PIN'i kaydet ve kilidi aç" variant="outline" onPress={handleSetPin} />
        {biometricAvailable ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <BodyText>Parmak izi / yüz tanıma da kullan</BodyText>
            <Switch
              value={biometricEnabled}
              onValueChange={async (v) => {
                setBiometricEnabled(v);
                await updateSettings({ biometricEnabled: v });
              }}
            />
          </View>
        ) : null}
      </Card>

      <Card>
        <Subtitle style={{ marginBottom: 10 }}>Yedekleme</Subtitle>
        <PrimaryButton title="Tüm verileri dışa aktar" variant="outline" onPress={handleExportAll} />
      </Card>

      <PrimaryButton title={saved ? '✓ Kaydedildi' : 'Kaydet'} onPress={persistCore} />
    </Screen>
  );
}
