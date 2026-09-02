import { app } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { AppState } from '../shared/types';

const STORE_FILE = 'jarvis-desktop-state.json';

function storePath(): string {
  return path.join(app.getPath('userData'), STORE_FILE);
}

function defaultState(): AppState {
  return {
    aiEngine: 'cloud',
    listeningMode: { jarvis: false, arastirma: false, planlama: false },
    chatMessages: [],
    listeningNotes: [],
    planPhases: [
      {
        id: 'faz-1',
        order: 1,
        title: 'Araştırma & Keşif',
        subtitle: '',
        progress: 100,
        possibilities: [],
        notes: [],
        researchIds: [],
      },
      {
        id: 'faz-2',
        order: 2,
        title: 'Konsept & Tasarım',
        subtitle: '',
        progress: 55,
        possibilities: [
          { id: 'olasilik-a', title: 'Minimal arayüz', selected: false },
          { id: 'olasilik-b', title: 'Yoğun bilgi paneli', selected: false },
          { id: 'olasilik-c', title: 'Hibrit', selected: true },
        ],
        notes: [],
        researchIds: [],
      },
      {
        id: 'faz-3',
        order: 3,
        title: 'Prototip & Test',
        subtitle: '',
        progress: 0,
        possibilities: [],
        notes: [],
        researchIds: [],
      },
      {
        id: 'faz-4',
        order: 4,
        title: 'Lansman',
        subtitle: '',
        progress: 0,
        possibilities: [],
        notes: [],
        researchIds: [],
      },
    ],
    selectedPhaseId: 'faz-2',
  };
}

export async function loadState(): Promise<AppState> {
  try {
    const raw = await fs.readFile(storePath(), 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

export async function saveState(state: AppState): Promise<void> {
  await fs.mkdir(path.dirname(storePath()), { recursive: true });
  await fs.writeFile(storePath(), JSON.stringify(state, null, 2), 'utf-8');
}
