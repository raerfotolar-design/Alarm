import { BrowserWindow, globalShortcut } from 'electron';
import { APP_EVENTS } from '../shared/types';

export const DEFAULT_HOTKEY = 'CommandOrControl+Shift+J';

let registered: string | null = null;

/**
 * Summons Jarvis from anywhere — even while another app has focus. Returns whether
 * the accelerator could be claimed; another program may already own it, and the user
 * needs to be told rather than left pressing a dead key.
 */
export function registerHotkey(accelerator: string, getWindow: () => BrowserWindow | null): boolean {
  unregisterHotkey();

  const combo = accelerator.trim() || DEFAULT_HOTKEY;
  let ok = false;
  try {
    ok = globalShortcut.register(combo, () => {
      const win = getWindow();
      if (!win) return;
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
      win.webContents.send(APP_EVENTS.summon);
    });
  } catch {
    ok = false;
  }

  registered = ok ? combo : null;
  return ok;
}

export function unregisterHotkey(): void {
  if (registered) {
    globalShortcut.unregister(registered);
    registered = null;
  }
}
