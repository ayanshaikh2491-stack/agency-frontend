# Munder-Flavored TAGS Agency Office — Design

**Date:** 2026-08-20
**Author:** Jcode (for Michael / TAGS Agency)
**Status:** Approved design (pending spec self-review + user review)

## Goal

Upgrade the existing TAGS Agency frontend office (`agency-frontend`) so it
feels like the Munder-Difflin office: a PixiJS floor where the CEO (Michael,
the god/orchestrator) and the employee agents (SBA, SEO, Website, Ads,
Content, Social, Analytics) appear as walking characters with live status
and thought bubbles. The backend is unchanged (already live on EC2
`18.213.66.136:8000`, commit `cd52596`).

This is NOT a copy of Munder-Difflin. Munder is an Electron, local-first,
node-pty desktop app. TAGS is a web app (Next.js frontend on Vercel, FastAPI
backend on EC2). We borrow Munder's *concepts* (god orchestrator, office cast,
walking avatars, thought bubbles, command center) and fit them into the web
architecture already in place.

## Why

The user already built the backend with the right mental model: CEO Michael is
the only boss-facing agent; all other agents are employees that the CEO
commands (CEO-gated, direct calls return 426). The frontend office exists but
is a static desk grid. This design makes the office *read* like a living
agency: who is working, on what, and what the CEO is doing — without changing
the proven backend.

## Architecture

- **Backend (unchanged, live on EC2):**
  - `GET /api/ceo/state` and `WS /api/ceo/ws/office` (3s floor state) from
    `ceo_controller.get_state()` → `{ ceo, workers, mandates, floor }`.
  - `POST /api/ceo/chat` → CEO reply.
  - `GET /api/ceo/email/outbox`, `POST /api/ceo/email/send` → queued emails.
- **Frontend (Vercel Next.js):** `NEXT_PUBLIC_API_URL` points at the EC2
  backend. All new UI lives under `src/app/admin/office` and
  `src/components` / `src/hooks`.

Data flow:

```
WebSocket(/api/ceo/ws/office) ─▶ useOfficeSocket ─▶ OfficePage
        │                                            ├─▶ OfficeFloor (characters animate)
        │                                            └─▶ AgentLivePanel (status cards)
CeoChat ─▶ POST /api/ceo/chat ─▶ CEO reply
EmailOutbox ─▶ GET /api/ceo/email/outbox (poll 5s)
```

## Components

1. **`OfficeFloor.tsx`** (upgrade existing `OfficeFloor.jsx`) — PixiJS app
   adapted from Munder's `scene/office/OfficeFloor.tsx` + `Character.ts`.
   - `CastMember[]` roster: `michael` (god/CEO) + 7 employees, each with a
     desk position, accent color, and blurb.
   - A `Character` class with `idle | walk | sit | working-glow | error-glyph`
     states and a thought bubble for live activity.
   - Simple room background (tiled or solid) — no full TiledMap required for v1.
   - Click Michael's desk → `onSelectCeo()`.
2. **`useOfficeSocket.js`** (reuse, minor map) — WebSocket state → character
   props.
3. **`CeoChat.jsx`** (reuse + small polish) — talk to Michael.
4. **`AgentLivePanel.tsx`** (extend existing `SbaLivePanel.jsx`) — one live
   status card per agent (Munder desk-screen style).
5. **`EmailOutbox.tsx`** (NEW) — polls `/api/ceo/email/outbox` every 5s,
   lists queued emails; office page shows "📬 Outbox (n)" button.
6. **`CommandCenter.tsx`** (extend existing mandates panel) — mandates in a
   Munder "triggers" style.

## State Mapping (backend → character)

| Backend state | Character action |
|---|---|
| `floor[agent].status == "working"` | sit at desk + pulsing glow + thought bubble = `task` |
| `status == "idle"` | idle rest at desk |
| `status == "error"` | red "!" glyph |
| `mandates[worker].status == "running"` | highlight desk, standing task in bubble |
| CEO chat active | Michael desk glows, bubble = "thinking…" |

## Error Handling

- WebSocket disconnect: `useOfficeSocket` already reconnects; characters freeze
  at last state, badge shows "○ connecting…".
- CEO chat fail: `CeoChat` already catches and shows an error.
- Email outbox poll fail: silent retry, empty list.
- Backend down: floor shows static desks, no crash.

## Testing (verify before claiming done)

- `npm run dev` (Next.js), open office page:
  - WebSocket connects (badge "● live floor").
  - Characters render; Michael + 7 employees seated at desks.
  - Click Michael → chat opens, `POST /api/ceo/chat` returns a reply.
  - Working agent shows glow + thought bubble from `task`.
  - "📬 Outbox (n)" polls `/api/ceo/email/outbox` and lists queued emails.
- `npm run lint` and `npm run build` pass.
- Deploy: push to `agency-frontend` → Vercel auto-deploys. Backend needs no
  change (endpoints already live on EC2 `cd52596`).

## Build & Deploy

- Frontend-only change → push `agency-frontend` → Vercel deploys.
- Backend: no deploy needed.
- Preserve `NEXT_PUBLIC_API_URL` (Vercel env) = `http://18.213.66.136:8000`.

## Scope (YAGNI)

- No Electron, no local-first, no node-pty.
- No cafeteria gossip / coffee breaks / wander loops (Munder flavor is
  optional; skip for v1 to keep it simple and stable).
- Focus: walking office + cast + thought bubbles + live floor + email outbox
  + command center.

## Reference

- Munder-Difflin (cloned to `_munder` for study):
  `src/renderer/src/scene/office/OfficeFloor.tsx`, `cast.ts`, `Character.ts`,
  `ThoughtBubble.ts`, `MessageEnvelope.ts`.
- Our backend: `admin/agency/ceo.py`, `admin/agency/ceo_controller.py`,
  `admin/api/routes/ceo.py`, `admin/tools/email_queue.py`.
- Our frontend: `agency-frontend/src/app/admin/office/*`, `src/hooks/useOfficeSocket.js`.
