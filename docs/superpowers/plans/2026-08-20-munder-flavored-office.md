# Munder-Flavored TAGS Agency Office — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the TAGS Agency frontend office into a Munder-style living PixiJS floor (CEO Michael + 7 employee agents as characters with live status, thought bubbles, email outbox, command center) wired to the already-live EC2 backend.

**Architecture:** Next.js frontend on Vercel consumes the live EC2 FastAPI backend (`18.213.66.136:8000`) via `NEXT_PUBLIC_API_URL` and the `WS /api/ceo/ws/office` socket. No backend changes. New/upgraded components live under `src/app/admin/office` and `src/components`.

**Tech Stack:** Next.js 14 (App Router, React 18), PixiJS 8 (already a dependency), native WebSocket, TypeScript/JSX.

## Global Constraints

- Backend is unchanged and already live on EC2 at commit `cd52596`; do NOT deploy or modify it.
- `NEXT_PUBLIC_API_URL` (Vercel env) must stay `http://18.213.66.136:8000`; never overwrite it.
- CEO is the ONLY boss-facing agent; direct worker calls return 426 — frontend must only talk to `/api/ceo/*`.
- Keep it web-based: no Electron, no node-pty, no local-first. YAGNI: skip cafeteria/coffee/gossip animations in v1.
- Every component that uses PixiJS must guard `ssr: false` (dynamic import) — Pixi needs the browser.
- `npm run lint` and `npm run build` must pass before claiming done.

---

## File Structure

- `src/app/admin/office/page.jsx` — MODIFY (wire new panels + outbox button)
- `src/app/admin/office/OfficeFloor.tsx` — CREATE (PixiJS walking office; replaces `OfficeFloor.jsx`)
- `src/app/admin/office/Character.ts` — CREATE (character state machine: idle/walk/sit/working/error + thought bubble)
- `src/app/admin/office/cast.ts` — CREATE (roster: michael + 7 employees, colors, desk coords, blurbs)
- `src/app/admin/office/ThoughtBubble.ts` — CREATE (speech/thought cloud renderer)
- `src/app/admin/office/CeoChat.jsx` — MODIFY (small polish; reuse logic)
- `src/app/admin/office/AgentLivePanel.tsx` — CREATE (replaces `SbaLivePanel.jsx`; one card per agent)
- `src/app/admin/office/EmailOutbox.tsx` — CREATE (polls `/api/ceo/email/outbox`)
- `src/app/admin/office/CommandCenter.tsx` — CREATE (mandates in triggers style)
- `src/hooks/useOfficeSocket.js` — MODIFY (map state → character props; keep reconnect)
- `src/app/admin/office/SbaLivePanel.jsx` — DELETE (replaced by AgentLivePanel)

---

## Task 1: Cast roster + types

**Files:**
- Create: `src/app/admin/office/cast.ts`

**Interfaces:**
- Produces: `OFFICE_CAST` (array of `CastMember`), `CastMember` type, `CAST_BY_NAME`, `hexToNumber(hex: string): number`.

- [ ] **Step 1: Write the cast module**

```ts
// src/app/admin/office/cast.ts
export interface CastMember {
  id: string;            // "michael" | "sba" | "seo" | "website" | "ads" | "content" | "social" | "analytics"
  displayName: string;   // "Michael" etc
  isGod: boolean;        // true only for michael
  shirt: string;         // accent hex, e.g. "#f4d35e"
  blurb: string;         // one-line role
  desk: { x: number; y: number }; // pixel coords on the 800x600 floor
}

export const OFFICE_CAST: CastMember[] = [
  { id: "michael",  displayName: "Michael",  isGod: true,  shirt: "#f4d35e", blurb: "CEO — the only boss entry point", desk: { x: 400, y: 300 } },
  { id: "sba",      displayName: "SBA",      isGod: false, shirt: "#4ea1ff", blurb: "Lead → Email → Meeting",          desk: { x: 150, y: 150 } },
  { id: "seo",      displayName: "SEO",      isGod: false, shirt: "#6e1423", blurb: "Technical + on-page SEO",         desk: { x: 650, y: 150 } },
  { id: "website",  displayName: "Website",  isGod: false, shirt: "#6e1423", blurb: "Design, build, host",            desk: { x: 150, y: 450 } },
  { id: "ads",      displayName: "Ads",      isGod: false, shirt: "#6e1423", blurb: "Meta + Google Ads",              desk: { x: 650, y: 450 } },
  { id: "content",  displayName: "Content",  isGod: false, shirt: "#232a33", blurb: "Visual execution",               desk: { x: 250, y: 300 } },
  { id: "social",   displayName: "Social",   isGod: false, shirt: "#232a33", blurb: "Social strategy",                desk: { x: 550, y: 300 } },
  { id: "analytics",displayName: "Analytics",isGod: false, shirt: "#232a33", blurb: "Performance + reporting",       desk: { x: 400, y: 120 } },
];

export const CAST_BY_NAME: Record<string, CastMember> =
  Object.fromEntries(OFFICE_CAST.map((c) => [c.id, c]));

export function hexToNumber(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}
```

