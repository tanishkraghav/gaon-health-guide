# Swasthya Sathi — Rural Health Companion

A voice-first, bilingual web platform built for rural India. It gives patients a simple way to describe symptoms and receive triage guidance, while giving ASHA (Accredited Social Health Activist) workers a digital dashboard to manage visits, triage alerts, and clinical decision support.

The same app serves two completely different user experiences behind one entry screen: **Patient Mode** and **ASHA Worker Mode**.

---

## Table of contents

1. [What it does](#what-it-does)
2. [Live URLs](#live-urls)
3. [Tech stack](#tech-stack)
4. [Project structure](#project-structure)
5. [Routing](#routing)
6. [Database](#database)
7. [AI & decision support](#ai--decision-support)
8. [Security model](#security-model)
9. [Authentication](#authentication)
10. [Internationalization](#internationalization)
11. [Running locally](#running-locally)
12. [Environment variables](#environment-variables)
13. [Deployment](#deployment)
14. [Key design decisions](#key-design-decisions)
15. [License & disclaimer](#license--disclaimer)

---

## What it does

### Patient Mode
- **Voice triage**: Patients tap a button and speak symptoms in their chosen language using the browser's Web Speech API.
- **AI follow-up**: A conversational AI asks up to 5 simple follow-up questions, then finalizes a triage recommendation.
- **Result cards**: Clear green / yellow / red recommendations — home care, visit the ASHA worker, or go to the hospital urgently.
- **Notify ASHA**: One-tap notification that sends the triage alert to the patient's assigned ASHA worker.
- **Worsened flow**: Patients can report that symptoms worsened, which clears the last result and re-runs triage.

### ASHA Worker Mode
- **Secure onboarding**: Government Worker ID verification, OTP, 4-digit PIN, and profile completion.
- **Home dashboard**: Real metrics (patients seen this month, pending visits, referrals, critical alerts) pulled from the database.
- **Visit list**: Filterable list of assigned visits with patient details.
- **Visit detail**: Record measurements, vitals, red flags, and get AI-generated NHM protocol guidance.
- **Alerts**: See triage alerts raised by patients, acknowledge them, and coordinate care.
- **Profile**: View assigned villages, households under care, and performance against monthly targets.

---

## Live URLs

- **Preview**: https://id-preview--d9cf1b39-ecde-4dc2-a13d-4ed2e5250b60.lovable.app
- **Published**: https://gaon-health-guide.lovable.app

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start v1 (React 19, SSR/SSG, Vite 7) |
| Routing | TanStack Router (file-based) |
| Styling | Tailwind CSS v4 + shadcn/ui components |
| State | React Context (`SessionProvider`) + localStorage |
| Data fetching | TanStack Query + `createServerFn` |
| Backend | Lovable Cloud (Supabase) — PostgreSQL + Auth |
| Server functions | `@tanstack/react-start` `createServerFn` |
| AI | Lovable AI Gateway — `google/gemini-2.5-flash` |
| Location search | OpenStreetMap Nominatim API (India-only results) |
| Voice input | Web Speech API (`SpeechRecognition`) |
| Validation | Zod |

---

## Project structure

```
/dev-server
├── src
│   ├── components/          # Reusable UI components
│   │   ├── AshaOnboarding.tsx
│   │   ├── BilingualText.tsx
│   │   ├── LocationAutocomplete.tsx
│   │   ├── OfflineBanner.tsx
│   │   ├── UrgencyBadge.tsx
│   │   └── ui/              # shadcn/ui primitives
│   ├── hooks/               # React hooks (use-mobile, etc.)
│   ├── integrations/        # Supabase client (auto-generated)
│   │   └── supabase/
│   ├── lib/                 # Core business logic
│   │   ├── ai.functions.ts    # AI triage & ASHA decision support
│   │   ├── data.functions.ts  # Server functions for auth, CRUD, metrics
│   │   ├── data.server.ts     # Server-only Supabase admin client
│   │   ├── data.types.ts      # Shared TypeScript types
│   │   ├── i18n.ts            # 8-language dictionary
│   │   ├── locationProvider.ts # Nominatim search abstraction
│   │   ├── mockData.ts        # Legacy mock data (unused in production)
│   │   ├── session.tsx        # React session context
│   │   └── utils.ts
│   ├── routes/              # TanStack file-based routes
│   │   ├── __root.tsx         # Root layout, fonts, head metadata
│   │   ├── index.tsx          # Role selection + login/onboarding
│   │   ├── patient.home.tsx
│   │   ├── patient.triage.tsx
│   │   ├── patient.result.tsx
│   │   ├── asha.tsx           # ASHA layout with bottom nav
│   │   ├── asha.home.tsx
│   │   ├── asha.visits.tsx
│   │   ├── asha.visit.$id.tsx
│   │   ├── asha.alerts.tsx
│   │   └── asha.profile.tsx
│   ├── router.tsx           # Router setup + default error boundary
│   ├── styles.css           # Tailwind v4 theme tokens
│   └── routeTree.gen.ts     # Auto-generated route tree
├── supabase/
│   └── migrations/          # SQL migrations (schema + seed)
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## Routing

TanStack Start uses file-based routing. All route files are under `src/routes/`.

| Route | Purpose |
|-------|---------|
| `/` | Role selection + patient login + ASHA onboarding/login |
| `/patient/home` | Patient home screen with recent alerts and actions |
| `/patient/triage` | Voice/text triage chat |
| `/patient/result` | Triage result with recommendations |
| `/asha/home` | ASHA dashboard with metrics and upcoming visits |
| `/asha/visits` | Visit list with filters |
| `/asha/visit/:id` | Visit detail with measurements and AI support |
| `/asha/alerts` | Patient triage alerts |
| `/asha/profile` | ASHA profile and stats |

---

## Database

The backend is a PostgreSQL database managed through Lovable Cloud. All tables are in the `public` schema, have Row Level Security (RLS) enabled, and deny all direct access by default. Application reads/writes happen exclusively through `createServerFn` handlers using the service-role client.

### Tables

| Table | Purpose |
|-------|---------|
| `asha_workers` | ASHA worker profiles, credentials, village clusters, and performance stats |
| `patients` | Patient identity, demographics, assigned ASHA worker |
| `visits` | Scheduled/completed/referred home visits |
| `triage_alerts` | Patient triage results that need ASHA attention |
| `otp_requests` | Temporary OTP codes for ASHA onboarding (demo: `1234`) |

### Key relationships

- `patients.assigned_asha` → `asha_workers.id`
- `visits.patient_id` → `patients.id`
- `visits.asha_id` → `asha_workers.id`
- `triage_alerts.patient_id` → `patients.id`
- `triage_alerts.asha_id` → `asha_workers.id`

### Seed data

The first migration seeds demo ASHA workers and patients so the app is usable immediately after deployment:

- ASHA worker IDs: `ASH-UP-2241`, `ASH-UP-2242`, `ASH-UP-2243`, `ASH-UP-2244`, `ASH-MP-1101`, `ASH-MH-3301`, `ASH-WB-4401`
- Demo PIN: `1234` (after onboarding)
- Demo OTP: `1234`

---

## AI & decision support

Two server functions in `src/lib/ai.functions.ts` call the Lovable AI Gateway.

### `triagePatient`
- Takes a language code and a short conversation history.
- Uses a structured tool/function-call response so the AI must either ask one follow-up question or finalize the triage.
- Returns an urgency tier: `1` (green, home care), `2` (yellow, visit ASHA), or `3` (red, hospital).
- Returns a brief explanation, likely condition, home remedy, referral reason, and confidence score.

### `ashaDecisionSupport`
- Takes visit type, patient summary, and recorded measurements.
- Returns red flags, the next NHM protocol step, whether referral is recommended, and a visit summary.

Both functions are gated by the `LOVABLE_API_KEY` environment variable.

---

## Security model

- **RLS locked down**: All public tables have `CREATE POLICY "deny all" ...` so no end user can read or write directly via PostgREST or GraphQL.
- **Service-role only**: All database access from the app goes through `createServerFn` handlers that use the server-side Supabase admin client.
- **No client-side secrets**: The Supabase service role key is never exposed to the browser.
- **PIN hashing**: ASHA worker PINs are stored as SHA-256 hashes (transition from legacy plaintext `pin` column).
- **No anonymous sign-ups**: ASHA workers must be pre-registered in the database by a supervisor; onboarding only activates existing records.

---

## Authentication

### Patient login
- Patients enter phone number, name, age, gender, and location.
- The server looks up the phone number; if it already exists, the profile is updated (upsert behavior).
- New patients are auto-assigned to the first ASHA worker whose `village_cluster` includes the patient's village, falling back to the first ASHA worker in the system.
- Session is stored in React Context and persisted to `localStorage`.

### ASHA worker onboarding
1. **Worker ID lookup**: The worker enters their government-issued Worker ID. If not found, they are told to contact their PHC supervisor.
2. **OTP verification**: A demo OTP (`1234`) is stored in `otp_requests` and validated.
3. **PIN creation**: The worker creates a 4-digit PIN, stored as a hash.
4. **Profile completion**: Name, district, block, village, and households under care are saved.

### ASHA worker login
- Worker ID + 4-digit PIN. The PIN is hashed and compared server-side.
- Only workers with `registration_status = 'active'` can log in.

---

## Internationalization

The app supports 8 languages through a lightweight dictionary in `src/lib/i18n.ts`:

- Hindi (`hi`)
- English (`en`)
- Bhojpuri (`bho`)
- Odia (`or`)
- Bengali (`bn`)
- Marathi (`mr`)
- Tamil (`ta`)
- Telugu (`te`)

The UI defaults to Hindi. English is always shown as a fallback when a translation is missing.

---

## Running locally

### Prerequisites
- Node.js 20+ (Bun runtime is preferred in the Lovable sandbox)
- A Lovable Cloud project with `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` configured
- A `LOVABLE_API_KEY` for AI features

### Install dependencies
```bash
bun install
```

### Start the dev server
```bash
bun dev
```

The app will be available at `http://localhost:8080`.

### Build for production
```bash
bun build
```

---

## Environment variables

These are managed by Lovable Cloud for the deployed environment. For local development, place them in a `.env` file at the project root:

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_SUPABASE_PROJECT_ID=<project-id>
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
LOVABLE_API_KEY=lovable_...
```

> **Note:** The service role key is a sensitive secret. Never expose it in client-side code or commit it to version control.

---

## Deployment

The project is built and deployed through Lovable:

1. Push changes to the connected GitHub repository (via **Plus → GitHub → Connect project** in the Lovable editor).
2. Lovable runs the production build automatically.
3. The published site is served at `https://gaon-health-guide.lovable.app`.

Backend migrations are applied through Lovable Cloud. Do not apply Supabase migrations manually unless you are self-hosting.

---

## Key design decisions

1. **Single-login, dual-mode UX**: One entry screen branches into two isolated experiences. This keeps the app simple for users who may only ever use one mode.
2. **Server functions for everything**: No direct client-to-database queries. All business logic and authorization live in `createServerFn` handlers.
3. **Voice-first triage**: The Web Speech API lets patients speak naturally; a fallback text input is always available.
4. **Real location search**: Nominatim provides Indian village/town autocomplete, storing location name, district, state, latitude, and longitude.
5. **Demo OTP**: The onboarding flow uses a hardcoded demo OTP (`1234`) for easy testing and demos. In a real deployment, this should be replaced with an SMS gateway.
6. **No real diagnosis**: The AI explicitly avoids definitive diagnoses and always includes confidence and escalation guidance.

---

## License & disclaimer

Swasthya Sathi is a prototype / proof-of-concept for rural health triage. It is **not a medical device** and does not replace trained healthcare professionals or emergency services. The AI output is decision support only; urgent symptoms should always be escalated to a hospital or qualified provider.

---

Built with care for rural communities in India.
