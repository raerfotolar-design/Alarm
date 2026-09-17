import { Bot, BotSession, ChatMessage } from '../types';
import { getJson, newId, setJson, STORAGE_KEYS } from './storage';

/**
 * One ongoing conversation thread per bot (like PolyBuzz's single-thread-per-character
 * chat), created lazily on first open and seeded with the bot's own greeting line.
 */
export async function getOrCreateSessionForBot(bot: Bot): Promise<BotSession> {
  const sessions = await getJson<BotSession[]>(STORAGE_KEYS.botSessions, []);
  const existing = sessions.find((s) => s.botId === bot.id);
  if (existing) return existing;

  const now = new Date().toISOString();
  const greeting: ChatMessage[] = bot.greeting.trim()
    ? [{ id: newId(), role: 'ai', text: bot.greeting.trim(), createdAt: now }]
    : [];
  const session: BotSession = {
    id: newId(),
    botId: bot.id,
    messages: greeting,
    createdAt: now,
    updatedAt: now,
  };
  await setJson(STORAGE_KEYS.botSessions, [...sessions, session]);
  return session;
}

export async function getBotSession(id: string): Promise<BotSession | null> {
  const sessions = await getJson<BotSession[]>(STORAGE_KEYS.botSessions, []);
  return sessions.find((s) => s.id === id) ?? null;
}

export async function appendBotMessage(sessionId: string, message: ChatMessage): Promise<void> {
  const sessions = await getJson<BotSession[]>(STORAGE_KEYS.botSessions, []);
  const next = sessions.map((s) =>
    s.id === sessionId
      ? { ...s, messages: [...s.messages, message], updatedAt: new Date().toISOString() }
      : s,
  );
  await setJson(STORAGE_KEYS.botSessions, next);
}

export async function deleteBotSession(botId: string): Promise<void> {
  const sessions = await getJson<BotSession[]>(STORAGE_KEYS.botSessions, []);
  await setJson(STORAGE_KEYS.botSessions, sessions.filter((s) => s.botId !== botId));
}
