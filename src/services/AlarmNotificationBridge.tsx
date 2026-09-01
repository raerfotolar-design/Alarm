import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { listAlarms } from '../storage/alarmRepository';
import { getSettings } from '../storage/settingsRepository';
import { startAlarmRinging } from '../services/alarmRingStore';

/** Headless component: watches for alarm notifications (foreground arrival
 * or tapped-from-background) and starts the in-app gradual ring + puzzle
 * overlay. Foreground-only by nature of how notification listeners work. */
export function AlarmNotificationBridge() {
  useEffect(() => {
    async function handleAlarmId(alarmId: unknown) {
      if (typeof alarmId !== 'string') return;
      const [alarms, settings] = await Promise.all([listAlarms(), getSettings()]);
      const alarm = alarms.find((a) => a.id === alarmId);
      if (!alarm) return;
      startAlarmRinging(alarm.id, alarm.label || 'Alarm', alarm.soundUri ?? settings.defaultAlarmSoundUri);
    }

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      handleAlarmId(notification.request.content.data?.alarmId);
    });
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      handleAlarmId(response.notification.request.content.data?.alarmId);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  return null;
}