- [ ] **Step 2: Sanity check it compiles/types resolve**

Run: `cd agency-frontend && npx tsc --noEmit -p tsconfig.json 2>&1 | head -20 || true`
Expected: no errors referencing `cast.ts` (other pre-existing errors may exist; ignore unrelated ones).

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/office/cast.ts
git commit -m "feat(office): add cast roster + types for Munder-style floor"
```

---

## Task 2: ThoughtBubble renderer

**Files:**
- Create: `src/app/admin/office/ThoughtBubble.ts`

**Interfaces:**
- Produces: `class ThoughtBubble` with `show(text: string, tool?: string): void`, `hide(): void`, `draw(g: Graphics, cx: number, cy: number): void` (renders into a Pixi `Graphics` above the character).

- [ ] **Step 1: Write ThoughtBubble**

```ts
// src/app/admin/office/ThoughtBubble.ts
import { Graphics } from "pixi.js";

const MAX_CHARS = 42;

export class ThoughtBubble {
  private text = "";
  private tool?: string;
  private visible = false;

  show(text: string, tool?: string): void {
    this.text = (text || "").slice(0, MAX_CHARS);
    this.tool = tool;
    this.visible = this.text.length > 0;
  }

  hide(): void {
    this.visible = false;
  }

  get isVisible(): boolean {
    return this.visible;
  }

  /** Draw a small cloud + text into `g`, anchored so its bottom-center sits at (cx, cy). */
  draw(g: Graphics, cx: number, cy: number): void {
    if (!this.visible) return;
    const w = Math.max(60, this.text.length * 7 + 24);
    const h = 30;
    const x = cx - w / 2;
    const y = cy - h - 10;
    g.roundRect(x, y, w, h, 8).fill({ color: 0xffffff, alpha: 0.95 });
    g.roundRect(x, y, w, h, 8).stroke({ width: 1, color: 0x232a33 });
    g.circle(cx - 6, y + h + 4, 3).fill({ color: 0xffffff, alpha: 0.95 });
    g.circle(cx + 4, y + h + 9, 2).fill({ color: 0xffffff, alpha: 0.95 });
    // text is drawn by the caller's Text object; ThoughtBubble only paints the cloud.
  }

