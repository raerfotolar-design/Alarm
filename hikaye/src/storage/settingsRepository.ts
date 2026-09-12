import { Settings } from '../types';
import { getJson, setJson, STORAGE_KEYS } from './storage';

const DEFAULTS: Settings = { geminiApiKey: '' };

export async function getSettings(): Promise<Settings> {
  return getJson<Settings>(STORAGE_KEYS.settings, DEFAULTS);
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await setJson(STORAGE_KEYS.settings, next);
  return next;
}
