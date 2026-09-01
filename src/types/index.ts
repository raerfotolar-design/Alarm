export type ISODateString = string;

export interface SleepEntry {
  id: string;
  sleepAt: ISODateString;
  wakeAt: ISODateString | null;
  durationMinutes: number | null;
  mood: MoodValue | null;
  note: string;
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
