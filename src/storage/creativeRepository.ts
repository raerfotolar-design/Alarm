import { Story, Song, Note } from '../types';
import { getJson, setJson, newId, STORAGE_KEYS } from './storage';

type Kind = 'stories' | 'songs' | 'notes';

const KEY_BY_KIND: Record<Kind, string> = {
  stories: STORAGE_KEYS.stories,
  songs: STORAGE_KEYS.songs,
  notes: STORAGE_KEYS.notes,
};

async function listAll<T extends { updatedAt: string }>(kind: Kind): Promise<T[]> {
  const items = await getJson<T[]>(KEY_BY_KIND[kind], []);
  return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function matches(query: string, title: string, tags: string[], body: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    title.toLowerCase().includes(q) ||
    body.toLowerCase().includes(q) ||
    tags.some((t) => t.toLowerCase().includes(q))
  );
}

export async function listStories(query = ''): Promise<Story[]> {
  const items = await listAll<Story>('stories');
  return items.filter((s) => matches(query, s.title, s.tags, s.content));
}

export async function listSongs(query = ''): Promise<Song[]> {
  const items = await listAll<Song>('songs');
  return items.filter((s) => matches(query, s.title, s.tags, s.lyrics));
}

export async function listNotes(query = ''): Promise<Note[]> {
  const items = await listAll<Note>('notes');
  return items.filter((n) => matches(query, n.title, n.tags, n.content));
}

type BodyField = 'content' | 'lyrics';

async function upsert<T extends { id: string; createdAt: string; updatedAt: string; history: { content: string; savedAt: string }[] }>(
  kind: Kind,
  bodyField: BodyField,
  input: Partial<T> & { id?: string }
): Promise<T> {
  const items = await getJson<T[]>(KEY_BY_KIND[kind], []);
  const now = new Date().toISOString();
  if (input.id) {
    const idx = items.findIndex((i) => i.id === input.id);
    if (idx !== -1) {
      const previousBody = (items[idx] as any)[bodyField] as string | undefined;
      const nextBody = (input as any)[bodyField] as string | undefined;
      const history = items[idx].history ?? [];
      const nextHistory =
        previousBody !== undefined && nextBody !== undefined && previousBody !== nextBody
          ? [{ content: previousBody, savedAt: items[idx].updatedAt }, ...history].slice(0, 20)
          : history;
      items[idx] = { ...items[idx], ...input, updatedAt: now, history: nextHistory } as T;
      await setJson(KEY_BY_KIND[kind], items);
      return items[idx];
    }
  }
  const created = { ...input, id: newId(), createdAt: now, updatedAt: now, history: [] } as unknown as T;
  await setJson(KEY_BY_KIND[kind], [created, ...items]);
  return created;
}

export function saveStory(input: Partial<Story> & { id?: string }) {
  return upsert<Story>('stories', 'content', input);
}
export function saveSong(input: Partial<Song> & { id?: string }) {
  return upsert<Song>('songs', 'lyrics', input);
}
export function saveNote(input: Partial<Note> & { id?: string }) {
  return upsert<Note>('notes', 'content', input);
}

export async function deleteItem(kind: Kind, id: string): Promise<void> {
  const items = await getJson<{ id: string }[]>(KEY_BY_KIND[kind], []);
  await setJson(KEY_BY_KIND[kind], items.filter((i) => i.id !== id));
}
