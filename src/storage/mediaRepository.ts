import { MediaItem, MediaKind } from '../types';
import { getJson, setJson, newId, STORAGE_KEYS } from './storage';

async function listAll(): Promise<MediaItem[]> {
  const items = await getJson<MediaItem[]>(STORAGE_KEYS.media, []);
  return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listMedia(kind?: MediaKind, query = ''): Promise<MediaItem[]> {
  const items = await listAll();
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    if (kind && item.kind !== kind) return false;
    if (!q) return true;
    return item.title.toLowerCase().includes(q) || item.note.toLowerCase().includes(q);
  });
}

export async function saveMediaItem(input: Partial<MediaItem> & { id?: string; kind: MediaKind; title: string }): Promise<MediaItem> {
  const items = await getJson<MediaItem[]>(STORAGE_KEYS.media, []);
  const now = new Date().toISOString();

  if (input.id) {
    const idx = items.findIndex((i) => i.id === input.id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...input, updatedAt: now };
      await setJson(STORAGE_KEYS.media, items);
      return items[idx];
    }
  }

  const created: MediaItem = {
    id: newId(),
    kind: input.kind,
    title: input.title,
    coverUrl: input.coverUrl ?? null,
    status: input.status ?? 'watchlist',
    rating: input.rating ?? null,
    note: input.note ?? '',
    progressLabel: input.progressLabel ?? '',
    createdAt: now,
    updatedAt: now,
  };
  await setJson(STORAGE_KEYS.media, [created, ...items]);
  return created;
}

export async function deleteMediaItem(id: string): Promise<void> {
  const items = await getJson<MediaItem[]>(STORAGE_KEYS.media, []);
  await setJson(STORAGE_KEYS.media, items.filter((i) => i.id !== id));
}
