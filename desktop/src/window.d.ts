import type { AppState } from '../shared/types';

declare global {
  interface Window {
    jarvisDesktop: {
      loadState: () => Promise<AppState>;
      saveState: (state: AppState) => Promise<boolean>;
    };
  }
}

export {};