  get label(): string {
    return this.tool ? `[${this.tool}] ${this.text}` : this.text;
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `cd agency-frontend && npx tsc --noEmit -p tsconfig.json 2>&1 | head -20 || true`
Expected: no new errors for `ThoughtBubble.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/office/ThoughtBubble.ts
git commit -m "feat(office): add ThoughtBubble renderer for live activity"
```

---

## Task 3: Character state machine

**Files:**
- Create: `src/app/admin/office/Character.ts`

**Interfaces:**
- Consumes: `hexToNumber` and `CastMember` from `./cast`, `ThoughtBubble` from `./ThoughtBubble`.
- Produces: `class Character` with:
  - constructor(opts: `{ id: string; member: CastMember; app: Application; layer: Container }`)
  - `setStatus(status: "idle" | "working" | "error", task?: string): void`
  - `tick(dt: number): void` (advances any animation; called from the floor ticker)
  - `get container(): Container` (the Pixi display object to add to the stage)

- [ ] **Step 1: Write Character**

```ts
// src/app/admin/office/Character.ts
import { Application, Container, Graphics, Text } from "pixi.js";
import { CastMember, hexToNumber } from "./cast";
import { ThoughtBubble } from "./ThoughtBubble";

type Status = "idle" | "working" | "error";

export class Character {
  readonly id: string;
  readonly container: Container;
  private member: CastMember;
  private body: Graphics;
  private dot: Graphics;
  private bubble: ThoughtBubble;
  private bubbleText: Text;
  private status: Status = "idle";
  private pulse = 0;

  constructor(opts: { id: string; member: CastMember; app: Application; layer: Container }) {
    this.id = opts.id;
    this.member = opts.member;
    const c = new Container();
    c.x = opts.member.desk.x;
    c.y = opts.member.desk.y;

    this.body = new Graphics();
    this.drawBody(0x9aa4b2);
    c.addChild(this.body);

    const t = new Text({
      text: opts.member.displayName,
      style: { fill: 0xffffff, fontSize: 12, fontWeight: "600" },
    });
    t.x = -42; t.y = -8;
    c.addChild(t);

    this.dot = new Graphics().circle(40, -28, 5).fill(0x8b94a3);
    c.addChild(this.dot);

    this.bubble = new ThoughtBubble();
    this.bubbleText = new Text({ text: "", style: { fill: 0x111111, fontSize: 11 } });
    this.bubbleText.x = -50; this.bubbleText.y = -70;
    c.addChild(this.bubbleText);

    opts.layer.addChild(c);
    this.container = c;
  }

  private drawBody(accent: number): void {
    this.body.clear();
    this.body.roundRect(-55, -38, 110, 76, 10).fill(hexToNumber(this.member.shirt));
    this.body.roundRect(-55, -38, 110, 76, 10).stroke({ width: 2, color: accent });
  }

  setStatus(status: Status, task?: string): void {
    this.status = status;
    const dotColor = status === "working" ? 0x16a34a : status === "error" ? 0xdc2626 : 0x8b94a3;
    this.dot.clear().circle(40, -28, 5).fill(dotColor);
    if (status === "working" && task) {
      this.bubble.show(task, "task");
    } else if (status === "error") {
      this.bubble.show("blocked", "error");
    } else {
      this.bubble.hide();
    }
    this.bubbleText.text = this.bubble.label;
  }

  tick(dt: number): void {
    if (this.status === "working") {
      this.pulse += dt;
      const a = 0.4 + 0.4 * Math.sin(this.pulse / 300);
      this.body.alpha = a;
    } else {
      this.body.alpha = 1;
    }
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `cd agency-frontend && npx tsc --noEmit -p tsconfig.json 2>&1 | head -20 || true`
Expected: no new errors for `Character.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/office/Character.ts
git commit -m "feat(office): add Character state machine (idle/working/error + bubble)"
```

---

## Task 4: OfficeFloor (PixiJS floor)

**Files:**
- Create: `src/app/admin/office/OfficeFloor.tsx`
- Delete: `src/app/admin/office/OfficeFloor.jsx`

**Interfaces:**
- Consumes: `OFFICE_CAST`, `Character` from `./Character`, `useOfficeSocket` floor state (passed as prop `floor`).
- Produces: default-exported React component `OfficeFloor({ onSelectCeo, floor })` rendered only client-side.

- [ ] **Step 1: Write OfficeFloor.tsx**

```tsx
// src/app/admin/office/OfficeFloor.tsx
"use client";
import { useEffect, useRef } from "react";
import { Application, Container, Graphics } from "pixi.js";
import { OFFICE_CAST } from "./cast";
import { Character } from "./Character";

export default function OfficeFloor({ onSelectCeo, floor }: { onSelectCeo: () => void; floor: any[] }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let app: Application | undefined;
    let destroyed = false;

    (async () => {
      const a = new Application();
      await a.init({ width: 800, height: 600, background: "#0f1115", antialias: true });
      if (destroyed) { a.destroy(true); return; }
      ref.current?.appendChild(a.canvas);

      const world = new Container();
      a.stage.addChild(world);

      // floor backdrop
      const bg = new Graphics().rect(0, 0, 800, 600).fill(0x141821);
      world.addChild(bg);

      const chars = new Map<string, Character>();
      for (const m of OFFICE_CAST) {
        const ch = new Character({ id: m.id, member: m, app: a, layer: world });
        chars.set(m.id, ch);
        if (m.isGod) {
          ch.container.eventMode = "static";
          ch.container.cursor = "pointer";
          ch.container.on("pointerdown", onSelectCeo);
        }
      }

      const statusByName: Record<string, any> = {};
      for (const f of floor || []) statusByName[f.agent_type || f.agent || f.id] = f;
      for (const m of OFFICE_CAST) {
        const st = statusByName[m.id];
        chars.get(m.id)?.setStatus(st?.status || "idle", st?.task || st?.standing_task);
      }

      a.ticker.add((t) => {
        for (const ch of chars.values()) ch.tick(t.deltaMS);
      });
      app = a;
    })();

    return () => {
      destroyed = true;
      app?.destroy(true);
    };
  }, [onSelectCeo, floor]);

