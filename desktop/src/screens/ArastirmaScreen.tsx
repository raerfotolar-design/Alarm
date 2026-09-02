import { useState } from 'react';
import { ListeningModeBar } from '../components/ListeningModeBar';
import type { PlanPhase, ResearchResult, SavedResearchItem } from '../../shared/types';

interface ArastirmaScreenProps {
  listening: boolean;
  phases: PlanPhase[];
  selectedPhaseId: string | null;
  savedResearch: SavedResearchItem[];
  onToggleListening: () => void;
  onSaved: (item: SavedResearchItem) => void;
}

const cardBase = {
  background: 'var(--surface-alt)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  overflow: 'hidden',
} as const;

export function ArastirmaScreen({
  listening,
  phases,
  selectedPhaseId,
  savedResearch,
  onToggleListening,
  onSaved,
}: ArastirmaScreenProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [targetPhaseId, setTargetPhaseId] = useState<string | null>(selectedPhaseId);

  const bridge = typeof window !== 'undefined' ? window.jarvisDesktop : undefined;
  const savedSourceUrls = new Set(savedResearch.map((s) => s.sourceUrl));

  const runSearch = async () => {
    if (!query.trim() || searching) return;
    if (!bridge) {
      setError('Arama yalnızca masaüstü uygulamasında çalışır.');
      return;
    }
    setSearching(true);
    setError('');
    setNotes([]);
    const res = await bridge.searchResearch(query);
    if (res.ok) {
      setResults(res.results);
      setNotes(res.notes);
      if (res.results.length === 0) setError('Sonuç bulunamadı.');
    } else {
      setResults([]);
      setError(res.error);
    }
    setSearching(false);
  };

  const save = async (result: ResearchResult) => {
    if (!bridge || savingId) return;
    setSavingId(result.id);
    const res = await bridge.saveResearch(result, targetPhaseId);
    if (res.ok) {
      onSaved(res.item);
    } else {
      setError(res.error);
    }
    setSavingId(null);
  };

  const phaseLabel = (phaseId: string | null) => {
    if (!phaseId) return 'Faza bağlama';
    const phase = phases.find((p) => p.id === phaseId);
    return phase ? `Faz ${phase.order}'e bağla` : 'Faza bağlama';
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runSearch()}
          placeholder="Bir şey araştır... (örn. bir karakter, bir konu)"
          style={{
            flex: 1,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '12px 16px',
            color: 'var(--text)',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <select
          value={targetPhaseId ?? ''}
          onChange={(e) => setTargetPhaseId(e.target.value || null)}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '0 12px',
            color: 'var(--text-dim)',
            fontSize: 12,
            outline: 'none',
          }}
        >
          <option value="">Faza bağlama</option>
          {[...phases]
            .sort((a, b) => a.order - b.order)
            .map((p) => (
              <option key={p.id} value={p.id}>
                Faz {p.order} — {p.title}
              </option>
            ))}
        </select>
        <button
          onClick={runSearch}
          disabled={searching}
          style={{
            padding: '0 22px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg,#2DD4EA,#38BDF8)',
            color: '#03141A',
            fontWeight: 700,
            fontSize: 13,
            opacity: searching ? 0.5 : 1,
          }}
        >
          {searching ? 'Aranıyor...' : 'Ara'}
        </button>
      </div>

      <ListeningModeBar
        active={listening}
        onToggle={onToggleListening}
        label={listening ? 'Dinleme Modu açık — "bunu kaydet" komutu dinleniyor' : 'Dinleme Modu kapalı'}
      />

      {error && (
        <div
          style={{
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.4)',
            borderRadius: 12,
            padding: '10px 14px',
            fontSize: 12,
            color: '#F87171',
            marginBottom: 14,
          }}
        >
          {error}
        </div>
      )}

      {notes.map((n) => (
        <div key={n} style={{ fontSize: 11.5, color: 'var(--text-dim)', marginBottom: 8 }}>
          {n}
        </div>
      ))}

      {results.length === 0 && !searching && !error && (
        <div style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 40, textAlign: 'center' }}>
          Bir şey aratınca görseller ve videolar burada listelenir. Kaydettiklerin diske iner ve seçtiğin faza bağlanır.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {results.map((r) => {
          const alreadySaved = savedSourceUrls.has(r.sourceUrl);
          return (
            <div key={r.id} style={cardBase}>
              <button
                onClick={() => bridge?.openExternal(r.sourceUrl)}
                title="Kaynağı tarayıcıda aç"
                style={{
                  display: 'block',
                  width: '100%',
                  height: 120,
                  padding: 0,
                  border: 'none',
                  background: r.thumbnailUrl ? `#0D1220 center/cover no-repeat url("${r.thumbnailUrl}")` : '#0D1220',
                }}
              />
              <div style={{ padding: 12 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 8,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                  title={r.title}
                >
                  {r.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 10.5,
                      padding: '4px 8px',
                      borderRadius: 999,
                      border: '1px solid rgba(45,212,234,0.4)',
                      color: '#2DD4EA',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.kind === 'video' ? 'Video' : 'Görsel'} · {r.provider}
                  </span>
                  <button
                    onClick={() => save(r)}
                    disabled={savingId === r.id || alreadySaved}
                    title={alreadySaved ? 'Zaten kaydedildi' : phaseLabel(targetPhaseId)}
                    style={{
                      width: 26,
                      height: 26,
                      minWidth: 26,
                      borderRadius: 8,
                      border: `1px solid ${alreadySaved ? 'rgba(52,211,153,0.5)' : 'var(--border)'}`,
                      background: alreadySaved ? 'rgba(52,211,153,0.12)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: savingId === r.id ? 0.4 : 1,
                    }}
                  >
                    {alreadySaved ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12l6 6L20 6" />
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7C8DA6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 4v12m0 0-4-4m4 4 4-4M4 20h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {savedResearch.length > 0 && (
        <>
          <div
            style={{
              marginTop: 28,
              marginBottom: 12,
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Kaydettiklerin ({savedResearch.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {savedResearch
              .slice()
              .reverse()
              .slice(0, 12)
              .map((s) => {
                const phase = phases.find((p) => p.id === s.phaseId);
                return (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.filePath || s.sourceUrl}
                      </div>
                    </div>
                    {phase && (
                      <span
                        style={{
                          fontSize: 10.5,
                          padding: '4px 8px',
                          borderRadius: 999,
                          border: '1px solid rgba(45,212,234,0.4)',
                          color: '#2DD4EA',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Faz {phase.order}'e bağlı
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
