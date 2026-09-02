import type {
  AppState,
  ChatRequest,
  ChatResponse,
  GenerateCardsRequest,
  GenerateCardsResponse,
  ExtractNotesRequest,
  ExtractNotesResponse,
  PcExecuteResponse,
  SyncPullResponse,
  SyncPushResponse,
  TranscribeResponse,
  PendingPcAction,
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
      pushSync: (state: AppState) => Promise<SyncPushResponse>;
      pullSync: () => Promise<SyncPullResponse>;
      onSummon: (callback: () => void) => () => void;
      transcribe: (wav: Uint8Array) => Promise<TranscribeResponse>;
      extractNotes: (request: ExtractNotesRequest) => Promise<ExtractNotesResponse>;
      executeAction: (action: PendingPcAction) => Promise<PcExecuteResponse>;
      searchResearch: (query: string) => Promise<SearchResponse>;
      saveResearch: (result: ResearchResult, phaseId: string | null) => Promise<SaveResponse>;
      openExternal: (url: string) => Promise<boolean>;
    };
  }
}

export {};
