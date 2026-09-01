import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const STORAGE_KEYS = {
  sleepEntries: 'raer.sleepEntries.v1',
  awakeSessions: 'raer.awakeSessions.v1',
  alarms: 'raer.alarms.v1',
  moods: 'raer.moods.v1',
  stories: 'raer.stories.v1',
  songs: 'raer.songs.v1',
  notes: 'raer.notes.v1',
  settings: 'raer.settings.v1',
  jarvisChat: 'raer.jarvisChat.v1',
  media: 'raer.media.v1',
  loveNotes: 'raer.loveNotes.v1',
  specialDates: 'raer.specialDates.v1',
  bucketList: 'raer.bucketList.v1',
  lullaby: 'raer.lullaby.v1',
  jarvisMemory: 'raer.jarvisMemory.v1',
  routineChecklist: 'raer.routineChecklist.v1',
  dailyMotivation: 'raer.dailyMotivation.v1',
} as const;
