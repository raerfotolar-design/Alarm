import { MicIcon } from '../icons';

interface ListeningModeBarProps {
  active: boolean;
  onToggle: () => void;
  label?: string;
}

export function ListeningModeBar({ active, onToggle, label }: ListeningModeBarProps) {
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
        <div style={{ fontSize: 12.5, color: active ? '#C9C3FF' : 'var(--text-dim)' }}>
          {label ?? (active ? 'Dinleme Modu açık — sessizce not alınıyor' : 'Dinleme Modu kapalı')}
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
