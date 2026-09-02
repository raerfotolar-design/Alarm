// Headless visual smoke test: launches the built app (with a display, e.g. via
// `xvfb-run -a npx electron scripts/screenshot-smoke.cjs --no-sandbox`), screenshots
// each tab, and writes smoke-<tab>.png to the project root. Requires `npm run build` first.
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { loadState, saveState } = require('../dist-electron/electron/store.js');
const { getPublicSettings, updateSettings } = require('../dist-electron/electron/settings.js');
const { handleChat } = require('../dist-electron/electron/ai/index.js');

ipcMain.handle('store:load', () => loadState());
ipcMain.handle('store:save', (_e, state) => saveState(state).then(() => true));
ipcMain.handle('settings:get', () => getPublicSettings());
ipcMain.handle('settings:set', (_e, patch) => updateSettings(patch));
ipcMain.handle('ai:chat', (_e, request) => handleChat(request));

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    backgroundColor: '#05070C',
    webPreferences: {
      preload: path.join(__dirname, '../dist-electron/electron/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  await win.loadFile(path.join(__dirname, '../dist/index.html'));
  await new Promise((r) => setTimeout(r, 500));

  const tabs = ['jarvis', 'arastirma', 'planlama', 'ogrenme'];
  for (const [idx, tab] of tabs.entries()) {
    await win.webContents.executeJavaScript(`
      document.querySelectorAll('div[style*="width: 72px"] button')[${idx}].click();
    `);
    await new Promise((r) => setTimeout(r, 300));
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(__dirname, `../smoke-${tab}.png`), img.toPNG());
  }
  app.quit();
});
