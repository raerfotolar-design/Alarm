import type { AppState, SyncPullResponse, SyncPushResponse, SyncedState } from '../../shared/types';
import { getSyncConfig } from '../settings';

const TABLE = 'jarvis_state';
const TIMEOUT_MS = 20_000;

/**
 * Chat history is deliberately left out: it grows without bound and is the one part
 * that is genuinely per-device. Everything else — notes, plans, memory, saved
 * research and the learning deck — is what makes the phone and the PC feel like one app.
 */
export function toSyncedState(state: AppState): SyncedState {
  return {
    listeningNotes: state.listeningNotes,
    planPhases: state.planPhases,
    memory: state.memory,
    savedResearch: state.savedResearch,
    learning: state.learning,
  };
}

export function mergeSyncedState(local: AppState, remote: SyncedState): AppState {
  return {
    ...local,
    listeningNotes: remote.listeningNotes ?? local.listeningNotes,
    planPhases: remote.planPhases ?? local.planPhases,
    memory: remote.memory ?? local.memory,
    savedResearch: remote.savedResearch ?? local.savedResearch,
    learning: remote.learning ?? local.learning,
  };
}

function headers(anonKey: string): Record<string, string> {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  };
}

function endpoint(url: string): string {
  return `${url.replace(/\/$/, '')}/rest/v1/${TABLE}`;
}

/**
 * Last-write-wins on the whole document. That is the honest trade for a two-device
 * personal app: no merge conflicts to resolve, but whoever saves last is the version
 * that survives — so the app pulls at startup before it starts pushing.
 */
export async function pushState(state: AppState): Promise<SyncPushResponse> {
  const config = await getSyncConfig();
  if (!config.enabled) return { ok: false, error: 'Bulut eşitleme kapalı.' };
  if (!config.url || !config.anonKey) return { ok: false, error: 'Supabase adresi veya anahtarı girilmemiş.' };

  const updatedAt = new Date().toISOString();
  const row = { id: config.space, payload: toSyncedState(state), updated_at: updatedAt };

  try {
    const res = await fetch(`${endpoint(config.url)}?on_conflict=id`, {
      method: 'POST',
      headers: { ...headers(config.anonKey), Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      return { ok: false, error: `Yüklenemedi (HTTP ${res.status}): ${(await res.text()).slice(0, 200)}` };
    }
    return { ok: true, updatedAt };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Buluta bağlanılamadı.' };
  }
}

export async function pullState(): Promise<SyncPullResponse> {
  const config = await getSyncConfig();
  if (!config.enabled) return { ok: false, error: 'Bulut eşitleme kapalı.' };
  if (!config.url || !config.anonKey) return { ok: false, error: 'Supabase adresi veya anahtarı girilmemiş.' };

  try {
    const res = await fetch(
      `${endpoint(config.url)}?id=eq.${encodeURIComponent(config.space)}&select=payload,updated_at`,
      { headers: headers(config.anonKey), signal: AbortSignal.timeout(TIMEOUT_MS) },
    );
    if (!res.ok) {
      return { ok: false, error: `İndirilemedi (HTTP ${res.status}): ${(await res.text()).slice(0, 200)}` };
    }

    const rows = (await res.json()) as { payload?: SyncedState; updated_at?: string }[];
    const row = rows[0];
    // No row yet is the normal first-run case, not a failure.
    if (!row?.payload) return { ok: true, state: null, updatedAt: null };

    return { ok: true, state: row.payload, updatedAt: row.updated_at ?? null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Buluta bağlanılamadı.' };
  }
}
