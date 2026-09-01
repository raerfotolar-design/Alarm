import React, { useEffect, useState } from 'react';
import { Modal, View } from 'react-native';
import { Screen, Title, Subtitle, Field, PrimaryButton, BodyText } from './ui';
import { useAppTheme } from '../theme/ThemeContext';
import { getRingingAlarm, subscribeRingingAlarm, stopAlarmRinging, RingingAlarm } from '../services/alarmRingStore';

export function AlarmRingOverlay() {
  const { theme } = useAppTheme();
  const [alarm, setAlarm] = useState<RingingAlarm | null>(getRingingAlarm());
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    return subscribeRingingAlarm((next) => {
      setAlarm(next);
      setAnswer('');
      setError(false);
    });
  }, []);

  if (!alarm) return null;

  function handleSubmit() {
    if (!alarm) return;
    const correct = alarm.puzzleA + alarm.puzzleB;
    if (parseInt(answer, 10) === correct) {
      stopAlarmRinging();
    } else {
      setError(true);
      setAnswer('');
    }
  }

  return (
    <Modal visible animationType="fade" onRequestClose={() => {}}>
      <Screen scroll={false}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Title style={{ textAlign: 'center' }}>⏰ {alarm.label}</Title>
          <Subtitle style={{ textAlign: 'center', marginBottom: 30 }}>Durdurmak için işlemi çöz</Subtitle>
          <BodyText style={{ textAlign: 'center', fontSize: 28, fontWeight: '700', marginBottom: 20 }}>
            {alarm.puzzleA} + {alarm.puzzleB} = ?
          </BodyText>
          <Field label="Cevap" keyboardType="number-pad" value={answer} onChangeText={setAnswer} />
          {error ? <BodyText style={{ color: theme.colors.danger, textAlign: 'center', marginBottom: 10 }}>Yanlış, tekrar dene.</BodyText> : null}
          <PrimaryButton title="Alarmı Durdur" onPress={handleSubmit} disabled={!answer} />
        </View>
      </Screen>
    </Modal>
  );
}
