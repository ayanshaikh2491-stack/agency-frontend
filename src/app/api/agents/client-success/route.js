import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Client Success Manager — onboarding, kickoff, QBR, retention, upsell, testimonials
// Spec: marketing-ai-agency/agents/client-success.md
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const message = (body.message || body.context || '').toString().trim()
    const clientName = (body.client_name || 'the client').toString().trim() || 'the client'
    const mode = (body.mode || 'full-csm').toString().toLowerCase()

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'A client context is required. Example: { message: "GreenLeaf SaaS, signed ₹14,999/mo Growth plan, India, 50 employees", client_name: "GreenLeaf", mode: "welcome" }' },
        { status: 400 }
      )
    }

    const stamp = new Date().toISOString()
    const sections = {}

    // --- Welcome / onboarding start ---
    if (mode === 'welcome' || mode === 'full-csm') {
      sections.welcome = `## 1. Welcome Packet — ${clientName}

### Day 0 — Sent within 5 minutes of contract signing

**Subject:** Welcome to NexusAI — 4 things to do before our kickoff call

> Hi ${clientName.split(' ')[0] || 'there'},
>
> Welcome aboard. The next 14 days will set the foundation for the next 12 months. Here's the path:
>
> 1. **Reply to this email** with 3 KPIs that, if we hit them, make this quarter a win
> 2. **Fill the intake form** (link below — 8 min, blocks our work until done)
> 3. **Add 2 Loom replies** to the kickoff doc — what you want us to know
> 4. **Block 45 min on the calendar** for our kickoff call (we'll send 3 slots)
>
> Anything stuck? Reply to this email directly. I read every one.
>
> — Ayan
> Your CSM, NexusAI

> [!note] Why a 5-minute welcome works
> Sets the speed-of-response tone for the entire relationship. Clients who get a same-day welcome are 4x more likely to give 5-star reviews.`
    }

    // --- Intake Form ---
    if (mode === 'intake-form' || mode === 'full-csm') {
      sections.intake = `## 2. Client Intake Form (8 minutes, blocks kickoff)

### Section A — Business snapshot
1. What does ${clientName} sell, in one sentence?
2. Target customer (industry, role, company size)?
3. Annual revenue range? (<₹1Cr, ₹1-10Cr, ₹10-50Cr, >₹50Cr)
4. Active marketing budget per month (across all channels)?
5. Current team: founder-led / in-house marketer / agency partner / none?

### Section B — Goals for the next 90 days
1. The single number that, if we move it, makes this quarter a win
2. The single number that, if we miss it, makes this quarter a failure
3. Any board/investor commitments we should know about?

### Section C — History
1. What have you tried in the last 6 months? What worked, what didn't?
2. Last agency/freelancer you worked with — what broke?
3. Any channels you've sworn off? (and why)

### Section D — Access & logistics
1. Meta Ads Manager admin email
2. Google Ads MCC access (or Manager account ID)
3. Google Analytics 4 property ID
4. Existing CRM (HubSpot / Zoho / Notion / sheets / none)
5. Brand assets folder (Drive / Figma / Notion link)

### Section E — Approvals & cadence
1. Who can approve creative? (single approver = faster)
2. Preferred Loom review or live walkthrough?
3. Best day/time for the weekly 30-min sync?

> [!warning] Hard rule
> We do not start work until the intake form is 100% complete. Partial intake = partial results.`
    }

    // --- Kickoff Agenda ---
    if (mode === 'kickoff' || mode === 'full-csm') {
      sections.kickoff = `## 3. Kickoff Call Agenda (45 minutes)

### Minutes 0-5 — Frame the engagement
- Recap: "Here's what we agreed to deliver in 12 weeks"
- The 3 numbers we're both measured on
- Communication norms (Loom vs live, response SLA, escalation path)

### Minutes 5-15 — Walk the intake form live
- Resolve any "TBD" answers
- Confirm access is granted (Meta, Google, GA4, CRM)
- Lock the channel mix and budget split

### Minutes 15-25 — Set the first 14 days
- Day 1-3: tracking audit, ICP refresh, baseline snapshot
- Day 4-7: first 3 ad sets live, first 6 creative variants queued
- Day 8-14: first lead cohort + Day 7 performance review

### Minutes 25-35 — Define the success metrics
- North star: e.g. "200 qualified leads/mo at CAC ≤ ₹280"
- Lagging indicators: revenue, ROAS, LTV
- Leading indicators: CTR, CPM, CPL, MQL→SQL rate
- Reporting: weekly Loom (Friday 5pm) + monthly QBR (first Tuesday)

### Minutes 35-45 — Risks + Q&A
- "What's the one thing that, if it goes wrong, kills this quarter?"
- Sign-off on the 14-day plan
- Schedule the next sync: **same time, same day, next week**

> [!tip] Kickoff deliverable
> Send a 1-page "Engagement Brief" Loom within 2 hours of the call recapping decisions. This becomes the source of truth for the next 12 weeks.`
    }

    // --- 30-Day Check-in ---
    if (mode === '30-day-checkin' || mode === 'full-csm') {
      sections.checkin = `## 4. 30-Day Check-in Template

### What we promised in the kickoff
1. Tracking audit complete by Day 3
2. 3 ad sets live by Day 7
3. First 50 leads generated by Day 14
4. Baseline CAC, CPM, CTR reported by Day 7
5. First creative refresh by Day 21

### What we actually delivered (be honest — credibility compounds)
| Deliverable | Status | Notes |
|-------------|--------|-------|
| Tracking audit | ✅ / ⚠️ / ❌ | |
| 3 ad sets live | ✅ / ⚠️ / ❌ | |
| 50 leads by Day 14 | ✅ / ⚠️ / ❌ | |
| Baseline metrics | ✅ / ⚠️ / ❌ | |
| Creative refresh | ✅ / ⚠️ / ❌ | |

### The 30-day health check
1. Are we on track to hit the 90-day north star?
2. What surprised us — good or bad?
3. What's the single biggest thing to fix in the next 30 days?
4. Is the client happy? (NPS-style: 1-10, "would you recommend us?")
5. Any unresolved blockers the client needs to clear?

### Action items + owner
- [ ] Item — owner — due date
- [ ] Item — owner — due date
- [ ] Item — owner — due date

> [!note] 30-day NPS target
> ≥9 = "promoter" → ask for referral at Day 45
> 7-8 = "passive" → address concerns in the Day 45 sync
> ≤6 = "at-risk" → escalate to founder call within 48 hours`
    }

    // --- QBR Deck ---
    if (mode === 'qbr' || mode === 'full-csm') {
      sections.qbr = `## 5. Quarterly Business Review (QBR) Deck — 12 slides

### Slide 1 — Cover
- Client logo, "Q[X] 2026 Performance Review — ${clientName}", date

### Slide 2 — Executive summary (1 paragraph, 3 numbers)
- Revenue, leads, ROAS — with the one number we're proud of and the one we're fixing

### Slide 3 — North star scorecard
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Leads/mo | 200 | 247 | 🟢 +24% |
| CAC | ₹280 | ₹256 | 🟢 -9% |
| ROAS | 2.5x | 3.1x | 🟢 +24% |
| LTV:CAC | 3.0 | 3.4 | 🟢 |

### Slide 4 — Channel performance breakdown
- Meta, Google, Email, Organic — leads, spend, CPL, trend
- Best channel + worst channel + recommendation

### Slide 5 — Creative performance (top 3 + bottom 3)
- Hook, format, CTR, CVR, fatigue score
- Refresh plan for next quarter

### Slide 6 — Audience insights
- ICP segments, which is converting best, lookalike expansion

### Slide 7 — Funnel analysis
- Impressions → Clicks → Leads → MQLs → SQLs → Customers
- Identify the leakiest step

### Slide 8 — Wins (3 things to celebrate)
- 3 specific, quantified wins from the quarter

### Slide 9 — Misses (2 things we own)
- 2 misses, root cause, what we learned, what we're doing differently

### Slide 10 — Next quarter plan
- 90-day roadmap with 3 big bets

### Slide 11 — Investment ask
- Scale-up opportunity: "To hit ₹[X] next quarter, we recommend [plan]. ROI math: [X.xx]x in 90 days."

### Slide 12 — Open Q&A + decisions needed
- 3 specific decisions the client needs to make this week

> [!tip] QBR cadence
> Send the deck 24 hours before the call. Walk it live on a 45-min Zoom. Record it. Send a 1-page Loom recap within 2 hours.`
    }

    // --- Retention Alert ---
    if (mode === 'retention-alert' || mode === 'full-csm') {
      sections.retention = `## 6. Churn Risk Score (0-100) — ${clientName}

### Risk signals (each scored, then summed to 100 max)

| Signal | Weight | Score | Triggered? |
|--------|--------|-------|-----------|
| NPS ≤ 6 in last 30 days | 20 | ?/20 | |
| Email reply rate < 50% (no-shows on sync) | 15 | ?/15 | |
| 2+ missed invoice payments | 15 | ?/15 | |
| Missed KPI for 2 consecutive months | 20 | ?/20 | |
| Asked about contract terms / cancellation | 25 | ?/25 | |
| No champion on client side (sponsor left) | 5 | ?/5 | |

### Risk band
- **0-25:** Healthy — keep doing what you're doing
- **26-50:** Watch — schedule a "how's it going" call this week
- **51-75:** At-risk — escalate to founder, propose a 30-day rescue plan
- **76-100:** Save-or-part — book a 1:1 with the buyer, offer 1 month free or a 90-day pivot, document learnings

### Save playbook
1. **Acknowledge the gap** — "We missed [KPI] by [X]%. Here's what we think went wrong."
2. **Present a 30-day rescue plan** — 1 specific change, not 5
3. **Offer a structural concession** — 1 month free, or a 50% discount on the next month, in exchange for a 6-month extension
4. **Loop in a senior stakeholder** — get the buyer's boss on a 15-min call
5. **Set a hard re-evaluation date** — Day 30 check-in with explicit go/no-go criteria

> [!warning] Don't
> - Discount mid-cycle without asking for an extension (it trains bad behavior)
> - Promise to "try harder" — be specific about what changes
> - Send the rescue plan over email — it must be a live conversation`
    }

    // --- Upsell ---
    if (mode === 'upsell' || mode === 'full-csm') {
      sections.upsell = `## 7. Upsell Pitch — ${clientName}

### When to pitch
- Month 3+, NPS ≥ 8, hitting KPIs, client is asking "what else can you do?"

### Pitch 1 — Growth → Scale (₹14,999 → ₹39,999/mo)
**"You've outgrown the Growth plan. Here's what Scale unlocks."**

- **Dedicated strategist** vs. shared — your strategist knows your account cold
- **3 channels live** vs. 2 — add LinkedIn or YouTube based on ICP
- **Weekly office hours** — 60-min live working session, not a status update
- **Quarterly QBR with your board** — we present, you get the credit
- **Priority creative turnaround** — 24h on urgent creative vs. 72h

**ROI math:**
- Adds ₹25,000/mo in fees
- Expected lift: +40% lead volume at the same or better CAC
- If we hit +40% leads at ₹256 CAC = +₹1,02,400/mo in pipeline value
- At a 12% close rate = +₹12,28,800 in new ARR over 90 days
- **Net: 49x ROI on the ₹25K/mo upgrade**

### Pitch 2 — Add-on: SEO Content Engine (₹9,999/mo)
**"Your paid engine is humming. Let's add a compounding organic layer."**

- 4 SEO-optimized blog posts/mo targeting bottom-of-funnel keywords
- Internal linking strategy + monthly content refresh
- Compounds over time: organic leads typically pass paid lead volume by month 6

**ROI math:**
- ₹9,999/mo investment
- Month 3: ~30 organic leads/mo
- Month 6: ~80 organic leads/mo
- Month 12: ~150 organic leads/mo at near-zero marginal CAC
- Saves ~₹38,400/mo in paid spend by month 6

### Pitch 3 — Add-on: Conversion Rate Optimisation (₹12,999/mo)
- 2 landing page experiments/mo
- Heatmaps, session recordings, form analytics
- Typical lift: 18-35% on form-fill conversion

> [!tip] Upsell timing rule
> Always pitch the upsell **after** delivering a win, not before. "We just hit 3.1x ROAS — let's compound it" works 3x better than "Your plan could be bigger."`
    }

    // --- Testimonial Ask ---
    if (mode === 'testimonial-ask' || mode === 'full-csm') {
      sections.testimonial = `## 8. Testimonial Request

### When to ask
- Right after a win (hit a KPI, delivered ahead of schedule, solved a crisis)
- NPS ≥ 9 in last check-in
- 60+ days into the engagement (early enough to ask, late enough to have proof)

### The ask (sent by your CSM, not the founder)

> Subject: Quick favor for ${clientName}?
>
> Hi ${clientName.split(' ')[0] || 'there'},
>
> Quick one — we just hit [SPECIFIC WIN, e.g. "3.1x ROAS in 60 days"] for you, which I wanted to celebrate properly.
>
> Would you be open to giving us a 60-second testimonial? I'm not asking for a polished case study — just 2-3 sentences on:
>
> 1. What was broken before we started
> 2. What changed after 60-90 days
> 3. Whether you'd recommend us (and to whom)
>
> Format: Loom, Google Doc, or 3 bullet points in a reply — whatever is fastest.
>
> As a thank-you, I'll send you a ₹2,000 Amazon voucher regardless of what you write.
>
> Either way, thanks for trusting us with this.
>
> — Ayan

### Where to publish
- LinkedIn (with their headshot + company logo)
- Agency website (with permission)
- Sales proposals (3-4 sentences max, attributed)
- Cold outreach (first name + company only, by default)

### Bonus: case study upgrade
If the testimonial is glowing, ask: "Would you be open to a 20-min recorded case study? We share the raw footage with you for approval, you get the visibility, we get the asset. ₹5,000 honorarium."

> [!note] Conversion rate
> 25-35% of clients respond to a testimonial ask when a win just landed
> 5-10% agree to a full case study`
    }

    // --- Combine ---
    const order = ['welcome', 'intake', 'kickoff', 'checkin', 'qbr', 'retention', 'upsell', 'testimonial']
    const labels = {
      welcome: 'Welcome Packet',
      intake: 'Intake Form',
      kickoff: 'Kickoff Agenda',
      checkin: '30-Day Check-in',
      qbr: 'QBR Deck (12 slides)',
      retention: 'Retention / Churn Risk Score',
      upsell: 'Upsell Pitches + ROI Math',
      testimonial: 'Testimonial Request',
    }
    const body_md = order
      .filter((k) => sections[k])
      .map((k) => sections[k])
      .join('\n\n')

    const fullText = `# Client Success — ${clientName}\n\n**Mode:** ${mode}\n**Context:** ${message}\n**Generated:** ${stamp}\n\n${body_md}\n\n---\n\n_Generated by Client Success Manager. Sections included: ${order.filter((k) => sections[k]).map((k) => labels[k]).join(', ')}._`

    return NextResponse.json({
      success: true,
      response: fullText,
      data: { agent: 'client-success', mode, client_name: clientName, request: message, sections_included: Object.keys(sections), generated_at: stamp },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Client success playbook failed' },
      { status: 500 }
    )
  }
}
