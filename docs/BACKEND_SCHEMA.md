# BACKEND_SCHEMA.md — NexusAI Agency

> **Source of truth for data model.** Read this before any DB or API change.
> Last updated: 2026-06-04 (Session 56)

---

## Architecture

- **Primary DB:** Supabase Postgres (managed) — auth, RLS, realtime, storage
- **Local DB:** SQLite (`backend/system_database.py`) — system telemetry only
- **Cache:** None (data freshness > cache speed for an honest control room)
- **Object storage:** Supabase Storage (brand assets, content files) + S3 (backups)
- **Auth:** Supabase Auth (email + password); session cookie = `sb-auth-token`

## Supabase Tables (21 tables per Session 39 audit)

### Core (user-facing)

#### `users`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default `gen_random_uuid()` | matches `auth.users.id` |
| email | text | NOT NULL, UNIQUE | from Supabase auth |
| role | text | NOT NULL, CHECK in (`'owner'`, `'client'`) | owner = Ayan; client = paying user |
| full_name | text | NULL | optional display name |
| avatar_url | text | NULL | Supabase storage URL |
| metadata | jsonb | NOT NULL DEFAULT `{}` | per-role extras (client business info) |
| created_at | timestamptz | NOT NULL DEFAULT `now()` | |
| updated_at | timestamptz | NOT NULL DEFAULT `now()` | trigger on update |

**RLS:**
- `SELECT`: own row only (`auth.uid() = id`)
- `UPDATE`: own row only; cannot change `role`
- Owner can SELECT all client rows (admin bypass via service role key, server-side only)

#### `clients`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| owner_id | uuid | NOT NULL, FK → `users.id` | who manages this client |
| business_name | text | NOT NULL | |
| contact_email | text | NOT NULL | |
| contact_phone | text | NULL | |
| industry | text | NULL | |
| website | text | NULL | |
| status | text | NOT NULL DEFAULT `'active'`, CHECK in (`'active'`, `'paused'`, `'churned'`, `'invited'`) | |
| plan | text | NULL, CHECK in (`'essential'`, `'premium'`, `'enterprise'`, `NULL`) | NULL until invoiced |
| notes | text | NULL | owner notes (markdown) |
| metadata | jsonb | NOT NULL DEFAULT `{}` | goals, integrations, brand voice, etc. |
| created_at | timestamptz | NOT NULL | |
| updated_at | timestamptz | NOT NULL | |

**RLS:**
- `SELECT` (owner): all rows where `owner_id = auth.uid()`
- `SELECT` (client): own row only (matched via `users.metadata.client_id`)
- `INSERT`: owner only
- `UPDATE`: owner only (or self, for limited fields)
- `DELETE`: owner only

#### `leads`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| source | text | NOT NULL | `'gmaps'`, `'openclaw'`, `'csv'`, `'manual'`, etc. |
| business_name | text | NULL | |
| contact_name | text | NULL | |
| email | text | NULL | real email only — junk rejected at enqueue |
| phone | text | NULL | |
| website | text | NULL | |
| location | jsonb | NULL | `{city, state, country, lat, lng}` |
| score | int | NOT NULL DEFAULT 0, CHECK between 0 and 100 | 70+ = HOT, 50-69 = WARM, <50 = COLD |
| status | text | NOT NULL DEFAULT `'new'`, CHECK in (`'new'`, `'contacted'`, `'replied'`, `'onboarded'`, `'rejected'`, `'junk'`) | |
| owner_id | uuid | NOT NULL, FK → `users.id` | |
| assigned_client_id | uuid | NULL, FK → `clients.id` | which client this lead was delivered to (if any) |
| metadata | jsonb | NOT NULL DEFAULT `{}` | scraper output, email source, etc. |
| created_at | timestamptz | NOT NULL | |
| contacted_at | timestamptz | NULL | |
| replied_at | timestamptz | NULL | |
| onboarded_at | timestamptz | NULL | |

**Indexes:**
- `(owner_id, status)` — pipeline view
- `(score)` — filtering
- `(email)` — dedupe
- `(created_at DESC)` — recent first

**RLS:**
- `SELECT`: owner only (leads are owner-internal, never exposed to clients directly)
- `INSERT`: server-side only (pipeline writes)
- `UPDATE`: owner only

#### `missions`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | text | PK | human-readable, e.g. `MISSION-2026-06-04-001` |
| agent | text | NOT NULL | `'cashclaw'`, `'clawwork'`, `'openclaw'`, `'hermes'`, `'aura'`, `'seo'`, etc. |
| status | text | NOT NULL DEFAULT `'queued'`, CHECK in (`'queued'`, `'running'`, `'succeeded'`, `'failed'`, `'pending_payment'`, `'paid'`, `'cancelled'`) | |
| owner_id | uuid | NOT NULL, FK → `users.id` | |
| client_id | uuid | NULL, FK → `clients.id` | if mission is for a client |
| lead_id | uuid | NULL, FK → `leads.id` | if mission originated from a lead |
| payload | jsonb | NOT NULL DEFAULT `{}` | inputs to the agent |
| result | jsonb | NOT NULL DEFAULT `{}` | outputs from the agent |
| error | text | NULL | error message if failed |
| cost_usd | numeric(10,4) | NULL | LLM + API cost |
| duration_ms | int | NULL | |
| created_at | timestamptz | NOT NULL | |
| started_at | timestamptz | NULL | |
| completed_at | timestamptz | NULL | |

