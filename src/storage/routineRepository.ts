import { RoutineChecklistItem } from '../types';
import { getJson, setJson, newId, STORAGE_KEYS } from './storage';

const DEFAULT_ITEMS: RoutineChecklistItem[] = [
  { id: newId(), title: 'Işıkları kıs', done: false },
  { id: newId(), title: 'Telefonu bırak', done: false },
  { id: newId(), title: 'İlaç/vitamin aldım', done: false },
];

export async function listRoutineItems(): Promise<RoutineChecklistItem[]> {
  return getJson<RoutineChecklistItem[]>(STORAGE_KEYS.routineChecklist, DEFAULT_ITEMS);
}

export async function addRoutineItem(title: string): Promise<RoutineChecklistItem> {
  const items = await listRoutineItems();
  const item: RoutineChecklistItem = { id: newId(), title, done: false };
  const next = [...items, item];
  await setJson(STORAGE_KEYS.routineChecklist, next);
  return item;
}

export async function toggleRoutineItem(id: string): Promise<void> {
  const items = await listRoutineItems();
  await setJson(
    STORAGE_KEYS.routineChecklist,
    items.map((i) => (i.id === id ? { ...i, done: !i.done } : i))
  );
}

export async function resetRoutineChecklist(): Promise<void> {
  const items = await listRoutineItems();
  await setJson(STORAGE_KEYS.routineChecklist, items.map((i) => ({ ...i, done: false })));
}

export async function deleteRoutineItem(id: string): Promise<void> {
  const items = await listRoutineItems();
  await setJson(STORAGE_KEYS.routineChecklist, items.filter((i) => i.id !== id));
}
