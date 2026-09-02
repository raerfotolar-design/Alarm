# Jarvis Desktop

PC companion app — separate from the phone app in this repo. Electron + React + TypeScript + Vite.

Design reference: https://claude.ai/code/artifact/0592fc1f-ea80-473d-a4be-354d5d9fb07c

## Status (v0.1 — scaffold)

- 4-tab shell (Jarvis / Araştırma / Planlama / Öğrenme) with the sidebar + topbar layout from the design, dark-neon theme.
- **Jarvis**: chat UI + Dinleme Modu toggle + notes panel, all persisted locally (JSON file in Electron's `userData` dir). Jarvis's replies are a placeholder — no AI engine wired yet.
- **Planlama**: real Plan Ağacı data model — phases, progress, possibilities (toggleable), per-phase notes, add-phase FAB. Persisted locally.
- **Araştırma** / **Öğrenme**: UI shells with mock data, not yet wired to real search/spaced-repetition logic.
- Yerel AI / Bulut AI toggle exists in the topbar but doesn't call anything yet.

Not yet built: local Whisper listening, Ollama/Gemini/Claude AI wiring, "100% PC control", web research + save-to-disk, Supabase/Firebase shared backend, spaced-repetition engine, wake-word.

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
