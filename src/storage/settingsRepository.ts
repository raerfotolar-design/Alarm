import * as SecureStore from 'expo-secure-store';
import { AppSettings } from '../types';
import { getJson, setJson, STORAGE_KEYS } from './storage';

const SECURE_KEYS = {
  geminiApiKey: 'raer_gemini_api_key',
  picovoiceAccessKey: 'raer_picovoice_access_key',
  tmdbApiKey: 'raer_tmdb_api_key',
  pinHash: 'raer_pin_hash',
} as const;

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  bedtimeGoalHour: 23,
  bedtimeGoalMinute: 0,
  geminiApiKey: '',
  picovoiceAccessKey: '',
  tmdbApiKey: '',
  jarvisTone: 'samimi',
  wakeWordEnabled: false,
  lockEnabled: false,
  biometricEnabled: false,
  pinHash: '',
  customAppImageUri: null,
  defaultAlarmSoundUri: null,
};

type SecretKey = 'geminiApiKey' | 'picovoiceAccessKey' | 'tmdbApiKey' | 'pinHash';
type NonSecretSettings = Omit<AppSettings, SecretKey>;

export async function getSettings(): Promise<AppSettings> {
  const nonSecret = await getJson<NonSecretSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const [geminiApiKey, picovoiceAccessKey, tmdbApiKey, pinHash] = await Promise.all([
    SecureStore.getItemAsync(SECURE_KEYS.geminiApiKey),
    SecureStore.getItemAsync(SECURE_KEYS.picovoiceAccessKey),
    SecureStore.getItemAsync(SECURE_KEYS.tmdbApiKey),
    SecureStore.getItemAsync(SECURE_KEYS.pinHash),
  ]);
  return {
    ...DEFAULT_SETTINGS,
    ...nonSecret,
    geminiApiKey: geminiApiKey ?? '',
    picovoiceAccessKey: picovoiceAccessKey ?? '',
    tmdbApiKey: tmdbApiKey ?? '',
    pinHash: pinHash ?? '',
  };
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const next = { ...current, ...patch };

  const secureWrites: Promise<void>[] = [];
  const secretPatch: Partial<Record<SecretKey, string>> = {
    geminiApiKey: patch.geminiApiKey,
    picovoiceAccessKey: patch.picovoiceAccessKey,
    tmdbApiKey: patch.tmdbApiKey,
    pinHash: patch.pinHash,
  };
  for (const key of Object.keys(secretPatch) as SecretKey[]) {
    const value = secretPatch[key];
    if (value === undefined) continue;
    secureWrites.push(
      value ? SecureStore.setItemAsync(SECURE_KEYS[key], value) : SecureStore.deleteItemAsync(SECURE_KEYS[key])
    );
  }
  await Promise.all(secureWrites);

  const { geminiApiKey, picovoiceAccessKey, tmdbApiKey, pinHash, ...nonSecret } = next;
  await setJson(STORAGE_KEYS.settings, nonSecret);

  return next;
}
