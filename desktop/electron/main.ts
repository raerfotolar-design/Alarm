import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { loadState, saveState } from './store';
import { getPublicSettings, updateSettings } from './settings';
import { handleChat, handleGenerateCards } from './ai';
import { openExternal, saveResult, search } from './research';
import { handleMediaProtocol, registerMediaScheme } from './mediaProtocol';
import {
  AI_CHANNELS,
  RESEARCH_CHANNELS,
  SETTINGS_CHANNELS,
  STORE_CHANNELS,
  type AppState,
  type ChatRequest,
  type GenerateCardsRequest,
  type ResearchResult,
  type SettingsPatch,
} from '../shared/types';

const isDev = process.env.NODE_ENV === 'development';

registerMediaScheme();

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
  return updateSettings(patch);
});

ipcMain.handle(AI_CHANNELS.chat, async (_event, request: ChatRequest) => {
  return handleChat(request);
});

ipcMain.handle(AI_CHANNELS.generateCards, async (_event, request: GenerateCardsRequest) => {
  return handleGenerateCards(request);
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

app.whenReady().then(() => {
  handleMediaProtocol();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
