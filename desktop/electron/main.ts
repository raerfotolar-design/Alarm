import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'node:path';
import { loadState, saveState } from './store';
import { getHotkey, getPublicSettings, setHotkeyRegistered, updateSettings } from './settings';
import { DEFAULT_HOTKEY, registerHotkey, unregisterHotkey } from './hotkey';
import { handleChat, handleExtractNotes, handleGenerateCards } from './ai';
import { transcribe } from './stt';
import { openExternal, saveResult, search } from './research';
import { handleMediaProtocol, registerMediaScheme } from './mediaProtocol';
import { executeApprovedAction } from './pc';
import { pullState, pushState } from './sync';
import {
  AI_CHANNELS,
  PC_CHANNELS,
  RESEARCH_CHANNELS,
  STT_CHANNELS,
  SYNC_CHANNELS,
  SETTINGS_CHANNELS,
  STORE_CHANNELS,
  type AppState,
  type ChatRequest,
  type ExtractNotesRequest,
  type GenerateCardsRequest,
  type PendingPcAction,
  type ResearchResult,
  type SettingsPatch,
} from '../shared/types';

const isDev = process.env.NODE_ENV === 'development';

registerMediaScheme();

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#05070C',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow = win;
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
}

ipcMain.handle(STORE_CHANNELS.load, async () => {
  return loadState();
});

ipcMain.handle(STORE_CHANNELS.save, async (_event, state: AppState) => {
  await saveState(state);
  return true;
});

ipcMain.handle(SETTINGS_CHANNELS.get, async () => {
  return getPublicSettings();
});

ipcMain.handle(SETTINGS_CHANNELS.set, async (_event, patch: SettingsPatch) => {
  const updated = await updateSettings(patch);
  if (patch.hotkey !== undefined) {
    setHotkeyRegistered(registerHotkey(patch.hotkey || DEFAULT_HOTKEY, () => mainWindow));
    return getPublicSettings();
  }
  return updated;
});

ipcMain.handle(AI_CHANNELS.chat, async (_event, request: ChatRequest) => {
  return handleChat(request);
});

ipcMain.handle(AI_CHANNELS.generateCards, async (_event, request: GenerateCardsRequest) => {
  return handleGenerateCards(request);
});

ipcMain.handle(AI_CHANNELS.extractNotes, async (_event, request: ExtractNotesRequest) => {
  return handleExtractNotes(request);
});

ipcMain.handle(SYNC_CHANNELS.push, async (_event, state: AppState) => {
  return pushState(state);
});

ipcMain.handle(SYNC_CHANNELS.pull, async () => {
  return pullState();
});

ipcMain.handle(STT_CHANNELS.transcribe, async (_event, wav: Uint8Array) => {
  return transcribe(wav);
});

ipcMain.handle(PC_CHANNELS.execute, async (_event, action: PendingPcAction) => {
  return executeApprovedAction(action);
});

ipcMain.handle(RESEARCH_CHANNELS.search, async (_event, query: string) => {
  return search(query);
});

ipcMain.handle(RESEARCH_CHANNELS.save, async (_event, result: ResearchResult, phaseId: string | null) => {
  return saveResult(result, phaseId);
});

ipcMain.handle(RESEARCH_CHANNELS.openExternal, async (_event, url: string) => {
  return openExternal(url);
});

app.whenReady().then(async () => {
  // Listening mode needs the microphone; nothing else is granted.
  session.defaultSession.setPermissionRequestHandler((_contents, permission, callback) => {
    callback(permission === 'media');
  });

  handleMediaProtocol();
  createWindow();
  setHotkeyRegistered(registerHotkey(await getHotkey(), () => mainWindow));

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  unregisterHotkey();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