**Indexes:**
- `(owner_id, status)` — CashClaw/ClawWork board views
- `(created_at DESC)` — recent
- `(agent, status)` — per-agent filtering

**RLS:**
- `SELECT`: owner only
- `INSERT`/`UPDATE`: server-side only (agents write)

#### `invoices`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| client_id | uuid | NOT NULL, FK → `clients.id` | |
| mission_id | text | NULL, FK → `missions.id` | if invoice is for a mission |
| amount | numeric(12,2) | NOT NULL | in invoice currency |
| currency | text | NOT NULL, CHECK in (`'USD'`, `'INR'`, `'USDC'`) | |
| status | text | NOT NULL DEFAULT `'draft'`, CHECK in (`'draft'`, `'sent'`, `'pending'`, `'confirmed'`, `'failed'`, `'cancelled'`) | DUAL LEDGER: pending → confirmed |
| provider | text | NULL | `'stripe'`, `'upi'`, `'paytm'`, `'usdc_base'`, `'manual'` |
| tx_id | text | NULL | provider transaction ID |
| metadata | jsonb | NOT NULL DEFAULT `{}` | line items, notes, UPI deep link, etc. |
| created_at | timestamptz | NOT NULL | when drafted |
| sent_at | timestamptz | NULL | when emailed to client |
| confirmed_at | timestamptz | NULL | when payment confirmed (the moment money arrives) |
| confirmed_by | text | NULL | `'stripe_webhook'`, `'upi_manual'`, `'owner_mark_paid'`, `'usdc_poll'` |

**Indexes:**
- `(client_id, status)` — client billing page
- `(status, created_at)` — owner payment dashboard
- `(mission_id)` — link invoice to mission

**RLS:**
- `SELECT` (owner): all
- `SELECT` (client): own invoices only
- `INSERT`/`UPDATE`: server-side only

#### `payments` (separate from invoices — captures the actual money event)
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| invoice_id | uuid | NOT NULL, FK → `invoices.id` | |
| amount | numeric(12,2) | NOT NULL | actual received amount |
| currency | text | NOT NULL | |
| method | text | NOT NULL | `'stripe'`, `'upi'`, `'paytm'`, `'usdc'`, `'manual'`, `'other'` |
| tx_hash | text | NULL | on-chain hash for crypto |
| provider | text | NULL | provider name |
| provider_response | jsonb | NOT NULL DEFAULT `{}` | full webhook/API response |
| received_at | timestamptz | NOT NULL DEFAULT `now()` | |
| created_at | timestamptz | NOT NULL | |

**Indexes:**
- `(invoice_id)` — link to invoice
- `(received_at DESC)` — recent payments

