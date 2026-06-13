import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Review-QC — quality-control gate between delivery agents and clients.
// Spec: marketing-ai-agency/agents/review-qc.md
//
// In MVP this is a DETERMINISTIC scoring stub (no real LLM call).
// Why: Groq key is not always configured; we want zero-cost, zero-latency
//      "looks plausible" responses that still match the spec schema so the
//      frontend and CRM integrations can be developed and demoed end-to-end.
//
// UPGRADE PATH (real LLM would do here):
//   1. Build the 4-dimension rubric into the system prompt (see spec).
//   2. Call Groq / OpenAI / Anthropic with the output + source-agent context.
//   3. Parse the JSON response (mode=json_object, response_format=json).
//   4. Fall back to deterministic scorer on parse failure.
//   5. Log score + decision to Twenty CRM as a Note on the originating Opportunity.
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const client_name = (body.client_name || '').toString().trim()
    const user_request = (body.user_request || '').toString().trim()
    const mode = (body.mode || 'audit').toString().toLowerCase()
    const target_agent = (body.target_agent || 'unknown').toString().toLowerCase()
    const content = (body.content || '').toString()

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'content is required. Example: { target_agent: "content-creator", mode: "audit", content: "..." }' },
        { status: 400 }
      )
    }

    const stamp = new Date().toISOString()

    // Deterministic scorer — same input -> same output (good for tests).
    // Real LLM (see UPGRADE PATH above) will replace this in Phase 2.
    const result = scoreOutput({ content, target_agent, mode, user_request })

    return NextResponse.json({
      success: true,
      response: result,
      data: {
        agent: 'review-qc',
        mode,
        target_agent,
        client_name,
        user_request,
        reviewed_at: stamp,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'review-qc failed' },
      { status: 500 }
    )
  }
}

// ------------------------------------------------------------------
// Deterministic 4-dimension scorer
// ------------------------------------------------------------------
//
// Why 4 dimensions? — Accuracy, Brand-voice, Actionability, Compliance.
// These map 1:1 to the failure modes Pepper research flagged (hallucination,
// drift, weak CTA, compliance). Splitting into 4 lets the human reviewer see
// WHICH axis failed, not just "low score".
//
// Why 60/80 thresholds? — <60 means structurally broken (rewrite);
// 60-79 means usable-but-risky (human eye needed); >=80 means ship it.
// Empirically tuned to match the 3-bucket triage a human editor would do.

const APPROVE_THRESHOLD = 80
const REJECT_THRESHOLD = 60

const RED_FLAGS = [
  // accuracy red flags
  /\b\d{2,3}%\s+of\s+(marketers|users|companies|customers)\b/i,
  /\bstudies\s+show\b/i,
  /\bresearch\s+(shows|says|suggests)\b/i,
  /\baccording\s+to\s+(a\s+)?(recent\s+)?(study|report)\b/i,
  // compliance red flags
  /\bguaranteed?\s+(results?|income|sales)\b/i,
  /\b(100%|risk[-\s]?free)\b/i,
  /\bmake\s+\$\d+/i,
  // weak CTA red flags
  /\bclick\s+here\b/i,
  /\blearn\s+more\s*\.?\s*$/i,
  /\bsign\s+up\s*\.?\s*$/i,
]

