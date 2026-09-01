import type { FunctionDeclaration } from '@google/genai/web';
import { Type } from '@google/genai/web';
import {
  addManualSleepEntry,
  startSleep,
  finishSleep,
  getOpenSleepEntry,
  listSleepEntries,
  startAwakeSession,
} from '../storage/sleepRepository';
import { computeSleepStats, formatMinutes } from './stats';
import { getSettings } from '../storage/settingsRepository';
import { saveAlarm } from '../storage/alarmRepository';
import { scheduleAlarmNotifications } from './notifications';
import { saveNote, saveSong, saveStory } from '../storage/creativeRepository';
import { logMood } from '../storage/moodRepository';
import { saveMediaItem, listMedia } from '../storage/mediaRepository';
import { lookupCoverUrl } from './mediaLookupService';
import { setLullabyPlaying } from './lullabyPlayer';
import { rememberFact, listMemoryFacts } from '../storage/jarvisMemoryRepository';
import { MoodValue, MediaKind } from '../types';

export const jarvisFunctionDeclarations: FunctionDeclaration[] = [
  {
    name: 'get_sleep_stats',
    description: "Kullanıcının uyku istatistiklerini (ortalama süre, düzen, streak) döndürür.",
  },
  {
    name: 'log_sleep',
    description: 'Geçmişe dönük bir uyku kaydı girer (yattığın ve kalktığın saat bilgisiyle).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        sleepAtIso: { type: Type.STRING, description: 'Yatma zamanı, ISO 8601 formatında.' },
        wakeAtIso: { type: Type.STRING, description: 'Uyanma zamanı, ISO 8601 formatında.' },
        note: { type: Type.STRING, description: 'Opsiyonel not.' },
      },
      required: ['sleepAtIso', 'wakeAtIso'],
    },
  },
  {
    name: 'start_sleep_now',
    description: 'Şu anı uykuya dalma zamanı olarak kaydeder (Uyku Modu başlatır).',
  },
  {
    name: 'finish_sleep_now',
    description: 'Açık olan uyku kaydını şu anki zamanla kapatır (uyandığını kaydeder).',
  },
  {
    name: 'set_alarm',
    description: 'Yeni bir alarm kurar.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        hour: { type: Type.NUMBER, description: '0-23 arası saat.' },
        minute: { type: Type.NUMBER, description: '0-59 arası dakika.' },
        label: { type: Type.STRING, description: 'Alarm etiketi.' },
        days: {
          type: Type.ARRAY,
          items: { type: Type.NUMBER },
          description: '0=Pazar..6=Cumartesi. Boş bırakılırsa tek seferlik alarm olur.',
        },
      },
      required: ['hour', 'minute'],
    },
  },
  {
    name: 'start_awake_session',
    description: 'Uyanık kalma modunu başlatır; hedef saate kadar hatırlatmalar gönderir.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        targetTimeIso: { type: Type.STRING, description: 'Hedef uyanık kalma saati, ISO 8601.' },
        reason: { type: Type.STRING, description: 'Neden uyanık kalınması gerektiği.' },
        reminderIntervalMinutes: { type: Type.NUMBER, description: 'Kaç dakikada bir hatırlatma gönderilsin.' },
      },
      required: ['targetTimeIso', 'reason'],
    },
  },
  {
    name: 'save_note',
    description: 'Notlar bölümüne yeni bir not kaydeder.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        content: { type: Type.STRING },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'save_song',
    description: 'Şarkı sözleri bölümüne yeni bir şarkı kaydeder.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        lyrics: { type: Type.STRING },
      },
      required: ['title', 'lyrics'],
    },
  },
  {
    name: 'save_story',
    description: 'Hikayeler bölümüne yeni bir hikaye kaydeder.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        content: { type: Type.STRING },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'log_mood',
    description: 'Kullanıcının şu anki ruh halini 1 (çok kötü) ile 5 (harika) arasında kaydeder.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        value: { type: Type.NUMBER, description: '1 ile 5 arasında bir tam sayı.' },
        note: { type: Type.STRING },
      },
      required: ['value'],
    },
  },
  {
    name: 'add_media_item',
    description: 'Hobi bölümüne (film/dizi/anime/manga/kitap) yeni bir kayıt ekler ve kapak görselini otomatik bulmaya çalışır.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Film/dizi/anime/manga/kitap adı.' },
        kind: { type: Type.STRING, description: "'movie' | 'series' | 'anime' | 'manga' | 'book' değerlerinden biri." },
        status: { type: Type.STRING, description: "'watchlist' | 'in_progress' | 'done', varsayılan 'watchlist'." },
      },
      required: ['title', 'kind'],
    },
  },
  {
    name: 'list_media_by_status',
    description: "Belirtilen türde ve durumdaki Hobi kayıtlarını listeler (örn. 'ne izlesem' sorusuna cevap vermek için izleme listesini getirir).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        kind: { type: Type.STRING, description: "'movie' | 'series' | 'anime' | 'manga' | 'book'." },
        status: { type: Type.STRING, description: "'watchlist' | 'in_progress' | 'done'." },
      },
      required: ['kind'],
    },
  },
  {
    name: 'play_lullaby',
    description: 'Kullanıcının kaydettiği ninniyi çalar.',
  },
  {
    name: 'stop_lullaby',
    description: 'Çalan ninniyi durdurur.',
  },
  {
    name: 'remember_fact',
    description: 'Kullanıcının "bunu unutma" dediği bir bilgiyi kalıcı olarak hafızana kaydeder.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        fact: { type: Type.STRING, description: 'Hatırlanacak bilgi, kısa ve net bir cümle olarak.' },
      },
      required: ['fact'],
    },
  },
  {
    name: 'recall_facts',
    description: 'Daha önce hatırlaman istenen tüm bilgileri getirir.',
  },
];

