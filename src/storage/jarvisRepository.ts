import { JarvisChatMessage } from '../types';
import { getJson, setJson, newId, STORAGE_KEYS } from './storage';

export async function listChatMessages(): Promise<JarvisChatMessage[]> {
  return getJson<JarvisChatMessage[]>(STORAGE_KEYS.jarvisChat, []);
}

export async function appendChatMessage(
  role: JarvisChatMessage['role'],
  text: string,
  imageUri?: string
): Promise<JarvisChatMessage> {
  const messages = await listChatMessages();
  const message: JarvisChatMessage = {
    id: newId(),
    role,
    text,
    imageUri,
    createdAt: new Date().toISOString(),
  };
  await setJson(STORAGE_KEYS.jarvisChat, [...messages, message]);
  return message;
}

export async function clearChat(): Promise<void> {
  await setJson(STORAGE_KEYS.jarvisChat, []);
}
