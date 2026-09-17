# Hikaye Evreni

A separate Expo app from RAER Special App and Jarvis Desktop in this repo. Two things
users do here:

- Write original, unpublished-elsewhere fiction (like Wattpad), then "enter" a
  published story of their own and role-play inside it with an AI, describing how
  they join (as an existing character, isekai-style from outside, or a brand-new
  extra character).
- Create their own characters/bots (PolyBuzz-style) — name, avatar, personality,
  greeting, tags — and chat with them directly, independent of any story.

## Status (v0.1 — local-only core)

- Write, edit, delete stories and chapters
- Publish toggle (local — see "What's missing" below)
- Enter a published story: pick a join mode, describe yourself, chat with the AI inside
  the story's world; multiple "entries" (sessions) per story are kept separately
- Create, edit, delete user-made characters/bots (`src/screens/BotsScreen.tsx`,
  `BotEditorScreen.tsx`); each bot gets one ongoing chat thread
  (`src/screens/BotChatScreen.tsx`, `src/storage/botSessionRepository.ts`)
- AI backend: **bring your own model.** `src/services/llmClient.ts` speaks the
  OpenAI-compatible `/chat/completions` shape that vLLM, TGI, Ollama's OpenAI-compatible
  endpoint, and every hosted-inference provider implement — so a self-hosted or
  fine-tuned open-source model plugs in the same way a hosted one would. Set the
  server address, model name, and (if the server needs one) an API key in Settings.
  No model is bundled or trained here — that part is on you; this is just the wiring.
  Both story chat (`storyAiService.ts`) and bot chat (`botAiService.ts`) use it.

## Content policy (`src/services/contentBoundary.ts`)

Mature fiction (violence, peril, dark themes, adult tension) is allowed — that's normal
for original fiction and roleplay. Refused regardless of framing: explicit pornographic
detail, anything sexual involving a minor character, and real-world harmful instructions.
**This applies identically to user-created bots** — whatever a user writes into a bot's
personality/description never overrides it; the boundary is appended last in every
system prompt (story or bot) specifically so it can't be talked around by an earlier
part of the prompt. This is a starting point, not a substitute for real moderation
before any public launch — see below.

## What's missing before this is a real product

This was scoped as a first slice, not the full platform described in planning:

- **No backend.** Stories, bots, and chat all live in `AsyncStorage` on one device —
  "publish" only unlocks the in-app AI-chat feature locally, and bots aren't shared
  either; nothing is actually visible to other users yet. A real publish/discover
  feed (for stories or user-made bots) needs a server (Supabase, matching the pattern
  used in `desktop/`) plus accounts.
- **No monetization.** No payments, no subscription tiers, no credits, no ads — see
  the chat history for the agreed model (freemium message limits, credit packs,
  author revenue-share on paid stories, non-manipulative rewarded ads, cosmetics).
  None of that is wired up.
- **No real content moderation pipeline.** The system-prompt boundary is a first
  line of defense, not enforcement — a launched app needs actual review/reporting
  tooling and probably a second moderation pass on outputs.
- **No age verification**, which matters if mature-tagged stories are allowed at all
  publicly.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go on a phone, or press `a`/`i` for an emulator.
