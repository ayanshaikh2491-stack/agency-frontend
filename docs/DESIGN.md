# DESIGN.md — NexusAI Agency

> **Source of truth for how the product looks and feels.** Read this before any UI work.
> All font choices, colors, spacing, and aesthetic direction are defined here.
> Do not deviate without explicit owner approval.
> Last updated: 2026-06-04 (Session 56)
> Created by: gstack `/design-consultation` methodology (Session 56)

---

## Product Context

- **What this is:** Autonomous AI marketing agency platform — owner watches a live control room, clients see their work in a polished portal, 47 AI agents execute in the background.
- **Who it's for:** Solo operator (Ayan Shaikh, owner) running 24/7, and small-business clients (US/IN) consuming the service.
- **Space/industry:** SaaS for AI services — peers are Linear, Vercel, Stripe, Raycast (NOT Mailchimp, NOT HubSpot).
- **Project type:** Web app — owner dashboard (internal) + client portal (external-facing).
- **Memorable thing** *(the one thing someone should remember after first seeing the product)*: **"Honest operational control."** Every screen shows real money, real agents, real activity — no decoration, no fluff, no AI tells.

## Aesthetic Direction

- **Direction:** **Industrial / Utilitarian** with cool precision. Function-first, data-dense, monospace as the personality font.
- **Decoration level:** **Minimal — none.** No gradient blobs, no glassmorphism, no decorative illustrations. The numbers and the code are the design.
- **Mood:** "Engineer's precision tool." Serious, focused, warm-by-absence-of-noise. The product feels like something built by a person who cares about craft.
- **Reference sites:** **Linear** (dark + restrained type), **Vercel** (mono + tabular data), **Raycast** (sidebar + dense list), **Warp** (cool precision). Anti-references: anything with purple gradients, 3-column icon grids, or hero with stock photo.

## Typography

> **Why these fonts:** the user picked "indigo / cool professional, engineer's precision tool." Inter is on the gstack blacklist ("overused by every AI tool"). **Geist** is the Vercel-native replacement (engineer-grade, sans + mono pair, tabular-nums), so we use it. **Geist Mono** is the personality font — it shows up in numbers, codes, IDs, timestamps.

- **Display / Hero:** `Geist` 600 weight, tight tracking (-0.02em). For page titles (H1), large numbers, KPI values.
- **Body:** `Geist` 400 / 500. For paragraphs, labels, descriptions. Line-height 1.5–1.6.
- **UI / Labels:** `Geist` 500. Buttons, table headers, nav items, form labels. Slight uppercase tracking for category labels (12–13px, +0.05em letter-spacing).
- **Data / Tables:** `Geist Mono` 400 / 500. **Personality font.** Every number, ID, timestamp, currency value, code, phone, email. Supports `tabular-nums` — money columns align perfectly.
- **Code:** `Geist Mono` 400. Inline `code` blocks and `<pre>` blocks.
- **Loading:** Geist + Geist Mono from `next/font/google` (Vercel CDN). `display=swap`, `preload: true`.

### Modular Scale (px / rem)

| Role | Size | Line-height | Weight | Tracking | Usage |
|------|------|-------------|--------|----------|-------|
| Display XL | 56 / 3.5rem | 1.05 | 600 | -0.03em | Login hero, signup hero (rare) |
| Display L | 40 / 2.5rem | 1.1 | 600 | -0.02em | Page H1, dashboard overview header |
| H2 | 28 / 1.75rem | 1.2 | 600 | -0.015em | Section titles, modal headers |
| H3 | 20 / 1.25rem | 1.3 | 500 | -0.01em | Card titles, list section headers |
| H4 | 16 / 1rem | 1.4 | 500 | 0 | Sub-section, panel title |
| Body L | 16 / 1rem | 1.6 | 400 | 0 | Paragraphs |
| Body M | 14 / 0.875rem | 1.5 | 400 | 0 | Default body, list rows |
| Body S | 13 / 0.8125rem | 1.4 | 400 | 0 | Helper text, captions |
| Label | 12 / 0.75rem | 1.3 | 500 | +0.02em | Form labels, button text |
| Eyebrow | 11 / 0.6875rem | 1 | 600 | +0.08em uppercase | Category labels (UPPERCASE TRACKED) |
| Mono Body | 13 / 0.8125rem | 1.5 | 400 | 0 | Inline data, codes, IDs |
| Mono Large | 28 / 1.75rem | 1.2 | 500 | -0.01em | KPI numbers (currency, counts) |
| Code | 13 / 0.8125rem | 1.5 | 400 | 0 | `<pre>`, `<code>` |

## Color

> **Why indigo:** the user picked "indigo / cool professional." `#6366F1` (indigo-500) is restrained, technical, and reads as "engineer-grade" without screaming. Not purple — the hue leans blue, not violet. Cool grays for chrome. Accent is rare; data gets the color.