  return <div ref={ref} style={{ width: 800, maxWidth: "100%" }} />;
}
```

- [ ] **Step 2: Delete the old JSX version**

Run: `cd agency-frontend && git rm src/app/admin/office/OfficeFloor.jsx`
Expected: file removed from index.

- [ ] **Step 3: Typecheck**

Run: `cd agency-frontend && npx tsc --noEmit -p tsconfig.json 2>&1 | head -20 || true`
Expected: no new errors for `OfficeFloor.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/office/OfficeFloor.tsx
git commit -m "feat(office): replace static desks with PixiJS character floor"
```

---

## Task 5: Upgrade useOfficeSocket mapping

**Files:**
- Modify: `src/hooks/useOfficeSocket.js`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_API_URL`, backend `WS /api/ceo/ws/office` (returns `{ ceo, workers, mandates, floor }`).
- Produces: same hook return `{ state, connected }` but ensure `state.floor` is normalized to `[{ id/agent_type, status, task, standing_task }]` so `OfficeFloor` and panels read it.

- [ ] **Step 1: Add normalization to the onmessage handler**

Replace the `socket.onmessage` block with:

```js
    socket.onmessage = (e) => {
      try {
        const raw = JSON.parse(e.data);
        const workers = raw.workers || [];
        const floor = (raw.floor || []).map((f) => ({
          id: f.agent_type || f.agent || f.id,
          agent_type: f.agent_type || f.agent || f.id,
          status: f.status || "idle",
          task: f.task || f.standing_task || "",
        }));
        setState({ ...raw, floor });
      } catch {
        /* ignore malformed frames */
      }
    };
```

- [ ] **Step 2: Lint**

Run: `cd agency-frontend && npm run lint 2>&1 | tail -20`
Expected: no errors for `useOfficeSocket.js`.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useOfficeSocket.js
git commit -m "feat(office): normalize floor state for character mapping"
```

---

## Task 6: AgentLivePanel (all agents)

**Files:**
- Create: `src/app/admin/office/AgentLivePanel.tsx`
- Delete: `src/app/admin/office/SbaLivePanel.jsx`

**Interfaces:**
- Consumes: `floor` prop (normalized array from `useOfficeSocket`).
- Produces: default-exported component rendering one status card per agent.

- [ ] **Step 1: Write AgentLivePanel.tsx**

```tsx
// src/app/admin/office/AgentLivePanel.tsx
"use client";

