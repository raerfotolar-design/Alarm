import type { CSSProperties } from 'react';

interface IconProps {
  color?: string;
  size?: number;
  style?: CSSProperties;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export function LogoIcon({ color = '#05070C', size = 20, style }: IconProps) {
  return (
    <svg {...base(size)} stroke={color} strokeWidth={2.2} style={style}>
      <path d="M12 2 L14 9 L21 12 L14 15 L12 22 L10 15 L3 12 L10 9 Z" />
    </svg>
  );
}

export function ChatIcon({ color = '#7C8DA6', size = 20, style }: IconProps) {
  return (
    <svg {...base(size)} stroke={color} strokeWidth={1.8} style={style}>
      <path d="M4 4h16v12H8l-4 4V4Z" />
    </svg>
  );
}

export function SearchIcon({ color = '#7C8DA6', size = 20, style }: IconProps) {
  return (
    <svg {...base(size)} stroke={color} strokeWidth={1.8} style={style}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function NetworkIcon({ color = '#7C8DA6', size = 20, style }: IconProps) {
  return (
    <svg {...base(size)} stroke={color} strokeWidth={1.8} style={style}>
      <circle cx="5" cy="6" r="2.2" />
      <circle cx="12" cy="12" r="2.2" />
      <circle cx="19" cy="18" r="2.2" />
      <path d="M7 6h5M12 12l7 6" />
    </svg>
  );
}

export function DocumentIcon({ color = '#7C8DA6', size = 20, style }: IconProps) {
  return (
    <svg {...base(size)} stroke={color} strokeWidth={1.8} style={style}>
      <path d="M4 19V6a2 2 0 0 1 2-2h9l5 5v10a0 0 0 0 1 0 0H6a2 2 0 0 1-2-2Z" />
      <path d="M8 8h5M8 12h8M8 16h8" />
    </svg>
  );
}

export function SettingsIcon({ color = '#7C8DA6', size = 20, style }: IconProps) {
  return (
    <svg {...base(size)} stroke={color} strokeWidth={1.8} style={style}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}

export function MicIcon({ color = '#8B7CFF', size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} stroke={color} strokeWidth={2} style={style}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

export function PlusIcon({ color = '#03141A', size = 22, style }: IconProps) {
  return (
    <svg {...base(size)} stroke={color} strokeWidth={2.4} style={style}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
