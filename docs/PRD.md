# PRD — NexusAI Agency Platform

> **Source of truth for what we are building.** Read this before any feature work.
> Last updated: 2026-06-04 (Session 56)

---

## App Name
**NexusAI Agency** (working name; brand may evolve)

## One-line App Idea
An autonomous AI marketing agency platform where 3+ AI agents (CEO, OpenClaw lead-gen, Hermes outreach, Aura brand) collaborate to find, pitch, onboard, and serve real paying clients — with the owner watching a live control room and clients getting a polished portal for their own work.

## Target Users

### Primary — Owner (you, Ayan Shaikh)
- Solo operator running a 24/7 AI marketing agency
- Wants **honest operational control** — see real money, real leads, real agent activity, no faked numbers
- Technical enough to read JSON, debug API responses, deploy via Vercel/EC2
- Cares about cashflow: lead conversion → payment → reinvestment loop

### Secondary — Agency Clients
- Small business owners (US dentists, gyms, salons, restaurants — verified by live pipeline)
- 1–10 employee businesses, $5K–$50K/year marketing budget
- Want: leads delivered, social posts scheduled, brand voice consistent
- Don't care HOW it works; care that it works

### Tertiary — Internal AI Agents
- 47 specialized agents (per AGENTS.md) acting as team members
- Read/write the platform's data, trigger actions, run pipelines

## Problem You Are Solving

You tried to build a "vibe-coded" SaaS and it ended up looking AI-generated. Worse, the AI templates don't survive first contact with real money:

1. **Fake earnings** — ClawWork $491 fake balance, 105 self-invoices, $0 received (Session 50 fix)
2. **Vague UI** — generic dark theme, no design system, looks like a tutorial
3. **Agent black box** — agents run but their actions aren't legible to the owner
4. **Client trust gap** — clients see a dashboard; nothing about the work feels real or premium

## Main Features (MVP, Live Now)

| # | Feature | Status | Lives At |
|---|---------|--------|----------|
| 1 | Auth (signup/login/session) | ✅ Live | `app/login`, `app/signup`, Supabase |
| 2 | Owner dashboard overview | ✅ Live | `app/dashboard/page.js` |
| 3 | CEO Agent chat (premium) | ✅ Live | `app/dashboard/ceo/page.js` + `AgentChatUI.js` |
| 4 | Lead pipeline view | ✅ Live | `app/dashboard/leads/page.js` |
| 5 | Client CRM (list + detail) | ✅ Live | `app/dashboard/clients/page.js` |
| 6 | CashClaw mission board | ✅ Live | `app/dashboard/cashclaw/page.js` |
| 7 | ClawWork gig board | ✅ Live | `app/dashboard/clawwork/page.js` |
| 8 | Social Media Manager | ✅ Live | `app/dashboard/social/page.js` |
| 9 | Client portal (separate) | ✅ Live | `app/client/*` |
| 10 | Stripe + UPI payment flow | ✅ Live | `/api/payments/*` |
| 11 | Memory system (per-agent) | ✅ Live | `/api/memory/*` |
| 12 | Onboarding wizard (4 steps) | ✅ Live | `app/client/onboarding/page.js` |

## User Roles

| Role | Routes | Can Do |
|------|--------|--------|
| **Owner** | `/dashboard/*` | Everything: see all clients, all leads, all money, chat with CEO, trigger cycles |
| **Client** | `/client/*` | See their own work: their brand, their leads, their content calendar, their billing |
| **Agent** | API only | Execute tasks, write memory, no direct UI access |

## User Stories (most important)

1. **As Owner, I open the dashboard and see in 3 seconds:** How much real money came in today, how many leads are warm, what my agents did while I was asleep.
2. **As Owner, I chat with the CEO agent like a colleague** — I ask "what should I do today?" and get a real, prioritized, money-linked answer, not a generic "here are some options" reply.
3. **As Client, I log in and immediately see my brand voice, my content calendar for this week, and what my leads did today** — no setup wizard on repeat visit.
4. **As Client, I get billed and the invoice looks real** — has my name, my business, the right amount, and a way to pay (UPI for India, card for US).
5. **As Owner, I never see fake numbers** — every dollar shown is backed by a real invoice with a real payment status, sourced from a real provider.

## Success Metrics

- **Money in bank** (real, not invoiced) ≥ $500/day by end of month
- **Client retention** ≥ 70% after 30 days
- **Owner time spent in app** ≤ 30 min/day (it should run itself)
- **Agent action legibility** — every agent action visible in audit log within 60s
- **Real money trust** — zero fake "earnings" entries; dual-ledger (pending vs confirmed) enforced in code

## MVP Scope (what ships in v1)

- Auth + 2 role types
- Owner dashboard with live data
- 5 owner views: overview, leads, clients, ceo, payments
- 4 client views: overview, onboarding, brand, billing
- 1 premium feature: CEO agent chat with memory

## Out of Scope for v1

- Public marketing site (removed Session 55)
- Multi-tenant subdomain routing
- Real-time WebSocket agent feed (polling 10s is enough)
- Mobile native apps (web is mobile-responsive, that's it)
- Multi-language (English only)
- Audit log export (visible in UI, no CSV)
- Custom agent builder (47 fixed agents)
- White-label for client (clients see NexusAI branding)

## Anti-Goals (what we will NOT do)

- We will not show fake "balance" or "earnings" in any view. If we have no real money, show $0 with a "no confirmed payments yet" caption.
- We will not add a feature without owner approval. The owner decides what ships.
- We will not use AI-generated-looking UI. Every screen has a human, intentional feel (see DESIGN.md).
- We will not optimize for vanity metrics (DAU, session length) over money-in-bank.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-04 | Single Next.js repo (`agency-frontend`) | After 22 Vercel project cleanup, one repo per surface |
| 2026-06-04 | Backend separate on EC2 | Vercel 500MB Lambda limit can't hold our Python deps |
| 2026-06-04 | No public marketing site | All traffic goes to login; clients come through direct outreach |
| 2026-06-04 | Dual-ledger for money (pending vs confirmed) | Session 50: fake $491 balance motivated this rule |
