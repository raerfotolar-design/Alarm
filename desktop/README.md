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
- **PC control** (off by default, switched on in Settings): Jarvis can act on the machine.
  - *Runs by itself:* `list_dir`, `read_file`, `search_files`, `system_info`, `open_path` — read-only, plus opening a file the way double-clicking would.
  - *Needs your approval every time:* `write_file`, `delete_path` (goes to the OS trash), `move_path`, `run_command` — the chat shows an approval card with the exact path or command, and nothing runs until you press İzin ver.
  - Neither engine's native function-calling is used, so it works identically on Gemini and any Ollama model: the model answers with a `{"action": ...}` block, which `electron/pc/protocol.ts` parses out and never shows to the user.
  - The main process re-checks the switch and the tool name on every execution, so an approval-shaped message cannot run anything on its own.
- **Dinleme Modu**: real passive listening. The microphone is captured in the renderer and encoded to 16 kHz mono WAV in-process (`src/audio/recorder.ts`) — no ffmpeg needed — in 12-second segments, and silent segments are dropped before they cost anything. Each segment is transcribed by a **local whisper.cpp** build (paths set in Settings), so audio never leaves the machine. The transcript is distilled into at most three notes, and saying **"Jarvis konuş"** ends the silence: whatever follows the phrase is sent to Jarvis as a message. Without a configured whisper binary the bar says so instead of failing quietly.
- **Settings** (sidebar gear): Gemini and YouTube API keys, model names, Ollama URL, save folder, PC-control switch. Keys are encrypted with Electron's `safeStorage` and never sent back to the renderer.
- **Planlama**: real Plan Ağacı data model — phases, progress, possibilities (toggleable), per-phase notes, add-phase FAB. Persisted locally.
- **Araştırma**: real search across Openverse + Wikimedia Commons (no key needed) and YouTube (needs the user's own free API key). Saving downloads the file into the save folder — videos keep their thumbnail plus the link — and attaches it to the chosen Plan Ağacı phase, where it shows up under that phase's Araştırmalar/Medya tabs.
- **Öğrenme**: real spaced repetition (SM-2 in `shared/sm2.ts`). Decks per topic (dil / programlama), Zor/Orta/Kolay grading that moves each card's interval and ease factor, a due queue that refills by date, and streak / mastery / 5-week heatmap computed from the actual review log. "Kart üret" asks the selected engine for cards on a topic and adds them to the deck.

Not yet built: Supabase/Firebase shared backend, global wake-word.

Listening mode needs whisper.cpp installed separately (build it, download a `ggml-*.bin` model, then point Settings at both). The microphone path itself could not be exercised in the development container — the transcription, note-extraction, trigger-detection and WAV-encoding paths are covered by tests, but recording from a real device is unverified until you run it.

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
