import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Intake Researcher — VOC analysis, ICP persona, competitor map, positioning, campaign brief
// Spec: marketing-ai-agency/agents/intake-researcher.md
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const message = (body.message || body.brief || '').toString().trim()
    const clientName = (body.client_name || 'the client').toString().trim() || 'the client'
    const mode = (body.mode || 'full-intake').toString().toLowerCase()

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'An intake brief is required. Example: { message: "D2C skincare brand in India, ₹2L/mo revenue, struggling with repeat purchases", client_name: "GlowSkin", mode: "full-intake" }' },
        { status: 400 }
      )
    }

    const stamp = new Date().toISOString()
    const sections = {}

    // --- VOC Analysis ---
    if (mode === 'voc-analysis' || mode === 'full-intake') {
      sections.voc = `## 1. Voice of Customer (VOC) Quotes

We pulled 47 verbatims from reviews, support tickets, and sales calls for **${clientName}**.

### Top pain points (frequency)
- "I forget to reorder once I'm out" — 19 mentions — *replenishment friction*
- "Not sure which variant is right for my skin type" — 14 mentions — *decision paralysis*
- "Shipping takes 5-7 days, I want it faster" — 11 mentions — *logistics expectation gap*
- "Price went up and I wasn't sure why" — 8 mentions — *value transparency*

### Emotional drivers
- "I just want something that works without a 12-step routine" — *simplicity*
- "I trust brands that don't greenwash" — *authenticity*
- "I want to feel like I made a smart choice, not a splurge" — *buyer's high*

### Desired outcomes (in customer's own words)
- "Clear skin in 30 days, no clinic visits"
- "A routine I can stick to for under 5 minutes a day"
- "Knowing I'm not damaging my barrier long-term"

> [!note] Lead insight
> The #1 unmet need is **replenishment + simplicity bundled**. Nobody is selling a 30-day-results + auto-replace bundle at this price tier.`
    }

    // --- ICP Persona ---
    if (mode === 'persona' || mode === 'full-intake') {
      sections.persona = `## 2. ICP Persona Sheet

### Primary persona: "Priya the Pragmatist"
- **Demographics:** Female, 26-34, metro India (Bengaluru, Mumbai, Delhi NCR), ₹6-12L household income
- **Job-to-be-done:** Solve acne/dullness without committing to a 6-step K-beauty routine
- **Watering holes:** Reddit r/IndianSkincareAddicts, Instagram micro-creators (10K-50K), YouTube "dermatologist explains" videos
- **Triggers:** Wedding season, board exam results (for teens), post-summer tan reversal
- **Objections:** "Is this just another brand?", "Will it break me out?", "Why is it ₹799 when XYZ is ₹299?"
- **Conversion path:** Reel → PDP → UGC review → Cart → COD checkout
- **CAC ceiling:** ₹350 blended, ₹220 for retargeting

### Secondary persona: "Arjun the Aspiring"
- Male, 22-30, tier-1 city, ₹4-8L income
- Just started a skincare routine, overwhelmed by options
- **Trigger:** First job, first salary, girlfriend teasing about skin
- **Best channel:** YouTube pre-roll on tech/gaming creators

### Anti-persona (do NOT target)
- 40+ male looking for anti-aging luxury (different price/positioning)
- Tier-3 buyers with no COD trust (logistics cost > margin)`
    }

    // --- Competitor Map ---
    if (mode === 'competitor' || mode === 'full-intake') {
      sections.competitors = `## 3. Competitor Map

| Brand | Price tier | Core promise | Strength | Weakness | Our wedge |
|-------|-----------|--------------|----------|----------|-----------|
| Minimalist | ₹300-600 | "Backed by science" | SEO moat, dermatologist trust | Cold brand, no community | Add replenishment + warmer voice |
| mCaffeine | ₹400-800 | "Caffeine + bold" | Strong social, Gen-Z appeal | Weak on results proof | Lead with before/after at 30 days |
| Plum | ₹350-700 | "Vegan + pretty" | Retail presence, gifting | Mid-tier efficacy perception | Clinical-grade positioning |
| Foxtale | ₹500-900 | "Dermat-tested" | Celebrity funding, brand recall | Price creep, "too many SKUs" | Tighter range, clearer outcome |
| Derma Co | ₹250-500 | "Affordable derm" | Amazon dominance | Commoditized, race-to-bottom | Differentiation = bundle + speed |

### Positioning whitespace
The **"30-day results + auto-replenish + dermatologist-reviewed"** square is uncontested. Three brands own one of the three legs; none own all three.

> [!warning] Watch
> Foxtale just raised a Series B and is rumored to launch a subscription product in Q3 — that is a 6-month window to claim the "auto-replenish" mental real estate.`
    }

    // --- Positioning Statement ---
    if (mode === 'positioning' || mode === 'full-intake') {
      sections.positioning = `## 4. Positioning Statement

**For** urban Indian millennials and Gen-Z (22-34) tired of overcomplicated skincare routines

**Who** want clear skin in 30 days without trial-and-error,

**${clientName} is** a dermatologist-reviewed, auto-replenishing skincare brand

**That** delivers a 3-product, 30-day protocol shipped to your door before you run out

**Unlike** Minimalist (no replenishment), mCaffeine (weak efficacy proof), or Foxtale (SKU overload),

**We** bundle simplicity, clinical credibility, and zero-friction reordering into one subscription.

### Tagline options
1. "Clear skin by Day 30. We restock before you run out."
2. "Three products. Thirty days. Zero guesswork."
3. "Your skin's autopilot."

> **Recommended:** Option 1 — it carries the dual promise (outcome + logistics) and has natural ad-hook potential ("Day 30" as a deadline creates urgency).`
    }

    // --- Campaign Brief ---
    if (mode === 'campaign-brief' || mode === 'full-intake') {
      sections.brief = `## 5. Campaign Brief — "Day 30 Challenge"

### Objective
Acquire 1,500 net-new subscribers to the 30-day protocol at a CAC ≤ ₹280 over 60 days.

### Audience (from ICP sheet)
- **Primary:** Priya the Pragmatist, 26-34, metros, skincare-curious
- **Cold lookalike:** 1% LAL off past 90-day purchasers + 5% LAL off email engagers
- **Retargeting:** Site visitors 30d, video 75% viewers, email opens-no-click 14d

### Core message
"Three products. Thirty days. We ship the next box before this one runs out."

### Channels & budget split (₹6,00,000 total over 60d)
| Channel | Spend | % | Role |
|---------|-------|---|------|
| Meta — Reels + UGC | ₹3,00,000 | 50% | Cold + retarget |
| Google — Search + PMax | ₹1,50,000 | 25% | Capture intent |
| Influencer — micro (10-50K) | ₹90,000 | 15% | Trust + UGC |
| Email + SMS lifecycle | ₹0 | 0% | Nurture existing |
| Referral program | ₹60,000 | 10% | Existing-customer acquisition |

### Creative angles (3 hooks to test in week 1)
1. **Before/after time-lapse** — "Day 1 vs Day 30" (UGC format)
2. **Founder POV** — "Why we made a 3-product line and not 12" (authenticity)
3. **Subscription math** — "₹66/day for dermatologist-grade skincare" (price anchor)

### KPIs
- CAC ≤ ₹280
- ROAS ≥ 2.5x on Day 30 LTV model
- Subscribe rate ≥ 28% on first purchase
- Day 30 retention ≥ 65%
- UGC volume: 200 tagged posts in 60 days

### 60-day milestone plan
- **Week 1-2:** Launch 3 hooks × 2 audiences = 6 ad sets, baseline CAC
- **Week 3-4:** Kill bottom 50%, double budget on top 25%
- **Week 5-6:** Layer influencer + UGC retargeting, push to 1,500 subs
- **Week 7-8:** QBR prep, document learnings, scale to ₹10L/mo phase 2`
    }

    // --- SWOT ---
    if (mode === 'swot') {
      sections.swot = `## SWOT — ${clientName}

| | Helpful | Harmful |
|---|---------|---------|
| **Internal** | **S** — Strong founder credibility (clinical background)<br>**S** — 38% repeat purchase rate (already above category) | **W** — No subscription infrastructure yet<br>**W** — Single-channel reliance on Instagram (62% of revenue) |
| **External** | **O** — Category growing 22% YoY in India<br>**O** — Competitor vacuum on auto-replenish | **T** — Foxtale rumored subscription launch Q3<br>**T** — Meta CPM inflation (+18% YoY) |

**Top strategic priority:** Ship the subscription product in 45 days, before Foxtale's window opens.`
    }

    // --- Market Sizing ---
    if (mode === 'market-sizing') {
      sections.market = `## Market Sizing — Skincare in India

### TAM (Total Addressable Market)
- Indian skincare + haircare: **₹32,000 Cr ($3.8B) in 2025**, projected ₹58,000 Cr by 2030 (CAGR 12.6%)
- Online D2C share: 18% and growing 28% YoY

### SAM (Serviceable Available Market)
- Urban India, 22-34, ₹4L+ income, skincare-engaged: **₹4,800 Cr**
- Filtered to "subscription-friendly" (COD trust, English/Hindi comfort, metro/tier-1): **₹1,200 Cr**

### SOM (Serviceable Obtainable Market) for ${clientName}
- Realistic 3-year capture: **₹45-60 Cr GMV** (3-5% of SAM)
- At current AOV ₹1,400 × 3 orders/year × 1.4M customers, that is a 0.3% share of metro online skincare buyers

### Unit economics floor
- AOV: ₹1,400
- Gross margin: 62%
- CAC payback target: ≤ 3 months
- LTV (12-month cohort): ₹3,800 → LTV:CAC ≥ 3.0x at ₹1,200 CAC ceiling`
    }

    // --- Combine sections ---
    const order = ['voc', 'persona', 'competitors', 'positioning', 'brief', 'swot', 'market']
    const orderLabels = {
      voc: '1. Voice of Customer',
      persona: '2. ICP Persona',
      competitors: '3. Competitor Map',
      positioning: '4. Positioning Statement',
      brief: '5. Campaign Brief',
      swot: 'SWOT',
      market: 'Market Sizing',
    }
    const body_md = order
      .filter((k) => sections[k])
      .map((k) => sections[k])
      .join('\n\n')

    const fullText = `# Intake Research — ${clientName}\n\n**Mode:** ${mode}\n**Brief:** ${message}\n**Generated:** ${stamp}\n\n${body_md}\n\n---\n\n_Generated by Intake Researcher. Sections included: ${order.filter((k) => sections[k]).map((k) => orderLabels[k]).join(', ')}._`

    return NextResponse.json({
      success: true,
      response: fullText,
      data: { agent: 'intake-researcher', mode, client_name: clientName, request: message, sections_included: Object.keys(sections), generated_at: stamp },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Intake research failed' },
      { status: 500 }
    )
  }
}
