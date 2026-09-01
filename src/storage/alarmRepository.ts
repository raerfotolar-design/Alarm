import { Alarm } from '../types';
import { getJson, setJson, newId, STORAGE_KEYS } from './storage';

export async function listAlarms(): Promise<Alarm[]> {
  const alarms = await getJson<Alarm[]>(STORAGE_KEYS.alarms, []);
  return [...alarms].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
}

export async function saveAlarm(input: Omit<Alarm, 'id' | 'createdAt'> & { id?: string }): Promise<Alarm> {
  const alarms = await getJson<Alarm[]>(STORAGE_KEYS.alarms, []);
  if (input.id) {
    const idx = alarms.findIndex((a) => a.id === input.id);
    if (idx !== -1) {
      alarms[idx] = { ...alarms[idx], ...input, id: input.id };
      await setJson(STORAGE_KEYS.alarms, alarms);
      return alarms[idx];
    }
  }
  const alarm: Alarm = { ...input, id: newId(), createdAt: new Date().toISOString() };
  await setJson(STORAGE_KEYS.alarms, [alarm, ...alarms]);
  return alarm;
}

export async function deleteAlarm(id: string): Promise<void> {
  const alarms = await getJson<Alarm[]>(STORAGE_KEYS.alarms, []);
  await setJson(STORAGE_KEYS.alarms, alarms.filter((a) => a.id !== id));
}

export async function setAlarmEnabled(id: string, enabled: boolean): Promise<void> {
  const alarms = await getJson<Alarm[]>(STORAGE_KEYS.alarms, []);
  const idx = alarms.findIndex((a) => a.id === id);
  if (idx === -1) return;
  alarms[idx] = { ...alarms[idx], enabled };
  await setJson(STORAGE_KEYS.alarms, alarms);
}
