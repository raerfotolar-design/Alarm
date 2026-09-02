import { useState } from 'react';
import { ListeningModeBar } from '../components/ListeningModeBar';
import type { ChatMessage, ListeningNote } from '../../shared/types';

interface JarvisScreenProps {
  messages: ChatMessage[];
  notes: ListeningNote[];
  listening: boolean;
  onToggleListening: () => void;
  onSendMessage: (text: string) => void;
  onAddNote: (text: string) => void;
}

function jarvisPlaceholderReply(userText: string): string {
  return `("${userText}" için henüz gerçek bir AI motoruna bağlı değilim — bu bir yer tutucu yanıt.)`;
}

export function JarvisScreen({
  messages,
  notes,
  listening,
  onToggleListening,
  onSendMessage,
  onAddNote,
}: JarvisScreenProps) {
  const [draft, setDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
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
            style={{
              padding: '0 22px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg,#2DD4EA,#38BDF8)',
              color: '#03141A',
              fontWeight: 700,
              fontSize: 13,
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

export { jarvisPlaceholderReply };
