import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Ads Runner — drafts a paid campaign plan: audience, creative, budget, KPIs
// Spec: marketing-ai-agency/agents/ads-runner.md
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const message = (body.message || body.brief || '').toString().trim()
    const budget = Number(body.budget) || 1000

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'A campaign brief is required. Example: { message: "Lead gen for B2B SaaS HR tool", budget: 3000 }' },
        { status: 400 }
      )
    }

    const topic = message.split(/\s+/).slice(0, 4).join(' ')
    const stamp = new Date().toISOString()

    const plan = {
      objective: 'Leads',
      daily_budget_usd: Math.round(budget / 30),
      monthly_budget_usd: budget,
      platforms: ['Meta Ads', 'Google Ads'],
      audiences: [
        { name: 'Cold — interest match', size_est: '1.2M', targeting: `Interests: ${topic}, business tools, founders` },
        { name: 'Lookalike 1%', size_est: '300K', targeting: 'Source: past 90-day converters' },
        { name: 'Retarget — site visitors 30d', size_est: '8K', targeting: 'Pixel-based, exclude buyers' },
      ],
      creative: [
        { format: 'Static image', angle: 'Speed-over-perfection', hook: `Most ${topic} teams overthink this.` },
        { format: '5s video', angle: 'Pattern interrupt', hook: `Stop doing ${topic} the hard way.` },
        { format: 'Carousel', angle: 'Listicle', hook: `5 ${topic} mistakes that cost you leads.` },
      ],
      kpis: {
        target_cpl_usd: budget > 5000 ? 18 : 28,
        target_ctr_pct: 1.5,
        target_roas: 2.4,
        learning_phase_days: 7,
      },
      experiment_plan: [
        'Day 1-3: launch 3 creatives × 2 audiences = 6 ad sets',
        'Day 4-7: kill any ad set with CPL > 2x target',
        'Day 8-14: scale winners +2x budget every 48h while ROAS holds',
      ],
    }

    return NextResponse.json({
      success: true,
      response:
        `**Campaign plan for "${topic}" — $${budget}/mo**\n\n` +
        `**Objective:** ${plan.objective}\n` +
        `**Daily budget:** $${plan.daily_budget_usd}\n` +
        `**Platforms:** ${plan.platforms.join(', ')}\n\n` +
        `**Audiences**\n${plan.audiences.map((a) => `- ${a.name} (${a.size_est}) — ${a.targeting}`).join('\n')}\n\n` +
        `**Creative**\n${plan.creative.map((c) => `- ${c.format}: *${c.angle}* — "${c.hook}"`).join('\n')}\n\n` +
        `**Targets**\n- CPL <= $${plan.kpis.target_cpl_usd}\n- CTR >= ${plan.kpis.target_ctr_pct}%\n- ROAS >= ${plan.kpis.target_roas}x\n\n` +
        `**Experiment plan**\n${plan.experiment_plan.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      data: { agent: 'ads-runner', topic, plan, generated_at: stamp },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Plan generation failed' },
      { status: 500 }
    )
  }
}
