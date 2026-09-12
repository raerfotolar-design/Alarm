import { ChatMessage, JoinMode, StorySession } from '../types';
import { getJson, newId, setJson, STORAGE_KEYS } from './storage';

export async function listSessionsForStory(storyId: string): Promise<StorySession[]> {
  const sessions = await getJson<StorySession[]>(STORAGE_KEYS.sessions, []);
  return sessions
    .filter((s) => s.storyId === storyId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getSession(id: string): Promise<StorySession | null> {
  const sessions = await getJson<StorySession[]>(STORAGE_KEYS.sessions, []);
  return sessions.find((s) => s.id === id) ?? null;
}

export async function createSession(params: { storyId: string; joinMode: JoinMode; joinPrompt: string }): Promise<StorySession> {
  const now = new Date().toISOString();
  const session: StorySession = {
    id: newId(),
    storyId: params.storyId,
    joinMode: params.joinMode,
    joinPrompt: params.joinPrompt,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  const sessions = await getJson<StorySession[]>(STORAGE_KEYS.sessions, []);
  await setJson(STORAGE_KEYS.sessions, [...sessions, session]);
  return session;
}

export async function appendMessage(sessionId: string, message: ChatMessage): Promise<void> {
  const sessions = await getJson<StorySession[]>(STORAGE_KEYS.sessions, []);
  const next = sessions.map((s) =>
    s.id === sessionId
      ? { ...s, messages: [...s.messages, message], updatedAt: new Date().toISOString() }
      : s,
  );
  await setJson(STORAGE_KEYS.sessions, next);
}

export async function deleteSession(id: string): Promise<void> {
  const sessions = await getJson<StorySession[]>(STORAGE_KEYS.sessions, []);
  await setJson(STORAGE_KEYS.sessions, sessions.filter((s) => s.id !== id));
}
