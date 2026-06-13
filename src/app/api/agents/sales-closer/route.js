import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Sales Closer — speed-to-lead, BANT qualification, proposal, nurture, objections, follow-up
// Spec: marketing-ai-agency/agents/sales-closer.md
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const message = (body.message || body.lead || '').toString().trim()
    const clientName = (body.client_name || 'the prospect').toString().trim() || 'the prospect'
    const mode = (body.mode || 'full-cycle').toString().toLowerCase()

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'A lead context is required. Example: { message: "Rohit from GreenLeaf SaaS, 50 employees, downloaded pricing PDF, India", client_name: "GreenLeaf", mode: "speed-to-lead" }' },
        { status: 400 }
      )
    }

    const stamp = new Date().toISOString()
    const sections = {}

    // --- Speed-to-Lead (90-second response) ---
    if (mode === 'speed-to-lead' || mode === 'full-cycle') {
      sections.speed = `## 1. Speed-to-Lead — 90-Second Response (Industry benchmark: 21x qualification odds vs 1-hour response)

### SMS (160 chars)
> Hi ${clientName.split(' ')[0] || 'there'} — got your enquiry about ${truncate(message, 40)}. Sent a 90s Loom with the answer + 3 next steps. Watch here: [link] — Ayan, NexusAI

### Email
**Subject A:** ${clientName}, sent a 90-sec answer (not a pitch)
**Subject B:** Quick Loom for ${clientName} re: ${truncate(message, 30)}

> Hi ${clientName.split(' ')[0] || 'there'},
>
> Thanks for reaching out — most agencies take 4-6 hours to reply. I wanted to be the exception.
>
> Here's a 90-second Loom walking through what you asked and what we'd do in week 1: [Loom link]
>
> If it makes sense, I have **two 15-min slots this week**:
> - [Calendar link — slot 1]
> - [Calendar link — slot 2]
>
> No pitch deck. Just clarity on whether we can actually move the needle for you.
>
> — Ayan
> NexusAI Agency

### LinkedIn DM (if connected)
> Hey ${clientName.split(' ')[0] || 'there'} — saw your message come through. Sent a 90s Loom reply, no pitch. If a 15-min call this week is useful, grab any slot: [link]. If not, no follow-ups, promise. — Ayan

> [!note] Why this works
> - SMS converts 6-8x better than email-only first reply
> - Loom personalises without a phone call (lowers friction for cold leads)
> - Two specific slots outperform "let me know when you're free" by 3x`
    }

    // --- BANT Qualification ---
    if (mode === 'qualify' || mode === 'full-cycle') {
      sections.bant = `## 2. BANT Scorecard — ${clientName}

### B — Budget
- [ ] Stated explicit budget? (e.g. "₹50K/mo for 6 months")
- [ ] Range given: **₹30K-1L/mo is our sweet spot**
- [ ] Decision-maker is the one talking to us? (vs. influencer/intern)

### A — Authority
- [ ] Title: **Founder, CMO, Growth Head, VP Marketing** = green light
- [ ] Has sign-off power over ₹30K+/mo spend?
- [ ] Anyone else in the buying committee we should loop in?

### N — Need
- **Stated pain:** ${truncate(message, 120)}
- [ ] Quantified? ("We need 200 leads/mo" > "we want more leads")
- [ ] Active alternative? (in-house team, freelancer, another agency)
- [ ] Trigger event? (funding, new product launch, missed quarter)

### T — Timeline
- [ ] Desired start: **within 30 days = hot; 30-90 = warm; >90 = nurture**
- [ ] Has a board/investor deadline driving this?

### Lead score (0-100)
| Signal | Weight | Score |
|--------|--------|-------|
| Budget clarity | 25 | ?/25 |
| Authority confirmed | 20 | ?/20 |
| Quantified need | 25 | ?/25 |
| Timeline urgency | 15 | ?/15 |
| ICP fit (industry/size) | 15 | ?/15 |

**Threshold:** ≥70 = book demo · 50-69 = nurture 14d · <50 = disqualify

> [!warning] Disqualify fast if
> - No budget at all ("just exploring")
> - Asking for free work as a "trial"
> - Comparing us to Fiverr-quality vendors on price alone`
    }

    // --- Proposal Outline ---
    if (mode === 'proposal' || mode === 'full-cycle') {
      sections.proposal = `## 3. Proposal Outline — ${clientName}

### Slide 1 — Cover
- Logo, project name, date, "Prepared for ${clientName}"
- Single line: *What we'll do, by when, for how much*

### Slide 2 — Restate the problem (in their words)
- Quote 2-3 lines from their email/Loom reply
- Mirror their language, not agency jargon

### Slide 3 — Insight (why their current setup is broken)
- Root cause diagnosis: 1-2 specific things, not a generic audit
- Anchor with a number they don't have visibility into

### Slide 4 — The plan (3 phases, 12 weeks)
| Phase | Weeks | Deliverable | Outcome |
|-------|-------|-------------|---------|
| **Diagnose & instrument** | 1-2 | Tracking audit, ICP refresh, baseline metrics | Single source of truth |
| **Build the engine** | 3-8 | 2 channels live, 3 ad sets per channel, weekly creative drops | Predictable lead flow |
| **Scale & systematise** | 9-12 | Performance review, scale rules, handover doc | Compounding growth |

### Slide 5 — Investment
- **Option A:** ₹4,999/mo Starter (1 channel, 1 ad set cluster, monthly report)
- **Option B:** ₹14,999/mo Growth (2 channels, 3 ad sets each, weekly Loom, BANT scoring)
- **Option C:** ₹39,999/mo Scale (3 channels, dedicated strategist, weekly office hours, quarterly QBR)
- 3-month minimum, 30-day cancellation after

### Slide 6 — Why us (proof)
- 3 case studies in their industry/ICP
- 1 testimonial quote, 1 metric ("3.1x ROAS in 60 days")

### Slide 7 — Timeline + next step
- Day 0: contract signed
- Day 1: kickoff call, asset list shared
- Day 7: first campaign live
- Day 14: first leads in pipeline
- **Single CTA: "Sign by Friday to start Monday"**

> [!tip] Pricing psychology
> Three tiers convert 38% better than two. Make Option B (Growth) the obvious default — it is your real offer; A and C exist to make B look reasonable.`
    }

    // --- Nurture Sequence ---
    if (mode === 'nurture' || mode === 'full-cycle') {
      sections.nurture = `## 4. 5-Email Nurture Sequence (post-no-decision, 14-day window)

> [!info] Trigger
> Lead downloaded pricing, opened proposal, didn't book a call. Send over 14 days, then move to monthly newsletter.

### Email 1 — Day 0 (sent within 1 hour)
**Subject:** Did the proposal make sense, ${clientName.split(' ')[0] || 'there'}?
- 3 lines max
- One specific question about their stated need
- One calendar link

### Email 2 — Day 3
**Subject:** The one stat that changed how we think about ${topic(message)}
- Single insight piece (not a pitch)
- Soft CTA: "Worth a 15-min walkthrough?"

### Email 3 — Day 7
**Subject:** How [Client X] hit 3.1x ROAS in 60 days
- Case study in their industry
- 1-2 screenshots, 1-2 numbers
- CTA: "Want the full breakdown? 15 min."

### Email 4 — Day 10
**Subject:** Quick question about timing
- Short, low-pressure
- Acknowledge they're busy
- Give 3 next-step options: call / async Loom / refer someone

### Email 5 — Day 14
**Subject:** Closing the loop
- "Looks like the timing isn't right — totally fine. I'll stop the sequence here."
- One last useful resource (template, audit checklist)
- "If things change in Q__, my door is open. — Ayan"

> [!note] Why "closing the loop" works
> 8-12% of cold leads reply to breakup emails. Sunk-cost-of-attention bias. Also: you build brand equity for when they DO need you in 6 months.`
    }

    // --- Objection Handling ---
    if (mode === 'objection' || mode === 'full-cycle') {
      sections.objections = `## 5. Objection Playbook

### "It's too expensive"
- **Reframe:** "Compared to what — a ₹15K/mo freelancer who ghosts you, or a ₹2L/mo agency that takes 90 days to launch?"
- **Anchor:** "Our Growth plan is ₹14,999/mo. Average client makes that back in 22 days of new pipeline."
- **Trade-off:** "If ₹4,999 Starter is the right starting point, let's do that. The point is to get the engine running."

### "We've been burned by agencies before"
- **Acknowledge:** "That tracks — most agencies sell a deck and disappear. We work on 30-day sprints with weekly Looms. If we miss a target, you don't pay for that month."
- **Proof:** "I can send 3 client references who've fired their last agency and worked with us for 12+ months."

### "We need to think about it / talk to my co-founder"
- **Lock a date:** "Totally fair. When can you both get 15 min on the calendar? I'll send a recap Loom after so they don't need to read the proposal cold."
- **If silent after 7 days:** run the 5-email nurture above

### "Can you do a free trial / pilot?"
- **Don't give away work.** "We do a paid 30-day diagnostic — ₹9,999 — with a clear scope and exit clause. If we don't surface at least 3 actionable insights, you don't continue."

### "We want to do it in-house"
- **Be honest:** "If you have a senior marketer in-house with 5+ hours/week for ads, you probably should. If they're stretched and you need pipeline now, our Growth plan is built to hand off in 90 days, not create dependency."`
    }

    // --- Follow-up cadence ---
    if (mode === 'follow-up' || mode === 'full-cycle') {
      sections.followup = `## 6. Follow-up Cadence

### For active opportunities (post-demo, awaiting decision)
- **Day 0:** Proposal sent within 2 hours of call
- **Day 1:** Loom recap + calendar link for follow-up Q's
- **Day 3:** "Any questions I can clear up?" (1 line)
- **Day 7:** New insight piece or case study
- **Day 10:** "Closing the loop" or escalate to founder call
- **Day 14:** Move to monthly nurture

### For inbound cold leads (no-show on booked call)
- **Immediately:** SMS + email "No worries, here's the reschedule link"
- **Day 2:** "What blocked it — timing, or was the topic not urgent?"
- **Day 5:** One-pager: "3 ways we help [their ICP] hit [their KPI]"
- **Day 14:** Move to nurture

### Channel mix
- Email: 70% of touches
- LinkedIn: 20% (warm leads only)
- Phone: 10% (only after email engagement: 3+ opens or 1 reply)

> [!warning] Never
> - Send more than 2 emails/week to a single lead
> - Use "Just checking in" as a subject line (lowest reply rate in history)
> - Follow up without adding new information each time`
    }

    // --- Combine ---
    const order = ['speed', 'bant', 'proposal', 'nurture', 'objections', 'followup']
    const labels = {
      speed: 'Speed-to-Lead (90-sec response)',
      bant: 'BANT Scorecard',
      proposal: 'Proposal Outline',
      nurture: '5-Email Nurture Sequence',
      objections: 'Objection Playbook',
      followup: 'Follow-up Cadence',
    }
    const body_md = order
      .filter((k) => sections[k])
      .map((k) => sections[k])
      .join('\n\n')

    const fullText = `# Sales Closer — ${clientName}\n\n**Mode:** ${mode}\n**Lead context:** ${message}\n**Generated:** ${stamp}\n\n${body_md}\n\n---\n\n_Generated by Sales Closer. Sections included: ${order.filter((k) => sections[k]).map((k) => labels[k]).join(', ')}._`

    return NextResponse.json({
      success: true,
      response: fullText,
      data: { agent: 'sales-closer', mode, client_name: clientName, request: message, sections_included: Object.keys(sections), generated_at: stamp },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Sales closer failed' },
      { status: 500 }
    )
  }
}

function truncate(s, n) {
  if (!s) return ''
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

function topic(s) {
  return (s || '').split(/\s+/).slice(0, 4).join(' ').toLowerCase()
}
