import type { ChatMessage, JarvisMemory, ListeningNote, MemoryFact } from '../../shared/types';

/** Turns sent verbatim in the prompt. Anything older is only present via `summary`. */
export const RECENT_LIMIT = 20;
/** How many messages have to fall out of the window before a summary refresh is worth a model call. */
export const SUMMARY_BATCH = 10;
const MAX_FACTS = 60;
const MAX_NOTES_IN_PROMPT = 40;

export function emptyMemory(): JarvisMemory {
  return { summary: '', facts: [], summarizedThroughId: null };
}

/**
 * The block prepended to the system prompt on every turn — this is what lets Jarvis
 * answer about things said days ago, long after those messages left the recent window.
 */
export function buildMemoryBlock(memory: JarvisMemory, notes: ListeningNote[]): string {
  const parts: string[] = [];

  if (memory.summary.trim()) {
    parts.push(`Bu kullanıcıyla daha önceki konuşmalarının özeti:\n${memory.summary.trim()}`);
  }

  if (memory.facts.length > 0) {
    const lines = memory.facts.map((f) => `- ${f.text}`).join('\n');
    parts.push(`Kullanıcı hakkında kalıcı olarak hatırladıkların:\n${lines}`);
  }

  const recentNotes = notes.slice(-MAX_NOTES_IN_PROMPT);
  if (recentNotes.length > 0) {
    const lines = recentNotes
      .map((n) => `- [${new Date(n.createdAt).toLocaleDateString('tr-TR')}] ${n.text}`)
      .join('\n');
    parts.push(`Dinleme Modu'nda aldığın notlar (eski tarihliler dahil, unutma):\n${lines}`);
  }

  if (parts.length === 0) return '';
  return `\n\n--- HAFIZAN ---\n${parts.join('\n\n')}\n--- HAFIZA SONU ---\n\nBu hafıza günlerce öncesine ait olabilir. Kullanıcı eski bir konuya dönerse buradan hatırla, "hatırlamıyorum" deme.`;
}

/** Messages that have fallen out of the recent window and are not yet in the summary. */
export function pendingForSummary(history: ChatMessage[], memory: JarvisMemory): ChatMessage[] {
  const older = history.slice(0, Math.max(0, history.length - RECENT_LIMIT));
  if (!memory.summarizedThroughId) return older;
  const idx = older.findIndex((m) => m.id === memory.summarizedThroughId);
  return idx === -1 ? older : older.slice(idx + 1);
}

export function buildSummaryPrompt(previousSummary: string, messages: ChatMessage[]): string {
  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'Kullanıcı' : 'Jarvis'}: ${m.text}`)
    .join('\n');

  return `Aşağıda bir kullanıcı ile asistanı arasındaki konuşmanın bir bölümü var. Görevin, uzun vadeli hafıza için bunu sıkıştırmak.

${previousSummary ? `Şu ana kadarki özet:\n${previousSummary}\n\n` : ''}Yeni konuşma bölümü:
${transcript}

Şunu döndür — SADECE geçerli JSON, başka hiçbir şey yazma:
{"summary": "güncellenmiş özet (önceki özeti de kapsayan, en fazla 250 kelime, Türkçe)", "newFacts": ["kullanıcı hakkında kalıcı olarak hatırlanması gereken yeni bilgiler, kısa cümleler halinde"]}

newFacts sadece kalıcı değeri olan şeyleri içersin (tercihler, planlar, kişisel bilgiler, verilen sözler, tekrar eden konular). Geçici sohbet detaylarını ekleme. Yeni kalıcı bilgi yoksa boş dizi döndür.`;
}

/** The model is asked for bare JSON but often wraps it in prose or a code fence. */
export function parseSummaryReply(raw: string): { summary: string; newFacts: string[] } | null {
  const withoutFence = raw.replace(/```(?:json)?/gi, '').trim();
  const start = withoutFence.indexOf('{');
  const end = withoutFence.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    const parsed = JSON.parse(withoutFence.slice(start, end + 1)) as {
      summary?: unknown;
      newFacts?: unknown;
    };
    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';
    const newFacts = Array.isArray(parsed.newFacts)
      ? parsed.newFacts.filter((f): f is string => typeof f === 'string' && f.trim().length > 0).map((f) => f.trim())
      : [];
    if (!summary && newFacts.length === 0) return null;
    return { summary, newFacts };
  } catch {
    return null;
  }
}

export function mergeMemory(
  memory: JarvisMemory,
  update: { summary: string; newFacts: string[] },
  summarizedThroughId: string,
): JarvisMemory {
  const existing = new Set(memory.facts.map((f) => f.text.toLowerCase()));
  const added: MemoryFact[] = update.newFacts
    .filter((text) => !existing.has(text.toLowerCase()))
    .map((text, i) => ({
      id: `fact-${Date.now()}-${i}`,
      text,
      createdAt: new Date().toISOString(),
    }));

  return {
    summary: update.summary || memory.summary,
    facts: [...memory.facts, ...added].slice(-MAX_FACTS),
    summarizedThroughId,
  };
}