### Surfaces (cool dark)
| Token | Hex | Usage |
|-------|-----|-------|
| `--surface-base` | `#0A0A0B` | App background, deepest layer |
| `--surface-canvas` | `#0A0A0B` | Page background (alias of base) |
| `--surface-1` | `#111114` | Cards, panels, raised surfaces |
| `--surface-2` | `#16161A` | Hovered cards, sub-panels, table header rows |
| `--surface-3` | `#1C1C22` | Active row, focused input, dropdown items |
| `--surface-overlay` | `rgba(10,10,11,0.85)` | Modal backdrop |

### Borders
| Token | Hex | Usage |
|-------|-----|-------|
| `--border-subtle` | `#1F1F23` | Card borders, divider lines |
| `--border-default` | `#2A2A30` | Input borders, table cell dividers |
| `--border-strong` | `#3A3A42` | Focused input, active nav item |
| `--border-accent` | `#6366F1` | Selected/highlighted state |

### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | `#FAFAFA` | Headlines, KPI numbers, primary content |
| `--text-secondary` | `#A8A8B0` | Body, descriptions, helper text |
| `--text-tertiary` | `#71717A` | Labels, captions, placeholders |
| `--text-muted` | `#52525B` | Disabled, very-low-priority text |
| `--text-accent` | `#818CF8` | Links, focus rings, accent text (indigo-400) |
| `--text-on-accent` | `#FFFFFF` | Text on accent background (buttons) |

### Accent (Indigo)
| Token | Hex | Usage |
|-------|-----|-------|
| `--accent` | `#6366F1` | Primary buttons, links, focus rings, brand mark |
| `--accent-hover` | `#4F46E5` | Hover state for accent backgrounds |
| `--accent-soft` | `rgba(99,102,241,0.10)` | Selected row tint, hover tint for accent buttons |
| `--accent-strong` | `#4F46E5` | Active/pressed state |

### Semantic
| Token | Hex | Usage |
|-------|-----|-------|
| `--success` | `#10B981` | Confirmed payments, completed missions, live status |
| `--success-soft` | `rgba(16,185,129,0.10)` | Success toast background |
| `--warning` | `#F59E0B` | Pending payments, retry-needed, in-progress |
| `--warning-soft` | `rgba(245,158,11,0.10)` | Warning toast background |
| `--error` | `#EF4444` | Failed payments, errors, destructive actions |
| `--error-soft` | `rgba(239,68,68,0.10)` | Error toast background |
| `--info` | `#3B82F6` | Informational, links in body text |

### Data palette (for charts, status indicators)
| Token | Hex | Usage |
|-------|-----|-------|
| `--data-1` | `#6366F1` | Primary metric (money in) |
| `--data-2` | `#10B981` | Secondary (leads) |
| `--data-3` | `#F59E0B` | Tertiary (engagement) |
| `--data-4` | `#EC4899` | Quaternary (alerts) |
| `--data-5` | `#8B5CF6` | Quinary (agent activity) |

## Spacing

- **Base unit:** 4px
- **Density:** Comfortable. Not Bloomberg Terminal cramped. Not marketing-site spacious.
- **Scale:** 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128

| Token | px | Usage |
|-------|-----|-------|
| `--space-0` | 0 | Reset |
| `--space-1` | 4 | Tight (between related label and value) |
| `--space-2` | 8 | Compact (icon + label, button padding-y) |
| `--space-3` | 12 | Default (form field gap, list item gap) |
| `--space-4` | 16 | Comfortable (card padding, section gap) |
| `--space-5` | 20 | Panel padding |
| `--space-6` | 24 | Card padding (large), section gap (large) |
| `--space-8` | 32 | Major section gap |
| `--space-10` | 40 | Page top/bottom on dashboard |
| `--space-12` | 48 | Page top/bottom on auth pages |
| `--space-16` | 64 | Hero sections (rare) |
| `--space-20` | 80 | (reserved) |
| `--space-24` | 96 | (reserved) |

## Layout

- **Approach:** Grid-disciplined for dashboard, slightly more generous for auth pages.
- **Grid:** 12 columns at `lg` (≥1024px), 6 columns at `md` (≥768px), 4 columns at `sm` (≥640px), 1 column at `<sm`.
- **Gutter:** 24px (`--space-6`).
- **Max content width:** 1440px (dashboard), 480px (login/signup), 720px (modal, form).
- **Sidebar:** 240px fixed on `lg`, collapsible to 64px (icons only) on `md`, off-canvas drawer on `<md`.
- **Top bar:** 56px fixed.
- **Border radius:**
  - Cards / panels: 8px
  - Buttons / inputs: 6px
  - Badges / pills / chips: 9999px (full)
  - Avatars: full
  - Modals: 12px
  - Toasts: 8px

