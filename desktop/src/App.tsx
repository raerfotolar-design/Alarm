import { useEffect, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { JarvisScreen } from './screens/JarvisScreen';
import { SettingsModal } from './components/SettingsModal';
import { ArastirmaScreen } from './screens/ArastirmaScreen';
import { PlanlamaScreen } from './screens/PlanlamaScreen';
import { OgrenmeScreen } from './screens/OgrenmeScreen';
import type { TabId } from './tabs';
import type { AiEngine, AppState, ChatMessage, PublicSettings, SettingsPatch } from '../shared/types';

const FALLBACK_STATE: AppState = {
  aiEngine: 'cloud',
  listeningMode: { jarvis: false, arastirma: false, planlama: false },
  chatMessages: [],
  listeningNotes: [],
  planPhases: [],
  selectedPhaseId: null,
  memory: { summary: '', facts: [], summarizedThroughId: null },
  savedResearch: [],
};

function hasBridge(): boolean {
  return typeof window !== 'undefined' && !!window.jarvisDesktop;
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [tab, setTab] = useState<TabId>('jarvis');
  const [state, setState] = useState<AppState | null>(null);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      if (!hasBridge()) {
        setState(FALLBACK_STATE);
        return;
      }
      setState(await window.jarvisDesktop.loadState());
      try {
        setSettings(await window.jarvisDesktop.getSettings());
      } catch {
        // Settings are optional for rendering; the modal just opens with defaults.
        setSettings(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (!state || !hasBridge()) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      window.jarvisDesktop.saveState(state);
    }, 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state]);

  if (!state) return null;

  const update = (patch: Partial<AppState>) => setState((s) => (s ? { ...s, ...patch } : s));

  const onEngineChange = (aiEngine: AiEngine) => update({ aiEngine });

  const onToggleListening = (key: keyof AppState['listeningMode']) =>
    update({ listeningMode: { ...state.listeningMode, [key]: !state.listeningMode[key] } });

  const onSendMessage = async (text: string) => {
    const historyBeforeSend = state.chatMessages;
    const userMsg: ChatMessage = { id: newId(), role: 'user', text, createdAt: new Date().toISOString() };
    setState((s) => (s ? { ...s, chatMessages: [...s.chatMessages, userMsg] } : s));
    setPending(true);

    let replyText: string;
    let updatedMemory: AppState['memory'] | null = null;
    if (hasBridge()) {
      const res = await window.jarvisDesktop.sendChat({
        engine: state.aiEngine,
        history: historyBeforeSend,
        userText: text,
        memory: state.memory,
        notes: state.listeningNotes,
      });
      replyText = res.ok ? res.text : `⚠ ${res.error}`;
      if (res.ok && res.memory) updatedMemory = res.memory;
    } else {
      replyText = '⚠ Bu görünüm masaüstü uygulaması dışında çalışıyor, AI motoruna erişilemiyor.';
    }

    const jarvisMsg: ChatMessage = { id: newId(), role: 'jarvis', text: replyText, createdAt: new Date().toISOString() };
    setState((s) =>
      s ? { ...s, chatMessages: [...s.chatMessages, jarvisMsg], memory: updatedMemory ?? s.memory } : s,
    );
    setPending(false);
  };

  const onSaveSettings = async (patch: SettingsPatch) => {
    if (!hasBridge()) return;
    setSettings(await window.jarvisDesktop.updateSettings(patch));
  };

  const onAddNote = (text: string) =>
    update({
      listeningNotes: [...state.listeningNotes, { id: newId(), text, source: 'jarvis', createdAt: new Date().toISOString() }],
    });

  const onSelectPhase = (id: string) => update({ selectedPhaseId: id });

  const onTogglePossibility = (phaseId: string, possibilityId: string) =>
    update({
      planPhases: state.planPhases.map((p) =>
        p.id !== phaseId
          ? p
          : { ...p, possibilities: p.possibilities.map((poss) => (poss.id === possibilityId ? { ...poss, selected: !poss.selected } : poss)) },
      ),
    });

  const onAddPhase = () => {
    const order = state.planPhases.length + 1;
    const id = `faz-${order}-${newId()}`;
    update({
      planPhases: [
        ...state.planPhases,
        { id, order, title: 'Yeni Faz', subtitle: '', progress: 0, possibilities: [], notes: [], researchIds: [] },
      ],
      selectedPhaseId: id,
    });
  };

  const onAddPhaseNote = (phaseId: string, text: string) =>
    update({
      planPhases: state.planPhases.map((p) => (p.id === phaseId ? { ...p, notes: [...p.notes, text] } : p)),
    });

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', background: 'var(--bg)', color: 'var(--text)', overflow: 'hidden' }}>
      <Sidebar active={tab} onSelect={setTab} onOpenSettings={() => setSettingsOpen(true)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar tab={tab} aiEngine={state.aiEngine} onEngineChange={onEngineChange} />
        {tab === 'jarvis' && (
          <JarvisScreen
            messages={state.chatMessages}
            notes={state.listeningNotes.filter((n) => n.source === 'jarvis')}
            memory={state.memory}
            listening={state.listeningMode.jarvis}
            pending={pending}
            onToggleListening={() => onToggleListening('jarvis')}
            onSendMessage={onSendMessage}
            onAddNote={onAddNote}
          />
        )}
        {tab === 'arastirma' && (
          <ArastirmaScreen
            listening={state.listeningMode.arastirma}
            phases={state.planPhases}
            selectedPhaseId={state.selectedPhaseId}
            savedResearch={state.savedResearch}
            onToggleListening={() => onToggleListening('arastirma')}
            onSaved={(item) => setState((s) => (s ? { ...s, savedResearch: [...s.savedResearch, item] } : s))}
          />
        )}
        {tab === 'planlama' && (
          <PlanlamaScreen
            phases={state.planPhases}
            selectedPhaseId={state.selectedPhaseId}
            savedResearch={state.savedResearch}
            listening={state.listeningMode.planlama}
            onToggleListening={() => onToggleListening('planlama')}
            onSelectPhase={onSelectPhase}
            onTogglePossibility={onTogglePossibility}
            onAddPhase={onAddPhase}
            onAddNote={onAddPhaseNote}
          />
        )}
        {tab === 'ogrenme' && <OgrenmeScreen />}
      </div>
      {settingsOpen && (
        <SettingsModal settings={settings} onSave={onSaveSettings} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
