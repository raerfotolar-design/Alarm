import { useEffect, useRef } from 'react';
import { useAudioRecorder, RecordingPresets, AudioModule } from 'expo-audio';
import { File } from 'expo-file-system';
import * as Speech from 'expo-speech';
import { getSettings } from '../storage/settingsRepository';
import { listChatMessages, appendChatMessage } from '../storage/jarvisRepository';
import { sendJarvisMessage } from './jarvisService';
import { sendImmediateNotification } from './notifications';
import { startWakeWordListener, stopWakeWordListener, isWakeWordSupported } from './wakeWordService';

const LISTEN_DURATION_MS = 5000;

/**
 * Headless component (renders nothing) mounted once at the app root.
 * Watches the "wake word enabled" setting and, when on, keeps Porcupine
 * listening for "Jarvis" in the background. On detection it records a short
 * voice command, sends it to Gemini together with the app's tools, speaks
 * the reply out loud, and also fires a notification (useful when the
 * screen is off).
 */
export function JarvisVoiceAssistant() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const isBusyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      const settings = await getSettings();
      if (cancelled || !settings.wakeWordEnabled) return;
      if (!isWakeWordSupported()) return;

      await AudioModule.requestRecordingPermissionsAsync();

      await startWakeWordListener(
        settings.picovoiceAccessKey,
        () => handleWake(),
        (message) => console.warn('[Jarvis wake word]', message)
      );
    }

    async function handleWake() {
      if (isBusyRef.current) return;
      isBusyRef.current = true;
      try {
        await recorder.prepareToRecordAsync();
        recorder.record();
        await new Promise((resolve) => setTimeout(resolve, LISTEN_DURATION_MS));
        await recorder.stop();

        const uri = recorder.uri;
        if (!uri) return;

        const file = new File(uri);
        const base64 = await file.base64();

        const settings = await getSettings();
        const history = await listChatMessages();

        const reply = await sendJarvisMessage({
          apiKey: settings.geminiApiKey,
          history,
          userText: 'Kullanıcı sesli bir komut söyledi, ekteki ses kaydını dinle ve isteğini yerine getir. Cevabını kısa ve sözlü söylenecek şekilde ver.',
          mediaBase64: base64,
          mediaMimeType: 'audio/m4a',
        });

        await appendChatMessage('user', '(sesli komut)');
        await appendChatMessage('model', reply.text);

        if (reply.text) {
          Speech.speak(reply.text, { language: 'tr-TR' });
          await sendImmediateNotification('Jarvis', reply.text);
        }
      } catch (error: any) {
        console.warn('[Jarvis voice command]', error?.message ?? error);
      } finally {
        isBusyRef.current = false;
      }
    }

    setup();

    return () => {
      cancelled = true;
      stopWakeWordListener();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
