import React, { useCallback, useState } from 'react';
import { View, Pressable, Image } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Title, Subtitle, Card, BodyText, StatTile, Chip } from '../components/ui';
import { useAppTheme } from '../theme/ThemeContext';
import { listSleepEntries, getOpenSleepEntry, getActiveAwakeSession } from '../storage/sleepRepository';
import { computeSleepStats, formatMinutes } from '../services/stats';
import { getSettings } from '../storage/settingsRepository';
import { logMood } from '../storage/moodRepository';
import { MoodValue } from '../types';
import type { HomeStackParamList } from '../navigation/RootNavigator';

const MOOD_EMOJI: Record<MoodValue, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [stats, setStats] = useState(computeSleepStats([], 23, 0));
  const [sleeping, setSleeping] = useState(false);
  const [awake, setAwake] = useState(false);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [moodLogged, setMoodLogged] = useState(false);

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
      })();
      return () => {
        active = false;
      };
    }, [])
  );

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
    </Screen>
  );
}
