import { contextBridge, ipcRenderer } from 'electron';
import {
  AI_CHANNELS,
  SETTINGS_CHANNELS,
  STORE_CHANNELS,
  type AppState,
  type ChatRequest,
  type ChatResponse,
  type PublicSettings,
  type SettingsPatch,
} from '../shared/types';

contextBridge.exposeInMainWorld('jarvisDesktop', {
  loadState: (): Promise<AppState> => ipcRenderer.invoke(STORE_CHANNELS.load),
  saveState: (state: AppState): Promise<boolean> => ipcRenderer.invoke(STORE_CHANNELS.save, state),
  getSettings: (): Promise<PublicSettings> => ipcRenderer.invoke(SETTINGS_CHANNELS.get),
  updateSettings: (patch: SettingsPatch): Promise<PublicSettings> => ipcRenderer.invoke(SETTINGS_CHANNELS.set, patch),
  sendChat: (request: ChatRequest): Promise<ChatResponse> => ipcRenderer.invoke(AI_CHANNELS.chat, request),
});
