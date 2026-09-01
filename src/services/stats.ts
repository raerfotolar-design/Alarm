import { SleepEntry } from '../types';

export interface SleepStats {
  averageDurationMinutes: number;
  longestMinutes: number;
  shortestMinutes: number;
  averageSleepHour: number; // 0-23.99, in local time, using a 24h wraparound centered on midnight
  consistencyMinutesStdDev: number;
  streakDays: number;
  weeklyTotals: { label: string; minutes: number }[];
}

function completed(entries: SleepEntry[]): SleepEntry[] {
  return entries.filter((e) => e.wakeAt && e.durationMinutes != null);
}

function sleepHourAsOffset(sleepAt: string): number {
  const d = new Date(sleepAt);
  const hour = d.getHours() + d.getMinutes() / 60;
  // shift so that hours after noon count as "late same night", before noon count as "very late"
  return hour < 12 ? hour + 24 : hour;
}

export function computeSleepStats(entries: SleepEntry[], bedtimeGoalHour: number, bedtimeGoalMinute: number): SleepStats {
  const done = completed(entries);
  if (done.length === 0) {
    return {
      averageDurationMinutes: 0,
      longestMinutes: 0,
      shortestMinutes: 0,
      averageSleepHour: 0,
      consistencyMinutesStdDev: 0,
      streakDays: 0,
      weeklyTotals: [],
    };
  }

  const durations = done.map((e) => e.durationMinutes as number);
  const averageDurationMinutes = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  const longestMinutes = Math.max(...durations);
  const shortestMinutes = Math.min(...durations);

  const hourOffsets = done.map((e) => sleepHourAsOffset(e.sleepAt));
  const averageSleepHour = hourOffsets.reduce((a, b) => a + b, 0) / hourOffsets.length;
  const mean = averageSleepHour;
  const variance = hourOffsets.reduce((acc, h) => acc + (h - mean) ** 2, 0) / hourOffsets.length;
  const consistencyMinutesStdDev = Math.round(Math.sqrt(variance) * 60);

  const goalOffset = bedtimeGoalHour < 12 ? bedtimeGoalHour + 24 : bedtimeGoalHour + bedtimeGoalMinute / 60;
  const sorted = [...done].sort((a, b) => b.sleepAt.localeCompare(a.sleepAt));
  let streakDays = 0;
  for (const entry of sorted) {
    const offset = sleepHourAsOffset(entry.sleepAt);
    if (Math.abs(offset - goalOffset) <= 1) {
      streakDays += 1;
    } else {
      break;
    }
  }

  const now = new Date();
  const weeklyTotals: { label: string; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const label = day.toLocaleDateString('tr-TR', { weekday: 'short' });
    const dayKey = day.toDateString();
    const minutes = done
      .filter((e) => new Date(e.sleepAt).toDateString() === dayKey)
      .reduce((acc, e) => acc + (e.durationMinutes ?? 0), 0);
    weeklyTotals.push({ label, minutes });
  }

  return {
    averageDurationMinutes,
    longestMinutes,
    shortestMinutes,
    averageSleepHour,
    consistencyMinutesStdDev,
    streakDays,
    weeklyTotals,
  };
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h <= 0) return `${m}dk`;
  return `${h}sa ${m}dk`;
}
