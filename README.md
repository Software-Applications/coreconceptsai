# Core Concepts AI

**Complex topics, simplified in AI audio.**

Core Concepts AI turns dense study topics into short, listenable audio explanations. Students browse by Subject → Chapter → Topic, see what's trending with peers, get exam-aware highlighting of relevant concepts, and can request any topic that doesn't yet exist — with audio generated on demand by a 3-stage AI pipeline (Architect → Script Writer → Audio Engineer) and synthesized through Google Cloud Text-to-Speech.

Live: https://coreconceptsai.lovable.app

---

## Tech Stack

- **Frontend**: React 18, Vite 5, TypeScript, Tailwind CSS v3, shadcn/ui, Framer Motion, TanStack Query
- **Backend**: Supabase (Postgres, Auth, Storage, Edge Functions on Deno)
- **AI**: Lovable AI Gateway (Gemini family) for transcript generation; Google Cloud TTS for audio synthesis
- **Mobile shell**: Capacitor (iOS / Android targets)
- **Testing**: Vitest

> The app is mobile-first and renders inside a custom mobile frame on desktop.

---

## Prerequisites

- **Node.js 18+** and **npm** (or `bun` / `pnpm`)
- A **Supabase project** (free tier works) — you'll need its URL and anon key
- A **Google Cloud project** with the **Text-to-Speech API enabled** and an API key
- A **Lovable API key** for the AI Gateway (used by transcript / textbook-cover generation), or swap these edge functions to your own LLM provider

---

## Local Setup

```sh
# 1. Clone
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Install
npm install

# 3. Run dev server
npm run dev
```

Dev server runs on http://localhost:8080.

### Available scripts

| Command            | What it does                              |
| ------------------ | ----------------------------------------- |
| `npm run dev`      | Start Vite dev server (port 8080)         |
| `npm run build`    | Production build to `dist/`               |
| `npm run preview`  | Preview the production build locally      |
| `npm run lint`     | Run ESLint                                |
| `npm run test`     | Run Vitest test suite                     |

---

## Environment Variables

### Frontend (`.env`)

The Vite frontend reads three variables from `.env`. The Supabase client itself **hardcodes** the URL and anon key in `src/integrations/supabase/client.ts` (intentional — keeps edge-function calls stable across environments), so these `.env` values are mainly for tooling parity.

```env
VITE_SUPABASE_PROJECT_ID="your-project-ref"
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
```

> If you fork this repo to a new Supabase project, update **both** `.env` and the hardcoded values in `src/integrations/supabase/client.ts`.

### Edge Function Secrets (set in Supabase, not in `.env`)

Set these via Supabase Dashboard → Project Settings → Edge Functions → Secrets, or with `supabase secrets set`:

| Secret                       | Used by                                                | Required | Notes                                                                 |
| ---------------------------- | ------------------------------------------------------ | -------- | --------------------------------------------------------------------- |
| `GOOGLE_API_KEY`             | `google-tts`                                           | ✅       | Google Cloud API key with **Text-to-Speech API** enabled              |
| `LOVABLE_API_KEY`            | `generate-transcript`, `generate-textbook-cover`       | ✅       | Lovable AI Gateway key. Replace with your own LLM provider if forking |
| `SUPABASE_URL`               | all edge functions                                     | ✅       | Auto-injected by Supabase                                             |
| `SUPABASE_SERVICE_ROLE_KEY`  | `generate-transcript`, `generate-textbook-cover`       | ✅       | Auto-injected by Supabase. **Never expose to the frontend**           |
| `SUPABASE_ANON_KEY`          | platform                                               | ✅       | Auto-injected by Supabase                                             |
| `SUPABASE_DB_URL`            | platform                                               | ✅       | Auto-injected by Supabase                                             |

---

## ✅ Pre-Build Checklist — Secrets & Env Vars

Run through this before your first build. Items marked **auto** are injected by Supabase — you don't set them.

### 1. Frontend `.env` (project root)

Copy this block into a new `.env` file and fill in your Supabase project values:

```env
# Supabase (frontend)
VITE_SUPABASE_PROJECT_ID="your-project-ref"
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
```

> ⚠️ Also update the hardcoded values in `src/integrations/supabase/client.ts` if you point at a different Supabase project — the client does not read from `import.meta.env`.

### 2. Supabase Edge Function secrets

Set these in **Supabase Dashboard → Project Settings → Edge Functions → Secrets**, or via CLI:

```sh
# Required — you must add these manually
supabase secrets set GOOGLE_API_KEY="your-google-cloud-tts-key"
supabase secrets set LOVABLE_API_KEY="your-lovable-ai-gateway-key"
```

