import { useEffect, useState } from 'react';
import type { PublicSettings, SettingsPatch } from '../../shared/types';

interface SettingsModalProps {
  settings: PublicSettings | null;
  onSave: (patch: SettingsPatch) => Promise<void>;
  onClose: () => void;
}

const inputStyle = {
  width: '100%',
  background: 'var(--surface-alt)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '9px 11px',
  color: 'var(--text)',
  fontSize: 12.5,
  outline: 'none',
} as const;

const labelStyle = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-dim)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: 6,
  display: 'block',
} as const;

export function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('');
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState('');
  const [ollamaModel, setOllamaModel] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setGeminiModel(settings.geminiModel);
    setOllamaBaseUrl(settings.ollamaBaseUrl);
    setOllamaModel(settings.ollamaModel);
  }, [settings]);

  const save = async () => {
    setSaving(true);
    const patch: SettingsPatch = { geminiModel, ollamaBaseUrl, ollamaModel };
    if (geminiKey.trim()) patch.geminiApiKey = geminiKey.trim();
    await onSave(patch);
    setSaving(false);
    setGeminiKey('');
    onClose();
  };

  const clearKey = async () => {
    setSaving(true);
    await onSave({ geminiApiKey: null });
    setSaving(false);
    setGeminiKey('');
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3,5,10,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          padding: 24,
          boxShadow: '0 0 50px rgba(0,0,0,0.6)',
        }}
      >
        <div className="heading" style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>
          Ayarlar
        </div>

        <div style={{ marginBottom: 18 }}>
          <span style={labelStyle}>Bulut AI — Gemini API anahtarı</span>
          <input
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder={settings?.hasGeminiKey ? '•••••••• (kayıtlı — değiştirmek için yeni anahtar yaz)' : 'AIza...'}
            style={inputStyle}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>
              Anahtar bu bilgisayarda şifrelenerek saklanır, arayüze geri gönderilmez.
            </span>
            {settings?.hasGeminiKey && (
              <button
                onClick={clearKey}
                style={{ background: 'transparent', border: 'none', color: '#F87171', fontSize: 10.5, padding: 0 }}
              >
                Sil
              </button>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <span style={labelStyle}>Bulut AI — model</span>
          <input value={geminiModel} onChange={(e) => setGeminiModel(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <span style={labelStyle}>Yerel AI — Ollama adresi</span>
          <input value={ollamaBaseUrl} onChange={(e) => setOllamaBaseUrl(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <span style={labelStyle}>Yerel AI — model</span>
          <input value={ollamaModel} onChange={(e) => setOllamaModel(e.target.value)} style={inputStyle} />
          <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 6 }}>
            RTX 5060 8GB için 7B–14B modeller uygun (örn. llama3.1:8b, qwen2.5:14b).
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-dim)',
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            Vazgeç
          </button>
          <button
            onClick={save}
            disabled={saving}
            style={{
              padding: '10px 22px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg,#2DD4EA,#38BDF8)',
              color: '#03141A',
              fontSize: 12.5,
              fontWeight: 700,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}
