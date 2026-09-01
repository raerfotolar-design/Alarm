import * as SecureStore from 'expo-secure-store';
import { AppSettings } from '../types';
import { getJson, setJson, STORAGE_KEYS } from './storage';

const SECURE_KEYS = {
  geminiApiKey: 'raer_gemini_api_key',
  picovoiceAccessKey: 'raer_picovoice_access_key',
  pinHash: 'raer_pin_hash',
} as const;

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  bedtimeGoalHour: 23,
  bedtimeGoalMinute: 0,
  geminiApiKey: '',
  picovoiceAccessKey: '',
  wakeWordEnabled: false,
  lockEnabled: false,
  biometricEnabled: false,
  pinHash: '',
  customAppImageUri: null,
  defaultAlarmSoundUri: null,
};

type NonSecretSettings = Omit<AppSettings, 'geminiApiKey' | 'picovoiceAccessKey' | 'pinHash'>;

export async function getSettings(): Promise<AppSettings> {
  const nonSecret = await getJson<NonSecretSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const [geminiApiKey, picovoiceAccessKey, pinHash] = await Promise.all([
    SecureStore.getItemAsync(SECURE_KEYS.geminiApiKey),
    SecureStore.getItemAsync(SECURE_KEYS.picovoiceAccessKey),
    SecureStore.getItemAsync(SECURE_KEYS.pinHash),
  ]);
  return {
    ...DEFAULT_SETTINGS,
    ...nonSecret,
    geminiApiKey: geminiApiKey ?? '',
    picovoiceAccessKey: picovoiceAccessKey ?? '',
    pinHash: pinHash ?? '',
  };
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const next = { ...current, ...patch };

  const secureWrites: Promise<void>[] = [];
  if (patch.geminiApiKey !== undefined) {
    secureWrites.push(
      patch.geminiApiKey
        ? SecureStore.setItemAsync(SECURE_KEYS.geminiApiKey, patch.geminiApiKey)
        : SecureStore.deleteItemAsync(SECURE_KEYS.geminiApiKey)
    );
  }
  if (patch.picovoiceAccessKey !== undefined) {
    secureWrites.push(
      patch.picovoiceAccessKey
        ? SecureStore.setItemAsync(SECURE_KEYS.picovoiceAccessKey, patch.picovoiceAccessKey)
        : SecureStore.deleteItemAsync(SECURE_KEYS.picovoiceAccessKey)
    );
  }
  if (patch.pinHash !== undefined) {
    secureWrites.push(
      patch.pinHash
        ? SecureStore.setItemAsync(SECURE_KEYS.pinHash, patch.pinHash)
        : SecureStore.deleteItemAsync(SECURE_KEYS.pinHash)
    );
  }
  await Promise.all(secureWrites);

  const { geminiApiKey, picovoiceAccessKey, pinHash, ...nonSecret } = next;
  await setJson(STORAGE_KEYS.settings, nonSecret);

  return next;
}
