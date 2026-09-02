import { app, safeStorage } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { PublicSettings, SettingsPatch } from '../shared/types';

const SETTINGS_FILE = 'jarvis-desktop-settings.json';

interface StoredSettings {
  /** Either an OS-encrypted key (base64) or, when encryption is unavailable, the raw key. */
  geminiApiKey: string;
  geminiApiKeyEncrypted: boolean;
  youtubeApiKey: string;
  youtubeApiKeyEncrypted: boolean;
  geminiModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  saveFolder: string;
  pcControlEnabled: boolean;
  whisperPath: string;
  whisperModelPath: string;
}

const DEFAULTS: StoredSettings = {
  geminiApiKey: '',
  geminiApiKeyEncrypted: false,
  youtubeApiKey: '',
  youtubeApiKeyEncrypted: false,
  geminiModel: 'gemini-3.6-flash',
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.1:8b',
  saveFolder: '',
  pcControlEnabled: false,
  whisperPath: '',
  whisperModelPath: '',
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
    hasYoutubeKey: stored.youtubeApiKey.length > 0,
    geminiModel: stored.geminiModel,
    ollamaBaseUrl: stored.ollamaBaseUrl,
    ollamaModel: stored.ollamaModel,
    saveFolder: stored.saveFolder,
    pcControlEnabled: stored.pcControlEnabled,
    whisperPath: stored.whisperPath,
    whisperModelPath: stored.whisperModelPath,
  };
}

/** Encrypts with the OS keychain when it is available, otherwise stores as-is. */
function encodeSecret(value: string): { value: string; encrypted: boolean } {
  if (!value) return { value: '', encrypted: false };
  if (safeStorage.isEncryptionAvailable()) {
    return { value: safeStorage.encryptString(value).toString('base64'), encrypted: true };
  }
  return { value, encrypted: false };
}

function decodeSecret(value: string, encrypted: boolean): string {
  if (!value) return '';
  if (!encrypted) return value;
  try {
    return safeStorage.decryptString(Buffer.from(value, 'base64'));
  } catch {
    return '';
  }
}

export async function updateSettings(patch: SettingsPatch): Promise<PublicSettings> {
  const stored = await readStored();

  if (patch.geminiApiKey !== undefined) {
    const encoded = encodeSecret(patch.geminiApiKey ?? '');
    stored.geminiApiKey = encoded.value;
    stored.geminiApiKeyEncrypted = encoded.encrypted;
  }
  if (patch.youtubeApiKey !== undefined) {
    const encoded = encodeSecret(patch.youtubeApiKey ?? '');
    stored.youtubeApiKey = encoded.value;
    stored.youtubeApiKeyEncrypted = encoded.encrypted;
  }
  if (patch.geminiModel !== undefined) stored.geminiModel = patch.geminiModel;
  if (patch.ollamaBaseUrl !== undefined) stored.ollamaBaseUrl = patch.ollamaBaseUrl;
  if (patch.ollamaModel !== undefined) stored.ollamaModel = patch.ollamaModel;
  if (patch.saveFolder !== undefined) stored.saveFolder = patch.saveFolder;
  if (patch.pcControlEnabled !== undefined) stored.pcControlEnabled = patch.pcControlEnabled;
  if (patch.whisperPath !== undefined) stored.whisperPath = patch.whisperPath;
  if (patch.whisperModelPath !== undefined) stored.whisperModelPath = patch.whisperModelPath;

  await writeStored(stored);
  return getPublicSettings();
}

/** Main-process only. */
export async function getResearchConfig(): Promise<{ youtubeApiKey: string; saveFolder: string }> {
  const stored = await readStored();
  return {
    youtubeApiKey: decodeSecret(stored.youtubeApiKey, stored.youtubeApiKeyEncrypted),
    saveFolder: stored.saveFolder,
  };
}

export async function getSttConfig(): Promise<{ whisperPath: string; whisperModelPath: string }> {
  const stored = await readStored();
  return { whisperPath: stored.whisperPath, whisperModelPath: stored.whisperModelPath };
}

/** Main-process only — the decrypted key must never be sent to the renderer. */
export async function getGeminiApiKey(): Promise<string> {
  const stored = await readStored();
  return decodeSecret(stored.geminiApiKey, stored.geminiApiKeyEncrypted);
}

export async function getAiConfig(): Promise<{
  geminiApiKey: string;
  geminiModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  pcControlEnabled: boolean;
}> {
  const stored = await readStored();
  return {
    geminiApiKey: await getGeminiApiKey(),
    geminiModel: stored.geminiModel,
    ollamaBaseUrl: stored.ollamaBaseUrl,
    ollamaModel: stored.ollamaModel,
    pcControlEnabled: stored.pcControlEnabled,
  };
}
