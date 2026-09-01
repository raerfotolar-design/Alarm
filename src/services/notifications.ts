import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Alarm } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Android notification channels are immutable once created — if an older build
// created these with weaker settings (no sound/low importance), later code
// changes are silently ignored on that device. Bumping the ID forces Android
// to create a fresh channel with the current (correct) settings.
const ALARM_CHANNEL_ID = 'raer-alarms-v2';
const REMINDER_CHANNEL_ID = 'raer-reminders-v2';

export async function ensureNotificationSetup(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
      name: 'Alarmlar',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 500, 250, 500],
      bypassDnd: true,
    });
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Uyanık Kalma Hatırlatmaları',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return status === 'granted';
}

export async function scheduleAlarmNotifications(alarm: Alarm): Promise<string[]> {
  await cancelAlarmNotifications(alarm.id);
  const ids: string[] = [];

  if (alarm.days.length === 0) {
    const now = new Date();
    const next = new Date();
    next.setHours(alarm.hour, alarm.minute, 0, 0);
    if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: alarm.label || 'Alarm',
        body: 'Kalkma zamanı geldi.',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: { alarmId: alarm.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: next,
        channelId: ALARM_CHANNEL_ID,
      },
    });
    ids.push(id);
  } else {
    for (const weekday of alarm.days) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: alarm.label || 'Alarm',
          body: 'Kalkma zamanı geldi.',
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: { alarmId: alarm.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: weekday + 1, // expo-notifications: 1=Sunday..7=Saturday
          hour: alarm.hour,
          minute: alarm.minute,
          channelId: ALARM_CHANNEL_ID,
        },
      });
      ids.push(id);
    }
  }

  return ids;
}

export async function cancelAlarmNotifications(alarmId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter((n) => n.content.data?.alarmId === alarmId);
  await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

export async function scheduleAwakeReminder(seconds: number, message: string): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'RAER',
      body: message,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: { kind: 'awake-reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      channelId: REMINDER_CHANNEL_ID,
    },
  });
}

export async function cancelAllAwakeReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter((n) => n.content.data?.kind === 'awake-reminder');
  await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

export async function sendImmediateNotification(title: string, body: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: 'default' },
    trigger: null,
  });
}
