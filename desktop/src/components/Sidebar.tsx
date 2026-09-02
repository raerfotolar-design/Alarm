import type { ReactElement } from 'react';
import { ChatIcon, DocumentIcon, LogoIcon, NetworkIcon, SearchIcon, SettingsIcon } from '../icons';
import type { TabId } from '../tabs';

interface SidebarProps {
  active: TabId;
  onSelect: (tab: TabId) => void;
  onOpenSettings: () => void;
}

const items: { id: TabId; icon: (active: boolean) => ReactElement }[] = [
  { id: 'jarvis', icon: (a) => <ChatIcon color={a ? '#2DD4EA' : '#7C8DA6'} /> },
  { id: 'arastirma', icon: (a) => <SearchIcon color={a ? '#2DD4EA' : '#7C8DA6'} /> },
  { id: 'planlama', icon: (a) => <NetworkIcon color={a ? '#2DD4EA' : '#7C8DA6'} /> },
  { id: 'ogrenme', icon: (a) => <DocumentIcon color={a ? '#2DD4EA' : '#7C8DA6'} /> },
];

export function Sidebar({ active, onSelect, onOpenSettings }: SidebarProps) {
  return (
    <div
      style={{
        width: 72,
        minWidth: 72,
        height: '100%',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 0',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: 'linear-gradient(135deg,#2DD4EA,#8B7CFF)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 32,
          boxShadow: '0 0 18px rgba(45,212,234,0.5)',
        }}
      >
        <LogoIcon />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              title={item.id}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive ? 'var(--cyan-soft)' : 'transparent',
                border: isActive ? '1px solid rgba(45,212,234,0.5)' : '1px solid transparent',
                boxShadow: isActive ? '0 0 14px rgba(45,212,234,0.25)' : 'none',
              }}
            >
              {item.icon(isActive)}
            </button>
          );
        })}
      </div>

      <button
        onClick={onOpenSettings}
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: '1px solid transparent',
        }}
        title="Ayarlar"
      >
        <SettingsIcon />
      </button>
    </div>
  );
}
