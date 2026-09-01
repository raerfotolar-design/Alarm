import { SleepEntry, AwakeSession } from '../types';
import { getJson, setJson, newId, STORAGE_KEYS } from './storage';

export async function listSleepEntries(): Promise<SleepEntry[]> {
  const entries = await getJson<SleepEntry[]>(STORAGE_KEYS.sleepEntries, []);
  return [...entries].sort((a, b) => b.sleepAt.localeCompare(a.sleepAt));
}

export async function startSleep(note = ''): Promise<SleepEntry> {
  const entries = await getJson<SleepEntry[]>(STORAGE_KEYS.sleepEntries, []);
  const entry: SleepEntry = {
    id: newId(),
    sleepAt: new Date().toISOString(),
    wakeAt: null,
    durationMinutes: null,
    mood: null,
    note,
  };
  await setJson(STORAGE_KEYS.sleepEntries, [entry, ...entries]);
  return entry;
}

export async function finishSleep(id: string, mood: SleepEntry['mood'] = null): Promise<SleepEntry | null> {
  const entries = await getJson<SleepEntry[]>(STORAGE_KEYS.sleepEntries, []);
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const wakeAt = new Date().toISOString();
  const sleepAt = new Date(entries[idx].sleepAt);
  const durationMinutes = Math.max(0, Math.round((new Date(wakeAt).getTime() - sleepAt.getTime()) / 60000));
  entries[idx] = { ...entries[idx], wakeAt, durationMinutes, mood };
  await setJson(STORAGE_KEYS.sleepEntries, entries);
  return entries[idx];
}

export async function addManualSleepEntry(input: {
  sleepAt: string;
  wakeAt: string;
  mood?: SleepEntry['mood'];
  note?: string;
}): Promise<SleepEntry> {
  const entries = await getJson<SleepEntry[]>(STORAGE_KEYS.sleepEntries, []);
  const durationMinutes = Math.max(
    0,
    Math.round((new Date(input.wakeAt).getTime() - new Date(input.sleepAt).getTime()) / 60000)
  );
  const entry: SleepEntry = {
    id: newId(),
    sleepAt: input.sleepAt,
    wakeAt: input.wakeAt,
    durationMinutes,
    mood: input.mood ?? null,
    note: input.note ?? '',
  };
  await setJson(STORAGE_KEYS.sleepEntries, [entry, ...entries]);
  return entry;
}

export async function deleteSleepEntry(id: string): Promise<void> {
  const entries = await getJson<SleepEntry[]>(STORAGE_KEYS.sleepEntries, []);
  await setJson(STORAGE_KEYS.sleepEntries, entries.filter((e) => e.id !== id));
}

export async function getOpenSleepEntry(): Promise<SleepEntry | null> {
  const entries = await getJson<SleepEntry[]>(STORAGE_KEYS.sleepEntries, []);
  return entries.find((e) => e.wakeAt == null) ?? null;
}

// --- Awake mode ---

export async function listAwakeSessions(): Promise<AwakeSession[]> {
  const sessions = await getJson<AwakeSession[]>(STORAGE_KEYS.awakeSessions, []);
  return [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export async function getActiveAwakeSession(): Promise<AwakeSession | null> {
  const sessions = await getJson<AwakeSession[]>(STORAGE_KEYS.awakeSessions, []);
  return sessions.find((s) => s.endedAt == null) ?? null;
}

export async function startAwakeSession(input: {
  targetTime: string;
  reason: string;
  reminderIntervalMinutes: number;
  tasksEnabled: boolean;
}): Promise<AwakeSession> {
  const sessions = await getJson<AwakeSession[]>(STORAGE_KEYS.awakeSessions, []);
  const session: AwakeSession = {
    id: newId(),
    startedAt: new Date().toISOString(),
    targetTime: input.targetTime,
    endedAt: null,
    reason: input.reason,
    reminderIntervalMinutes: input.reminderIntervalMinutes,
    tasksEnabled: input.tasksEnabled,
    tasks: [],
  };
  await setJson(STORAGE_KEYS.awakeSessions, [session, ...sessions]);
  return session;
}

export async function endAwakeSession(id: string): Promise<void> {
  const sessions = await getJson<AwakeSession[]>(STORAGE_KEYS.awakeSessions, []);
  const idx = sessions.findIndex((s) => s.id === id);
  if (idx === -1) return;
  sessions[idx] = { ...sessions[idx], endedAt: new Date().toISOString() };
  await setJson(STORAGE_KEYS.awakeSessions, sessions);
}

export async function logAwakeTask(sessionId: string, type: AwakeSession['tasks'][number]['type']): Promise<string> {
  const sessions = await getJson<AwakeSession[]>(STORAGE_KEYS.awakeSessions, []);
  const idx = sessions.findIndex((s) => s.id === sessionId);
  if (idx === -1) return '';
  const taskId = newId();
  sessions[idx].tasks = [
    ...sessions[idx].tasks,
    { id: taskId, askedAt: new Date().toISOString(), answeredAt: null, type },
  ];
  await setJson(STORAGE_KEYS.awakeSessions, sessions);
  return taskId;
}

export async function answerAwakeTask(sessionId: string, taskId: string): Promise<void> {
  const sessions = await getJson<AwakeSession[]>(STORAGE_KEYS.awakeSessions, []);
  const idx = sessions.findIndex((s) => s.id === sessionId);
  if (idx === -1) return;
  sessions[idx].tasks = sessions[idx].tasks.map((t) =>
    t.id === taskId ? { ...t, answeredAt: new Date().toISOString() } : t
  );
  await setJson(STORAGE_KEYS.awakeSessions, sessions);
}
