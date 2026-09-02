import type {
  AppState,
  ChatRequest,
  ChatResponse,
  GenerateCardsRequest,
  GenerateCardsResponse,
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
      generateCards: (request: GenerateCardsRequest) => Promise<GenerateCardsResponse>;
      searchResearch: (query: string) => Promise<SearchResponse>;
      saveResearch: (result: ResearchResult, phaseId: string | null) => Promise<SaveResponse>;
      openExternal: (url: string) => Promise<boolean>;
    };
  }
}

export {};
