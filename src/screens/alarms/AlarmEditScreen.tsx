import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { File } from 'expo-file-system';
import { Screen, Title, Field, PrimaryButton, Chip, BodyText } from '../../components/ui';
import { listAlarms, saveAlarm } from '../../storage/alarmRepository';
import { scheduleAlarmNotifications, ensureNotificationSetup } from '../../services/notifications';
import { playSound } from '../../services/audio';
import type { AlarmsStackParamList } from '../../navigation/RootNavigator';

const DAY_LABELS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

export default function AlarmEditScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AlarmsStackParamList>>();
  const route = useRoute<RouteProp<AlarmsStackParamList, 'AlarmEdit'>>();
  const alarmId = route.params?.alarmId;

  const [label, setLabel] = useState('');
  const [hour, setHour] = useState('08');
  const [minute, setMinute] = useState('00');
  const [days, setDays] = useState<number[]>([]);
  const [soundUri, setSoundUri] = useState<string | null>(null);

  useEffect(() => {
    if (!alarmId) return;
    listAlarms().then((alarms) => {
      const existing = alarms.find((a) => a.id === alarmId);
      if (!existing) return;
      setLabel(existing.label);
      setHour(String(existing.hour).padStart(2, '0'));
      setMinute(String(existing.minute).padStart(2, '0'));
      setDays(existing.days);
      setSoundUri(existing.soundUri);
    });
  }, [alarmId]);

  function toggleDay(day: number) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function pickSound() {
    try {
      const result = await File.pickFileAsync({ mimeTypes: ['audio/*'] });
      if (!result.canceled) {
        setSoundUri(result.result.uri);
      }
    } catch {
      // user cancelled or picker unavailable
    }
  }

  async function handleSave() {
    await ensureNotificationSetup();
    const alarm = await saveAlarm({
      id: alarmId,
      label,
      hour: Math.min(23, Math.max(0, parseInt(hour, 10) || 0)),
      minute: Math.min(59, Math.max(0, parseInt(minute, 10) || 0)),
      days,
      enabled: true,
      soundUri,
      linkedToAwakeMode: false,
    });
    await scheduleAlarmNotifications(alarm);
    navigation.goBack();
  }

  return (
    <Screen>
      <Title>{alarmId ? 'Alarmı düzenle' : 'Yeni alarm'}</Title>

      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Field label="Saat" keyboardType="number-pad" value={hour} onChangeText={setHour} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Dakika" keyboardType="number-pad" value={minute} onChangeText={setMinute} />
        </View>
      </View>

      <Field label="Etiket" value={label} onChangeText={setLabel} placeholder="Örn. İşe kalk" />

      <BodyText style={{ marginBottom: 8 }}>Tekrar günleri (boş = tek seferlik)</BodyText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
        {DAY_LABELS.map((d, i) => (
          <Chip key={d} label={d} selected={days.includes(i)} onPress={() => toggleDay(i)} />
        ))}
      </View>

      <PrimaryButton title={soundUri ? '🎵 Ses seçildi — değiştir' : '🎵 Özel alarm sesi seç'} variant="outline" onPress={pickSound} />
      {soundUri ? <PrimaryButton title="▶️ Sesi dinle" variant="outline" onPress={() => playSound(soundUri)} /> : null}

      <PrimaryButton title="Kaydet" onPress={handleSave} />
    </Screen>
  );
}
