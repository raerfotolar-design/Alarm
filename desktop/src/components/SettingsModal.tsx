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
  const [youtubeKey, setYoutubeKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('');
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState('');
  const [ollamaModel, setOllamaModel] = useState('');
  const [saveFolder, setSaveFolder] = useState('');
  const [pcControlEnabled, setPcControlEnabled] = useState(false);
  const [whisperPath, setWhisperPath] = useState('');
  const [whisperModelPath, setWhisperModelPath] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setGeminiModel(settings.geminiModel);
    setOllamaBaseUrl(settings.ollamaBaseUrl);
    setOllamaModel(settings.ollamaModel);
    setSaveFolder(settings.saveFolder);
    setPcControlEnabled(settings.pcControlEnabled);
    setWhisperPath(settings.whisperPath);
    setWhisperModelPath(settings.whisperModelPath);
  }, [settings]);

  const save = async () => {
    setSaving(true);
    const patch: SettingsPatch = {
      geminiModel,
      ollamaBaseUrl,
      ollamaModel,
      saveFolder,
      pcControlEnabled,
      whisperPath,
      whisperModelPath,
    };
    if (geminiKey.trim()) patch.geminiApiKey = geminiKey.trim();
    if (youtubeKey.trim()) patch.youtubeApiKey = youtubeKey.trim();
    await onSave(patch);
    setSaving(false);
    setGeminiKey('');
    setYoutubeKey('');
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

        <div style={{ marginBottom: 18 }}>
          <span style={labelStyle}>Yerel AI — model</span>
          <input value={ollamaModel} onChange={(e) => setOllamaModel(e.target.value)} style={inputStyle} />
          <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 6 }}>
            RTX 5060 8GB için 7B–14B modeller uygun (örn. llama3.1:8b, qwen2.5:14b).
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <span style={labelStyle}>Araştırma — YouTube API anahtarı (video araması için)</span>
          <input
            type="password"
            value={youtubeKey}
            onChange={(e) => setYoutubeKey(e.target.value)}
            placeholder={settings?.hasYoutubeKey ? '•••••••• (kayıtlı)' : 'İsteğe bağlı — görsel araması anahtarsız çalışır'}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <span style={labelStyle}>Araştırma — kayıt klasörü</span>
          <input
            value={saveFolder}
            onChange={(e) => setSaveFolder(e.target.value)}
            placeholder="Boş bırakırsan uygulama klasöründeki 'kayitlar' kullanılır"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <span style={labelStyle}>Dinleme Modu — whisper.cpp çalıştırılabiliri</span>
          <input
            value={whisperPath}
            onChange={(e) => setWhisperPath(e.target.value)}
            placeholder="örn. C:\\whisper\\whisper-cli.exe"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <span style={labelStyle}>Dinleme Modu — model dosyası</span>
          <input
            value={whisperModelPath}
            onChange={(e) => setWhisperModelPath(e.target.value)}
            placeholder="örn. C:\\whisper\\models\\ggml-medium.bin"
            style={inputStyle}
          />
          <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 6 }}>
            Ses bilgisayardan çıkmaz; yazıya çevirme tamamen yerelde yapılır.
          </div>
        </div>

        <div
          style={{
            marginBottom: 24,
            padding: 14,
            borderRadius: 12,
            background: pcControlEnabled ? 'rgba(251,191,36,0.08)' : 'var(--surface-alt)',
            border: `1px solid ${pcControlEnabled ? 'rgba(251,191,36,0.45)' : 'var(--border)'}`,
          }}
        >
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={pcControlEnabled}
              onChange={(e) => setPcControlEnabled(e.target.checked)}
              style={{ marginTop: 2 }}
            />
            <span>
              <span style={{ fontSize: 12.5, fontWeight: 700, display: 'block', marginBottom: 4 }}>
                PC kontrolü
              </span>
              <span style={{ fontSize: 10.5, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                Açıkken Jarvis dosyalarını okuyabilir, arayabilir, klasör listeleyebilir ve dosya/uygulama
                açabilir. Yazma, silme, taşıma ve terminal komutları her seferinde senin onayını ister.
              </span>
            </span>
          </label>
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
