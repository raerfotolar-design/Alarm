import { useState } from 'react';

type Mode = 'dil' | 'programlama';

const HEATMAP = Array.from({ length: 35 }, (_, i) => (i % 5 === 3 ? 0.15 : [0.85, 0.55, 0.3][i % 3]));

export function OgrenmeScreen() {
  const [mode, setMode] = useState<Mode>('dil');
  const [flipped, setFlipped] = useState(false);

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ display: 'flex', background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 999, padding: 3 }}>
            <button
              onClick={() => setMode('dil')}
              style={{
                padding: '7px 16px',
                borderRadius: 999,
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                background: mode === 'dil' ? 'linear-gradient(90deg,#8B7CFF,#6C5CE7)' : 'transparent',
                color: mode === 'dil' ? '#0B0620' : 'var(--text-dim)',
              }}
            >
              Dil Öğrenme
            </button>
            <button
              onClick={() => setMode('programlama')}
              style={{
                padding: '7px 16px',
                borderRadius: 999,
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                background: mode === 'programlama' ? 'linear-gradient(90deg,#8B7CFF,#6C5CE7)' : 'transparent',
                color: mode === 'programlama' ? '#0B0620' : 'var(--text-dim)',
              }}
            >
              Programlama
            </button>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>12 / 30 kart</div>
        </div>

        <button
          onClick={() => setFlipped((f) => !f)}
          style={{
            width: 460,
            height: 280,
            borderRadius: 22,
            background: 'linear-gradient(160deg,#0D1220,#0B1220)',
            border: '1px solid var(--border)',
            boxShadow: '0 0 40px rgba(45,212,234,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', top: 16, left: 20, fontSize: 10.5, color: 'var(--text-dim)' }}>
            {flipped ? 'CEVAP' : 'SORU'}
          </div>
          {mode === 'dil' ? (
            flipped ? (
              <>
                <div className="heading" style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>gönülsüz, isteksiz</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-dim)', textAlign: 'center' }}>
                  "He was reluctant to leave the party." → İsteksizce ayrılmayı kabul etti.
                </div>
              </>
            ) : (
              <>
                <div className="heading" style={{ fontSize: 30, fontWeight: 700, marginBottom: 14 }}>"reluctant"</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-dim)', textAlign: 'center', maxWidth: 320 }}>
                  Türkçe çevirisini ve bir örnek cümlede kullanımını söyle
                </div>
              </>
            )
          ) : flipped ? (
            <>
              <div className="heading" style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Bir üreteç (generator) fonksiyon</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-dim)', textAlign: 'center' }}>
                "yield" kullanarak değerleri tek tek, çağrıldıkça üretir; tüm listeyi belleğe almaz.
              </div>
            </>
          ) : (
            <>
              <div className="heading" style={{ fontSize: 22, fontWeight: 700, marginBottom: 14, textAlign: 'center' }}>
                Python'da "yield" ne işe yarar?
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-dim)', textAlign: 'center', maxWidth: 320 }}>
                Bir örnekle açıkla
              </div>
            </>
          )}
          <div style={{ position: 'absolute', bottom: 16, fontSize: 10.5, color: '#4A5D75' }}>Çevirmek için tıkla</div>
        </button>

        <div style={{ display: 'flex', gap: 14, marginTop: 24 }}>
          <div style={{ width: 128, padding: '13px 0', borderRadius: 14, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.45)', textAlign: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F87171' }}>Zor</span>
          </div>
          <div style={{ width: 128, padding: '13px 0', borderRadius: 14, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.45)', textAlign: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#FBBF24' }}>Orta</span>
          </div>
          <div style={{ width: 128, padding: '13px 0', borderRadius: 14, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.5)', textAlign: 'center', boxShadow: '0 0 16px rgba(52,211,153,0.2)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#34D399' }}>Kolay</span>
          </div>
        </div>
      </div>

      <div style={{ width: 300, minWidth: 300, borderLeft: '1px solid var(--border)', overflowY: 'auto' }}>
        <div style={{ padding: '20px 18px 16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FB923C" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c4.4 0 7-2.8 7-6.8 0-3.2-2-5-3.2-7.4-.5 1.6-1.4 2.6-2.3 2.6.6-3-1-6-3.5-7.4.3 2.2-.6 4-2.3 5.6C6.1 10 5 12 5 14.8 5 19 7.6 22 12 22Z" />
            </svg>
          </div>
          <div>
            <div className="heading" style={{ fontSize: 22, fontWeight: 700 }}>18 gün</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>kesintisiz seri</div>
          </div>
        </div>

        <div style={{ padding: 18, borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
            Konu Hakimiyeti
          </div>
          {[
            { label: 'İngilizce · Kelime', pct: 72, color: '#2DD4EA' },
            { label: 'İngilizce · Dilbilgisi', pct: 45, color: '#8B7CFF' },
            { label: 'Python · Fonksiyonlar', pct: 88, color: '#34D399' },
            { label: 'Python · Async', pct: 21, color: '#FBBF24' },
          ].map((t) => (
            <div key={t.label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span>{t.label}</span>
                <span style={{ color: 'var(--text-dim)' }}>{t.pct}%</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{ width: `${t.pct}%`, height: '100%', background: t.color }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
            Son 5 Hafta
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
            {HEATMAP.map((opacity, i) => (
              <div key={i} style={{ width: '100%', aspectRatio: '1', borderRadius: 4, background: `rgba(45,212,234,${opacity})` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
