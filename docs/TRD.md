# TRD — Technical Requirements Document

> **Source of truth for how we build.** Read this before any architecture decision.
> Last updated: 2026-06-04 (Session 56)

---

## Frontend Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 14.2 (App Router)** | React Server Components, file-based routing, Vercel-native |
| Language | **JavaScript (ES2022)** | Existing codebase; no TS rewrite cost |
| Styling | **Tailwind CSS 3.4** + custom CSS variables | Existing; tokens in `tailwind.config.js` |
| State | **React hooks + Context** | No Redux/Zustand needed at this scale |
| Data fetching | **fetch + SWR (where useful)** | Most data is on-demand; no real-time feed requirement |
| Icons | **Material Symbols Outlined** | Already loaded by existing pages |
| Fonts | **Geist + Geist Mono** (from `next/font/google` or local) | Engineer precision, tabular nums; replaces blacklisted Inter |
| Forms | **Native + Tailwind** | No form library; small surface area |
| Charts | **Recharts** (already in package.json if present, else add) | For revenue/metrics display |
| Build target | **Static (SSG) where possible, SSR where auth-gated** | Vercel static is fast and cheap |

## Backend Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **FastAPI (Python 3.12)** | Existing; async; OpenAPI auto-docs |
| Server | **Uvicorn on EC2 t3.small (us-east-1a)** | `18.213.66.136:8000` — existing, healthy |
| Auth | **Supabase** (Postgres + Auth + RLS) | Email/password + session cookies |
| ORM | **Raw SQL + Supabase client** | Existing; no Prisma/SQLAlchemy |
| Background work | **Pipeline scheduler daemon** (in-process threads) | 12 phases, 5-min cycle |
| Email | **Brevo (primary) + SendGrid native + Gmail SMTP (fallback)** | Multi-provider chain (Session 50) |
| Payments | **Stripe (USD) + UPI/Paytm (INR)** | Geo-routed, dual-currency |
| Crypto (USDC) | **Base network wallet** | `0x0D920be4F76d8E8C19D6230702b02112E42c1282` |
| Search | **Exa (web), Google Maps Places, DuckDuckGo (fallback)** | Multi-source leads |
| Scraping | **Scrapling** (StealthyFetcher + DynamicFetcher + Spider) | Anti-bot, Cloudflare bypass |
| LLM | **OpenRouter (default), OpenAI, Anthropic** | Per-agent config; gstack as orchestrator |
| Workflow automation | **n8n** (self-hosted on Render) | OAuth capture, social auto-publish |

## Database

**Supabase Postgres** (existing) — 21 tables per Session 39 audit. Key tables:
- `users` (id, email, role, created_at, metadata)
- `clients` (id, owner_id, business_name, status, plan, created_at)
- `leads` (id, source, email, phone, score, status, owner_id)
- `missions` (id, agent, status, payload, result, created_at)
- `invoices` (id, client_id, amount, currency, status, provider, tx_id)
- `memory` (agent, key, value, updated_at) — agent memory
- `alerts` (id, level, message, resolved, created_at) — Session 38

**SQLite** (system_database.py) — local-only: `leads`, `builds`, `deliveries`, `payments`, `errors`, `executions`, `agents`

## Authentication

- **Supabase Auth** with email + password
- Session cookie: `sb-auth-token` (set by Supabase client SDK)
- Middleware: `src/middleware.js` checks token on every request
- Public routes: `/login`, `/signup`, `/api/auth/*`, `/api/payments/stripe-webhook`, `/health`
- Role check: `users.role` field — `owner` or `client`

## APIs Needed

### Frontend → Backend (Next.js → FastAPI on EC2)
- `POST /api/auth/*` — handled by Next.js API routes (Supabase proxy)
- `GET/POST /api/clients/*` — list, create, update, delete
- `GET/POST /api/leads/*` — list with filter, detail, status change
- `POST /api/ceo/chat` — owner ↔ CEO agent
- `GET /api/cashclaw/*` — missions, status, run-cycle
- `GET /api/clawwork/*` — gigs, status, run-cycle
- `POST /api/payments/create-checkout` — Stripe or UPI link
- `POST /api/payments/mark-paid` — manual owner confirmation
- `GET /api/memory/*` — agent memory (recall, store, sync-obsidian)

### Backend → External
- **Supabase**: Auth, DB queries, RLS enforcement
- **Brevo**: Transactional email (invoice, lead confirm, etc.)
- **Stripe**: USD checkout, webhooks
- **UPI/Paytm**: INR deep links
- **n8n**: OAuth + auto-publish workflows
- **Exa**: Web search
- **Google Maps Places**: Business leads
- **Scrapling**: Email scraping
- **OpenRouter**: LLM calls (per-agent)

