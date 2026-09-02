import { useState } from 'react';
import { ListeningModeBar } from '../components/ListeningModeBar';

interface ArastirmaScreenProps {
  listening: boolean;
  onToggleListening: () => void;
}

interface ResultCard {
  id: string;
  title: string;
  kind: 'video' | 'image';
  phaseTag: string;
}

const MOCK_RESULTS: ResultCard[] = [
  { id: '1', title: 'Rakip ürün tanıtım videosu', kind: 'video', phaseTag: "Faz 2'ye bağlı" },
  { id: '2', title: 'Kullanıcı arayüzü ilhamı', kind: 'image', phaseTag: "Faz 1'e bağlı" },
  { id: '3', title: 'Sunum anlatım videosu', kind: 'video', phaseTag: "Faz 2'ye bağlı" },
  { id: '4', title: 'Renk paleti referansı', kind: 'image', phaseTag: "Faz 2'ye bağlı" },
  { id: '5', title: 'Konu anlatım videosu', kind: 'video', phaseTag: "Faz 1'e bağlı" },
  { id: '6', title: 'İkon seti örneği', kind: 'image', phaseTag: "Faz 3'e bağlı" },
  { id: '7', title: 'Kart düzeni ilhamı', kind: 'image', phaseTag: "Faz 2'ye bağlı" },
  { id: '8', title: 'Demo akışı videosu', kind: 'video', phaseTag: "Faz 3'e bağlı" },
];

export function ArastirmaScreen({ listening, onToggleListening }: ArastirmaScreenProps) {
  const [query, setQuery] = useState('');

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
        <button
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
          Ara
        </button>
      </div>

      <ListeningModeBar
        active={listening}
        onToggle={onToggleListening}
        label={listening ? 'Dinleme Modu açık — "bunu kaydet" komutu dinleniyor' : 'Dinleme Modu kapalı'}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {MOCK_RESULTS.map((r) => (
          <div key={r.id} style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div
              style={{
                height: 100,
                background: r.kind === 'video' ? 'linear-gradient(135deg,#1B3346,#0D1220)' : 'linear-gradient(135deg,#2A2350,#0D1220)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10.5,
                color: 'var(--text-dim)',
              }}
            >
              {r.kind === 'video' ? 'VİDEO' : 'GÖRSEL'}
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{r.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10.5, padding: '4px 8px', borderRadius: 999, border: '1px solid rgba(45,212,234,0.4)', color: '#2DD4EA' }}>
                  {r.phaseTag}
                </span>
                <button
                  title="Kaydet"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7C8DA6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 4v12m0 0-4-4m4 4 4-4M4 20h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
