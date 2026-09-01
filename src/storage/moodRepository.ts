import { MoodEntry, MoodValue } from '../types';
import { getJson, setJson, newId, STORAGE_KEYS } from './storage';

export async function listMoods(): Promise<MoodEntry[]> {
  const moods = await getJson<MoodEntry[]>(STORAGE_KEYS.moods, []);
  return [...moods].sort((a, b) => b.date.localeCompare(a.date));
}

export async function logMood(value: MoodValue, note = ''): Promise<MoodEntry> {
  const moods = await getJson<MoodEntry[]>(STORAGE_KEYS.moods, []);
  const entry: MoodEntry = { id: newId(), date: new Date().toISOString(), value, note };
  await setJson(STORAGE_KEYS.moods, [entry, ...moods]);
  return entry;
}