**RLS:**
- `SELECT`: owner only (clients don't see raw payment events; they see invoice status)
- `INSERT`: server-side only

#### `memory` (per-agent memory)
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| agent | text | NOT NULL | agent name (e.g. `'ceo'`, `'openclaw'`) |
| key | text | NOT NULL | memory key, e.g. `'conversations:client_xyz:20260604'` |
| value | jsonb | NOT NULL | the memory content |
| scope | text | NOT NULL DEFAULT `'agent'`, CHECK in (`'agent'`, `'session'`, `'client'`, `'global'`) | |
| created_at | timestamptz | NOT NULL | |
| updated_at | timestamptz | NOT NULL | |

**Indexes:**
- `(agent, key)` — UNIQUE
- `(scope, updated_at)` — TTL-style cleanup

**RLS:**
- `SELECT`/`INSERT`/`UPDATE`: server-side only (agent memory is system-internal)

#### `social_accounts` (client social media OAuth tokens)
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| client_id | uuid | NOT NULL, FK → `clients.id` | |
| platform | text | NOT NULL, CHECK in (`'facebook'`, `'instagram'`, `'linkedin'`, `'twitter'`, `'youtube'`, `'tiktok'`, `'gbp'`) | |
| account_id | text | NOT NULL | platform's account ID |
| account_name | text | NULL | display name |
| access_token | text | NOT NULL | encrypted at rest (Supabase Vault) |
| refresh_token | text | NULL | |
| expires_at | timestamptz | NULL | |
| scopes | text[] | NOT NULL DEFAULT `{}` | granted OAuth scopes |
| metadata | jsonb | NOT NULL DEFAULT `{}` | |
| created_at | timestamptz | NOT NULL | |
| updated_at | timestamptz | NOT NULL | |

**Indexes:**
- `(client_id, platform)` — UNIQUE per platform per client

**RLS:**
- `SELECT`/`UPDATE` (client): own rows only
- `INSERT`/`UPDATE` (owner): all (admin)
- `SELECT` (server): all (for n8n / agent use)

### Pipeline telemetry

#### `alerts` (Session 38)
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| level | text | NOT NULL, CHECK in (`'info'`, `'warning'`, `'error'`, `'critical'`) | |
| source | text | NOT NULL | which phase / agent raised it |
| message | text | NOT NULL | human-readable |
| metadata | jsonb | NOT NULL DEFAULT `{}` | context |
| resolved | bool | NOT NULL DEFAULT `false` | |
| resolved_at | timestamptz | NULL | |
| created_at | timestamptz | NOT NULL | |

**Indexes:**
- `(resolved, created_at DESC)` — get recent unresolved
- `(level, created_at DESC)` — filter by severity

#### `agent_executions`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| agent | text | NOT NULL | |
| mission_id | text | NULL, FK → `missions.id` | |
| started_at | timestamptz | NOT NULL | |
| completed_at | timestamptz | NULL | |
| success | bool | NULL | |
| error | text | NULL | |
| tokens_in | int | NULL | |
| tokens_out | int | NULL | |
| cost_usd | numeric(10,4) | NULL | |
| metadata | jsonb | NOT NULL DEFAULT `{}` | |

#### `email_log`
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | |
| to_email | text | NOT NULL | |
| subject | text | NOT NULL | |
| body_html | text | NOT NULL | |
| provider | text | NOT NULL | `'brevo'`, `'sendgrid'`, `'gmail'` |
| provider_message_id | text | NULL | |
| status | text | NOT NULL | `'sent'`, `'delivered'`, `'opened'`, `'clicked'`, `'bounced'`, `'failed'` |
| sent_at | timestamptz | NOT NULL | |
| metadata | jsonb | NOT NULL DEFAULT `{}` | |

## SQLite (system_database.py — local only)

Tables: `leads`, `builds`, `deliveries`, `payments`, `errors`, `executions`, `agents`

- Used for: system-level telemetry that doesn't belong in the customer-facing Supabase
- Location: `backend/data/system.db`
- Backed up daily to S3 via `startup.sh` cron

## Authentication & Authorization

### Supabase Auth
- Email + password
- Session cookie: `sb-auth-token` (set by Supabase SDK)
- Auto-confirm email: enabled (avoids magic-link delay in dev)
- Password reset: email link

### Middleware (`src/middleware.js`)
- Reads `sb-auth-token` from cookies
- If no token and route is not public → redirect to `/login`
- If token + user role=client but route is `/dashboard/*` → redirect to `/client`
- If token + user role=owner but route is `/client/*` → redirect to `/dashboard`
- If token expired → refresh attempt; if fails → `/login`

### Public routes (no auth required)
- `/login`
- `/signup`
- `/privacy`
- `/terms`
- `/api/auth/*`
- `/api/payments/stripe-webhook` (HMAC-verified)
- `/health`
- `/api/public/*` (lead capture forms, etc.)

### Role-based access
- `role='owner'`: full access to `/dashboard/*` + all admin APIs
- `role='client'`: limited to `/client/*` + their own data only (via RLS)

## Data Ownership Rules

| Entity | Owner | Client can see |
|--------|-------|----------------|
| users | self | self only |
| clients | owner | own row (via `metadata.client_id`) |
| leads | owner | leads assigned to them (`assigned_client_id = self`) |
| missions | owner | missions for their client (`client_id = self`) |
| invoices | owner | own invoices |
| payments | owner (via invoice) | NOT directly (just invoice status) |
| memory | (system) | NOT accessible |
| social_accounts | owner + self | own rows |
| alerts | owner | NOT accessible |
| agent_executions | owner | NOT accessible |
| email_log | owner | NOT accessible |

## Migrations

- Location: `supabase/migrations/` (numbered, e.g. `20260604_add_invoice_currency.sql`)
- Run via Supabase CLI: `supabase db push`
- Never edit a committed migration — write a new one

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-04 | Dual-ledger: invoices vs payments | Session 50 fix — fake $491 balance motivated this. Invoice = intent. Payment = reality. |
| 2026-06-04 | Leads are owner-internal | Clients don't see raw leads; they see only the ones we delivered to them |
| 2026-06-04 | RLS on every table | Defense in depth — no client should ever see another client's data even if API has a bug |
| 2026-06-04 | No "earnings" table | Earnings are derived: `SUM(payments WHERE confirmed_at >= x)`. Single source of truth. |
| 2026-06-04 | `missions.id` is text, not uuid | Human-readable IDs in logs (`MISSION-2026-06-04-001`) save debugging time |
