/**
 * Listening mode records everything but must not store everything — an hour of
 * speech would bury the useful lines. Each transcript segment is distilled into at
 * most a few notes, and often none at all.
 */
export function buildNotePrompt(transcript: string): string {
  return `Aşağıda bir kullanıcının sesli olarak söylediklerinin dökümü var. Görevin, ileride hatırlanmaya değer olanları kısa notlara dönüştürmek.

Döküm:
"""
${transcript}
"""

Şunu döndür — SADECE geçerli JSON, başka hiçbir şey yazma:
{"notes": ["kısa not", "..."]}

Kurallar:
- En fazla 3 not çıkar.
- Sadece kalıcı değeri olan şeyleri not al: kararlar, planlar, yapılacaklar, fikirler, tercihler, tarihler.
- Günlük laf kalabalığını, selamlaşmayı, yarım kalmış cümleleri alma.
- Hatırlanmaya değer bir şey yoksa boş dizi döndür: {"notes": []}
- Notları Türkçe ve tek cümlelik yaz.`;
}

export function parseNotes(raw: string, limit = 3): string[] {
  const withoutFence = raw.replace(/```(?:json)?/gi, '').trim();
  const start = withoutFence.indexOf('{');
  const end = withoutFence.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return [];

  try {
    const parsed = JSON.parse(withoutFence.slice(start, end + 1)) as { notes?: unknown };
    if (!Array.isArray(parsed.notes)) return [];
    return parsed.notes
      .filter((n): n is string => typeof n === 'string')
      .map((n) => n.trim())
      .filter((n) => n.length > 0)
      .slice(0, limit);
  } catch {
    return [];
  }
}

/** Anything shorter than this is almost always a stray word or silence. */
const MIN_TRANSCRIPT_CHARS = 15;

export function worthExtracting(transcript: string): boolean {
  return transcript.trim().length >= MIN_TRANSCRIPT_CHARS;
}

const TRIGGER_PATTERNS = [/jarvis\s+konu[sş]/i, /jarvis\s+kalk/i, /jarvis\s+cevap\s+ver/i];

/**
 * The phrase that ends silent listening. Returns what the user said around it, so
 * the question itself is what reaches Jarvis rather than the raw trigger.
 */
export function findTrigger(transcript: string): { triggered: boolean; message: string } {
  const match = TRIGGER_PATTERNS.map((p) => transcript.match(p)).find((m) => m !== null);
  if (!match || match.index === undefined) return { triggered: false, message: '' };

  const after = transcript.slice(match.index + match[0].length).trim();
  const before = transcript.slice(0, match.index).trim();
  // What follows the trigger is normally the request; if nothing does, fall back to
  // what came just before it.
  const message = after || before;
  return { triggered: true, message };
}
