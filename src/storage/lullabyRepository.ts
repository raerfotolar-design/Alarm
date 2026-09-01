import { LullabySettings } from '../types';
import { getJson, setJson, STORAGE_KEYS } from './storage';

const DEFAULT_SETTINGS: LullabySettings = {
  audioUri: null,
  youtubeUrl: '',
  loop: true,
  sleepTimerMinutes: 30,
};

export async function getLullabySettings(): Promise<LullabySettings> {
  return getJson<LullabySettings>(STORAGE_KEYS.lullaby, DEFAULT_SETTINGS);
}

export async function updateLullabySettings(patch: Partial<LullabySettings>): Promise<LullabySettings> {
  const current = await getLullabySettings();
  const next = { ...current, ...patch };
  await setJson(STORAGE_KEYS.lullaby, next);
  return next;
}
