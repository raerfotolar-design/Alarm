import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { getLullabySettings } from '../storage/lullabyRepository';

let player: AudioPlayer | null = null;
let sleepTimer: ReturnType<typeof setTimeout> | null = null;

function clearTimer() {
  if (sleepTimer) {
    clearTimeout(sleepTimer);
    sleepTimer = null;
  }
}

export function isLullabyPlaying(): boolean {
  return !!player?.playing;
}

export async function playLullaby(): Promise<{ ok: boolean; reason?: string }> {
  const settings = await getLullabySettings();
  if (!settings.audioUri) return { ok: false, reason: 'no_audio_set' };

  stopLullaby();
  player = createAudioPlayer({ uri: settings.audioUri });
  player.loop = settings.loop;
  player.play();

  if (settings.sleepTimerMinutes > 0) {
    sleepTimer = setTimeout(() => stopLullaby(), settings.sleepTimerMinutes * 60 * 1000);
  }

  return { ok: true };
}

export function stopLullaby(): void {
  clearTimer();
  if (player) {
    try {
      player.pause();
    } catch {
      // already stopped
    }
    player = null;
  }
}

export async function setLullabyPlaying(playing: boolean): Promise<{ ok: boolean; reason?: string }> {
  if (playing) return playLullaby();
  stopLullaby();
  return { ok: true };
}
