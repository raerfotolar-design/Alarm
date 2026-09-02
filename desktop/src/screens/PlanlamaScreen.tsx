import type React from 'react';
import { useState } from 'react';
import { ListeningModeBar } from '../components/ListeningModeBar';
import { PlusIcon } from '../icons';
import { mediaUrl } from '../media';
import type { PlanPhase, SavedResearchItem } from '../../shared/types';

interface PlanlamaScreenProps {
  phases: PlanPhase[];
  selectedPhaseId: string | null;
  savedResearch: SavedResearchItem[];
  listening: boolean;
  listeningStatus?: React.ComponentProps<typeof ListeningModeBar>['status'];
  onToggleListening: () => void;
  onSelectPhase: (id: string) => void;
  onTogglePossibility: (phaseId: string, possibilityId: string) => void;
  onAddPhase: () => void;
  onAddNote: (phaseId: string, text: string) => void;
}

type DetailTab = 'notlar' | 'arastirmalar' | 'medya';

export function PlanlamaScreen({
  phases,
  selectedPhaseId,
  savedResearch,
  listening,
  listeningStatus,
  onToggleListening,
  onSelectPhase,
  onTogglePossibility,
  onAddPhase,
  onAddNote,
}: PlanlamaScreenProps) {
  const [detailTab, setDetailTab] = useState<DetailTab>('notlar');
  const [noteDraft, setNoteDraft] = useState('');
  const sorted = [...phases].sort((a, b) => a.order - b.order);
  const selected = sorted.find((p) => p.id === selectedPhaseId) ?? sorted[0];
  const linkedResearch = savedResearch.filter((r) => r.phaseId === selected?.id);
  const linkedImages = linkedResearch.filter((r) => r.kind === 'image');

  const submitNote = () => {
    const text = noteDraft.trim();
    if (!text || !selected) return;
    onAddNote(selected.id, text);
    setNoteDraft('');
  };

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'auto', padding: '20px 24px', minWidth: 0 }}>
        <ListeningModeBar
          active={listening}
          status={listeningStatus}
          onToggle={onToggleListening}
          label={listening ? 'Dinleme Modu açık — beyin fırtınası notları alınıyor' : 'Dinleme Modu kapalı'}
        />

        <div className="heading" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 16 }}>
          Plan Ağacı
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {sorted.map((phase, i) => {
            const isSelected = phase.id === selected?.id;
            return (
              <div key={phase.id} style={{ display: 'flex', alignItems: 'flex-start' }}>
                <button
                  onClick={() => onSelectPhase(phase.id)}
                  style={{
                    width: 186,
                    textAlign: 'left',
                    background: 'var(--surface-alt)',
                    border: `1px solid ${isSelected ? '#2DD4EA' : 'var(--border)'}`,
                    borderRadius: 14,
                    padding: 16,
                    boxShadow: isSelected ? '0 0 26px rgba(45,212,234,0.3)' : 'none',
                  }}
                >
                  <div style={{ fontSize: 11, color: isSelected ? '#2DD4EA' : 'var(--text-dim)', marginBottom: 6 }}>
                    FAZ {phase.order}
                    {isSelected ? ' · SEÇİLİ' : ''}
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 10 }}>{phase.title}</div>
                  <div style={{ height: 5, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ width: `${phase.progress}%`, height: '100%', background: isSelected ? '#2DD4EA' : '#34D399' }} />
                  </div>
                </button>
                {i < sorted.length - 1 && (
                  <div style={{ width: 40, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="28" height="14" viewBox="0 0 28 14" fill="none">
                      <path d="M0 7h22M16 1l6 6-6 6" stroke="#2A3B52" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {selected && selected.possibilities.length > 0 && (
          <div
            style={{
              marginLeft: sorted.findIndex((p) => p.id === selected.id) * 226,
              width: 240,
              marginTop: 6,
              paddingLeft: 18,
              borderLeft: '2px solid rgba(45,212,234,0.35)',
            }}
          >
            {selected.possibilities.map((poss) => (
              <div key={poss.id} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
                <div style={{ width: 14, height: 2, background: 'rgba(45,212,234,0.35)' }} />
                <button
                  onClick={() => onTogglePossibility(selected.id, poss.id)}
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    background: poss.selected ? 'rgba(45,212,234,0.1)' : 'var(--surface)',
                    border: `1px solid ${poss.selected ? '#2DD4EA' : 'var(--border)'}`,
                    borderRadius: 10,
                    padding: '10px 12px',
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: poss.selected ? '#2DD4EA' : 'var(--text)' }}>
                    {poss.title}
                    {poss.selected ? ' (seçildi)' : ''}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onAddPhase}
          title="Faz ekle"
          style={{
            position: 'absolute',
            right: 26,
            bottom: 26,
            width: 52,
            height: 52,
            borderRadius: 16,
            border: 'none',
            background: 'linear-gradient(135deg,#2DD4EA,#38BDF8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 22px rgba(45,212,234,0.55)',
          }}
        >
          <PlusIcon />
        </button>
      </div>

      <div style={{ width: 300, minWidth: 300, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        {selected && (
          <>
            <div style={{ padding: '18px 18px 0 18px' }}>
              <div className="heading" style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>
                Faz {selected.order} — {selected.title}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginBottom: 16 }}>
                {selected.notes.length} not · {linkedResearch.length} araştırma · {linkedImages.length} medya
              </div>
              <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 3, marginBottom: 16 }}>
                {(['notlar', 'arastirmalar', 'medya'] as DetailTab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setDetailTab(t)}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '8px 0',
                      borderRadius: 8,
                      border: 'none',
                      background: detailTab === t ? '#111A2C' : 'transparent',
                      fontSize: 12,
                      color: detailTab === t ? '#2DD4EA' : 'var(--text-dim)',
                      fontWeight: detailTab === t ? 700 : 600,
                      boxShadow: detailTab === t ? '0 0 10px rgba(45,212,234,0.2)' : 'none',
                    }}
                  >
                    {t === 'notlar' ? 'Notlar' : t === 'arastirmalar' ? 'Araştırmalar' : 'Medya'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 18px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {detailTab === 'notlar' &&
                (selected.notes.length === 0 ? (
                  <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>Bu faza henüz not eklenmedi.</div>
                ) : (
                  selected.notes.map((n, i) => (
                    <div key={i} style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, fontSize: 12 }}>
                      {n}
                    </div>
                  ))
                ))}
              {detailTab === 'arastirmalar' &&
                (linkedResearch.length === 0 ? (
                  <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                    Araştırma sekmesinde bir sonucu bu faza bağlayarak kaydet, burada görünsün.
                  </div>
                ) : (
                  linkedResearch
                    .slice()
                    .reverse()
                    .map((r) => (
                      <button
                        key={r.id}
                        onClick={() => window.jarvisDesktop?.openExternal(r.sourceUrl)}
                        style={{
                          textAlign: 'left',
                          background: 'var(--surface-alt)',
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          padding: 12,
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>{r.title}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>
                          {r.provider} · {r.kind === 'video' ? 'video' : 'görsel'}
                        </div>
                      </button>
                    ))
                ))}
              {detailTab === 'medya' &&
                (linkedImages.length === 0 ? (
                  <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>Bu faza kaydedilmiş bir dosya yok.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {linkedImages
                      .slice()
                      .reverse()
                      .map((r) => (
                        <div
                          key={r.id}
                          title={r.filePath || r.title}
                          style={{
                            aspectRatio: '1',
                            borderRadius: 10,
                            border: '1px solid var(--border)',
                            background: r.filePath
                              ? `#0D1220 center/cover no-repeat url("${mediaUrl(r.filePath)}")`
                              : '#0D1220',
                          }}
                        />
                      ))}
                  </div>
                ))}
            </div>
            {detailTab === 'notlar' && (
              <div style={{ padding: 16, display: 'flex', gap: 6, borderTop: '1px solid var(--border)' }}>
                <input
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitNote()}
                  placeholder="Not ekle..."
                  style={{
                    flex: 1,
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '8px 10px',
                    color: 'var(--text)',
                    fontSize: 12,
                    outline: 'none',
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