export default function AgentLivePanel({ floor }: { floor: any[] }) {
  const agents = floor || [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {agents.length === 0 && (
        <p style={{ color: "var(--office-muted)", fontSize: 13, margin: 0 }}>No agents online.</p>
      )}
      {agents.map((a) => {
        const dot = a.status === "working" ? "#16a34a" : a.status === "error" ? "#dc2626" : "#8b94a3";
        return (
          <div key={a.id || a.agent_type} style={{ background: "var(--office-panel)", border: "1px solid var(--office-border)", borderRadius: 10, padding: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: dot, display: "inline-block" }} />
              <strong style={{ fontSize: 13 }}>{a.agent_type || a.id}</strong>
            </div>
            <p style={{ fontSize: 12, color: "var(--office-muted)", margin: "4px 0 0" }}>{a.task || "idle"}</p>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Delete old panel**

Run: `cd agency-frontend && git rm src/app/admin/office/SbaLivePanel.jsx`

- [ ] **Step 3: Lint**

Run: `cd agency-frontend && npm run lint 2>&1 | tail -20`
Expected: no errors for `AgentLivePanel.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/office/AgentLivePanel.tsx
git commit -m "feat(office): replace SBA-only panel with per-agent live panel"
```

---

## Task 7: EmailOutbox panel

**Files:**
- Create: `src/app/admin/office/EmailOutbox.tsx`

**Interfaces:**
- Consumes: `GET /api/ceo/email/outbox` (returns `{ status, outbox: [{ id, to_email, subject, body, status, created_at }] }`).
- Produces: component with internal poll (5s) + `count` so the office page can show a badge.

- [ ] **Step 1: Write EmailOutbox.tsx**

```tsx
// src/app/admin/office/EmailOutbox.tsx
"use client";
import { useEffect, useState } from "react";

interface OutboxRow { id: string; to_email: string; subject: string; body: string; status: string; created_at: string; }

export default function EmailOutbox({ embedded = false }: { embedded?: boolean }) {
  const [rows, setRows] = useState<OutboxRow[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/ceo/email/outbox");
        const j = await r.json();
        if (alive && j?.outbox) setRows(j.outbox);
      } catch { /* keep last known */ }
    };
    load();
    const t = setInterval(load, 5000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const pending = rows.filter((r) => r.status === "pending").length;

  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} style={{ background: "var(--office-accent)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
        📬 Outbox{pending ? ` (${pending})` : ""}
      </button>
      {open && (
        <div style={{ marginTop: 12, background: "var(--office-panel)", border: "1px solid var(--office-border)", borderRadius: 12, padding: 14, maxHeight: 320, overflowY: "auto" }}>
          {rows.length === 0 && <p style={{ color: "var(--office-muted)", fontSize: 13, margin: 0 }}>No queued emails.</p>}
          {rows.map((r) => (
            <div key={r.id} style={{ borderBottom: "1px solid var(--office-border)", padding: "8px 0" }}>
              <div style={{ fontSize: 13 }}><strong>{r.to_email}</strong> · <span style={{ color: "var(--office-muted)" }}>{r.status}</span></div>
              <div style={{ fontSize: 12, color: "var(--office-muted)" }}>{r.subject}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Lint**

Run: `cd agency-frontend && npm run lint 2>&1 | tail -20`
Expected: no errors for `EmailOutbox.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/office/EmailOutbox.tsx
git commit -m "feat(office): add email outbox panel (polls CEO outbox)"
```

---

## Task 8: CommandCenter (mandates)

**Files:**
- Create: `src/app/admin/office/CommandCenter.tsx`

**Interfaces:**
- Consumes: `state.mandates` from `useOfficeSocket` (`[{ worker, status, standing_task }]`).
- Produces: component listing running mandates in a Munder "triggers" style.

- [ ] **Step 1: Write CommandCenter.tsx**

```tsx
// src/app/admin/office/CommandCenter.tsx
"use client";

export default function CommandCenter({ mandates }: { mandates: any[] }) {
  const active = (mandates || []).filter((m) => m.status === "running");
  return (
    <div style={{ background: "var(--office-panel)", border: "1px solid var(--office-border)", borderRadius: 12, padding: 14 }}>
      <h3 style={{ margin: "0 0 8px", fontSize: 14 }}>Active CEO mandates</h3>
      {active.length === 0 ? (
        <p style={{ color: "var(--office-muted)", fontSize: 13, margin: 0 }}>No active mandates.</p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
          {active.map((m) => (
            <li key={m.worker}><strong>{m.worker}</strong>: {m.standing_task || m.status}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Lint**

Run: `cd agency-frontend && npm run lint 2>&1 | tail -20`
Expected: no errors for `CommandCenter.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/office/CommandCenter.tsx
git commit -m "feat(office): add command-center mandates panel"
```

---

## Task 9: Wire OfficePage

**Files:**
- Modify: `src/app/admin/office/page.jsx`
- Modify: `src/app/admin/office/CeoChat.jsx` (import path for OfficeFloor stays same; no logic change needed beyond confirming it calls `/api/ceo/chat`)

**Interfaces:**
- Consumes: `OfficeFloor` (default from `./OfficeFloor`), `AgentLivePanel`, `EmailOutbox`, `CommandCenter`, `useOfficeSocket` (`{ state, connected }`).
- Produces: the composed office page.

- [ ] **Step 1: Rewrite page.jsx**

```jsx
"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import CeoChat from "./CeoChat";
import AgentLivePanel from "./AgentLivePanel";
import EmailOutbox from "./EmailOutbox";
import CommandCenter from "./CommandCenter";
import { useOfficeSocket } from "../../../hooks/useOfficeSocket";

const OfficeFloor = dynamic(() => import("./OfficeFloor"), { ssr: false });

export default function OfficePage() {
  const [chatOpen, setChatOpen] = useState(false);
  const { state, connected } = useOfficeSocket();
  const floor = state?.floor || [];
  const mandates = state?.mandates || [];

  return (
    <div style={{ background: "var(--office-bg)", minHeight: "100vh", color: "var(--office-text)", padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>TAGS Agency — Michael&apos;s Office</h1>
          <p style={{ color: "var(--office-muted)", margin: "4px 0 0", fontSize: 13 }}>
            The CEO is the only boss entry point. Click his desk to talk to him.
          </p>
        </div>
        <div style={{ fontSize: 12, color: connected ? "var(--office-sba)" : "var(--office-muted)" }}>
          {connected ? "● live floor" : "○ connecting…"}
        </div>
      </header>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ background: "var(--office-panel)", border: "1px solid var(--office-border)", borderRadius: 12, padding: 12 }}>
          <OfficeFloor onSelectCeo={() => setChatOpen(true)} floor={floor} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 260 }}>
          <AgentLivePanel floor={floor} />
          <EmailOutbox />
          <button onClick={() => setChatOpen(true)} style={{ background: "var(--office-accent)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            Talk to the CEO
          </button>
          <CommandCenter mandates={mandates} />
        </div>
      </div>

      {chatOpen && <CeoChat onClose={() => setChatOpen(false)} />}
    </div>
  );
}
```

- [ ] **Step 2: Confirm CeoChat posts to /api/ceo/chat**

Open `src/app/admin/office/CeoChat.jsx` and verify the fetch uses `POST /api/ceo/chat` with `{ message }`. No change needed if it already does (it does in the current file).

- [ ] **Step 3: Lint + build**

Run: `cd agency-frontend && npm run lint 2>&1 | tail -20 && npm run build 2>&1 | tail -30`
Expected: lint clean, build succeeds (compiles the office route).

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/office/page.jsx
git commit -m "feat(office): compose floor + panels + outbox into office page"
```

---

## Task 10: Manual verification + push

**Files:** none new; verify `src/app/admin/office/*`.

- [ ] **Step 1: Run dev server and verify in browser**

Run: `cd agency-frontend && npm run dev`
Open `http://localhost:3000/admin/office` (or the deployed Vercel URL).
Check:
- WebSocket connects (badge "● live floor").
- 8 characters render (Michael + 7 employees) seated at desks.
- Click Michael → chat opens; `POST /api/ceo/chat` returns a reply.
- A working agent shows green dot + thought bubble with its task.
- "📬 Outbox (n)" polls `/api/ceo/email/outbox` and lists queued emails.
- Mandates panel shows running mandates.

- [ ] **Step 2: Push to Vercel**

Run: `cd agency-frontend && git push origin master`
Expected: Vercel auto-deploys; visit the live office URL and re-check the items from Step 1.

- [ ] **Step 3: Final commit tag**

No extra commit; confirm `git status` is clean after push.

---

## Self-Review Notes

- Spec coverage: architecture (Task 4/5/9), components (cast→T1, bubble→T2, character→T3, floor→T4, panel→T6, outbox→T7, command→T8, page→T9), state mapping (T3 `setStatus`, T5 normalization), error handling (T5 try/catch, T7 silent retry), testing (T10 manual + lint/build in T4/T6/T7/T8/T9), deploy (T10 push). All covered.
- No placeholders found.
- Type consistency: `CastMember.id` used as `m.id` in T3/T4; `floor` item shape `{ id, agent_type, status, task }` produced in T5 and consumed in T4/T6 — consistent. `Character.setStatus(status, task?)` signature matches T3 definition and T4 call.