export async function executeJarvisFunction(name: string, args: Record<string, any>): Promise<Record<string, any>> {
  switch (name) {
    case 'get_sleep_stats': {
      const [entries, settings] = await Promise.all([listSleepEntries(), getSettings()]);
      const stats = computeSleepStats(entries, settings.bedtimeGoalHour, settings.bedtimeGoalMinute);
      return {
        averageDuration: formatMinutes(stats.averageDurationMinutes),
        longest: formatMinutes(stats.longestMinutes),
        shortest: formatMinutes(stats.shortestMinutes),
        streakDays: stats.streakDays,
        consistencyMinutesStdDev: stats.consistencyMinutesStdDev,
        totalEntries: entries.length,
      };
    }
    case 'log_sleep': {
      const entry = await addManualSleepEntry({
        sleepAt: args.sleepAtIso,
        wakeAt: args.wakeAtIso,
        note: args.note ?? '',
      });
      return { ok: true, durationMinutes: entry.durationMinutes };
    }
    case 'start_sleep_now': {
      const existing = await getOpenSleepEntry();
      if (existing) return { ok: false, reason: 'already_sleeping' };
      const entry = await startSleep();
      return { ok: true, id: entry.id };
    }
    case 'finish_sleep_now': {
      const existing = await getOpenSleepEntry();
      if (!existing) return { ok: false, reason: 'no_open_sleep' };
      const entry = await finishSleep(existing.id);
      return { ok: true, durationMinutes: entry?.durationMinutes ?? null };
    }
    case 'set_alarm': {
      const alarm = await saveAlarm({
        label: args.label ?? 'Alarm',
        hour: args.hour,
        minute: args.minute,
        days: args.days ?? [],
        enabled: true,
        soundUri: null,
        linkedToAwakeMode: false,
      });
      await scheduleAlarmNotifications(alarm);
      return { ok: true, alarmId: alarm.id };
    }
    case 'start_awake_session': {
      const session = await startAwakeSession({
        targetTime: args.targetTimeIso,
        reason: args.reason ?? '',
        reminderIntervalMinutes: args.reminderIntervalMinutes ?? 20,
        tasksEnabled: true,
      });
      return { ok: true, sessionId: session.id };
    }
    case 'save_note': {
      const note = await saveNote({ title: args.title, content: args.content, tags: [], voiceUri: null });
      return { ok: true, id: note.id };
    }
    case 'save_song': {
      const song = await saveSong({ title: args.title, lyrics: args.lyrics, tags: [] });
      return { ok: true, id: song.id };
    }
    case 'save_story': {
      const story = await saveStory({ title: args.title, content: args.content, tags: [] });
      return { ok: true, id: story.id };
    }
    case 'log_mood': {
      const clamped = Math.min(5, Math.max(1, Math.round(args.value))) as MoodValue;
      const entry = await logMood(clamped, args.note ?? '');
      return { ok: true, id: entry.id };
    }
    case 'add_media_item': {
      const kind = args.kind as MediaKind;
      const settings = await getSettings();
      const coverUrl = await lookupCoverUrl(args.title, kind, settings.tmdbApiKey);
      const item = await saveMediaItem({
        kind,
        title: args.title,
        status: args.status ?? 'watchlist',
        coverUrl,
      });
      return { ok: true, id: item.id, coverFound: !!coverUrl };
    }
    case 'list_media_by_status': {
      const items = await listMedia(args.kind as MediaKind);
      const filtered = args.status ? items.filter((i) => i.status === args.status) : items;
      return { items: filtered.map((i) => ({ title: i.title, status: i.status, rating: i.rating })) };
    }
    case 'play_lullaby':
      return setLullabyPlaying(true);
    case 'stop_lullaby':
      return setLullabyPlaying(false);
    case 'remember_fact': {
      const entry = await rememberFact(args.fact);
      return { ok: true, id: entry.id };
    }
    case 'recall_facts': {
      const facts = await listMemoryFacts();
      return { facts: facts.map((f) => f.fact) };
    }
    default:
      return { ok: false, reason: 'unknown_function' };
  }
}
