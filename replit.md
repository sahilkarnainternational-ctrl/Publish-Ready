# Axyomis-X

A high-fidelity biomedical OS and scientific intelligence platform — explore the cosmos, anatomy, and pathology through AI chat, 3D visualization, quizzes, and educational videos.

## Run & Operate

- `pnpm run dev` — unified dev proxy on port 4174 (`/api` → API on 8080, UI → Vite on 4173). Start API + frontend first: `pnpm run dev:api` and `pnpm run dev:frontend`.
- `pnpm run dev:frontend` — Vite frontend (default port 4173; proxies `/api` to `http://127.0.0.1:8080`)
- `pnpm run dev:api` — API server on port 8080
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7 + TailwindCSS v4 + motion
- AI: Google Gemini via `@google/genai` (client-side, key injected at build time)
- Auth & DB: Firebase Auth + Firestore (`firebase-applet-config.json` at artifact root)
- API: Express 5 (YouTube proxy routes at `/api/youtube` and `/api/youtube-multilingual`)
- 3D Globe: `cobe`

## Where things live

- Frontend: `artifacts/axyomis/src/`
- Firebase config: `artifacts/axyomis/firebase-applet-config.json`
- Quiz data: `artifacts/axyomis/src/data/`
- YouTube proxy: `artifacts/api-server/src/routes/youtube.ts`
- OpenAPI spec: `lib/api-spec/openapi.yaml`

## Architecture decisions

- Gemini API key is injected into the client bundle via Vite `define` (original AI Studio pattern). Key must be set as `GEMINI_API_KEY` secret.
- YouTube API proxy lives in the shared Express api-server to keep the key server-side.
- Firebase config is committed as JSON (contains public Firebase keys — not secrets, this is intentional per Firebase's client-side auth model).
- The `motion` package (v12) is used for animations — not `framer-motion` (different subpath exports).

## Product

- Lyra AI chat (Gemini-powered) with voice, image analysis, math rendering, Mermaid diagrams
- Wikipedia-powered topic cards for Science, Biology, Physics, Chemistry, Diseases
- Interactive quiz engine with 3 difficulty levels
- YouTube educational video search (multilingual: English, Hindi, Nepali)
- Firebase Auth (Google + email/password) with user profiles
- 3D globe visualization, animated hero, PWA support

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `GEMINI_API_KEY` must be set as a secret for the AI chat to work
- WebGL errors in the preview pane are expected (no GPU in headless env) — works fine for real users
- YouTube features require `VITE_YOUTUBE_API_KEY` or `YOUTUBE_API_KEY` secret
- After each OpenAPI spec change, re-run codegen before using the updated types

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
