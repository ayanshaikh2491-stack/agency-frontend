# IMPLEMENTATION_PLAN.md — NexusAI Agency

> **Source of truth for what to build, in what order.** Read this before starting any phase.
> Last updated: 2026-06-04 (Session 56)

---

## Phased Build Sequence

The build is broken into 9 phases. Each phase has a clear deliverable, and later phases depend on earlier ones being complete and verified.

---

## Phase 0 — Foundation (DONE in Session 56)
**Deliverable:** PRD, TRD, App Flow, DESIGN.md, BACKEND_SCHEMA.md, this file.

**Status:** ✅ All 6 docs created in Session 56.

**Why first:** AI cannot build a great app from a vague idea. These 6 docs are non-negotiable context for any subsequent work.

**Verify:** All 6 files exist in `agency-frontend/docs/`, each reviewed against the PDF's required sections.

---

## Phase 1 — Design System Implementation (Session 56, in progress)
**Deliverable:** Working design tokens in `globals.css` + `tailwind.config.js`, font loading in `layout.js`, 1 polished example page.

**Tasks:**
1. **Update `tailwind.config.js`:** replace `brand.*` palette with indigo palette from DESIGN.md. Add `fontFamily.geist` and `fontFamily['geist-mono']`.
2. **Update `src/app/globals.css`:** add CSS variables for all DESIGN.md tokens (surfaces, borders, text, accent, semantic, data). Apply `font-feature-settings: 'cv11', 'ss01', 'ss03'` for Geist stylistic alternates.
3. **Update `src/app/layout.js`:** load Geist + Geist Mono via `next/font/google`, set on `<html>` and `<body>`.
4. **Add `src/components/ui/`** with: `Button.js`, `Input.js`, `Card.js`, `Badge.js`, `Table.js`, `Modal.js`, `Toast.js`, `Sidebar.js` (one file per component, each a thin wrapper around the DESIGN.md rules).
5. **Pick 1 page to demo the system:** `src/app/login/page.js` (most visible, low risk).

**Verify:**
- Login page renders with new typography, colors, spacing
- No old `brand-orange` colors anywhere
- Lighthouse: no font flash, no CLS, fonts load in <200ms
- Mobile (375px) + desktop (1440px) both look intentional

**Estimated effort:** ~2-3 hours (component library is the bulk).

---

## Phase 2 — Apply Design to Dashboard Core Pages
**Deliverable:** 5 owner dashboard pages redesigned per DESIGN.md.

**Tasks:**
1. `/dashboard` — overview with KPI cards, recent activity, agent status
2. `/dashboard/ceo` — premium chat using new Chat Bubble component
3. `/dashboard/leads` — lead pipeline table with filter chips, status badges
4. `/dashboard/clients` — client list with status badges, plan cards
5. `/dashboard/clients/[id]` — client detail with sidebar layout

**Verify:**
- Each page passes the Anti-Slop Checklist in DESIGN.md
- Geist Mono shows up in all currency, count, timestamp, ID fields
- Empty states follow the "explain WHY + show next step" rule
- All hover/focus states use the new accent + timings

**Estimated effort:** ~4-5 hours (most pages need real data wiring polish + visual rework).

---

## Phase 3 — Apply Design to Client Portal
**Deliverable:** 4 client-facing pages polished to the same standard.

