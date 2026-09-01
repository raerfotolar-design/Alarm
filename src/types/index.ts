export type ISODateString = string;

export interface SleepEntry {
  id: string;
  sleepAt: ISODateString;
  wakeAt: ISODateString | null;
  durationMinutes: number | null;
  mood: MoodValue | null;
  note: string;
  dreamNote: string;
  lastCaffeineTime: string;
  screenTimeBeforeBedMinutes: number | null;
}

export interface RoutineChecklistItem {
  id: string;
  title: string;
  done: boolean;
}

export type AwakeTaskType = 'math' | 'typing';

export interface AwakeTaskLog {
  id: string;
  askedAt: ISODateString;
  answeredAt: ISODateString | null;
  type: AwakeTaskType;
}

export interface AwakeSession {
  id: string;
  startedAt: ISODateString;
  targetTime: ISODateString;
  endedAt: ISODateString | null;
  reason: string;
  reminderIntervalMinutes: number;
  tasksEnabled: boolean;
  tasks: AwakeTaskLog[];
}

export interface Alarm {
  id: string;
  label: string;
  hour: number;
  minute: number;
  days: number[]; // 0=Sunday .. 6=Saturday, empty = one-off
  enabled: boolean;
  soundUri: string | null;
  linkedToAwakeMode: boolean;
  createdAt: ISODateString;
}

export type MoodValue = 1 | 2 | 3 | 4 | 5;

export interface MoodEntry {
  id: string;
  date: ISODateString;
  value: MoodValue;
  note: string;
}

export interface CreativeItemBase {
  id: string;
  title: string;
  tags: string[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Story extends CreativeItemBase {
  content: string;
}

export interface Song extends CreativeItemBase {
  lyrics: string;
}

export interface Note extends CreativeItemBase {
  content: string;
  voiceUri: string | null;
}

export type ThemePreference = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: ThemePreference;
  bedtimeGoalHour: number;
  bedtimeGoalMinute: number;
  geminiApiKey: string;
  picovoiceAccessKey: string;
  tmdbApiKey: string;
  jarvisTone: 'samimi' | 'resmi' | 'esprili';
  wakeWordEnabled: boolean;
  lockEnabled: boolean;
  biometricEnabled: boolean;
  pinHash: string;
  customAppImageUri: string | null;
  defaultAlarmSoundUri: string | null;
}

export interface JarvisChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  imageUri?: string;
  createdAt: ISODateString;
}

// --- Hobi (media tracking) ---

export type MediaKind = 'movie' | 'series' | 'anime' | 'manga' | 'book';
export type MediaStatus = 'watchlist' | 'in_progress' | 'done';

export interface MediaItem {
  id: string;
  kind: MediaKind;
  title: string;
  coverUrl: string | null;
  status: MediaStatus;
  rating: number | null; // 1-10
  note: string;
  progressLabel: string; // e.g. "S2E5" or "sayfa 120/400"
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// --- For My Love ---

export interface LoveNote {
  id: string;
  title: string;
  content: string;
  photoUris: string[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface SpecialDate {
  id: string;
  label: string;
  date: ISODateString;
  remindDaysBefore: number;
  notificationIds: string[];
}

export interface BucketListItem {
  id: string;
  title: string;
  done: boolean;
  createdAt: ISODateString;
}

// --- Ninni (lullaby) ---

export interface LullabySettings {
  audioUri: string | null;
  youtubeUrl: string;
  loop: boolean;
  sleepTimerMinutes: number;
}
