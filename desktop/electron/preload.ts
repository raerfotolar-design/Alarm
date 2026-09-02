import { contextBridge, ipcRenderer } from 'electron';
import {
  AI_CHANNELS,
  RESEARCH_CHANNELS,
  SETTINGS_CHANNELS,
  STORE_CHANNELS,
  type AppState,
  type ChatRequest,
  type ChatResponse,
  type GenerateCardsRequest,
  type GenerateCardsResponse,
  type PublicSettings,
  type ResearchResult,
  type SaveResponse,
  type SearchResponse,
  type SettingsPatch,
} from '../shared/types';

contextBridge.exposeInMainWorld('jarvisDesktop', {
  loadState: (): Promise<AppState> => ipcRenderer.invoke(STORE_CHANNELS.load),
  saveState: (state: AppState): Promise<boolean> => ipcRenderer.invoke(STORE_CHANNELS.save, state),
  getSettings: (): Promise<PublicSettings> => ipcRenderer.invoke(SETTINGS_CHANNELS.get),
  updateSettings: (patch: SettingsPatch): Promise<PublicSettings> => ipcRenderer.invoke(SETTINGS_CHANNELS.set, patch),
  sendChat: (request: ChatRequest): Promise<ChatResponse> => ipcRenderer.invoke(AI_CHANNELS.chat, request),
  generateCards: (request: GenerateCardsRequest): Promise<GenerateCardsResponse> =>
    ipcRenderer.invoke(AI_CHANNELS.generateCards, request),
  searchResearch: (query: string): Promise<SearchResponse> => ipcRenderer.invoke(RESEARCH_CHANNELS.search, query),
  saveResearch: (result: ResearchResult, phaseId: string | null): Promise<SaveResponse> =>
    ipcRenderer.invoke(RESEARCH_CHANNELS.save, result, phaseId),
  openExternal: (url: string): Promise<boolean> => ipcRenderer.invoke(RESEARCH_CHANNELS.openExternal, url),
});