## AI Models

- **Default model**: `minimax-m3-free` via OpenCode Zen (per CLAUDE.md) — used for most agent reasoning
- **Premium agents** (CEO, content-write, brand-audit): upgraded to `big-pickle` (thinking) or `claude-sonnet-4-6` when budget allows
- **Embeddings**: not yet used (memory is file-based + JSON in `backend/agent_memory/`)

## Cloud / Deployment

| Component | Host | URL |
|-----------|------|-----|
| Frontend | Vercel | `https://agency-frontend-seven.vercel.app` |
| Backend | AWS EC2 t3.small | `http://18.213.66.136:8000` |
| Database | Supabase | `db.svbabyxkmysmapbibnjn.supabase.co` |
| n8n | Render (free) | `https://nexus-n8n-x17d.onrender.com` |
| Domain | (none yet) | TBD: `nexusai.com` or similar |
| Monitoring | Uptime Kuma + Sentry | (configured, not alerting actively) |
| Backups | Daily 3 AM DB dump via `startup.sh` cron | Local + S3 target |

## Security Requirements

- **Auth**: Supabase RLS + middleware check (no `admin` bypass in client code)
- **Secrets**: All keys in `.env.local` (gitignored) + Vercel env vars (per-env). `git filter-branch` already scrubbed secrets from history
- **CORS**: Explicit allowlist in `main.py:150` — `localhost:3000`, Vercel domains only (Session 40 fix)
- **Input validation**: Pydantic on backend, Zod-lite (manual) on frontend
- **Rate limit**: 60 req/min per IP (basic) — protect payment endpoints more strictly
- **Webhook verification**: HMAC SHA-256 for Stripe (Session 55)

## Performance Requirements

- **First contentful paint** < 1.5s on Vercel edge
- **Time to interactive** < 3.0s on dashboard pages
- **API response** < 500ms p95 for list endpoints; < 2s for chat
- **Real-time** = 10s polling (CashClaw/ClawWork) — no WebSockets in v1
- **Build** < 60s on Vercel (currently 45s, well under)

## Third-Party Integrations (summary)

| Service | Purpose | Critical? |
|---------|---------|-----------|
| Supabase | Auth + DB | YES |
| Brevo | Email (primary) | YES |
| SendGrid | Email (fallback) | YES |
| Stripe | USD payments | YES (when configured) |
| UPI/Paytm | INR payments | YES (active) |
| n8n | Social OAuth + auto-publish | YES |
| OpenRouter / OpenCode Zen | LLM | YES |
| Exa | Web search | YES |
| Google Maps Places | Business leads | YES |
| Scrapling | Email scraping | YES |
| Indigo/Geist design system | (new — Session 56) | YES |

## Environment Variables (production)

```bash
# Frontend (.env.local in Vercel)
NEXT_PUBLIC_SUPABASE_URL=https://svbabyxkmysmapbibnjn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
BACKEND_API_URL=http://18.213.66.136:8000
NEXT_PUBLIC_API_URL=http://18.213.66.136:8000
NEXT_PUBLIC_APP_URL=https://agency-frontend-seven.vercel.app

# Backend (EC2 /home/ubuntu/agency-backend/.env)
OPENROUTER_API_KEY=sk-or-v1-...
ANTHROPIC_API_KEY=sk-ant-...
BREVO_API_KEY=xkeysib-...
STRIPE_SECRET_KEY=sk_live_...  (when configured)
PAYT_MERCHANT_ID=...
META_PAGE_ACCESS_TOKEN=...
META_PAGE_ID=...
META_INSTAGRAM_ID=...
N8N_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
AI_WALLET_PRIVATE_KEY=0x...  (Base network)
AI_WALLET_ADDRESS=0x0D920be4F76d8E8C19D6230702b02112E42c1282
OWNER_BINANCE_USDC_ADDRESS=0x...
```

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-04 | Single Next.js repo (no backend in Vercel) | 782MB Python bundle > 500MB Lambda limit |
| 2026-06-04 | EC2 t3.small (not Lambda) for backend | Long-running pipeline daemon + 70+ Python deps |
| 2026-06-04 | Supabase for auth + DB | Existing, proven, RLS built-in |
| 2026-06-04 | Polling 10s, not WebSockets | Simpler, cheaper, sufficient for v1 |
