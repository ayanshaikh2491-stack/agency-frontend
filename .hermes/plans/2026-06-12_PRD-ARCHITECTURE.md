# 🏗️ Agency Frontend — PRD & 6 Structural Engineering Specs

> **Based on:** Paperclip AI open-source (github.com/paperclipai/paperclip) — exact source extraction
> **Date:** 2026-06-12
> **Status:** 📋 Draft for Structural Review — NO code until approved

---

## 📐 PAPERCLIP SOURCE MAP (Doc 6 Embedded)

Original Paperclip repo layout blocks mapped for reverse-engineering:

| Paperclip File | Our File | Key UI Block |
|---|---|---|
| `ui/src/index.css` | `src/app/globals.css` | CSS variables, dark theme, scrollbars, animations |
| `ui/src/components/SidebarShell.tsx` | `src/app/admin/layout.js` | 3-column shell: spacer+panel, collapsed/peeking, drag resize |
| `ui/src/components/Sidebar.tsx` | `src/app/admin/layout.js` | Nav items, sections, inbox badge, live run count |
| `ui/src/components/SidebarNavItem.tsx` | `src/app/admin/layout.js` | 13px nav items, active/inactive states, dot badges |
| `ui/src/components/SidebarSection.tsx` | `src/app/admin/layout.js` | 10px uppercase mono section headers, collapsible |
| `ui/src/components/SidebarCompanyMenu.tsx` | `src/app/admin/layout.js` | Company dropdown, drag-reorder, invite/settings/signout |
| `ui/src/components/SidebarAgents.tsx` | `src/app/admin/layout.js` | Agent list with status dots |
| `ui/src/components/CompanyContext.tsx` | `src/lib/client-context.js` | Company selection, localStorage persistence |
| `ui/src/components/BreadcrumbBar.tsx` | `src/app/admin/layout.js` | Breadcrumb trail, plugin toolbar slots |
| `ui/src/components/Layout.tsx` | `src/app/admin/layout.js` | Root layout orchestrator, sidebar/panel/dialogs |
| `ui/src/components/MetricCard.tsx` | Dashboard components | Icon, value, label card pattern |
| `ui/src/components/ActiveAgentsPanel.tsx` | Dashboard | Live run cards with mini logs |
| `ui/src/pages/Dashboard.tsx` | `src/app/admin/dashboard/page.js` | Metric grid + agents + activity + tasks |
| `ui/src/pages/Issues.tsx` | `src/app/admin/dashboard/tickets/` | Infinite scroll issue list, filters, live runs |
| `ui/src/pages/OrgChart.tsx` | `src/app/admin/dashboard/org/` | SVG org chart, pan/zoom, agent cards |
| `ui/src/api/dashboard.ts` | Backend | `GET /companies/:id/dashboard` |
| `ui/src/api/issues.ts` | Backend | Full CRUD + comments + labels + tree holds |
| `ui/src/api/companies.ts` | Backend | Company CRUD + settings |

**Paperclip design constants (EXACT):**
| Token | Value | Source |
|---|---|---|
| `--radius` | `0` | `index.css` |
| `--radius-lg` | `0px` | `index.css` |
| Sidebar expanded | `240px` (default) | `SidebarShell.tsx` |
| Sidebar rail | `64px` | `SidebarShell.tsx` |
| Nav font | `13px` / medium | `SidebarNavItem.tsx` |
| Section header font | `10px` / uppercase mono | `SidebarSection.tsx` |
| Company button height | `h-9` (36px) | `SidebarCompanyMenu.tsx` |
| Gap between nav icon + label | `gap-2.5` | `SidebarNavItem.tsx` |
| MetricCard value | `text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums` | `MetricCard.tsx` |
| Org card | `200×100px` | `OrgChart.tsx` |

---

# PART 1: SYSTEM PRD

## 1. Product Vision

An **internal multi-tenant agency admin panel** where Ayan manages his autonomous AI marketing engines (Pipeline, CashClaw, ClawWork) through a chat-first interface modeled exactly on Paperclip's architecture.

### 1.1 Scope
- **Internal only** — no client-facing features
- **Multi-tenant** via company/workspace switching (Acme Inc, Ayan Agency, CashClaw, ClawWork)
- **Autonomous routing**: CEO orchestrator → Worker agents (intake-researcher, content-creator, seo, ads, analytics, sales, client-success, review-qc)

