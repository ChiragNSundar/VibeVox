<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# VoxScript — Agent & IDE Guide

Optimized for Google Antigravity, Cursor, Claude Code, and any IDE agent that
picks up this codebase after `git clone`.

## Stack

- **TanStack Start v1** (React 19, Vite 7) — file-based routing under `src/routes/`.
- **Tailwind v4** via `src/styles.css` (native `@theme`, no `tailwind.config.js`).
- **Bun** as package manager and runtime. `npm`/`pnpm` also work.
- **Cloud Backend (Supabase)** is optional. The app can run 100% locally.

## Quickstart

```bash
bun install
bun dev            # http://localhost:8080
bun run build      # production build
bun run typecheck  # tsgo (fast) — do not use tsc directly
bunx vitest run    # unit tests
```

No environment variables are required to run in local mode. The `.env`
committed here targets the cloud project;
delete or replace it for your own deployment.

## Fully-Local Mode

The `Live Punch-In` studio, style memory, transcription cache, and rhyme
lookups all work with zero backend:

- **Tracks / bars** → IndexedDB via `src/lib/local-store.ts`.
- **Audio takes** → Origin Private File System (OPFS) with an IDB fallback.
- **Style memory + embeddings** → IndexedDB via `src/lib/cache.ts` and
  `src/lib/style-memory.ts`.
- **LLM** → Ollama / LM Studio / llama.cpp server (see `src/lib/llm-config.ts`).
  Hosted providers work through the same path — see below.
- **Transcription** → faster-whisper-server or whisper.cpp
  (`src/lib/local-transcribe.ts`).
- **Rhymes** → Datamuse (free, keyless) plus deep-link into
  [RhymeWave](https://www.rhymewave.com/) for phonetic exploration.

Toggle local mode with `setLocalOnly(true)` from `src/lib/local-store.ts`
or via Settings once wired in the UI. Bundle export/import
(`exportBundle` / `importBundle` / `downloadBundle`) roundtrips everything
to a single portable `.json`.

## LLM Providers

`src/lib/providers.ts` is the single registry of OpenAI-compatible backends —
local servers and hosted gateways (OpenRouter, OpenAI, Groq, DeepSeek,
Mistral, Together, Gemini). Everything downstream speaks one wire format, so
provider differences live only here:

- `resolveTarget(input)` → `{ baseUrl, model, headers, strictBody }`. The three
  fetch call sites (`rawChat` in `local-pipeline.ts`, `pingLlm` in
  `llm-config.ts`, `callLocal` in `embeddings.ts`) all go through it. Add new
  call sites the same way rather than reading config fields directly.
- `applyBodyCompat(body, target)` strips Ollama's nested `options` for
  providers that reject unknown params, and renames `max_tokens` →
  `max_completion_tokens` for o-series/gpt-5.
- `fetchCatalog(input)` lists models. OpenRouter's catalog is public and
  carries `context_length` + pricing; picking from it fills in the real
  context window, which is what drives writer chunk sizing.

Keys are stored per-provider in `LlmConfig.apiKeys` so switching backends
doesn't lose credentials, and they go from the browser straight to the
provider (`routing: "direct"`). A `"proxy"` value is reserved for a
server-side relay; if you implement it, the base URL must come from a
server-side allowlist, never from the client request body.

Embeddings are configured independently (`embedProviderId`) because several
chat providers have no `/embeddings` endpoint. `resolveEmbedContext` reports
`supported: false` in that case and recall degrades to its lexical signals.

Hosted model ids carry no parameter count, so `detectModel` matches them by
family first and pins them to the `large` tier — otherwise a frontier model
falls through to `other`/`paramsB: 0`, reads as mid-tier, and gets 8K of
assumed context.

## Rhyme & Language Intelligence

`src/lib/rhymes.ts` is a small provider abstraction. Out of the box:

- `datamuse` — free HTTP API, CORS-friendly, no key.
- `custom` — any endpoint accepting `POST { word }` and returning
  `{ rhymes: string[] | { word, score?, kind? }[] }`. Point this at a local
  Ollama function-calling model to layer LLM-generated rhyme suggestions on
  top of phonetic ones.

Every result is cached in IndexedDB (`chat` namespace) keyed by
provider + endpoint + word, so second lookups are instant and offline-safe.

## Architecture Landmarks

- `src/routes/__root.tsx` — shell + head metadata (SSR-safe).
- `src/routes/_app/*` — authenticated app surface (studio, library, live).
- `src/lib/*.functions.ts` — TanStack `createServerFn` RPC handlers.
- `src/lib/*.server.ts` — server-only helpers; never imported from client code.
- `src/lib/live-capture.ts` + `src/lib/live.functions.ts` — real-time punch-in
  capture pipeline with latency-compensated bar slicing.
- `src/lib/local-*.ts` — offline-first modules (store, transcribe, discovery,
  pipeline, profiles).

## Conventions for Agents

- Prefer `search-replace` edits over full-file rewrites.
- Never edit `src/routeTree.gen.ts`, `src/integrations/supabase/*` (except
  human-authored files), or `.env` values marked auto-generated.
- New public-schema Supabase tables **must** ship with GRANTs and RLS in
  the same migration.
- All browser-only APIs (`window`, `localStorage`, OPFS, `navigator.storage`)
  must run inside `useEffect`, event handlers, `<ClientOnly>`, or behind
  `useHydrated()` — never at module scope.
- Server functions live in `*.functions.ts(x)` under `src/lib/` or
  co-located with routes. Never place them under `src/server/*`.

## Antigravity / IDE Tips

- The dev server listens on port `8080`. Add
  `"portsAttributes": { "8080": { "onAutoForward": "notify" } }` to a
  devcontainer if you build one.
- Bun is preferred; the `bun.lock` is authoritative. `npm ci` also works
  from `package-lock.json` but will be slower.
- Tests use Vitest + jsdom; browser-only modules import `fake-indexeddb/auto`
  in `src/test/setup.ts`.
- Never run `tsc --noEmit` manually — the build harness uses `tsgo`.

## RhymeWave

RhymeWave has no public API. The integration is a deep-link:
`https://www.rhymewave.com/#/{word}` opens the target word directly in
RhymeWave's phonetic explorer. Combine with the local Datamuse lookup for
fast in-app suggestions.
