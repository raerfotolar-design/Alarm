import { useEffect, useRef, useState } from 'react';
import { startRecording, type RecorderHandle } from './recorder';
import type { AiEngine } from '../../shared/types';

interface UseListeningParams {
  active: boolean;
  engine: AiEngine;
  onNotes: (notes: string[]) => void;
  /** Fired when the user says "Jarvis konuş" — the message is what they asked. */
  onTrigger: (message: string) => void;
}

export interface ListeningStatus {
  state: 'off' | 'starting' | 'listening' | 'processing' | 'error';
  lastTranscript: string;
  error: string;
}

/**
 * Drives the passive listening loop: microphone → whisper → notes, staying silent
 * until the user asks Jarvis to speak. Segments are handled one at a time so a slow
 * transcription cannot pile up behind the microphone.
 */
export function useListening({ active, engine, onNotes, onTrigger }: UseListeningParams): ListeningStatus {
  const [status, setStatus] = useState<ListeningStatus>({ state: 'off', lastTranscript: '', error: '' });
  const recorderRef = useRef<RecorderHandle | null>(null);
  const busyRef = useRef(false);

  // Handlers change identity every render; a ref keeps the effect from restarting the mic.
  const handlers = useRef({ onNotes, onTrigger, engine });
  handlers.current = { onNotes, onTrigger, engine };

  useEffect(() => {
    if (!active) {
      recorderRef.current?.stop();
      recorderRef.current = null;
      setStatus({ state: 'off', lastTranscript: '', error: '' });
      return;
    }

    let cancelled = false;
    setStatus({ state: 'starting', lastTranscript: '', error: '' });

    const handleSegment = async (wav: Uint8Array) => {
      const bridge = window.jarvisDesktop;
      if (!bridge || busyRef.current || cancelled) return;
      busyRef.current = true;
      setStatus((s) => ({ ...s, state: 'processing' }));

      try {
        const heard = await bridge.transcribe(wav);
        if (cancelled) return;
        if (!heard.ok) {
          setStatus({ state: 'error', lastTranscript: '', error: heard.error });
          return;
        }
        if (!heard.text) {
          setStatus((s) => ({ ...s, state: 'listening' }));
          return;
        }

        setStatus({ state: 'listening', lastTranscript: heard.text, error: '' });

        const extracted = await bridge.extractNotes({ engine: handlers.current.engine, transcript: heard.text });
        if (cancelled || !extracted.ok) return;
        if (extracted.notes.length > 0) handlers.current.onNotes(extracted.notes);
        if (extracted.triggered) handlers.current.onTrigger(extracted.message || heard.text);
      } finally {
        busyRef.current = false;
      }
    };

    startRecording((wav) => void handleSegment(wav))
      .then((handle) => {
        if (cancelled) {
          handle.stop();
          return;
        }
        recorderRef.current = handle;
        setStatus({ state: 'listening', lastTranscript: '', error: '' });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus({
          state: 'error',
          lastTranscript: '',
          error: err instanceof Error ? `Mikrofona erişilemedi: ${err.message}` : 'Mikrofona erişilemedi.',
        });
      });

    return () => {
      cancelled = true;
      recorderRef.current?.stop();
      recorderRef.current = null;
    };
  }, [active]);

  return status;
}
