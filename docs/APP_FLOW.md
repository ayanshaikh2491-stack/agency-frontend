# App Flow — NexusAI Agency

> **Every screen, every button, every state.** Read this before adding a route.
> Last updated: 2026-06-04 (Session 56)

---

## All Pages / Screens

### Public (no auth)
- `/login` — email + password sign-in
- `/signup` — email + password + business name (creates client)
- `/privacy` — privacy policy
- `/terms` — terms of service

### Owner (`role: owner`)
- `/dashboard` — overview (money in, leads, agent activity)
- `/dashboard/ceo` — premium CEO agent chat
- `/dashboard/leads` — lead pipeline (filter, sort, detail modal)
- `/dashboard/clients` — client list (CRUD)
- `/dashboard/clients/[id]` — client detail (status, notes, contact log, delete)
- `/dashboard/cashclaw` — CashClaw mission board
- `/dashboard/clawwork` — ClawWork gig board
- `/dashboard/social` — social media manager
- `/dashboard/memory` — per-agent memory inspector
- `/dashboard/payments` — payment history + mark-paid (when manual)

### Client (`role: client`)
- `/client` — client overview (their brand, this week's content, recent leads)
- `/client/onboarding` — 4-step wizard (Business, Goals, Integrations, Payment)
- `/client/brand` — their brand voice, color palette, content guidelines
- `/client/leads` — leads delivered to them
- `/client/calendar` — scheduled social posts
- `/client/payments` — their billing page (plan, history, upgrade)

## User Journey — Owner (primary)

```
1. Open browser → /login (auto-redirect from /)
2. Enter email + password → POST /api/auth/login
3. Middleware: valid session + role=owner → /dashboard
4. /dashboard loads:
   a. GET /api/dashboard/summary → money in, leads warm, agent last-run
   b. GET /api/agents/recent → last 10 agent actions
5. Owner sees overview in < 1.5s
6. Clicks "CEO" in sidebar → /dashboard/ceo
7. /dashboard/ceo loads:
   a. GET /api/memory/ceo/recall → conversation history
   b. GET /api/ceo/suggestions → smart suggestion chips
8. Owner types question
9. POST /api/ceo/chat → response (markdown-rendered)
10. Response in chat with copy button, timestamp, code-block highlight
11. Owner can: copy, regenerate, view history sidebar (localStorage), new chat, upload file (10MB), voice input (SpeechRecognition)
12. Sidebar nav: click any other page → client-side route change
```

## User Journey — Client (secondary)

```
1. Owner sends invitation email with magic link → /signup?token=...
2. Client signs up → business name captured → /client/onboarding
3. Step 1: Business (industry, size, location, website)
4. Step 2: Goals (lead gen / brand / social / content)
5. Step 3: Integrations (FB connect, IG connect, GBP — all optional)
6. Step 4: Payment (plan select → Stripe/UPI)
7. Confirm → success screen (confetti) → /client
8. /client loads:
   a. GET /api/client/summary → their brand, week calendar, recent leads
9. Client sees polished overview, no setup wizard on repeat visit
10. Click "Leads" → /client/leads (read-only list of delivered leads)
11. Click "Calendar" → /client/calendar (this week's scheduled posts)
12. Click "Payments" → /client/payments (plan card + history + upgrade modal)
```

## Navigation Flow

```
/  (root)
  ├── unauthenticated → /login
  └── authenticated
        ├── role=owner → /dashboard
        └── role=client → /client

/login → POST /api/auth/login → role=owner /dashboard | role=client /client
/signup → POST /api/auth/signup → /client/onboarding (default for new clients)
/dashboard → sidebar nav:
  ├── /dashboard/ceo
  ├── /dashboard/leads
  ├── /dashboard/clients → /dashboard/clients/[id]
  ├── /dashboard/cashclaw
  ├── /dashboard/clawwork
  ├── /dashboard/social
  └── /dashboard/memory

/client → sidebar nav:
  ├── /client/brand
  ├── /client/leads
  ├── /client/calendar
  └── /client/payments
```

## Button Actions (most-used)

| Button | Action | Result |
|--------|--------|--------|
| "Sign in" (login form) | POST /api/auth/login | Redirect by role |
| "Create one" (login → signup) | navigate to /signup | Signup form |
| "Send" (CEO chat) | POST /api/ceo/chat | Append user + agent messages |
| "Copy" (chat msg) | navigator.clipboard.write | Toast: "Copied" |
| "New chat" (CEO) | localStorage.clear | Empty conversation |
| "Add lead" (leads page) | Modal: email, name, source | POST /api/leads |
| "Add client" (clients) | Modal: business, contact | POST /api/clients |
| "Mark as Paid" (CashClaw mission) | Modal: amount, method, tx_id | POST /api/payments/mark-paid |
| "Connect FB" (client onboarding step 3) | OAuth popup → token capture | PATCH /api/clients/[id] |
| "Pay Now" (client payments) | Modal: UPI link or Stripe | Redirect or open UPI app |

## Empty States

| Page | Empty State | CTA |
|------|-------------|-----|
| /dashboard/leads | "No leads yet. Your AI agents are scanning 48 US cities." | "Trigger lead scan" |
| /dashboard/clients | "No clients yet. Start with a manual invite or let the pipeline find them." | "Invite client" |
| /dashboard/cashclaw | "No missions. CashClaw is idle. Tell CEO to start scanning." | "Chat with CEO" |
| /dashboard/clawwork | "No gigs. ClawWork hasn't found matching work." | "Refresh" |
| /client/leads | "No leads delivered yet. Usually first leads arrive 3-5 days after onboarding." | (none — passive) |

## Error States

| Page | Error State | Recovery |
|------|-------------|----------|
| /login (wrong creds) | "Email or password incorrect" | Clear password, focus email |
| /dashboard (API down) | "Backend unreachable. Last sync: 12 min ago." | "Retry" button |
| /dashboard/ceo (chat fail) | "Agent didn't respond. Try again or switch to a different agent." | "Retry" / "Switch to OpenClaw" |
| /client/payments (Stripe fail) | "Payment provider error. We saved your intent — try again." | "Retry checkout" |
| Any page (network) | Top banner: "Connection lost. Some data may be stale." | Auto-retry every 30s |

## Success States

| Action | Success State | Next Step |
|--------|---------------|-----------|
| Login | Redirect to role's home | — |
| Signup (client) | Confetti + "Welcome to NexusAI" | "Start onboarding" → /client/onboarding |
| Mark paid | Toast: "$79 confirmed via UPI" + balance updates | (no redirect) |
| Add lead | Toast: "Lead added. Score: 84" | Stays on /dashboard/leads |
| CEO chat send | Message appears + agent streams in | Stays on /dashboard/ceo |
| Mission complete | Card flips to "Completed" + green border | Toast: "Mission done in 47s" |

## Login/Signup Flow

```
/login:
  1. Email + password fields
  2. "Sign in" button → loading state
  3. On success: redirect by role
  4. On error: inline error message below button

/signup:
  1. Email, password, business name fields
  2. "Create account" → loading
  3. On success: redirect to /client/onboarding
  4. On error: inline error
  5. If email already exists: "Email already in use. Sign in instead?"
```

## Payment Flow (Owner: Mark Paid)

```
1. Owner on /dashboard/cashclaw sees mission with status: 'pending_payment'
2. Clicks "Mark as Paid"
3. Modal: Amount (prefilled), Method (UPI/Card/Crypto/Other), TX ID (optional)
4. Submits → POST /api/payments/mark-paid
5. Backend: CashClaw.confirm_payment(mission_id, amount, tx_hash, method)
6. Updates dual-ledger: pending → confirmed, balance += amount
7. Frontend: toast + mission card flips to "Paid"
```

## Payment Flow (Client: Pay Now)

```
1. Client on /client/payments clicks "Pay" on outstanding invoice
2. Modal: Plan summary, amount, currency
3. If INR client: "Pay via UPI" button → opens `upi://pay?pa=...` deep link
4. If USD client: Stripe Checkout redirect
5. After payment: webhook hits backend → /api/payments/stripe-webhook (HMAC verified)
6. Backend: confirm_payment() → status=paid
7. Client refreshes /client/payments → invoice shows "Paid"
```

## Onboarding Flow (4 steps + confirm)

```
Step 1 — Business: industry (dropdown), size (1-10/11-50/50+), location, website
Step 2 — Goals: lead-gen / brand / social / content (multi-select)
Step 3 — Integrations: FB connect, IG connect, Google Business Profile (all optional, "skip" available)
Step 4 — Payment: plan select (Essential / Premium / Enterprise)
Step 5 — Review: all data shown, "Edit" jumps back to that step
Confirm → success screen with confetti → /client
```

Progress saved in localStorage on every step change. Refresh resumes mid-flow.

## CEO Chat Flow (Premium)

```
1. Owner on /dashboard/ceo
2. Sees:
   - Conversation history (sidebar, last 10 sessions, localStorage)
   - Active conversation in main panel
   - Smart suggestion chips ("Today's priorities", "Pending payments", "Lead quality check")
   - Input area with: file upload, voice input, send button
3. Types or uploads
4. Send → POST /api/ceo/chat (with conversation history for context)
5. Backend: recalls memory → LLM call (minimax-m3-free default) → response
6. Frontend renders: markdown (with code block syntax highlight), timestamp, copy button
7. Owner can: continue thread, copy, regenerate, start new
8. Conversation stored: file-based per agent + Obsidian sync
```

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-04 | Single root `/` redirects to role-home | No marketing landing (Session 55 cleanup) |
| 2026-06-04 | 10s polling for live data, not WebSocket | Simpler, sufficient, no infra |
| 2026-06-04 | Onboarding state in localStorage | Refresh-safe; no DB roundtrip for draft |
| 2026-06-04 | 4-step onboarding (not 1 long form) | Less overwhelming; progressive disclosure |