### 1.2 Data Isolation

```
client_id (companyId) —— filters every query
       │
       ├── agents    WHERE company_id = client_id
       ├── issues    WHERE company_id = client_id
       ├── projects  WHERE company_id = client_id
       ├── budgets   WHERE company_id = client_id
       └── activity  WHERE company_id = client_id
```

Switching company in the sidebar **refetches all scoped queries** — no stale cross-tenant data.

### 1.3 Agent Hierarchy

```
CEO Orchestrator
  └── CTO Orchestrator (infra/maintenance)
        ├── Intake-Researcher
        ├── Content-Creator
        ├── SEO Specialist
        ├── Ads Manager
        ├── Analytics
        ├── Sales Closer
        ├── Client-Success
        └── Review-QC
```

CEO routes by keyword: `lead→intake-researcher`, `content→content-creator`, etc.

---

# DOC 1: MASTER LAYER ARCHITECTURE SPEC

## Strict 3-Column Viewport Layout

### Layout Equation (immutable)

```
h-screen overflow-hidden
├── [Sidebar]  w-60 flex-shrink-0    (240px expanded / 64px rail)
├── [Main]     flex-1 min-w-0         (overflow-y-auto)
│   ├── [BreadcrumbBar]  h-12
│   └── [Page Content]   flex-1
└── [PropertiesPanel]    w-80 (optional, right side)
```

### Rules

1. **`h-screen overflow-hidden`** on the root `<body>` — NO scroll on the body
2. **Sidebar**: always `flex-shrink-0`, never collapses below content area
3. **Main area**: `flex-1 min-w-0 overflow-y-auto` — scrolls independently
4. **Never use `min-h-screen`** — always `h-screen`
5. **Column heights** — all three columns are `h-screen` siblings
6. **No nesting of `<body>` scroll** — only the main content panel scrolls
7. **Rail state**: sidebar snaps to 64px, icons stay pixel-identical (PAP-10676 constraint)

### Responsive Breakpoints

| Breakpoint | Sidebar | Layout |
|---|---|---|
| `≥1280px` (xl) | Expanded 240px | 3-column grid |
| `≥1024px` (lg) | Rail 64px | 3-column |
| `≥768px` (md) | Rail 64px | 2-column (no properties) |
| `<768px` | Hidden (mobile menu) | Single column |

---

# DOC 2: REACT STATE & CONTEXT SPEC

## CompanyContext (from Paperclip `ui/src/context/CompanyContext.tsx`)

### State Shape

```javascript
{
  companies: Company[],                    // All companies
  selectedCompanyId: string | null,        // Current active
  selectedCompany: Company | null,         // Derived lookup
  selectionSource: 'bootstrap' | 'manual',
  loading: boolean,
  error: Error | null,
  setSelectedCompanyId: (id, options?) => void,
  reloadCompanies: () => Promise<void>,
  createCompany: (data) => Promise<Company>,
}
```

### Persistence

```javascript
const STORAGE_KEY = 'agency.selectedCompanyId';

// On mount: read from localStorage
// On change: write to localStorage
// Bootstrap priority:
//   1. URL route prefix match
//   2. localStorage stored ID
//   3. First company in sidebar list
//   4. null (empty state)
```

### Stale Component Flush

When `setSelectedCompanyId(newId)` is called:
1. Update `selectedCompanyId` state → triggers re-render
2. Persist to `localStorage`
3. All `useQuery` hooks with `queryKey` scoped to `selectedCompanyId` auto-refetch
4. All `useEffect` with `[selectedCompanyId]` dependency re-run
5. Activity animation timers reset (hydratedActivityRef = false)

### React Query Keys

```javascript
const queryKeys = {
  companies: {
    all: ['companies'],
    detail: (id) => ['companies', id],
  },
  dashboard: (companyId) => ['dashboard', companyId],
  agents: {
    list: (companyId) => ['agents', companyId],
    detail: (id) => ['agents', id],
  },
  issues: {
    list: (companyId, filters) => ['issues', companyId, 'list', filters],
    detail: (id) => ['issues', id],
  },
  liveRuns: (companyId) => ['liveRuns', companyId],
  activity: (companyId) => ['activity', companyId],
  orgTree: (companyId) => ['orgTree', companyId],
};
```

---

# DOC 3: THE TICKET HUB & STREAMING SPEC

## 2-Column Ticket View Layout

