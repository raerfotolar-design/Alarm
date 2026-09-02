import type { AppState, SyncedState } from '../shared/types';

/**
 * Applies a pulled document over the local one. Mirrors `mergeSyncedState` in
 * electron/sync — chat history is per-device and is never replaced.
 */
export function mergeSynced(local: AppState, remote: SyncedState): AppState {
  return {
    ...local,
    listeningNotes: remote.listeningNotes ?? local.listeningNotes,
    planPhases: remote.planPhases ?? local.planPhases,
    memory: remote.memory ?? local.memory,
    savedResearch: remote.savedResearch ?? local.savedResearch,
    learning: remote.learning ?? local.learning,
  };
}
