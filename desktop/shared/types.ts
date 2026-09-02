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

export type ResearchKind = 'image' | 'video';

export interface ResearchResult {
  id: string;
  kind: ResearchKind;
  title: string;
  /** Preview image. For videos this is the video thumbnail. */
  thumbnailUrl: string;
  /** Page to open in a browser. */
  sourceUrl: string;
  /** Direct media URL, or '' when the provider offers no downloadable file. */
  downloadUrl: string;
  provider: string;
}

export interface SavedResearchItem {
  id: string;
  title: string;
  kind: ResearchKind;
  provider: string;
  sourceUrl: string;
  /** Where the file landed on disk, or '' when only the link was kept. */
  filePath: string;
  phaseId: string | null;
  createdAt: string;
}

export type PcToolName =
  | 'list_dir'
  | 'read_file'
  | 'search_files'
  | 'system_info'
  | 'open_path'
  | 'write_file'
  | 'delete_path'
  | 'move_path'
  | 'run_command';

/** An action Jarvis wants to take that the user must approve first. */
export interface PendingPcAction {
  id: string;
  tool: PcToolName;
  args: Record<string, unknown>;
  description: string;
}

export type PcExecuteResponse = { ok: true; output: string } | { ok: false; error: string };

export type TranscribeResponse = { ok: true; text: string } | { ok: false; error: string };

export interface ExtractNotesRequest {
  engine: AiEngine;
  transcript: string;
}

/** `triggered` means the user said "Jarvis konuş" — `message` is what to ask Jarvis. */
export type ExtractNotesResponse =
  | { ok: true; notes: string[]; triggered: boolean; message: string }
  | { ok: false; error: string };

export type LearningTopic = 'dil' | 'programlama';
export type ReviewGrade = 'zor' | 'orta' | 'kolay';

export interface LearningDeck {
  id: string;
  name: string;
  topic: LearningTopic;
}

/** A flashcard with its SM-2 scheduling state. */
export interface LearningCard {
  id: string;
  deckId: string;
  question: string;
  answer: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  /** ISO date (YYYY-MM-DD) this card is next due. */
  due: string;
  createdAt: string;
}

export interface LearningState {
  decks: LearningDeck[];
  cards: LearningCard[];
  /** Reviews per ISO date, for the streak and the heatmap. */
  reviewLog: Record<string, number>;
  activeTopic: LearningTopic;
  activeDeckId: string | null;
}

export interface MemoryFact {
  id: string;
  text: string;
  createdAt: string;
}

/**
 * Long-term memory. Only a window of recent messages fits in a prompt, so anything
 * older is preserved here instead: durable facts plus a rolling summary of the
 * conversation up to `summarizedThroughId`.
 */
export interface JarvisMemory {
  summary: string;
  facts: MemoryFact[];
  summarizedThroughId: string | null;
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
  memory: JarvisMemory;
  savedResearch: SavedResearchItem[];
  learning: LearningState;
}

/** Settings as the renderer sees them — API keys themselves never leave the main process. */
export interface PublicSettings {
  hasGeminiKey: boolean;
  hasYoutubeKey: boolean;
  geminiModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  saveFolder: string;
  pcControlEnabled: boolean;
  whisperPath: string;
  whisperModelPath: string;
}

export interface SettingsPatch {
  /** A new key, or null to clear the stored one. Omit to leave it untouched. */
  geminiApiKey?: string | null;
  youtubeApiKey?: string | null;
  geminiModel?: string;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
  saveFolder?: string;
  pcControlEnabled?: boolean;
  whisperPath?: string;
  whisperModelPath?: string;
}

export interface ChatRequest {
  engine: AiEngine;
  /** The full conversation — the main process decides what fits in the prompt and what gets summarized. */
  history: ChatMessage[];
  userText: string;
  memory: JarvisMemory;
  notes: ListeningNote[];
}

export type ChatResponse =
  /**
   * `memory` is present only when this turn produced an updated summary or new facts;
   * `pendingAction` when Jarvis wants to do something that needs the user's approval.
   */
  | { ok: true; text: string; memory?: JarvisMemory; pendingAction?: PendingPcAction }
  | { ok: false; error: string };

export const STORE_CHANNELS = {
  load: 'store:load',
  save: 'store:save',
} as const;

export const AI_CHANNELS = {
  chat: 'ai:chat',
  generateCards: 'ai:generateCards',
  extractNotes: 'ai:extractNotes',
} as const;

export const SETTINGS_CHANNELS = {
  get: 'settings:get',
  set: 'settings:set',
} as const;

export const PC_CHANNELS = {
  execute: 'pc:execute',
} as const;

export const STT_CHANNELS = {
  transcribe: 'stt:transcribe',
} as const;

export const RESEARCH_CHANNELS = {
  search: 'research:search',
  save: 'research:save',
  openExternal: 'research:openExternal',
} as const;

export interface GeneratedCard {
  question: string;
  answer: string;
}

export interface GenerateCardsRequest {
  engine: AiEngine;
  topic: LearningTopic;
  subject: string;
  count: number;
}

export type GenerateCardsResponse = { ok: true; cards: GeneratedCard[] } | { ok: false; error: string };

export type SearchResponse = { ok: true; results: ResearchResult[]; notes: string[] } | { ok: false; error: string };

export type SaveResponse = { ok: true; item: SavedResearchItem } | { ok: false; error: string };
