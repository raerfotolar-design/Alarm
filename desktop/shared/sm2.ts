import type { LearningCard, ReviewGrade } from './types';

/**
 * SM-2 spaced repetition. Grades map to SM-2 qualities: a "zor" is a lapse and
 * sends the card back to tomorrow; "orta" and "kolay" grow the interval by the
 * card's ease factor, which itself drifts with how easily it is recalled.
 */
const QUALITY: Record<ReviewGrade, number> = { zor: 2, orta: 4, kolay: 5 };
const MIN_EASE = 1.3;

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function newCard(params: { id: string; deckId: string; question: string; answer: string; now?: Date }): LearningCard {
  const now = params.now ?? new Date();
  return {
    id: params.id,
    deckId: params.deckId,
    question: params.question,
    answer: params.answer,
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    due: isoDate(now),
    createdAt: now.toISOString(),
  };
}

export function gradeCard(card: LearningCard, grade: ReviewGrade, now: Date = new Date()): LearningCard {
  const quality = QUALITY[grade];
  const easeDelta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  const easeFactor = Math.max(MIN_EASE, card.easeFactor + easeDelta);

  if (quality < 3) {
    return {
      ...card,
      easeFactor,
      repetitions: 0,
      lapses: card.lapses + 1,
      intervalDays: 1,
      due: isoDate(addDays(now, 1)),
    };
  }

  const repetitions = card.repetitions + 1;
  const intervalDays =
    repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.max(1, Math.round(card.intervalDays * easeFactor));

  return {
    ...card,
    easeFactor,
    repetitions,
    intervalDays,
    due: isoDate(addDays(now, intervalDays)),
  };
}

export function dueCards(cards: LearningCard[], now: Date = new Date()): LearningCard[] {
  const today = isoDate(now);
  return cards.filter((c) => c.due <= today);
}

/** Consecutive days with at least one review, counting back from today (or yesterday). */
export function computeStreak(reviewLog: Record<string, number>, now: Date = new Date()): number {
  let streak = 0;
  let cursor = new Date(now);

  // A day with no reviews yet does not break a streak until it ends.
  if (!reviewLog[isoDate(cursor)]) cursor = addDays(cursor, -1);

  while (reviewLog[isoDate(cursor)] > 0) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Mastery = share of a deck's cards that have survived to an interval of 21+ days. */
export function deckMastery(cards: LearningCard[], deckId: string): number {
  const deckCards = cards.filter((c) => c.deckId === deckId);
  if (deckCards.length === 0) return 0;
  const mature = deckCards.filter((c) => c.intervalDays >= 21).length;
  const learning = deckCards.filter((c) => c.intervalDays > 0 && c.intervalDays < 21).length;
  return Math.round(((mature + learning * 0.5) / deckCards.length) * 100);
}

/** Review counts for the last `weeks * 7` days, oldest first — the heatmap grid. */
export function heatmap(reviewLog: Record<string, number>, weeks: number, now: Date = new Date()): number[] {
  const days = weeks * 7;
  const out: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    out.push(reviewLog[isoDate(addDays(now, -i))] ?? 0);
  }
  return out;
}
