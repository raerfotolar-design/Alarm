import { app, safeStorage } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { PublicSettings, SettingsPatch } from '../shared/types';

const SETTINGS_FILE = 'jarvis-desktop-settings.json';

interface StoredSettings {
  /** Either an OS-encrypted key (base64) or, when encryption is unavailable, the raw key. */
  geminiApiKey: string;
  geminiApiKeyEncrypted: boolean;
  geminiModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
}

const DEFAULTS: StoredSettings = {
  geminiApiKey: '',
  geminiApiKeyEncrypted: false,
  geminiModel: 'gemini-3.6-flash',
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.1:8b',
};

function settingsPath(): string {
  return path.join(app.getPath('userData'), SETTINGS_FILE);
}

async function readStored(): Promise<StoredSettings> {
  try {
    const raw = await fs.readFile(settingsPath(), 'utf-8');
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<StoredSettings>) };
  } catch {
    return { ...DEFAULTS };
  }
}

async function writeStored(settings: StoredSettings): Promise<void> {
  await fs.mkdir(path.dirname(settingsPath()), { recursive: true });
  await fs.writeFile(settingsPath(), JSON.stringify(settings, null, 2), 'utf-8');
}

export async function getPublicSettings(): Promise<PublicSettings> {
  const stored = await readStored();
  return {
    hasGeminiKey: stored.geminiApiKey.length > 0,
    geminiModel: stored.geminiModel,
    ollamaBaseUrl: stored.ollamaBaseUrl,
    ollamaModel: stored.ollamaModel,
  };
}

export async function updateSettings(patch: SettingsPatch): Promise<PublicSettings> {
  const stored = await readStored();

  if (patch.geminiApiKey !== undefined) {
    if (patch.geminiApiKey === null || patch.geminiApiKey === '') {
      stored.geminiApiKey = '';
      stored.geminiApiKeyEncrypted = false;
    } else if (safeStorage.isEncryptionAvailable()) {
      stored.geminiApiKey = safeStorage.encryptString(patch.geminiApiKey).toString('base64');
      stored.geminiApiKeyEncrypted = true;
    } else {
      stored.geminiApiKey = patch.geminiApiKey;
      stored.geminiApiKeyEncrypted = false;
    }
  }
  if (patch.geminiModel !== undefined) stored.geminiModel = patch.geminiModel;
  if (patch.ollamaBaseUrl !== undefined) stored.ollamaBaseUrl = patch.ollamaBaseUrl;
  if (patch.ollamaModel !== undefined) stored.ollamaModel = patch.ollamaModel;

  await writeStored(stored);
  return getPublicSettings();
}

/** Main-process only — the decrypted key must never be sent to the renderer. */
export async function getGeminiApiKey(): Promise<string> {
  const stored = await readStored();
  if (!stored.geminiApiKey) return '';
  if (!stored.geminiApiKeyEncrypted) return stored.geminiApiKey;
  try {
    return safeStorage.decryptString(Buffer.from(stored.geminiApiKey, 'base64'));
  } catch {
    return '';
  }
}

export async function getAiConfig(): Promise<{
  geminiApiKey: string;
  geminiModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
}> {
  const stored = await readStored();
  return {
    geminiApiKey: await getGeminiApiKey(),
    geminiModel: stored.geminiModel,
    ollamaBaseUrl: stored.ollamaBaseUrl,
    ollamaModel: stored.ollamaModel,
  };
}