```
h-full overflow-hidden flex
├── [Issue List - Left]  w-[400px] flex-shrink-0 overflow-y-auto
│   ├── SearchBar (q param → URL)
│   ├── FilterBar (status, agent, project, workspace)
│   ├── IssuesList (infinite scroll, 500/page)
│   │   ├── IssueRow (status icon, title, identifier, assignee, time)
│   │   │   └── "Live" dot indicator (from heartbeatsApi)
│   │   └── LoadMore (IntersectionObserver)
│   └── IssueCount badge
│
└── [Issue Detail - Right] flex-1 overflow-y-auto
    ├── Header (title, status, project, identifier)
    ├── Chat Thread
    │   ├── User messages
    │   ├── Agent responses
    │   │   └── <think> blocks → collapsible (chevron toggle)
    │   │       └── MarkdownBody render (grey bg, monospace)
    │   └── System notices (recovery, handoff, retry)
    ├── Output Section (files, artifacts, logs)
    └── [Bottom Terminal] h-[200px] flex-shrink-0
        ├── bg-[#0B0F17] (Paperclip terminal bg)
        ├── font-mono text-[12px]
        ├── Real-time log streaming (15s poll)
        └── status bar (running/queued/done/error)
```

### `<think>` Collapsible Markdown Spec

```jsx
// Use shadcn Collapsible component
<Collapsible>
  <CollapsibleTrigger className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
    <ChevronRight className={cn("h-3 w-3 transition-transform", open && "rotate-90")} />
    <span>Chain of thought</span>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div className="rounded-md bg-muted/50 p-3 text-[13px] leading-relaxed font-mono">
      <MarkdownBody content={thinkContent} />
    </div>
  </CollapsibleContent>
</Collapsible>
```

### Streaming Log Terminal

```
┌──────────────────────────────────────────────┐
│ ⚡ Live Run · agent-name · 0s ago           │
├──────────────────────────────────────────────┤
│ [12:34:01] ▶ Starting task: research lead    │
│ [12:34:02]   → Searching Crunchbase          │
│ [12:34:05]   ✓ Found 3 matching contacts     │
│ [12:34:06] ▶ Drafting outreach sequence      │
│ [12:34:08]   → Generating email variant A    │
│ ...                                          │
├──────────────────────────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ Status: ● Running · 23s                      │
└──────────────────────────────────────────────┘
```

- **Polling**: every 15s (`DASHBOARD_LOG_POLL_INTERVAL_MS = 15000`)
- **Read limit**: 64KB (`DASHBOARD_LOG_READ_LIMIT_BYTES = 64000`)
- **Max chunks**: 40 per run (`DASHBOARD_MAX_CHUNKS_PER_RUN = 40`)

---

# DOC 4: ORG CHART NODE ENGINE SPEC

## Interactive Visual Hierarchy

### Layout Constants (from Paperclip `OrgChart.tsx`)

```javascript
const CARD_W = 200;        // Card width in px
const CARD_H = 100;        // Card height in px
const GAP_X = 32;          // Horizontal gap between siblings
const GAP_Y = 80;          // Vertical gap between levels
const PADDING = 60;        // Padding around the chart
const MIN_ZOOM = 0.2;      // Min zoom level
const MAX_ZOOM = 2.0;      // Max zoom level
```

### Layout Algorithm

```
subtreeWidth(node):
  if no children → CARD_W
  else → max(CARD_W, sum(subtreeWidth(child)) + gaps)

layoutTree(node, x, y):
  totalW = subtreeWidth(node)
  cardX = x + (totalW - CARD_W) / 2

  for each child:
    cw = subtreeWidth(child)
    layoutTree(child, cx, y + CARD_H + GAP_Y)
    cx += cw + GAP_X

  return LayoutNode(x: cardX, y, children: ...)
```

### Node Hierarchy

```
CEO Card (top center)
├── CTO Card (level 2)
│   ├── Intake-Researcher  [worker]
│   ├── Content-Creator    [worker]
│   ├── SEO Specialist     [worker]
│   ├── Ads Manager        [worker]
│   ├── Analytics          [worker]
│   ├── Sales Closer       [worker]
│   ├── Client-Success     [worker]
│   └── Review-QC          [worker]
```

### Interaction

