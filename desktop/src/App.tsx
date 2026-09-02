import { useEffect, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { JarvisScreen } from './screens/JarvisScreen';
import { SettingsModal } from './components/SettingsModal';
import { ArastirmaScreen } from './screens/ArastirmaScreen';
import { PlanlamaScreen } from './screens/PlanlamaScreen';
import { OgrenmeScreen } from './screens/OgrenmeScreen';
import type { TabId } from './tabs';
import type { ListeningNote } from '../shared/types';
import { gradeCard, isoDate, newCard } from '../shared/sm2';
import { useListening } from './audio/useListening';
import type {
  AiEngine,
  AppState,
  ChatMessage,
  LearningTopic,
  PendingPcAction,
  PublicSettings,
  ReviewGrade,
  SettingsPatch,
} from '../shared/types';

const FALLBACK_STATE: AppState = {
  aiEngine: 'cloud',
  listeningMode: { jarvis: false, arastirma: false, planlama: false },
  chatMessages: [],
  listeningNotes: [],
  planPhases: [],
  selectedPhaseId: null,
  memory: { summary: '', facts: [], summarizedThroughId: null },
  savedResearch: [],
  learning: { decks: [], cards: [], reviewLog: {}, activeTopic: 'dil', activeDeckId: null },
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
  const [pendingAction, setPendingAction] = useState<PendingPcAction | null>(null);
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

  // The global hotkey opens Jarvis and starts listening, from any tab or any app.
  useEffect(() => {
    if (!hasBridge()) return;
    return window.jarvisDesktop.onSummon(() => {
      setTab('jarvis');
      setState((s) => (s ? { ...s, listeningMode: { ...s.listeningMode, jarvis: true } } : s));
    });
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

  const listeningSource: ListeningNote['source'] | null = state
    ? state.listeningMode.jarvis
      ? 'jarvis'
      : state.listeningMode.arastirma
        ? 'arastirma'
        : state.listeningMode.planlama
          ? 'planlama'
          : null
    : null;

  const listening = useListening({
    active: listeningSource !== null,
    engine: state?.aiEngine ?? 'local',
    onNotes: (notes) => addListeningNotes(notes, listeningSource ?? 'jarvis'),
    onTrigger: (message) => void onSendMessage(message),
  });

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
      setPendingAction(res.ok && res.pendingAction ? res.pendingAction : null);
    } else {
      replyText = '⚠ Bu görünüm masaüstü uygulaması dışında çalışıyor, AI motoruna erişilemiyor.';
    }

    const jarvisMsg: ChatMessage = { id: newId(), role: 'jarvis', text: replyText, createdAt: new Date().toISOString() };
    setState((s) =>
      s ? { ...s, chatMessages: [...s.chatMessages, jarvisMsg], memory: updatedMemory ?? s.memory } : s,
    );
    setPending(false);
  };

  const appendJarvisMessage = (text: string) =>
    setState((s) =>
      s
        ? {
            ...s,
            chatMessages: [
              ...s.chatMessages,
              { id: newId(), role: 'jarvis' as const, text, createdAt: new Date().toISOString() },
            ],
          }
        : s,
    );

  const onApproveAction = async (action: PendingPcAction) => {
    setPendingAction(null);
    if (!hasBridge()) return;
    const res = await window.jarvisDesktop.executeAction(action);
    appendJarvisMessage(res.ok ? `✓ ${action.description}\n\n${res.output}` : `⚠ ${res.error}`);
  };

  const onRejectAction = () => {
    setPendingAction(null);
    appendJarvisMessage('Tamam efendim, o işlemi yapmadım.');
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

  const addListeningNotes = (texts: string[], source: ListeningNote['source']) =>
    setState((s) =>
      s
        ? {
            ...s,
            listeningNotes: [
              ...s.listeningNotes,
              ...texts.map((text) => ({
                id: newId(),
                text,
                source,
                createdAt: new Date().toISOString(),
              })),
            ],
          }
        : s,
    );

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

  const onGradeCard = (cardId: string, grade: ReviewGrade) => {
    const now = new Date();
    const today = isoDate(now);
    setState((s) => {
      if (!s) return s;
      const card = s.learning.cards.find((c) => c.id === cardId);
      if (!card) return s;
      return {
        ...s,
        learning: {
          ...s.learning,
          cards: s.learning.cards.map((c) => (c.id === cardId ? gradeCard(c, grade, now) : c)),
          reviewLog: { ...s.learning.reviewLog, [today]: (s.learning.reviewLog[today] ?? 0) + 1 },
        },
      };
    });
  };

  const onAddGeneratedCards = (deckId: string, cards: { question: string; answer: string }[]) =>
    setState((s) =>
      s
        ? {
            ...s,
            learning: {
              ...s.learning,
              cards: [
                ...s.learning.cards,
                ...cards.map((c) => newCard({ id: newId(), deckId, question: c.question, answer: c.answer })),
              ],
            },
          }
        : s,
    );

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
            listeningStatus={listening}
            pending={pending}
            pendingAction={pendingAction}
            onToggleListening={() => onToggleListening('jarvis')}
            onSendMessage={onSendMessage}
            onAddNote={onAddNote}
            onApproveAction={onApproveAction}
            onRejectAction={onRejectAction}
          />
        )}
        {tab === 'arastirma' && (
          <ArastirmaScreen
            listening={state.listeningMode.arastirma}
            listeningStatus={listening}
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
            listeningStatus={listening}
            onToggleListening={() => onToggleListening('planlama')}
            onSelectPhase={onSelectPhase}
            onTogglePossibility={onTogglePossibility}
            onAddPhase={onAddPhase}
            onAddNote={onAddPhaseNote}
          />
        )}
        {tab === 'ogrenme' && (
          <OgrenmeScreen
            learning={state.learning}
            aiEngine={state.aiEngine}
            onSetTopic={(topic: LearningTopic) =>
              update({
                learning: {
                  ...state.learning,
                  activeTopic: topic,
                  activeDeckId: state.learning.decks.find((d) => d.topic === topic)?.id ?? null,
                },
              })
            }
            onSetDeck={(deckId) => update({ learning: { ...state.learning, activeDeckId: deckId } })}
            onGrade={onGradeCard}
            onAddGeneratedCards={onAddGeneratedCards}
          />
        )}
      </div>
      {settingsOpen && (
        <SettingsModal settings={settings} onSave={onSaveSettings} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
