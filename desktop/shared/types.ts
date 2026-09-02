export type AiEngine = 'local' | 'cloud';

export interface ChatMessage {
  id: string;
  role: 'user' | 'jarvis';
  text: string;
  createdAt: string;
}

export interface ListeningNote {
  id: string;
  text: string;
  source: 'jarvis' | 'arastirma' | 'planlama';
  createdAt: string;
}

export interface PlanPossibility {
  id: string;
  title: string;
  selected: boolean;
}

export interface PlanPhase {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  progress: number;
  possibilities: PlanPossibility[];
  notes: string[];
  researchIds: string[];
}

export interface AppState {
  aiEngine: AiEngine;
  listeningMode: {
    jarvis: boolean;
    arastirma: boolean;
    planlama: boolean;
  };
  chatMessages: ChatMessage[];
  listeningNotes: ListeningNote[];
  planPhases: PlanPhase[];
  selectedPhaseId: string | null;
}

/** Settings as the renderer sees them — the Gemini key itself never leaves the main process. */
export interface PublicSettings {
  hasGeminiKey: boolean;
  geminiModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
}

export interface SettingsPatch {
  /** A new key, or null to clear the stored one. Omit to leave it untouched. */
  geminiApiKey?: string | null;
  geminiModel?: string;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
}

export interface ChatRequest {
  engine: AiEngine;
  history: ChatMessage[];
  userText: string;
}

export type ChatResponse = { ok: true; text: string } | { ok: false; error: string };

export const STORE_CHANNELS = {
  load: 'store:load',
  save: 'store:save',
} as const;

export const AI_CHANNELS = {
  chat: 'ai:chat',
} as const;

export const SETTINGS_CHANNELS = {
  get: 'settings:get',
  set: 'settings:set',
} as const;