| Gesture | Action |
|---|---|
| Mouse drag (bg) | Pan chart |
| Scroll wheel | Zoom toward cursor (1.1× / 0.9×) |
| Pinch (touch) | Zoom toward center |
| Click card | Navigate to agent detail |
| Double-tap | Fit to screen |

### Agent Card Layout

```
┌──────────────────────┐
│ [icon] ● status      │  status colors:
│ Name                 │  ● running  #22d3ee (cyan)
│ Title/Role           │  ● active   #4ade80 (green)
│ Adapter: hermes      │  ● paused   #facc15 (yellow)
│ 3 capabilities       │  ● error    #f87171 (red)
└──────────────────────┘  ● idle     #a3a3a3 (gray)
```

### Live Toggle States

```
┌─────────────┬─────────────────┬─────────────┐
│  State      │  Dot Color      │  CSS Class  │
├─────────────┼─────────────────┼─────────────┤
│  Running    │  cyan (#22d3ee) │  .running   │
│  Active     │  green (#4ade80)│  .active    │
│  Paused     │  yellow (#facc15)│  .paused   │
│  Error      │  red (#f87171)  │  .error     │
│  Idle       │  gray (#a3a3a3) │  .idle      │
└─────────────┴─────────────────┴─────────────┘
```

---

# DOC 5: POSTGRESQL SCHEMA MAPPING

## 10-Table Relational Schema (Cross-Tenant)

All tables include `company_id` for RLS (Row-Level Security). Every query MUST include `WHERE company_id = :client_id`.

### Table 1: `companies`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `name` | VARCHAR(255) | Company/workspace name |
| `slug` | VARCHAR(100) | URL-friendly prefix |
| `status` | ENUM('active','archived') | Sidebar visibility |
| `budget_monthly_cents` | BIGINT | Monthly budget in cents |
| `issue_prefix` | VARCHAR(10) | e.g., 'ACME', 'AYAN' |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### Table 2: `agents`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `company_id` | UUID | FK → companies |
| `name` | VARCHAR(255) | |
| `role` | ENUM('ceo','cto','worker') | |
| `status` | ENUM('running','active','paused','error','idle') | |
| `adapter_type` | VARCHAR(50) | 'hermes', 'claude', 'gpt-4', etc. |
| `icon` | VARCHAR(50) | Lucide icon name |
| `capabilities` | TEXT[] | Array of capability strings |
| `parent_agent_id` | UUID | Nullable FK → agents (hierarchy) |
| `last_heartbeat_at` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### Table 3: `issues` (Tasks/Tickets)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `company_id` | UUID | FK → companies |
| `parent_id` | UUID | Nullable FK → issues (sub-issues) |
| `project_id` | UUID | Nullable FK → projects |
| `assignee_agent_id` | UUID | Nullable FK → agents |
| `identifier` | VARCHAR(20) | e.g., 'AYAN-42' |
| `title` | TEXT | |
| `status` | ENUM('todo','in_progress','in_review','done','blocked','cancelled') | |
| `priority` | ENUM('none','low','medium','high','critical') | |
| `origin_kind` | VARCHAR(50) | 'lead', 'content', 'manual', etc. |
| `attention` | ENUM('none','blocked','needs_review') | |
| `body` | TEXT | Markdown |
| `last_read_at` | TIMESTAMPTZ | For inbox tracking |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### Table 4: `issue_comments`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `issue_id` | UUID | FK → issues |
| `agent_id` | UUID | Nullable FK → agents |
| `user_id` | UUID | Nullable FK → users |
| `body` | TEXT | Markdown |
| `interrupt` | BOOLEAN | Triggers agent interruption |
| `created_at` | TIMESTAMPTZ | |

### Table 5: `issue_labels`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `company_id` | UUID | FK → companies |
| `name` | VARCHAR(100) | |
| `color` | VARCHAR(7) | Hex color |

### Table 6: `issue_label_assignments`

| Column | Type | Notes |
|---|---|---|
| `issue_id` | UUID | FK → issues |
| `label_id` | UUID | FK → issue_labels |
| PK: (`issue_id`, `label_id`) | | Composite key |

### Table 7: `heartbeats` (Live Runs)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `issue_id` | UUID | FK → issues |
| `agent_id` | UUID | FK → agents |
| `company_id` | UUID | FK → companies |
| `status` | ENUM('queued','running','completed','failed') | |
| `transcript` | JSONB | Array of transcript entries |
| `output` | TEXT | Log output |
| `started_at` | TIMESTAMPTZ | |
| `finished_at` | TIMESTAMPTZ | Nullable |
| `created_at` | TIMESTAMPTZ | |

