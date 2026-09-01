import React, { useCallback, useState } from 'react';
import { View, Switch, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Title, Subtitle, Card, BodyText, PrimaryButton } from '../../components/ui';
import { useAppTheme } from '../../theme/ThemeContext';
import { listAlarms, setAlarmEnabled, deleteAlarm } from '../../storage/alarmRepository';
import { scheduleAlarmNotifications, cancelAlarmNotifications, ensureNotificationSetup } from '../../services/notifications';
import { Alarm } from '../../types';
import type { AlarmsStackParamList } from '../../navigation/RootNavigator';

const DAY_LABELS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

export default function AlarmsScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AlarmsStackParamList>>();
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  const load = useCallback(async () => {
    setAlarms(await listAlarms());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function toggle(alarm: Alarm) {
    const next = !alarm.enabled;
    await setAlarmEnabled(alarm.id, next);
    if (next) {
      await ensureNotificationSetup();
      await scheduleAlarmNotifications({ ...alarm, enabled: true });
    } else {
      await cancelAlarmNotifications(alarm.id);
    }
    load();
  }

  async function remove(alarm: Alarm) {
    await cancelAlarmNotifications(alarm.id);
    await deleteAlarm(alarm.id);
    load();
  }

  return (
    <Screen>
      <Title>Alarmlar</Title>
      <Subtitle>Klasik alarmlar, uyanık kalma moduyla da bağlantılı çalışabilir.</Subtitle>

      <PrimaryButton title="+ Yeni alarm" onPress={() => navigation.navigate('AlarmEdit', undefined)} />

      {alarms.map((alarm) => (
        <Card key={alarm.id}>
          <Pressable onPress={() => navigation.navigate('AlarmEdit', { alarmId: alarm.id })}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <BodyText style={{ fontSize: 22, fontWeight: '700' }}>
                  {String(alarm.hour).padStart(2, '0')}:{String(alarm.minute).padStart(2, '0')}
                </BodyText>
                <BodyText style={{ color: theme.colors.textMuted }}>{alarm.label || 'Alarm'}</BodyText>
                <BodyText style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 4 }}>
                  {alarm.days.length === 0 ? 'Tek seferlik' : alarm.days.map((d) => DAY_LABELS[d]).join(', ')}
                </BodyText>
              </View>
              <Switch value={alarm.enabled} onValueChange={() => toggle(alarm)} />
            </View>
          </Pressable>
          <PrimaryButton title="Sil" variant="danger" onPress={() => remove(alarm)} style={{ marginTop: 10, marginBottom: 0 }} />
        </Card>
      ))}

      {alarms.length === 0 ? <BodyText style={{ color: theme.colors.textMuted }}>Henüz alarm kurulmadı.</BodyText> : null}
    </Screen>
  );
}