## Motion

> **Why minimal:** the user said "industrial / utilitarian." Motion serves comprehension, not delight. The live data IS the motion (10s polling updates feel like motion).

- **Approach:** Minimal-functional. Only transitions that aid comprehension.
- **Easing:**
  - Enter: `cubic-bezier(0.16, 1, 0.3, 1)` (smooth, decelerating)
  - Exit: `cubic-bezier(0.4, 0, 1, 1)` (accelerating)
  - Move: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out)
- **Duration:**
  - Micro: 80ms (hover, focus ring, button press)
  - Short: 150ms (small element changes)
  - Medium: 250ms (modal open, sidebar slide)
  - Long: 400ms (page transition, large panel)
- **What animates:**
  - Hover: 80ms (background-color, border-color)
  - Modal open: 200ms (scale 0.98 → 1, fade in)
  - Toast: 200ms slide-in from bottom-right, 200ms fade-out
  - Button press: 50ms (scale 0.98)
  - Live data "Updated 3s ago" timestamp: 80ms opacity flicker
- **What does NOT animate:**
  - Page loads (no skeletons, no fade-in)
  - Numbers counting up (snap to value)
  - Charts (no entrance animation)
  - List items (no stagger)

## Component Library (concrete rules)

### Button
- **Primary:** bg `--accent`, text `--text-on-accent`, 6px radius, 8/16 padding, font 14/500. Hover: `--accent-hover` in 80ms. Active: scale(0.98) in 50ms. Disabled: 0.5 opacity.
- **Secondary:** bg transparent, border `--border-default`, text `--text-primary`. Hover: bg `--surface-2`.
- **Ghost:** no border, text `--text-secondary`. Hover: text `--text-primary`, bg `--surface-2`.
- **Destructive:** bg `--error`, text white. Same shape as Primary.
- **Sizes:** sm (28px height), md (36px, default), lg (44px).
- **Icon-only:** square, 36x36, icon 16px.

### Input
- bg `--surface-1`, border 1px `--border-default`, 6px radius, 10/12 padding, font 14/400.
- Placeholder: `--text-tertiary`.
- Focus: border `--border-accent`, ring 2px `--accent-soft`.
- Error: border `--error`, error text below in `--error` font 12.
- Disabled: bg `--surface-2`, cursor not-allowed.

### Card
- bg `--surface-1`, border 1px `--border-subtle`, 8px radius, 20px padding.
- Hover (when interactive): bg `--surface-2`, border `--border-default` in 80ms.

### Badge
- 9999px radius, 4/8 padding, font 11/600 uppercase +0.05em tracking.
- Variants: neutral (`--surface-2` bg, `--text-secondary` text), success (`--success-soft` + `--success`), warning, error, info, accent (`--accent-soft` + `--text-accent`).

### Table
- Header row: bg `--surface-2`, font 11/600 uppercase +0.05em tracking, `--text-tertiary` color.
- Body row: bg transparent, hover `--surface-2`, 12/16 padding, border-bottom 1px `--border-subtle`.
- Selected row: bg `--accent-soft`.
- Cell text: 14/400, body. Numeric / data cells: `Geist Mono` 13/400, right-aligned, `tabular-nums`.
- No zebra striping (not needed with row hover).

### Modal
- Backdrop: `--surface-overlay` 0.85.
- Panel: bg `--surface-1`, border 1px `--border-subtle`, 12px radius, 24px padding, max-width 480/640/720 by use case.
- Header: H2 (20/600) + close icon (24x24, ghost button).
- Footer: right-aligned button group, gap 8px.

### Sidebar
- Fixed left, 240px wide, bg `--surface-1`, border-right 1px `--border-subtle`.
- Sections: Eyebrow label (11/600 uppercase) + nav items.
- Nav item: 10/12 padding, 6px radius, font 14/500, `--text-secondary`. Hover: bg `--surface-2`, `--text-primary`. Active: bg `--accent-soft`, `--text-accent`, left border 2px `--accent`.
- Collapse toggle at bottom.

### Toast
- Bottom-right, fixed, 8px radius, bg `--surface-2`, border 1px `--border-default`, 16px padding, 360px max-width.
- Icon + message (14/500) + optional action.
- 4 variants: success, warning, error, info (left border 3px in semantic color).
- Auto-dismiss: 4s for success/info, 8s for warning, manual dismiss for error.

### Chat Bubble (CEO Agent)
- **User message:** right-aligned, bg `--accent`, text `--text-on-accent`, 12px radius (top-right corner 4px — slight asymmetry for chat feel), 12/16 padding, max-width 70%.
- **Agent message:** left-aligned, bg `--surface-2`, text `--text-primary`, 12px radius (top-left corner 4px), 12/16 padding, max-width 80%.
- **Metadata line:** below bubble, font 11, `--text-tertiary`, mono for timestamp.
- **Code block inside:** bg `--surface-base`, border 1px `--border-subtle`, mono font, syntax highlighted (dracula-ish palette but cooler).
- **Action row below agent message:** Copy (icon button), Regenerate (icon button), both 28x28 ghost.

