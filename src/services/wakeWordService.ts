/**
 * Wraps Picovoice Porcupine so the rest of the app can call a small, safe API.
 * Porcupine is a native module: it does not exist in Expo Go, only in a custom
 * EAS build. Every access below is lazy (require() at call time, not at module
 * load time) and wrapped in try/catch so importing this file never crashes
 * Expo Go — the feature simply reports itself unavailable there.
 */

let managerInstance: any = null;

export function isWakeWordSupported(): boolean {
  try {
    require('@picovoice/porcupine-react-native');
    return true;
  } catch {
    return false;
  }
}

export async function startWakeWordListener(
  accessKey: string,
  onWake: () => void,
  onError?: (message: string) => void
): Promise<boolean> {
  if (!accessKey) {
    onError?.('Picovoice AccessKey girilmemiş.');
    return false;
  }

  try {
    const { default: PorcupineManager } = require('@picovoice/porcupine-react-native');
    await stopWakeWordListener();

    managerInstance = await PorcupineManager.fromKeywordPaths(
      accessKey,
      ['jarvis_android.ppn'],
      () => onWake(),
      (error: any) => onError?.(String(error?.message ?? error))
    );
    await managerInstance.start();
    return true;
  } catch (error: any) {
    onError?.(
      error?.message?.includes('has not been')
        ? 'Bu özellik yalnızca RAER Special App APK sürümünde çalışır (Expo Go desteklemiyor).'
        : String(error?.message ?? error)
    );
    return false;
  }
}

export async function stopWakeWordListener(): Promise<void> {
  if (managerInstance) {
    try {
      await managerInstance.stop();
      managerInstance.delete();
    } catch {
      // ignore
    }
    managerInstance = null;
  }
}
