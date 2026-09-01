import React, { useCallback, useState } from 'react';
import { View, Pressable, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Title, Subtitle, Card, BodyText, StatTile, Chip, PrimaryButton, Field } from '../components/ui';
import { useAppTheme } from '../theme/ThemeContext';
import { listSleepEntries, getOpenSleepEntry, getActiveAwakeSession } from '../storage/sleepRepository';
import { listAlarms } from '../storage/alarmRepository';
import { listStories, listSongs, listNotes } from '../storage/creativeRepository';
import { listMedia } from '../storage/mediaRepository';
import { computeSleepStats, formatMinutes } from '../services/stats';
import { getSettings } from '../storage/settingsRepository';
import { logMood } from '../storage/moodRepository';
import { getJson, setJson, STORAGE_KEYS } from '../storage/storage';
import { getDailyMotivation, getDailyBriefing } from '../services/jarvisService';
import { MoodValue } from '../types';
import type { HomeStackParamList, RootTabParamList } from '../navigation/RootNavigator';

interface SearchResult {
  id: string;
  kind: 'story' | 'song' | 'note' | 'media';
  icon: string;
  title: string;
  snippet: string;
  tab: keyof RootTabParamList;
}

const MOOD_EMOJI: Record<MoodValue, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [stats, setStats] = useState(computeSleepStats([], 23, 0));
  const [sleeping, setSleeping] = useState(false);
  const [awake, setAwake] = useState(false);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [moodLogged, setMoodLogged] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [motivation, setMotivation] = useState('');
  const [briefing, setBriefing] = useState('');
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [entries, settings, openSleep, activeAwake] = await Promise.all([
          listSleepEntries(),
          getSettings(),
          getOpenSleepEntry(),
          getActiveAwakeSession(),
        ]);
        if (!active) return;
        setStats(computeSleepStats(entries, settings.bedtimeGoalHour, settings.bedtimeGoalMinute));
        setSleeping(!!openSleep);
        setAwake(!!activeAwake);
        setCustomImage(settings.customAppImageUri);
        setApiKey(settings.geminiApiKey);

        if (settings.geminiApiKey) {
          const today = new Date().toDateString();
          const cached = await getJson<{ date: string; text: string }>(STORAGE_KEYS.dailyMotivation, { date: '', text: '' });
          if (cached.date === today && cached.text) {
            setMotivation(cached.text);
          } else {
            const text = await getDailyMotivation(settings.geminiApiKey);
            if (text) {
              setMotivation(text);
              await setJson(STORAGE_KEYS.dailyMotivation, { date: today, text });
            }
          }
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const [stories, songs, notes, media] = await Promise.all([
      listStories(q),
      listSongs(q),
      listNotes(q),
      listMedia(undefined, q),
    ]);
    setSearchResults([
      ...stories.map((s) => ({ id: s.id, kind: 'story' as const, icon: '📖', title: s.title, snippet: s.content, tab: 'Creative' as const })),
      ...songs.map((s) => ({ id: s.id, kind: 'song' as const, icon: '🎵', title: s.title, snippet: s.lyrics, tab: 'Creative' as const })),
      ...notes.map((n) => ({ id: n.id, kind: 'note' as const, icon: '🗒️', title: n.title, snippet: n.content, tab: 'Creative' as const })),
      ...media.map((m) => ({ id: m.id, kind: 'media' as const, icon: '🎬', title: m.title, snippet: m.note, tab: 'Hobby' as const })),
    ]);
  }

  function goToResult(result: SearchResult) {
    setSearchQuery('');
    setSearchResults([]);
    navigation.getParent()?.navigate(result.tab as never);
  }

  async function handleBriefing() {
    if (!apiKey) return;
    setBriefingLoading(true);
    const [alarms, settings] = await Promise.all([listAlarms(), getSettings()]);
    const enabledAlarms = alarms.filter((a) => a.enabled);
    const context = `Bugünkü aktif alarmlar: ${
      enabledAlarms.length > 0 ? enabledAlarms.map((a) => `${String(a.hour).padStart(2, '0')}:${String(a.minute).padStart(2, '0')} (${a.label || 'Alarm'})`).join(', ') : 'yok'
    }. Hedef yatma saati: ${String(settings.bedtimeGoalHour).padStart(2, '0')}:${String(settings.bedtimeGoalMinute).padStart(2, '0')}. Streak: ${stats.streakDays} gün.`;
    const text = await getDailyBriefing(apiKey, context);
    setBriefing(text);
    setBriefingLoading(false);
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Title>RAER Special App</Title>
          <Subtitle>Sana özel kişisel asistan ve uyku takip sistemi</Subtitle>
        </View>
        {customImage ? (
          <Image source={{ uri: customImage }} style={{ width: 48, height: 48, borderRadius: 14, marginLeft: 12 }} />
        ) : null}
        <Pressable onPress={() => navigation.navigate('Settings')} style={{ marginLeft: 12, padding: 6 }}>
          <BodyText style={{ fontSize: 22 }}>⚙️</BodyText>
        </Pressable>
      </View>

      <Field label="🔍 Uygulamada Ara" placeholder="Hikaye, şarkı, not veya hobi ara..." value={searchQuery} onChangeText={handleSearch} />
      {searchResults.length > 0 ? (
        <Card>
          {searchResults.slice(0, 8).map((r) => (
            <Pressable key={`${r.kind}-${r.id}`} onPress={() => goToResult(r)} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
              <BodyText style={{ fontWeight: '700' }}>
                {r.icon} {r.title}
              </BodyText>
              <BodyText style={{ color: theme.colors.textMuted, fontSize: 12 }} numberOfLines={1}>
                {r.snippet}
              </BodyText>
            </Pressable>
          ))}
        </Card>
      ) : null}

      {motivation ? (
        <Card>
          <BodyText style={{ fontStyle: 'italic', color: theme.colors.primary }}>💬 {motivation}</BodyText>
        </Card>
      ) : null}

      {sleeping ? (
        <Card style={{ backgroundColor: theme.colors.primary }}>
          <BodyText style={{ color: theme.colors.primaryText, fontWeight: '700' }}>😴 Şu an uyku modundasın</BodyText>
        </Card>
      ) : null}
      {awake ? (
        <Card style={{ backgroundColor: theme.colors.warning }}>
          <BodyText style={{ color: '#1A1A1A', fontWeight: '700' }}>⚡ Uyanık kalma modu aktif</BodyText>
        </Card>
      ) : null}

      <Card>
        <Subtitle style={{ marginBottom: 10 }}>Uyku Özeti</Subtitle>
        <View style={{ flexDirection: 'row' }}>
          <StatTile label="Ortalama" value={formatMinutes(stats.averageDurationMinutes)} />
          <StatTile label="Streak" value={`${stats.streakDays} gün`} />
          <StatTile label="Düzen sapması" value={`${stats.consistencyMinutesStdDev} dk`} />
        </View>
      </Card>

      <Card>
        <Subtitle style={{ marginBottom: 10 }}>Bugün nasılsın?</Subtitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {([1, 2, 3, 4, 5] as MoodValue[]).map((value) => (
            <Chip
              key={value}
              label={MOOD_EMOJI[value]}
              onPress={async () => {
                await logMood(value);
                setMoodLogged(true);
              }}
            />
          ))}
        </View>
        {moodLogged ? <BodyText style={{ color: theme.colors.textMuted, marginTop: 4 }}>Kaydedildi, efendim.</BodyText> : null}
      </Card>

      {apiKey ? (
        <Card>
          <Subtitle style={{ marginBottom: 10 }}>Günlük Brifing</Subtitle>
          {briefing ? <BodyText style={{ marginBottom: 10 }}>{briefing}</BodyText> : null}
          {briefingLoading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <PrimaryButton title="📋 Bugünkü Brifingi Getir" variant="outline" onPress={handleBriefing} />
          )}
        </Card>
      ) : null}
    </Screen>
  );
}
