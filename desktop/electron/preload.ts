import { contextBridge, ipcRenderer } from 'electron';
import { STORE_CHANNELS, type AppState } from '../shared/types';

contextBridge.exposeInMainWorld('jarvisDesktop', {
  loadState: (): Promise<AppState> => ipcRenderer.invoke(STORE_CHANNELS.load),
  saveState: (state: AppState): Promise<boolean> => ipcRenderer.invoke(STORE_CHANNELS.save, state),
});
