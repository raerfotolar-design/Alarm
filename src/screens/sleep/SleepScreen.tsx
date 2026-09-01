import React, { useCallback, useState } from 'react';
import { View, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Title, Subtitle, Card, BodyText, PrimaryButton, StatTile, Chip, Field } from '../../components/ui';
import { useAppTheme } from '../../theme/ThemeContext';
import {
  getOpenSleepEntry,
  startSleep,
  finishSleep,
  listSleepEntries,
  deleteSleepEntry,
  getActiveAwakeSession,
  startAwakeSession,
  endAwakeSession,
} from '../../storage/sleepRepository';
import { getSettings } from '../../storage/settingsRepository';
import { computeSleepStats, formatMinutes } from '../../services/stats';
import { ensureNotificationSetup, scheduleAwakeReminder, cancelAllAwakeReminders } from '../../services/notifications';
import { SleepEntry, AwakeSession, MoodValue } from '../../types';

const MOOD_EMOJI: Record<MoodValue, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' };

type Mode = 'sleep' | 'awake';

export default function SleepScreen() {
  const { theme } = useAppTheme();
  const [mode, setMode] = useState<Mode>('sleep');
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [openEntry, setOpenEntry] = useState<SleepEntry | null>(null);
  const [activeAwake, setActiveAwake] = useState<AwakeSession | null>(null);
  const [bedtimeGoal, setBedtimeGoal] = useState({ hour: 23, minute: 0 });
  const [awakeTargetHour, setAwakeTargetHour] = useState('23');
  const [awakeTargetMinute, setAwakeTargetMinute] = useState('0');
  const [awakeReason, setAwakeReason] = useState('');
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    const [list, open, settings, awakeSession] = await Promise.all([
      listSleepEntries(),
      getOpenSleepEntry(),
      getSettings(),
      getActiveAwakeSession(),
    ]);
    setEntries(list);
    setOpenEntry(open);
    setBedtimeGoal({ hour: settings.bedtimeGoalHour, minute: settings.bedtimeGoalMinute });
    setActiveAwake(awakeSession);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const timer = setInterval(() => setNow(Date.now()), 30000);
      return () => clearInterval(timer);
    }, [load])
  );

  const stats = computeSleepStats(entries, bedtimeGoal.hour, bedtimeGoal.minute);

  async function handleStartSleep() {
    await startSleep();
    load();
  }

  async function handleFinishSleep(mood?: MoodValue) {
    if (!openEntry) return;
    await finishSleep(openEntry.id, mood ?? null);
    load();
  }

  async function handleStartAwake() {
    const hour = Math.min(23, Math.max(0, parseInt(awakeTargetHour, 10) || 0));
    const minute = Math.min(59, Math.max(0, parseInt(awakeTargetMinute, 10) || 0));
    const target = new Date();
    target.setHours(hour, minute, 0, 0);
    if (target.getTime() <= Date.now()) target.setDate(target.getDate() + 1);

    const granted = await ensureNotificationSetup();
    if (!granted) {
      Alert.alert('Bildirim izni gerekli', 'Hatırlatmaların çalışması için bildirim izni vermelisin.');
    }

    const session = await startAwakeSession({
      targetTime: target.toISOString(),
      reason: awakeReason,
      reminderIntervalMinutes: 20,
      tasksEnabled: true,
    });

    const totalMs = target.getTime() - Date.now();
    const intervalMs = 20 * 60 * 1000;
    let elapsed = intervalMs;
    while (elapsed < totalMs) {
      await scheduleAwakeReminder(
        Math.floor(elapsed / 1000),
        awakeReason ? `Uyanık kal! Sebep: ${awakeReason}` : 'Uyanık kalma vaktin sürüyor, pes etme.'
      );
      elapsed += intervalMs;
    }

    setActiveAwake(session);
  }

  async function handleEndAwake() {
    if (!activeAwake) return;
    await endAwakeSession(activeAwake.id);
    await cancelAllAwakeReminders();
    setActiveAwake(null);
  }

  return (
    <Screen>
      <Title>Uyku</Title>
      <Subtitle>İki mod: uyumak için, ya da uyanık kalman gerektiğinde.</Subtitle>

      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        <Chip label="🌙 Uyku Modu" selected={mode === 'sleep'} onPress={() => setMode('sleep')} />
        <Chip label="⚡ Uyanık Kalma Modu" selected={mode === 'awake'} onPress={() => setMode('awake')} />
      </View>

      {mode === 'sleep' ? (
        <>
          <Card>
            {openEntry ? (
              <>
                <BodyText style={{ marginBottom: 12 }}>
                  Uykuya daldığın saat: {new Date(openEntry.sleepAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </BodyText>
                <BodyText style={{ marginBottom: 12, color: theme.colors.textMuted }}>
                  Geçen süre: {formatMinutes(Math.round((now - new Date(openEntry.sleepAt).getTime()) / 60000))}
                </BodyText>
                <BodyText style={{ marginBottom: 8 }}>Uyandın mı? Ruh halini seç:</BodyText>
                <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                  {([1, 2, 3, 4, 5] as MoodValue[]).map((value) => (
                    <Chip key={value} label={MOOD_EMOJI[value]} onPress={() => handleFinishSleep(value)} />
                  ))}
                </View>
                <PrimaryButton title="Ruh hali seçmeden bitir" variant="outline" onPress={() => handleFinishSleep()} />
              </>
            ) : (
              <PrimaryButton title="😴 Uyudum (şimdi başlat)" onPress={handleStartSleep} />
            )}
          </Card>

          <Card>
            <Subtitle style={{ marginBottom: 10 }}>İstatistikler</Subtitle>
            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
              <StatTile label="Ortalama" value={formatMinutes(stats.averageDurationMinutes)} />
              <StatTile label="En uzun" value={formatMinutes(stats.longestMinutes)} />
              <StatTile label="En kısa" value={formatMinutes(stats.shortestMinutes)} />
            </View>
            <View style={{ flexDirection: 'row' }}>
              <StatTile label="Streak" value={`${stats.streakDays} gün`} />
              <StatTile label="Sapma" value={`${stats.consistencyMinutesStdDev} dk`} />
              <StatTile label="Toplam kayıt" value={`${entries.length}`} />
            </View>
          </Card>

          <Card>
            <Subtitle style={{ marginBottom: 10 }}>Geçmiş</Subtitle>
            {entries.slice(0, 10).map((e) => (
              <View
                key={e.id}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border,
                }}
              >
                <BodyText>{new Date(e.sleepAt).toLocaleDateString('tr-TR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</BodyText>
                <BodyText style={{ color: theme.colors.textMuted }}>
                  {e.durationMinutes != null ? formatMinutes(e.durationMinutes) : 'devam ediyor'}
                </BodyText>
              </View>
            ))}
            {entries.length === 0 ? <BodyText style={{ color: theme.colors.textMuted }}>Henüz kayıt yok.</BodyText> : null}
          </Card>
        </>
      ) : (
        <>
          {activeAwake ? (
            <Card style={{ backgroundColor: theme.colors.warning }}>
              <BodyText style={{ color: '#1A1A1A', fontWeight: '700', marginBottom: 8 }}>
                Hedef: {new Date(activeAwake.targetTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </BodyText>
              <BodyText style={{ color: '#1A1A1A', marginBottom: 12 }}>
                Kalan süre:{' '}
                {formatMinutes(Math.max(0, Math.round((new Date(activeAwake.targetTime).getTime() - now) / 60000)))}
              </BodyText>
              <PrimaryButton title="Uyanık kalma modunu bitir" variant="danger" onPress={handleEndAwake} />
            </Card>
          ) : (
            <Card>
              <BodyText style={{ marginBottom: 10 }}>Hangi saate kadar uyanık kalmalısın?</BodyText>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Field label="Saat" keyboardType="number-pad" value={awakeTargetHour} onChangeText={setAwakeTargetHour} />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Dakika" keyboardType="number-pad" value={awakeTargetMinute} onChangeText={setAwakeTargetMinute} />
                </View>
              </View>
              <Field label="Neden uyanık kalman gerekiyor?" value={awakeReason} onChangeText={setAwakeReason} placeholder="Örn. yarın sınav var" />
              <PrimaryButton title="⚡ Uyanık kalma modunu başlat" onPress={handleStartAwake} />
            </Card>
          )}
          <Card>
            <BodyText style={{ color: theme.colors.textMuted }}>
              Aktifken belirli aralıklarla motivasyon bildirimleri gönderilir. Jarvis'e "beni uyanık tut" diyerek de bu modu başlatabilirsin.
            </BodyText>
          </Card>
        </>
      )}
    </Screen>
  );
}
