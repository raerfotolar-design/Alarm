import type {
  AppState,
  ChatRequest,
  ChatResponse,
  PublicSettings,
  ResearchResult,
  SaveResponse,
  SearchResponse,
  SettingsPatch,
} from '../shared/types';

declare global {
  interface Window {
    jarvisDesktop: {
      loadState: () => Promise<AppState>;
      saveState: (state: AppState) => Promise<boolean>;
      getSettings: () => Promise<PublicSettings>;
      updateSettings: (patch: SettingsPatch) => Promise<PublicSettings>;
      sendChat: (request: ChatRequest) => Promise<ChatResponse>;
      searchResearch: (query: string) => Promise<SearchResponse>;
      saveResearch: (result: ResearchResult, phaseId: string | null) => Promise<SaveResponse>;
      openExternal: (url: string) => Promise<boolean>;
    };
  }
}

export {};
