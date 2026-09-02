import { useMemo, useState } from 'react';
import { computeStreak, deckMastery, dueCards, heatmap, isoDate } from '../../shared/sm2';
import type { AiEngine, LearningState, LearningTopic, ReviewGrade } from '../../shared/types';

interface OgrenmeScreenProps {
  learning: LearningState;
  aiEngine: AiEngine;
  onSetTopic: (topic: LearningTopic) => void;
  onSetDeck: (deckId: string) => void;
  onGrade: (cardId: string, grade: ReviewGrade) => void;
  onAddGeneratedCards: (deckId: string, cards: { question: string; answer: string }[]) => void;
}

const HEATMAP_WEEKS = 5;

const GRADES: { grade: ReviewGrade; label: string; color: string }[] = [
  { grade: 'zor', label: 'Zor', color: '#F87171' },
  { grade: 'orta', label: 'Orta', color: '#FBBF24' },
  { grade: 'kolay', label: 'Kolay', color: '#34D399' },
];

export function OgrenmeScreen({
  learning,
  aiEngine,
  onSetTopic,
  onSetDeck,
  onGrade,
  onAddGeneratedCards,
}: OgrenmeScreenProps) {
  const [flipped, setFlipped] = useState(false);
  const [subject, setSubject] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const today = new Date();
  const decksForTopic = learning.decks.filter((d) => d.topic === learning.activeTopic);
  const activeDeck = decksForTopic.find((d) => d.id === learning.activeDeckId) ?? decksForTopic[0];

  const deckCards = useMemo(
    () => learning.cards.filter((c) => c.deckId === activeDeck?.id),
    [learning.cards, activeDeck?.id],
  );
  const due = useMemo(() => dueCards(deckCards, today), [deckCards, today]);
  const current = due[0];

  const streak = computeStreak(learning.reviewLog, today);
  const reviewedToday = learning.reviewLog[isoDate(today)] ?? 0;
  const grid = heatmap(learning.reviewLog, HEATMAP_WEEKS, today);
  const maxReviews = Math.max(1, ...grid);

  const grade = (g: ReviewGrade) => {
    if (!current) return;
    onGrade(current.id, g);
    setFlipped(false);
  };

  const generate = async () => {
    if (!activeDeck || generating) return;
    const bridge = typeof window !== 'undefined' ? window.jarvisDesktop : undefined;
    if (!bridge) {
      setError('Kart üretimi yalnızca masaüstü uygulamasında çalışır.');
      return;
    }
    setGenerating(true);
    setError('');
    const res = await bridge.generateCards({
      engine: aiEngine,
      topic: learning.activeTopic,
      subject: subject.trim() || activeDeck.name,
      count: 10,
    });
    if (res.ok) {
      onAddGeneratedCards(activeDeck.id, res.cards);
      setSubject('');
    } else {
      setError(res.error);
    }
    setGenerating(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 999, padding: 3 }}>
            {(['dil', 'programlama'] as LearningTopic[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  onSetTopic(t);
                  setFlipped(false);
                }}
                style={{
                  padding: '7px 16px',
                  borderRadius: 999,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  background: learning.activeTopic === t ? 'linear-gradient(90deg,#8B7CFF,#6C5CE7)' : 'transparent',
                  color: learning.activeTopic === t ? '#0B0620' : 'var(--text-dim)',
                }}
              >
                {t === 'dil' ? 'Dil Öğrenme' : 'Programlama'}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>
            {due.length} kart sırada · bugün {reviewedToday} tekrar
          </div>
        </div>

        <div style={{ width: '100%', display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {decksForTopic.map((d) => {
            const count = dueCards(learning.cards.filter((c) => c.deckId === d.id), today).length;
            const isActive = d.id === activeDeck?.id;
            return (
              <button
                key={d.id}
                onClick={() => {
                  onSetDeck(d.id);
                  setFlipped(false);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  background: isActive ? 'var(--cyan-soft)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(45,212,234,0.5)' : 'var(--border)'}`,
                  color: isActive ? '#2DD4EA' : 'var(--text-dim)',
                }}
              >
                {d.name} {count > 0 ? `· ${count}` : ''}
              </button>
            );
          })}
        </div>

        {current ? (
          <>
            <button
              onClick={() => setFlipped((f) => !f)}
              style={{
                width: 460,
                minHeight: 280,
                borderRadius: 22,
                background: 'linear-gradient(160deg,#0D1220,#0B1220)',
                border: '1px solid var(--border)',
                boxShadow: '0 0 40px rgba(45,212,234,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 40,
                position: 'relative',
                color: 'var(--text)',
              }}
            >
              <div style={{ position: 'absolute', top: 16, left: 20, fontSize: 10.5, color: 'var(--text-dim)' }}>
                {flipped ? 'CEVAP' : 'SORU'}
              </div>
              <div style={{ position: 'absolute', top: 16, right: 20, fontSize: 10.5, color: 'var(--text-dim)' }}>
                {current.repetitions === 0 ? 'yeni' : `${current.intervalDays} günlük aralık`}
              </div>
              <div
                className="heading"
                style={{ fontSize: flipped ? 18 : 22, fontWeight: 700, textAlign: 'center', lineHeight: 1.4 }}
              >
                {flipped ? current.answer : current.question}
              </div>
              <div style={{ position: 'absolute', bottom: 16, fontSize: 10.5, color: '#4A5D75' }}>
                {flipped ? 'Zorluğu seç' : 'Çevirmek için tıkla'}
              </div>
            </button>

            <div style={{ display: 'flex', gap: 14, marginTop: 24 }}>
              {GRADES.map((g) => (
                <button
                  key={g.grade}
                  onClick={() => grade(g.grade)}
                  disabled={!flipped}
                  title={flipped ? '' : 'Önce kartı çevir'}
                  style={{
                    width: 128,
                    padding: '13px 0',
                    borderRadius: 14,
                    background: `${g.color}1a`,
                    border: `1px solid ${g.color}73`,
                    textAlign: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: g.color,
                    opacity: flipped ? 1 : 0.35,
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div
            style={{
              width: 460,
              minHeight: 200,
              borderRadius: 22,
              background: 'var(--surface)',
              border: '1px dashed var(--border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 32,
              textAlign: 'center',
              gap: 8,
            }}
          >
            <div className="heading" style={{ fontSize: 16, fontWeight: 700 }}>
              {deckCards.length === 0 ? 'Bu destede henüz kart yok' : 'Bugünlük bu kadar efendim'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              {deckCards.length === 0
                ? 'Aşağıdan bir konu yazıp Jarvis’e kart ürettir.'
                : 'Tüm kartların tekrarı tamamlandı, yarın yenileri gelecek.'}
            </div>
          </div>
        )}

        <div style={{ width: 460, marginTop: 26, display: 'flex', gap: 8 }}>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generate()}
            placeholder={activeDeck ? `${activeDeck.name} için konu (örn. "iş görüşmesi kelimeleri")` : 'Önce deste seç'}
            style={{
              flex: 1,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '11px 14px',
              color: 'var(--text)',
              fontSize: 12.5,
              outline: 'none',
            }}
          />
          <button
            onClick={generate}
            disabled={generating || !activeDeck}
            style={{
              padding: '0 18px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg,#2DD4EA,#38BDF8)',
              color: '#03141A',
              fontWeight: 700,
              fontSize: 12.5,
              opacity: generating ? 0.5 : 1,
            }}
          >
            {generating ? 'Üretiliyor...' : 'Kart üret'}
          </button>
        </div>

        {error && (
          <div style={{ width: 460, marginTop: 10, fontSize: 11.5, color: '#F87171' }}>{error}</div>
        )}
      </div>

      <div style={{ width: 300, minWidth: 300, borderLeft: '1px solid var(--border)', overflowY: 'auto' }}>
        <div style={{ padding: '20px 18px 16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FB923C" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c4.4 0 7-2.8 7-6.8 0-3.2-2-5-3.2-7.4-.5 1.6-1.4 2.6-2.3 2.6.6-3-1-6-3.5-7.4.3 2.2-.6 4-2.3 5.6C6.1 10 5 12 5 14.8 5 19 7.6 22 12 22Z" />
            </svg>
          </div>
          <div>
            <div className="heading" style={{ fontSize: 22, fontWeight: 700 }}>
              {streak} gün
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>kesintisiz seri</div>
          </div>
        </div>

        <div style={{ padding: 18, borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
            Konu Hakimiyeti
          </div>
          {learning.decks.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Henüz deste yok.</div>}
          {learning.decks.map((d, i) => {
            const pct = deckMastery(learning.cards, d.id);
            const total = learning.cards.filter((c) => c.deckId === d.id).length;
            const color = ['#2DD4EA', '#8B7CFF', '#34D399', '#FBBF24'][i % 4];
            return (
              <div key={d.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span>
                    {d.name} <span style={{ color: 'var(--text-dim)' }}>· {total} kart</span>
                  </span>
                  <span style={{ color: 'var(--text-dim)' }}>{pct}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: color }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
            Son {HEATMAP_WEEKS} Hafta
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
            {grid.map((count, i) => (
              <div
                key={i}
                title={`${count} tekrar`}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 4,
                  background: count === 0 ? 'var(--border)' : `rgba(45,212,234,${0.2 + 0.8 * (count / maxReviews)})`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
