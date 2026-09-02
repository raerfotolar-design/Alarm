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
- **Memory** (`electron/ai/memory.ts`): Jarvis remembers across days, not just the last turns.
  - Only the last 20 turns fit in a prompt, so older messages are folded into a **rolling summary** plus a list of **durable facts**, both stored on disk and injected into every prompt.
  - Messages that have left the window but are not summarized yet are still sent verbatim, so nothing is ever in neither the window nor the summary.
  - Listening-mode notes are injected too, with their dates — that is what makes "you told me this yesterday" work.
  - The summary refresh costs one extra model call, and only once every 10 messages that age out.
  - Both are visible in the Jarvis notes panel under "Jarvis'in Hafızası".
- **Settings** (sidebar gear): Gemini API key + model, Ollama URL + model. The key is encrypted with Electron's `safeStorage` and is never sent back to the renderer.
- **Planlama**: real Plan Ağacı data model — phases, progress, possibilities (toggleable), per-phase notes, add-phase FAB. Persisted locally.
- **Araştırma**: real search across Openverse + Wikimedia Commons (no key needed) and YouTube (needs the user's own free API key). Saving downloads the file into the save folder — videos keep their thumbnail plus the link — and attaches it to the chosen Plan Ağacı phase, where it shows up under that phase's Araştırmalar/Medya tabs.
- **Öğrenme**: real spaced repetition (SM-2 in `shared/sm2.ts`). Decks per topic (dil / programlama), Zor/Orta/Kolay grading that moves each card's interval and ease factor, a due queue that refills by date, and streak / mastery / 5-week heatmap computed from the actual review log. "Kart üret" asks the selected engine for cards on a topic and adds them to the deck.

Not yet built: local Whisper listening, "100% PC control", web research + save-to-disk, Supabase/Firebase shared backend, spaced-repetition engine, wake-word.

## Architecture notes

- All AI calls, network calls and secrets live in the **main process** (`electron/ai/`, `electron/research/`, `electron/settings.ts`); the renderer only talks over IPC (`shared/types.ts` defines the channels). No API key ever reaches the renderer.
- Saved files are served to the page through the app's own `jarvis-media://` scheme (`electron/mediaProtocol.ts`), which only serves paths inside the save folder — `file://` stays blocked by the page CSP.
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
