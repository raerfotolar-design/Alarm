import { createAudioPlayer, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';

export async function ensureMicPermission(): Promise<boolean> {
  const res = await requestRecordingPermissionsAsync();
  return res.granted;
}

export async function playSound(uri: string): Promise<void> {
  const player = createAudioPlayer({ uri });
  player.play();
}

export async function activateAudioSession(): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'duckOthers',
  });
}
