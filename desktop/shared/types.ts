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

export const STORE_CHANNELS = {
  load: 'store:load',
  save: 'store:save',
} as const;