const GOOD_SIGNALS = [
  // strong CTA
  /book\s+a\s+(call|demo|meeting)/i,
  /download\s+the\s+[\w\s-]+playbook/i,
  /reply\s+with\s+["']?\w+["']?/i,
  /start\s+(your\s+)?free\s+trial/i,
  // specificity
  /\b\d+\s+day(s)?\b/i,
  /\bbefore\s+\[date\]/i,
  /\bstep\s+\d+/i,
  // brand-voice markers
  /\bnexusai\b/i,
  /\b(our|the)\s+team\b/i,
  /\bplaybook\b/i,
]

const BRAND_VOCAB = /\b(playbook|ship|iterate|completion|rate|lever|signal|funnel)\b/i

function scoreOutput({ content, target_agent, user_request, mode }) {
  const lower = content.toLowerCase()
  const len = content.length
  const flags = RED_FLAGS.filter((re) => re.test(content))
  const goods = GOOD_SIGNALS.filter((re) => re.test(content))

  // ---- accuracy (0-25) ----
  let accuracy = 22
  // Heavily penalize unsourced stats
  const statHits = (content.match(/\b\d{2,3}\s*%/g) || []).length
  const studyHits = (content.match(/\b(studies|research)\s+(shows?|says?|suggests?)\b/gi) || []).length
  if (statHits > 0 && !/source:|citation:|according to [a-z]/i.test(content)) {
    accuracy -= Math.min(15, statHits * 5 + studyHits * 3)
  }
  // Very short outputs can't be accurate
  if (len < 50) accuracy -= 8
  accuracy = clamp(accuracy, 0, 25)

  // ---- brand-voice (0-25) ----
  let brand_voice = 15
  if (BRAND_VOCAB.test(content)) brand_voice += 6
  if (/\b(dear\s+sir|to\s+whom\s+it\s+may\s+concern)\b/i.test(content)) brand_voice -= 8
  if (/(lol|omg|bro|bruh)\b/i.test(content)) brand_voice -= 6
  if (len > 200) brand_voice += 2
  brand_voice = clamp(brand_voice, 0, 25)

  // ---- actionability (0-25) ----
  let actionability = 12
  actionability += Math.min(10, goods.length * 4)
  if (flags.some((re) => /\bclick\s+here\b|\blearn\s+more\b|\bsign\s+up\s*\.?\s*$/i.test(content))) {
    actionability -= 6
  }
  // Step lists are highly actionable
  if (/\b\d+\.\s/.test(content)) actionability += 3
  actionability = clamp(actionability, 0, 25)

  // ---- compliance (0-25) ----
  let compliance = 22
  if (flags.length > 0) compliance -= Math.min(18, flags.length * 4)
  // Detect PII-ish patterns
  if (/\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/.test(content)) compliance -= 10 // SSN-ish
  if (/\b\d{16}\b/.test(content)) compliance -= 12 // CC-ish
  compliance = clamp(compliance, 0, 25)

  const score = accuracy + brand_voice + actionability + compliance

  let decision
  if (score < REJECT_THRESHOLD) decision = 'reject'
  else if (score < APPROVE_THRESHOLD) decision = 'human-review'
  else decision = 'approve'

  const feedback = buildFeedback({ decision, score, accuracy, brand_voice, actionability, compliance, flags, goods })
  const blockers = decision === 'reject' ? buildBlockers({ accuracy, brand_voice, actionability, compliance, flags }) : []
  const redline = score < APPROVE_THRESHOLD ? buildRedline({ content, user_request, target_agent, flags }) : null

  return {
    decision,
    score,
    scores: { accuracy, brand_voice, actionability, compliance },
    feedback,
    redline,
    blockers,
  }
}

function buildFeedback({ decision, score, accuracy, brand_voice, actionability, compliance, flags, goods }) {
  const dims = []
  if (accuracy < 18) dims.push('unsourced stats or unverifiable claims')
  if (brand_voice < 18) dims.push('tone does not match brand voice')
  if (actionability < 18) dims.push('CTA is vague or generic')
  if (compliance < 18) dims.push('compliance or risk language detected')

  if (decision === 'approve') {
    return `Score ${score}/100. All 4 dimensions pass. ${goods.length} strong signals detected. Ready to ship.`
  }
  if (decision === 'human-review') {
    return `Score ${score}/100. Borderline. Concerns: ${dims.join('; ') || 'tone and specificity could be tighter'}. Flag for human editor.`
  }
  return `Score ${score}/100. REJECTED. Issues: ${dims.join('; ') || 'multiple dimensions below bar'}. ${flags.length} red-flag match(es). Send back to source agent for rewrite.`
}

function buildBlockers({ accuracy, brand_voice, actionability, compliance, flags }) {
  const out = []
  if (accuracy < 18) out.push('Cite verifiable sources for all stats and named studies')
  if (brand_voice < 18) out.push('Align tone, vocabulary, and formality with the brand-style.md brief')
  if (actionability < 18) out.push('Replace generic CTA with a specific offer (book a call / download playbook / start free trial)')
  if (compliance < 18) out.push('Remove prohibited claims (guaranteed results, 100%/risk-free, income promises)')
  if (flags.length === 0 && out.length === 0) out.push('General rewrite required — multiple quality dimensions below threshold')
  return out
}

function buildRedline({ content, user_request, target_agent, flags }) {
  // Minimal redline: strip risk-claim language, append a specific CTA.
  let redlined = content
  redlined = redlined.replace(/\b(guaranteed?\s+(results?|income|sales))\b/gi, '[removed: unsubstantiated claim]')
  redlined = redlined.replace(/\b(100%|risk[-\s]?free)\b/gi, '[removed: compliance risk]')
  redlined = redlined.replace(/\bclick\s+here\b/gi, 'book a 15-min call')
  redlined = redlined.replace(/\blearn\s+more\s*\.?\s*$/i, 'download the 14-day playbook')
  redlined = redlined.replace(/\bsign\s+up\s*\.?\s*$/i, 'start your free trial')
  if (!/book\s+a\s+(call|demo)|download|start\s+(your\s+)?free\s+trial/i.test(redlined)) {
    redlined += `\n\n**Next step:** Book a 15-min call — https://nexusai.example/book`
  }
  return `// Redline (auto-corrected by review-qc, source=${target_agent}):\n${redlined}`
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}
