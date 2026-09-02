import type React from 'react';
import { useState } from 'react';
import { ListeningModeBar } from '../components/ListeningModeBar';
import type { ChatMessage, JarvisMemory, ListeningNote, PendingPcAction } from '../../shared/types';

interface JarvisScreenProps {
  messages: ChatMessage[];
  notes: ListeningNote[];
  memory: JarvisMemory;
  listening: boolean;
  listeningStatus?: React.ComponentProps<typeof ListeningModeBar>['status'];
  pending: boolean;
  pendingAction: PendingPcAction | null;
  onToggleListening: () => void;
  onSendMessage: (text: string) => void;
  onAddNote: (text: string) => void;
  onApproveAction: (action: PendingPcAction) => void;
  onRejectAction: () => void;
}

export function JarvisScreen({
  messages,
  notes,
  memory,
  listening,
  listeningStatus,
  pending,
  pendingAction,
  onToggleListening,
  onSendMessage,
  onAddNote,
  onApproveAction,
  onRejectAction,
}: JarvisScreenProps) {
  const [draft, setDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');

  const submit = () => {
    const text = draft.trim();
    if (!text || pending) return;
    onSendMessage(text);
    setDraft('');
  };

  const submitNote = () => {
    const text = noteDraft.trim();
    if (!text) return;
    onAddNote(text);
    setNoteDraft('');
  };

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, padding: '20px 24px' }}>
        <ListeningModeBar
          active={listening}
          status={listeningStatus}
          onToggle={onToggleListening}
          label={
            listening
              ? '"Jarvis konuş" diyene kadar sessizce dinliyor ve not alıyor'
              : 'Dinleme Modu kapalı'
          }
        />

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 12 }}>
          {messages.length === 0 && (
            <div style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 40, textAlign: 'center' }}>
              Henüz mesaj yok. Jarvis'e bir şey yaz.
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '70%',
                background: m.role === 'user' ? 'var(--cyan-soft)' : 'var(--surface)',
                border: `1px solid ${m.role === 'user' ? 'rgba(45,212,234,0.4)' : 'var(--border)'}`,
                borderRadius: 14,
                padding: '10px 14px',
                fontSize: 13,
              }}
            >
              {m.text}
            </div>
          ))}
          {pendingAction && (
            <div
              style={{
                alignSelf: 'flex-start',
                maxWidth: '80%',
                background: 'rgba(251,191,36,0.08)',
                border: '1px solid rgba(251,191,36,0.5)',
                borderRadius: 14,
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: 11, color: '#FBBF24', fontWeight: 700, marginBottom: 6 }}>
                ONAY GEREKİYOR
              </div>
              <div style={{ fontSize: 13, marginBottom: 4 }}>{pendingAction.description}</div>
              {pendingAction.tool === 'run_command' && (
                <pre
                  style={{
                    fontSize: 11.5,
                    color: 'var(--text-dim)',
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: 8,
                    margin: '8px 0 0',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {String(pendingAction.args.command ?? '')}
                </pre>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  onClick={() => onApproveAction(pendingAction)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'rgba(52,211,153,0.15)',
                    color: '#34D399',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  İzin ver
                </button>
                <button
                  onClick={onRejectAction}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-dim)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Reddet
                </button>
              </div>
            </div>
          )}
          {pending && (
            <div
              style={{
                alignSelf: 'flex-start',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '10px 14px',
                fontSize: 13,
                color: 'var(--text-dim)',
              }}
            >
              Jarvis düşünüyor...
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Jarvis'e yaz..."
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
          <button
            onClick={submit}
            disabled={pending}
            style={{
              padding: '0 22px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg,#2DD4EA,#38BDF8)',
              color: '#03141A',
              fontWeight: 700,
              fontSize: 13,
              opacity: pending ? 0.5 : 1,
            }}
          >
            Gönder
          </button>
        </div>
      </div>

      <div style={{ width: 280, minWidth: 280, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 16px 12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Notlar
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notes.length === 0 && (
            <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>Dinleme Modu'nda alınan notlar burada birikir.</div>
          )}
          {notes.map((n) => (
            <div key={n.id} style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, fontSize: 12 }}>
              {n.text}
            </div>
          ))}

          {(memory.facts.length > 0 || memory.summary) && (
            <>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginTop: 14,
                }}
              >
                Jarvis'in Hafızası
              </div>
              {memory.summary && (
                <div
                  style={{
                    background: 'rgba(139,124,255,0.08)',
                    border: '1px solid rgba(139,124,255,0.35)',
                    borderRadius: 10,
                    padding: 10,
                    fontSize: 11.5,
                    color: '#C9C3FF',
                    lineHeight: 1.5,
                  }}
                >
                  {memory.summary}
                </div>
              )}
              {memory.facts.map((f) => (
                <div
                  key={f.id}
                  style={{
                    background: 'var(--surface-alt)',
                    border: '1px solid rgba(45,212,234,0.3)',
                    borderRadius: 10,
                    padding: 10,
                    fontSize: 11.5,
                  }}
                >
                  {f.text}
                </div>
              ))}
            </>
          )}
        </div>
        <div style={{ padding: 16, display: 'flex', gap: 6 }}>
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
      </div>
    </div>
  );
}
