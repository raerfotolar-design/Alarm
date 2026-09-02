import { MicIcon } from '../icons';

interface ListeningModeBarProps {
  active: boolean;
  onToggle: () => void;
  label?: string;
  /** Live state of the microphone loop, when this bar owns it. */
  status?: { state: 'off' | 'starting' | 'listening' | 'processing' | 'error'; lastTranscript: string; error: string };
}

const STATE_LABEL: Record<string, string> = {
  starting: 'Mikrofon açılıyor...',
  listening: 'Dinliyor',
  processing: 'Duyduğunu yazıya çeviriyor...',
};

export function ListeningModeBar({ active, onToggle, label, status }: ListeningModeBarProps) {
  const statusText = status && status.state !== 'off' && status.state !== 'error' ? STATE_LABEL[status.state] : '';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--surface)',
        border: `1px solid ${active ? 'rgba(139,124,255,0.4)' : 'var(--border)'}`,
        borderRadius: 14,
        padding: '12px 18px',
        marginBottom: 20,
        boxShadow: active ? '0 0 20px rgba(139,124,255,0.12)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: active ? 'rgba(139,124,255,0.15)' : 'rgba(124,141,166,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MicIcon color={active ? '#8B7CFF' : '#7C8DA6'} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, color: active ? '#C9C3FF' : 'var(--text-dim)' }}>
            {label ?? (active ? 'Dinleme Modu açık — sessizce not alınıyor' : 'Dinleme Modu kapalı')}
          </div>
          {status?.state === 'error' ? (
            <div style={{ fontSize: 10.5, color: '#F87171', marginTop: 3 }}>{status.error}</div>
          ) : (
            (statusText || status?.lastTranscript) && (
              <div
                style={{
                  fontSize: 10.5,
                  color: 'var(--text-dim)',
                  marginTop: 3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 620,
                }}
              >
                {statusText}
                {status?.lastTranscript ? ` · "${status.lastTranscript}"` : ''}
              </div>
            )
          )}
        </div>
      </div>
      <button
        onClick={onToggle}
        style={{
          width: 40,
          height: 22,
          borderRadius: 999,
          border: 'none',
          background: active ? 'linear-gradient(90deg,#8B7CFF,#6C5CE7)' : 'var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: 2,
          boxShadow: active ? '0 0 10px rgba(139,124,255,0.5)' : 'none',
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#F2F1F7',
            marginLeft: active ? 'auto' : 0,
            transition: 'margin-left 0.15s ease',
          }}
        />
      </button>
    </div>
  );
}