| Secret                        | Required? | Where to get it                                                                 |
| ----------------------------- | --------- | ------------------------------------------------------------------------------- |
| `GOOGLE_API_KEY`              | ✅ manual  | Google Cloud Console → APIs & Services → Credentials (enable Text-to-Speech API) |
| `LOVABLE_API_KEY`             | ✅ manual  | Lovable workspace settings (or swap edge functions to your own LLM provider)    |
| `SUPABASE_URL`                | ✅ auto    | Auto-injected by Supabase                                                       |
| `SUPABASE_ANON_KEY`           | ✅ auto    | Auto-injected by Supabase                                                       |
| `SUPABASE_SERVICE_ROLE_KEY`   | ✅ auto    | Auto-injected by Supabase. **Never expose to the frontend**                     |
| `SUPABASE_DB_URL`             | ✅ auto    | Auto-injected by Supabase                                                       |
| `SUPABASE_PUBLISHABLE_KEY`    | ✅ auto    | Auto-injected by Supabase                                                       |

### 3. Verify before building

```sh
# Confirm both manual secrets exist
supabase secrets list | grep -E "GOOGLE_API_KEY|LOVABLE_API_KEY"

# Confirm storage bucket exists
supabase storage ls
# expected: textbook-covers (public)

# Confirm migrations applied
supabase db push

# Confirm edge functions deployed
supabase functions list
# expected: generate-transcript, google-tts, generate-textbook-cover
```

### 4. Build

```sh
npm install
npm run build
```

If you see a `400` from `google-tts` → `GOOGLE_API_KEY` is missing or the Text-to-Speech API isn't enabled in your Google Cloud project.
If you see transcript generation hang or 401 → `LOVABLE_API_KEY` is missing.

---

## Database Setup

The full schema lives in `supabase/migrations/`. Apply it to a fresh Supabase project with:

```sh
supabase link --project-ref <your-project-ref>
supabase db push
```

### Tables (high level)

| Table              | Purpose                                                              |
| ------------------ | -------------------------------------------------------------------- |
| `subjects`         | Top-level subjects (with optional AI-generated textbook covers)      |
| `chapters`         | Chapters within a subject                                            |
| `topics`           | Individual topics with generated `transcript`, `duration`, audio URL |
| `topic_listens`    | Per-listen log — drives the Trending Concepts ranking                |
| `topic_requests`   | User-submitted requests for new topics                               |
| `user_progress`    | Per-user listen progress and completion                              |
| `quiz_attempts`    | Practice quiz scores per chapter                                     |
| `exams`            | User-saved upcoming exam dates                                       |
| `exam_chapters`    | Many-to-many: which chapters an exam covers                          |
| `pinned_cards`     | (legacy, currently unused by the UI)                                 |
| `flash_summaries`  | (legacy, currently unused by the UI)                                 |

> The app does **not** currently use `flash_summaries` or `pinned_cards` — flashcards have been removed from the product.

### Storage buckets

- **`textbook-covers`** (public) — AI-generated textbook cover images written by the `generate-textbook-cover` edge function

---

## Edge Functions

All edge functions live in `supabase/functions/` and deploy automatically when you push to a Supabase-linked project.

| Function                    | `verify_jwt` | Purpose                                                                           |
| --------------------------- | ------------ | --------------------------------------------------------------------------------- |
| `generate-transcript`       | `false`      | 3-stage pipeline (Architect → Script Writer → Audio Engineer) producing SSML-ready transcripts |
| `google-tts`                | `false`      | Synthesizes SSML to MP3 via Google Cloud TTS, with chunking + retry/backoff       |
| `generate-textbook-cover`   | `false`      | Generates a textbook cover image and uploads it to the `textbook-covers` bucket   |

Manual deploy (if not using auto-deploy):

```sh
supabase functions deploy generate-transcript
supabase functions deploy google-tts
supabase functions deploy generate-textbook-cover
```

---

## Project Structure

```
src/
├── components/          # UI components (mobile frame, sheets, cards, player)
├── components/ui/       # shadcn primitives
├── hooks/               # Data fetching, audio, gestures, progress, voice prefs
├── pages/               # Index (home), NotFound
├── integrations/
│   └── supabase/        # Generated client + types (do not edit types.ts)
├── lib/                 # Audio cache, search, validation, motion variants
└── data/                # Static course data fallbacks

supabase/
├── functions/           # Deno edge functions
└── migrations/          # SQL schema migrations

capacitor.config.ts      # iOS / Android native shell config
```

---

## Mobile (Capacitor)

The app ships with Capacitor configured for iOS and Android. To run on a device:

```sh
npm run build
npx cap sync
npx cap open ios      # or: npx cap open android
```

Update `capacitor.config.ts` and remove the `server.url` field before producing a real native build — the current value points to the Lovable preview.

---

## Deployment

- **Lovable**: changes pushed to this repo sync back into Lovable automatically. Publish from the Lovable editor.
- **Self-host**: `npm run build` produces a static `dist/` directory deployable to Vercel, Netlify, Cloudflare Pages, etc. Make sure your Supabase project is reachable and edge function secrets are configured.

---

## License

Private project. All rights reserved unless otherwise specified.
