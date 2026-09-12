# Hikaye Evreni

A separate Expo app from RAER Special App and Jarvis Desktop in this repo. Users write
original, unpublished-elsewhere fiction (like Wattpad), then can "enter" a published
story of their own and role-play inside it with an AI, describing how they join
(as an existing character, isekai-style from outside, or a brand-new extra character).

## Status (v0.1 — local-only core)

- Write, edit, delete stories and chapters
- Publish toggle (local — see "What's missing" below)
- Enter a published story: pick a join mode, describe yourself, chat with the AI inside
  the story's world; multiple "entries" (sessions) per story are kept separately
- Gemini API key in Settings

## Content policy (baked into the system prompt, `src/services/storyAiService.ts`)

Mature fiction (violence, peril, dark themes, adult tension) is allowed — that's normal
for original fiction. Refused regardless of framing: explicit pornographic detail,
anything sexual involving a minor character, and real-world harmful instructions.
This is a starting point, not a substitute for real moderation before any public launch —
see below.

## What's missing before this is a real product

This was scoped as a first slice, not the full platform described in planning:

- **No backend.** Stories and chat live in `AsyncStorage` on one device — "publish"
  only unlocks the in-app AI-chat feature locally; nothing is actually shared with
  other users yet. A real publish/discover feed needs a server (Supabase, matching
  the pattern used in `desktop/`) plus accounts.
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
