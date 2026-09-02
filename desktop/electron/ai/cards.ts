import type { GeneratedCard, LearningTopic } from '../../shared/types';

export function buildCardPrompt(topic: LearningTopic, subject: string, count: number): string {
  const flavour =
    topic === 'dil'
      ? 'Kartlar kelime/kalıp öğrenmeye yönelik olsun: ön yüzde yabancı dildeki ifade, arka yüzde Türkçe karşılığı ve kısa bir örnek cümle.'
      : 'Kartlar programlama kavramlarını öğrenmeye yönelik olsun: ön yüzde net bir soru, arka yüzde kısa ve doğru bir açıklama (gerekirse tek satırlık kod).';

  return `"${subject}" konusunda ${count} adet aralıklı tekrar kartı üret. ${flavour}

Şunu döndür — SADECE geçerli JSON, başka hiçbir şey yazma:
{"cards": [{"question": "...", "answer": "..."}]}

Sorular kısa ve tek bir şeyi ölçsün. Cevaplar 2 cümleyi geçmesin. Türkçe yaz.`;
}

export function parseCards(raw: string, limit: number): GeneratedCard[] {
  const withoutFence = raw.replace(/```(?:json)?/gi, '').trim();
  const start = withoutFence.indexOf('{');
  const end = withoutFence.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return [];

  try {
    const parsed = JSON.parse(withoutFence.slice(start, end + 1)) as { cards?: unknown };
    if (!Array.isArray(parsed.cards)) return [];

    return parsed.cards
      .filter((c): c is { question: string; answer: string } => {
        if (typeof c !== 'object' || c === null) return false;
        const card = c as Record<string, unknown>;
        return typeof card.question === 'string' && typeof card.answer === 'string';
      })
      .map((c) => ({ question: c.question.trim(), answer: c.answer.trim() }))
      .filter((c) => c.question.length > 0 && c.answer.length > 0)
      .slice(0, limit);
  } catch {
    return [];
  }
}
