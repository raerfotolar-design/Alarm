import { Bot } from '../types';
import { getJson, newId, setJson, STORAGE_KEYS } from './storage';
import { deleteBotSession } from './botSessionRepository';

export async function listBots(): Promise<Bot[]> {
  const bots = await getJson<Bot[]>(STORAGE_KEYS.bots, []);
  return [...bots].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getBot(id: string): Promise<Bot | null> {
  const bots = await getJson<Bot[]>(STORAGE_KEYS.bots, []);
  return bots.find((b) => b.id === id) ?? null;
}

export async function createBot(params: {
  name: string;
  avatarEmoji: string;
  shortDescription: string;
  personality: string;
  greeting: string;
  tags: string[];
}): Promise<Bot> {
  const now = new Date().toISOString();
  const bot: Bot = {
    id: newId(),
    name: params.name,
    avatarEmoji: params.avatarEmoji,
    shortDescription: params.shortDescription,
    personality: params.personality,
    greeting: params.greeting,
    tags: params.tags,
    createdAt: now,
    updatedAt: now,
  };
  const bots = await getJson<Bot[]>(STORAGE_KEYS.bots, []);
  await setJson(STORAGE_KEYS.bots, [...bots, bot]);
  return bot;
}

export async function updateBot(
  id: string,
  patch: Partial<Pick<Bot, 'name' | 'avatarEmoji' | 'shortDescription' | 'personality' | 'greeting' | 'tags'>>,
): Promise<void> {
  const bots = await getJson<Bot[]>(STORAGE_KEYS.bots, []);
  const next = bots.map((b) => (b.id === id ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b));
  await setJson(STORAGE_KEYS.bots, next);
}

export async function deleteBot(id: string): Promise<void> {
  const bots = await getJson<Bot[]>(STORAGE_KEYS.bots, []);
  await setJson(STORAGE_KEYS.bots, bots.filter((b) => b.id !== id));
  await deleteBotSession(id);
}
