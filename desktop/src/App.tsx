import { useEffect, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { JarvisScreen, jarvisPlaceholderReply } from './screens/JarvisScreen';
import { ArastirmaScreen } from './screens/ArastirmaScreen';
import { PlanlamaScreen } from './screens/PlanlamaScreen';
import { OgrenmeScreen } from './screens/OgrenmeScreen';
import type { TabId } from './tabs';
import type { AiEngine, AppState } from '../shared/types';

const FALLBACK_STATE: AppState = {
  aiEngine: 'cloud',
  listeningMode: { jarvis: false, arastirma: false, planlama: false },
  chatMessages: [],
  listeningNotes: [],
  planPhases: [],
  selectedPhaseId: null,
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
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      if (hasBridge()) {
        setState(await window.jarvisDesktop.loadState());
      } else {
        setState(FALLBACK_STATE);
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

  const onSendMessage = (text: string) => {
    const userMsg = { id: newId(), role: 'user' as const, text, createdAt: new Date().toISOString() };
    const jarvisMsg = {
      id: newId(),
      role: 'jarvis' as const,
      text: jarvisPlaceholderReply(text),
      createdAt: new Date().toISOString(),
    };
    update({ chatMessages: [...state.chatMessages, userMsg, jarvisMsg] });
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
      <Sidebar active={tab} onSelect={setTab} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar tab={tab} aiEngine={state.aiEngine} onEngineChange={onEngineChange} />
        {tab === 'jarvis' && (
          <JarvisScreen
            messages={state.chatMessages}
            notes={state.listeningNotes.filter((n) => n.source === 'jarvis')}
            listening={state.listeningMode.jarvis}
            onToggleListening={() => onToggleListening('jarvis')}
            onSendMessage={onSendMessage}
            onAddNote={onAddNote}
          />
        )}
        {tab === 'arastirma' && (
          <ArastirmaScreen listening={state.listeningMode.arastirma} onToggleListening={() => onToggleListening('arastirma')} />
        )}
        {tab === 'planlama' && (
          <PlanlamaScreen
            phases={state.planPhases}
            selectedPhaseId={state.selectedPhaseId}
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
    </div>
  );
}
