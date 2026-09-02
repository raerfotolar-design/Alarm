import type { AppState, ChatRequest, ChatResponse, PublicSettings, SettingsPatch } from '../shared/types';

declare global {
  interface Window {
    jarvisDesktop: {
      loadState: () => Promise<AppState>;
      saveState: (state: AppState) => Promise<boolean>;
      getSettings: () => Promise<PublicSettings>;
      updateSettings: (patch: SettingsPatch) => Promise<PublicSettings>;
      sendChat: (request: ChatRequest) => Promise<ChatResponse>;
    };
  }
}

export {};
