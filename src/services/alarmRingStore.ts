import { createAudioPlayer, AudioPlayer } from 'expo-audio';

export interface RingingAlarm {
  alarmId: string;
  label: string;
  soundUri: string | null;
  puzzleA: number;
  puzzleB: number;
}

let state: RingingAlarm | null = null;
const listeners = new Set<(s: RingingAlarm | null) => void>();
let player: AudioPlayer | null = null;
let volumeTimer: ReturnType<typeof setInterval> | null = null;

export function getRingingAlarm(): RingingAlarm | null {
  return state;
}

export function subscribeRingingAlarm(cb: (s: RingingAlarm | null) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify() {
  listeners.forEach((cb) => cb(state));
}

function stopAudio() {
  if (volumeTimer) {
    clearInterval(volumeTimer);
    volumeTimer = null;
  }
  if (player) {
    try {
      player.pause();
    } catch {
      // already stopped
    }
    player = null;
  }
}

export function startAlarmRinging(alarmId: string, label: string, soundUri: string | null): void {
  stopAudio();
  state = {
    alarmId,
    label,
    soundUri,
    puzzleA: Math.floor(Math.random() * 8) + 2,
    puzzleB: Math.floor(Math.random() * 8) + 2,
  };
  notify();

  if (soundUri) {
    player = createAudioPlayer({ uri: soundUri });
    player.loop = true;
    player.volume = 0.15;
    player.play();

    let volume = 0.15;
    volumeTimer = setInterval(() => {
      volume = Math.min(1, volume + 0.1);
      if (player) player.volume = volume;
      if (volume >= 1 && volumeTimer) {
        clearInterval(volumeTimer);
        volumeTimer = null;
      }
    }, 1500);
  }
}

export function stopAlarmRinging(): void {
  stopAudio();
  state = null;
  notify();
}
