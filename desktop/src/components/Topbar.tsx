import type { AiEngine } from '../../shared/types';
import { TAB_LABELS, type TabId } from '../tabs';

interface TopbarProps {
  tab: TabId;
  aiEngine: AiEngine;
  onEngineChange: (engine: AiEngine) => void;
  /** Last cloud-sync outcome, shown quietly next to the engine switch. */
  syncNote?: string;
}

export function Topbar({ tab, aiEngine, onEngineChange, syncNote }: TopbarProps) {
  return (
    <div
      style={{
        height: 64,
        minHeight: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="heading" style={{ fontWeight: 700, fontSize: 18 }}>
        {TAB_LABELS[tab]}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {syncNote && (
          <span style={{ fontSize: 10.5, color: 'var(--text-dim)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {syncNote}
          </span>
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface-alt)',
            border: '1px solid var(--border)',
            borderRadius: 999,
            padding: 3,
          }}
        >
          <button
            onClick={() => onEngineChange('local')}
            style={{
              padding: '7px 16px',
              borderRadius: 999,
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              background: aiEngine === 'local' ? 'linear-gradient(90deg,#8B7CFF,#6C5CE7)' : 'transparent',
              color: aiEngine === 'local' ? '#0B0620' : 'var(--text-dim)',
              boxShadow: aiEngine === 'local' ? '0 0 12px rgba(139,124,255,0.4)' : 'none',
            }}
          >
            Yerel AI
          </button>
          <button
            onClick={() => onEngineChange('cloud')}
            style={{
              padding: '7px 16px',
              borderRadius: 999,
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              background: aiEngine === 'cloud' ? 'linear-gradient(90deg,#2DD4EA,#38BDF8)' : 'transparent',
              color: aiEngine === 'cloud' ? '#03141A' : 'var(--text-dim)',
              boxShadow: aiEngine === 'cloud' ? '0 0 12px rgba(45,212,234,0.4)' : 'none',
            }}
          >
            Bulut AI
          </button>
        </div>
      </div>
    </div>
  );
}
