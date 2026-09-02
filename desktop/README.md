# Jarvis Desktop

PC companion app — separate from the phone app in this repo. Electron + React + TypeScript + Vite.

Design reference: https://claude.ai/code/artifact/0592fc1f-ea80-473d-a4be-354d5d9fb07c

## Status (v0.2)

- 4-tab shell (Jarvis / Araştırma / Planlama / Öğrenme) with the sidebar + topbar layout from the design, dark-neon theme.
- **Jarvis**: working chat against a real AI engine, Dinleme Modu toggle, notes panel — all persisted locally (JSON file in Electron's `userData` dir).
- **Hybrid AI**: the topbar toggle picks the engine per message.
  - *Yerel AI* → Ollama on `http://localhost:11434` (default model `llama3.1:8b`). Start it with `ollama serve`.
  - *Bulut AI* → Gemini REST API (default model `gemini-3.6-flash`), needs an API key.
  - Both share the same Jarvis persona (`electron/ai/persona.ts`) and the last 20 turns of history.
- **Settings** (sidebar gear): Gemini API key + model, Ollama URL + model. The key is encrypted with Electron's `safeStorage` and is never sent back to the renderer.
- **Planlama**: real Plan Ağacı data model — phases, progress, possibilities (toggleable), per-phase notes, add-phase FAB. Persisted locally.
- **Araştırma** / **Öğrenme**: UI shells with mock data, not yet wired to real search/spaced-repetition logic.

Not yet built: local Whisper listening, "100% PC control", web research + save-to-disk, Supabase/Firebase shared backend, spaced-repetition engine, wake-word.

## Architecture notes

- All AI calls and secrets live in the **main process** (`electron/ai/`, `electron/settings.ts`); the renderer only talks over IPC (`shared/types.ts` defines the channels). No API key ever reaches the renderer.
- The preload runs with `sandbox: false` so it can `require` the shared types module; `contextIsolation` stays on and `nodeIntegration` off.
- Fonts load from Google Fonts, so on a machine with no internet the UI falls back to system sans — worth bundling locally later.

## Run it

```bash
npm install
npm run electron:dev   # runs Vite + Electron together, with hot reload
```

Or separately:

```bash
npm run dev             # Vite dev server only, http://localhost:5173
npm run build            # production build (renderer + main process)
npx electron .           # run the built app
```

`npm run typecheck` checks both the renderer and the Electron main process.