## Anti-Slop Checklist (NEVER include)

> This list is non-negotiable. Every PR that touches UI must pass this gate.

- [ ] No purple/violet gradients as default accent (we use flat indigo)
- [ ] No 3-column feature grid with icons in colored circles
- [ ] No centered-everything with uniform spacing
- [ ] No uniform 16px border-radius on all elements
- [ ] No gradient buttons as the primary CTA pattern
- [ ] No generic stock-photo hero sections
- [ ] No `system-ui` / `-apple-system` as primary display or body font
- [ ] No "Built for X" / "Designed for Y" / "Empower your Y" marketing copy
- [ ] No "Let's get started!" / "Welcome aboard!" / generic encouragement
- [ ] No "delve", "crucial", "robust", "comprehensive", "nuanced", "multifaceted", "furthermore", "moreover", "pivotal", "leverage", "synergy" in any user-facing copy
- [ ] No AI tells in chat agent responses (em dashes, sycophantic openers, "I'd be happy to help")
- [ ] No confetti or celebration animation on routine actions (only on signup completion)
- [ ] No fake "balance" or "earnings" numbers (real money rule from PRD)
- [ ] No emoji in UI labels (status indicators can use semantic color, not emoji)
- [ ] No drop shadows on cards (use border + bg to layer; shadows feel AI-template)

## Coherence Rules

1. **Density matches function.** Dashboard pages are dense (data tables, KPIs). Auth pages are spacious (one task, big type). Don't mix.
2. **Color is earned.** Neutral surfaces are the rule. Accent appears only on: primary buttons, links, focus rings, the brand mark, and the active nav item. Data colors (chart palette) appear only in charts and status indicators.
3. **Type is consistent.** Geist for prose, Geist Mono for data. Never mix within a single line of text.
4. **Spacing follows rhythm.** 4/8/12/16/24 — use these 5 values for 90% of gaps. Bigger gaps only for major section breaks.
5. **Motion is fast.** Nothing on this app should take more than 400ms to appear. If it does, show instant data + a subtle "loading" indicator.
6. **Empty states teach.** An empty state should explain WHY it's empty and WHAT will fill it. Not "Nothing to see here."

## Implementation Notes

- **CSS variables** in `globals.css` (override the `tailwind.config.js` extended colors with CSS vars for runtime theme-ability, even though we ship dark-only in v1).
- **Tailwind config** gets updated to use these tokens. Existing `brand.*` palette (orange/coral) is deprecated; the new indigo palette replaces it.
- **Font loading** via `next/font/google` in `app/layout.js`:
  ```js
  import { Geist, Geist_Mono } from 'next/font/google';
  const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
  const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });
  ```
- **Material Symbols** for icons (already loaded). Outlined variant, 20px default, 1.75 weight.
- **No icon library** beyond Material Symbols. No Lucide, no Heroicons — one source of truth.

## Reference Sites (for visual grounding)

- **Linear** — https://linear.app (dark, dense, type-first, mono numbers)
- **Vercel** — https://vercel.com/dashboard (cool grays, tabular data, monospace identity)
- **Raycast Store** — https://raycast.com/store (sidebar + dense list + image-led cards)
- **Warp** — https://warp.dev (cool precision, mono accents, restrained accent)
- **Anti-references** (do NOT imitate): Mailchimp, HubSpot, Intercom dashboard, anything with purple gradient hero, anything with 3-column "feature" grid

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-04 | Indigo over orange/coral | Owner picked "cool professional, engineer precision"; existing warm palette felt AI-template-ish |
| 2026-06-04 | Geist over Inter | Inter is on the gstack blacklist ("overused by every AI tool"); Geist is Vercel-native, same engineer aesthetic |
| 2026-06-04 | Mono for data, not for prose | Personality font should appear in numbers/codes, not body — feels considered, not decorative |
| 2026-06-04 | No grain texture (vs gstack default) | gstack has grain (3% noise) for warmth. Our indigo-cool direction doesn't need it; grain would add unwanted warmth. |
| 2026-06-04 | No shadows, only borders | Borders + bg-tinting = cleaner layering. Shadows feel like AI template defaults. |
| 2026-06-04 | Polling 10s, not WebSocket | Spec calls for "honest operational control" — instant data. 10s polling is fast enough. No fake "real-time" feel. |
| 2026-06-04 | Single source: Material Symbols | No mixing icon libraries. Outlined, 1.75 weight, 20px. |
| 2026-06-04 | Dark mode only (v1) | No light mode complexity. Saves 30% of design decisions. Re-evaluate in v2. |