### Table 8: `activity_log`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `company_id` | UUID | FK → companies |
| `agent_id` | UUID | Nullable FK → agents |
| `issue_id` | UUID | Nullable FK → issues |
| `action` | VARCHAR(100) | e.g., 'issue_created', 'agent_started' |
| `metadata` | JSONB | Flexible payload |
| `created_at` | TIMESTAMPTZ | |

### Table 9: `budgets`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `company_id` | UUID | FK → companies |
| `monthly_cents` | BIGINT | |
| `spent_cents` | BIGINT | Current month spend |
| `active_incidents` | INTEGER | |
| `paused_agents` | INTEGER | |
| `pending_approvals` | INTEGER | |
| `reset_at` | TIMESTAMPTZ | Monthly reset timestamp |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### Table 10: `projects`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `company_id` | UUID | FK → companies |
| `name` | VARCHAR(255) | |
| `description` | TEXT | |
| `status` | ENUM('active','archived') | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### RLS Policy Template

```sql
-- Every table gets this policy
CREATE POLICY tenant_isolation ON <table>
  FOR ALL
  USING (company_id = current_setting('app.current_company_id')::UUID);
```

---

# PART 2: IMPLEMENTATION ORDER

## Phase 1: Layout & Routing (Foundation)

- [ ] Fix `globals.css` — Paperclip exact: `--radius: 0`, OKLCH colors, dark scrollbars
- [ ] Rewrite `layout.js` — 3-column shell: SidebarShell (resizable, collapsible, peeking)
- [ ] CompanyContext from `client-context.js` — localStorage persistence, bootstrap logic
- [ ] BreadcrumbBar — context-driven breadcrumbs with plugin slots
- [ ] Mobile bottom nav / responsive breakpoints

## Phase 2: Dashboard

- [ ] MetricCard grid (4 cols xl, 2 cols default)
- [ ] ActiveAgentsPanel (live run cards, mini transcript, polling)
- [ ] Recent Activity feed (ActivityRow with animation)
- [ ] Budget incident banner
- [ ] Empty states (no company, no agents)

## Phase 3: Ticket Hub (Issues Page)

- [ ] 2-column layout (list + detail)
- [ ] Issue list with infinite scroll (500/page)
- [ ] Search (`q` param in URL)
- [ ] Filters (status, agent, project, workspace)
- [ ] Issue detail with chat thread
- [ ] `<think>` collapsible blocks
- [ ] Bottom terminal window (log streaming, 15s poll)
- [ ] Issue creation dialog

## Phase 4: Org Chart

- [ ] SVG edge rendering (cubic bezier curves)
- [ ] Pan/zoom (mouse wheel toward cursor)
- [ ] Touch pinch support
- [ ] Agent cards with status dots
- [ ] Fit-to-screen button

## Phase 5: Backend Services

- [ ] Company CRUD API
- [ ] Agent CRUD + heartbeat API
- [ ] Issue CRUD API (comments, labels, tree holds, recovery)
- [ ] Dashboard summary endpoint
- [ ] Activity log endpoint
- [ ] PostgreSQL schema migration with RLS

## Phase 6: CEO Orchestrator Integration

- [ ] `/api/ceo/chat` endpoint (keyword routing)
- [ ] Agent status proxy (heartbeat polling)
- [ ] Live run transcript streaming

---

## ⚠️ Structural Constraints (DO NOT BREAK)

1. **`h-screen overflow-hidden`** on body — violations cause layout collapse
2. **Sidebar rail = 64px** — no other value; icons stay pixel-identical
3. **`company_id` on every query** — cross-contamination breaks isolation
4. **No `<Link>` from Next.js** — use `<NavLink>` from custom router or Next `<Link>` with `className` function
5. **No rounded corners** — `--radius: 0` globally
6. **No blue-gray palette** — pure neutral grays only (`#1a1b1d` → `#e8e9eb`)
7. **Chat-first interface** — NO "Run" buttons; select agent → type → agent responds
8. **Internal-only** — NO client-facing features

---

📋 **Ready for structural review.** Bol — sahi hai ya kuch change chahiye? Approval ke baad Phase 1 implement karunga phase-by-phase, code nahi likhunga jab tak tum "hao" na bolo.
