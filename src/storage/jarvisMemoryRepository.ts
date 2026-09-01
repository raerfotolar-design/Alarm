import { getJson, setJson, newId, STORAGE_KEYS } from './storage';

export interface JarvisMemoryFact {
  id: string;
  fact: string;
  createdAt: string;
}

export async function listMemoryFacts(): Promise<JarvisMemoryFact[]> {
  return getJson<JarvisMemoryFact[]>(STORAGE_KEYS.jarvisMemory, []);
}

export async function rememberFact(fact: string): Promise<JarvisMemoryFact> {
  const facts = await listMemoryFacts();
  const entry: JarvisMemoryFact = { id: newId(), fact, createdAt: new Date().toISOString() };
  await setJson(STORAGE_KEYS.jarvisMemory, [entry, ...facts]);
  return entry;
}

export async function forgetFact(id: string): Promise<void> {
  const facts = await listMemoryFacts();
  await setJson(STORAGE_KEYS.jarvisMemory, facts.filter((f) => f.id !== id));
}
