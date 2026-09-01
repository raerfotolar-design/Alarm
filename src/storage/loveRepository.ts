import { LoveNote, SpecialDate, BucketListItem } from '../types';
import { getJson, setJson, newId, STORAGE_KEYS } from './storage';

// --- Notes ---

export async function listLoveNotes(): Promise<LoveNote[]> {
  const notes = await getJson<LoveNote[]>(STORAGE_KEYS.loveNotes, []);
  return [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveLoveNote(input: Partial<LoveNote> & { id?: string }): Promise<LoveNote> {
  const notes = await getJson<LoveNote[]>(STORAGE_KEYS.loveNotes, []);
  const now = new Date().toISOString();
  if (input.id) {
    const idx = notes.findIndex((n) => n.id === input.id);
    if (idx !== -1) {
      notes[idx] = { ...notes[idx], ...input, updatedAt: now };
      await setJson(STORAGE_KEYS.loveNotes, notes);
      return notes[idx];
    }
  }
  const created: LoveNote = {
    id: newId(),
    title: input.title ?? '',
    content: input.content ?? '',
    photoUris: input.photoUris ?? [],
    createdAt: now,
    updatedAt: now,
  };
  await setJson(STORAGE_KEYS.loveNotes, [created, ...notes]);
  return created;
}

export async function deleteLoveNote(id: string): Promise<void> {
  const notes = await getJson<LoveNote[]>(STORAGE_KEYS.loveNotes, []);
  await setJson(STORAGE_KEYS.loveNotes, notes.filter((n) => n.id !== id));
}

// --- Special dates ---

export async function listSpecialDates(): Promise<SpecialDate[]> {
  const dates = await getJson<SpecialDate[]>(STORAGE_KEYS.specialDates, []);
  return [...dates].sort((a, b) => a.date.localeCompare(b.date));
}

export async function saveSpecialDate(input: Partial<SpecialDate> & { id?: string }): Promise<SpecialDate> {
  const dates = await getJson<SpecialDate[]>(STORAGE_KEYS.specialDates, []);
  if (input.id) {
    const idx = dates.findIndex((d) => d.id === input.id);
    if (idx !== -1) {
      dates[idx] = { ...dates[idx], ...input };
      await setJson(STORAGE_KEYS.specialDates, dates);
      return dates[idx];
    }
  }
  const created: SpecialDate = {
    id: newId(),
    label: input.label ?? '',
    date: input.date ?? new Date().toISOString(),
    remindDaysBefore: input.remindDaysBefore ?? 1,
    notificationIds: input.notificationIds ?? [],
  };
  await setJson(STORAGE_KEYS.specialDates, [created, ...dates]);
  return created;
}

export async function deleteSpecialDate(id: string): Promise<void> {
  const dates = await getJson<SpecialDate[]>(STORAGE_KEYS.specialDates, []);
  await setJson(STORAGE_KEYS.specialDates, dates.filter((d) => d.id !== id));
}

// --- Bucket list ---

export async function listBucketItems(): Promise<BucketListItem[]> {
  return getJson<BucketListItem[]>(STORAGE_KEYS.bucketList, []);
}

export async function addBucketItem(title: string): Promise<BucketListItem> {
  const items = await listBucketItems();
  const item: BucketListItem = { id: newId(), title, done: false, createdAt: new Date().toISOString() };
  await setJson(STORAGE_KEYS.bucketList, [item, ...items]);
  return item;
}

export async function toggleBucketItem(id: string): Promise<void> {
  const items = await listBucketItems();
  const updated = items.map((i) => (i.id === id ? { ...i, done: !i.done } : i));
  await setJson(STORAGE_KEYS.bucketList, updated);
}

export async function deleteBucketItem(id: string): Promise<void> {
  const items = await listBucketItems();
  await setJson(STORAGE_KEYS.bucketList, items.filter((i) => i.id !== id));
}