**Tasks:**
1. `/client` — overview (brand summary, this week's content, recent leads)
2. `/client/brand` — brand voice display + editable settings
3. `/client/calendar` — scheduled content calendar
4. `/client/payments` — billing page with plan card, history, pay modal

**Verify:**
- Client sees ONLY their data (RLS enforced)
- No owner-internal labels leak into client UI
- Stripe / UPI pay flow works end-to-end

**Estimated effort:** ~3 hours.

---

## Phase 4 — CashClaw + ClawWork Boards
**Deliverable:** Mission board UIs match the new design.

**Tasks:**
1. `/dashboard/cashclaw` — mission list with filter, sort, detail modal
2. `/dashboard/clawwork` — same pattern
3. "Mark as Paid" modal — uses new Modal + Input + Button components
4. Mission detail — full result view, code blocks highlighted, costs shown

**Verify:**
- 10s polling works with new component patterns
- Toast notifications for status changes use new Toast component
- Mission status badges use semantic colors correctly

**Estimated effort:** ~2 hours.

---

## Phase 5 — Onboarding Wizard Polish
**Deliverable:** 4-step + confirm wizard redesigned.

**Tasks:**
1. `/client/onboarding` — step indicators using new design tokens
2. Progress bar with mono font
3. Step 5 review with edit-jump-back
4. Success screen with confetti (only here — anti-slop rule)
5. localStorage resume on refresh

**Verify:**
- Refresh on any step resumes correctly
- Validation gates per step (can't proceed without required fields)
- Confetti only fires on final confirm, not on every step

**Estimated effort:** ~1.5 hours.

---

## Phase 6 — Polish + QA
**Deliverable:** Visual polish, mobile responsive, accessibility.

**Tasks:**
1. **Mobile audit:** every page at 375px, 414px, 768px. Fix breakpoints where layout breaks.
2. **Accessibility:** keyboard nav, focus rings (must be visible — 2px accent-soft ring), color contrast (WCAG AA minimum), aria labels on icon-only buttons.
3. **Empty states:** audit every list page for the "explain WHY + show next step" pattern.
4. **Loading states:** all async actions show feedback in <200ms.
5. **Error states:** every API failure has a recovery path.
6. **Anti-Slop Checklist:** re-run on every page. Fail the merge if any item is violated.
7. **Cross-browser:** Chrome, Firefox, Safari (last 2 versions). Edge for completeness.
8. **Run gstack `/qa` skill** if available — automated visual + behavior checks.

**Verify:**
- Zero anti-slop violations
- Lighthouse score: Performance ≥ 90, Accessibility ≥ 95
- All interactive elements keyboard-reachable
- No console errors in production

**Estimated effort:** ~3-4 hours.

---

## Phase 7 — Deploy + Verify
**Deliverable:** Live on Vercel, all pages verified, owner notified.

**Tasks:**
1. **Commit + push:** `git add -A && git commit -m "Session 56: Apply DESIGN.md to [pages]"`
2. **Vercel auto-deploys** (existing GitHub connection)
3. **Verify on production URL:** `https://agency-frontend-seven.vercel.app`
   - Each page loads without error
   - No 404s on assets
   - No console errors
4. **Visual diff:** screenshot key pages, compare to design intent in DESIGN.md
5. **Owner sign-off:** walk through each page with the owner before declaring done
6. **Rollback plan:** if visual regression, revert commit + redeploy

**Verify:**
- Production URL returns 200 for all routes
- All assets load
- Owner confirms visual intent matches

**Estimated effort:** ~30 min (deploy + verify).

---

## Phase 8 — Save Session + Memory
**Deliverable:** Project memory updated for next session.

**Tasks (per project auto-save rules):**
1. Update `int/docs/AGENTS.md` — Session 56 entry, completed work, bugs found
2. Update `int/docs/HANDOFF.md` — what's done, what's next
3. Create `claude-obsidian/wiki/meta/session-56-design-system.md` — Obsidian session note
4. Update `claude-obsidian/wiki/log.md` — session log entry
5. Update `claude-obsidian/wiki/hot-cache.md` — recent context
6. Git commit all changes
7. Push to origin

**Verify:**
- All 6 files updated
- Git log shows session commit
- Obsidian wiki reflects new state

**Estimated effort:** ~15 min.

---

## Phases NOT in v1 Scope

- **Public marketing site:** removed in Session 55; out of scope
- **Multi-tenant subdomain routing:** out of scope; one Vercel project
- **Real-time WebSocket agent feed:** polling 10s is sufficient
- **Mobile native apps:** web is mobile-responsive; that's the v1 commitment
- **Multi-language:** English only
- **Audit log CSV export:** visible in UI; no export in v1
- **Custom agent builder:** 47 fixed agents from `marketing-ai-agency/agents/`
- **White-label client portal:** clients see NexusAI branding
- **Light mode:** dark only in v1 (per DESIGN.md decision)

---

## Build Order Summary

```
Phase 0  ✅ 6 docs created              (done Session 56)
Phase 1  ⏳ Design tokens + 1 demo page (in progress Session 56)
Phase 2  ⬜ 5 owner dashboard pages
Phase 3  ⬜ 4 client portal pages
Phase 4  ⬜ CashClaw + ClawWork boards
Phase 5  ⬜ Onboarding wizard polish
Phase 6  ⬜ QA + accessibility + mobile
Phase 7  ⬜ Deploy + verify
Phase 8  ⬜ Save session + memory
```

**Total estimated v1 effort:** ~16-20 hours of focused work, phased across 2-3 sessions.

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-04 | Build dashboard first, then client portal | Owner is the primary user; client comes after owner experience is solid |
| 2026-06-04 | 1 demo page (login) before full rollout | De-risks font loading + token system before applying to 10+ pages |
| 2026-06-04 | Anti-Slop Checklist is a merge gate | No "AI template" regressions; every PR must pass |
| 2026-06-04 | Polling 10s, not WebSocket | No fake "real-time" feel; honest operational control |
| 2026-06-04 | Dark mode only in v1 | 30% fewer design decisions; light mode deferred to v2 |
| 2026-06-04 | No marketing site in v1 | Owner decision Session 55: focus on product, not marketing |
