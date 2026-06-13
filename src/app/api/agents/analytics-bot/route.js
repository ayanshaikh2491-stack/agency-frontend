import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Analytics Bot — surfaces "what changed and why" + a weekly report
// Spec: marketing-ai-agency/agents/analytics-bot.md
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const message = (body.message || body.question || 'weekly report').toString().trim()
    const stamp = new Date().toISOString()

    const kpis = {
      revenue_usd: 18420,
      revenue_change_pct: 12.4,
      leads: 312,
      leads_change_pct: 8.1,
      cac_usd: 41,
      cac_change_pct: -6.2,
      roas: 3.1,
      roas_change_pct: 0.4,
      active_campaigns: 7,
      active_clients: 18,
    }

    const channels = [
      { name: 'Organic search', leads: 118, spend: 0, cpl: 0, change: '+14%' },
      { name: 'Paid — Meta', leads: 96, spend: 2400, cpl: 25, change: '+6%' },
      { name: 'Paid — Google', leads: 58, spend: 1800, cpl: 31, change: '-3%' },
      { name: 'Email', leads: 22, spend: 0, cpl: 0, change: '+22%' },
      { name: 'Referral', leads: 18, spend: 0, cpl: 0, change: 'flat' },
    ]

    const wins = [
      'Organic search up 14% — new "vs" comparison post is ranking page 1 for 3 commercial terms',
      'Email re-engagement flow added 22% MoM leads at $0 spend',
      'Meta retargeting CPL dropped 18% after creative refresh on Day 9',
    ]
    const risks = [
      'Google brand CPC up 11% — check if competitor just launched a branded term bid',
      'CashClaw lead queue 4x larger than last week — conversion team is the bottleneck, not supply',
    ]
    const actions = [
      'Reallocate $500/mo from Google brand to Meta lookalike — both have a 28-day trend we can exploit',
      'Ship the comparison post follow-up (3 internal links missing)',
      'Brief conversion team on CashClaw lead triage: 90s SLA on first reply',
    ]

    return NextResponse.json({
      success: true,
      response:
        `**Analytics Bot — weekly report**\n\n` +
        `**Top KPIs**\n` +
        `- Revenue: $${kpis.revenue_usd.toLocaleString()} (${kpis.revenue_change_pct >= 0 ? '+' : ''}${kpis.revenue_change_pct}%)\n` +
        `- Leads: ${kpis.leads} (${kpis.leads_change_pct >= 0 ? '+' : ''}${kpis.leads_change_pct}%)\n` +
        `- CAC: $${kpis.cac_usd} (${kpis.cac_change_pct}%)\n` +
        `- ROAS: ${kpis.roas}x\n\n` +
        `**Channel mix**\n${channels.map((c) => `- ${c.name}: ${c.leads} leads${c.spend ? `, $${c.spend} spend, CPL $${c.cpl}` : ''} (${c.change})`).join('\n')}\n\n` +
        `**Wins**\n${wins.map((w) => `- ${w}`).join('\n')}\n\n` +
        `**Risks**\n${risks.map((r) => `- ${r}`).join('\n')}\n\n` +
        `**Actions**\n${actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}`,
      data: { agent: 'analytics-bot', question: message, kpis, channels, wins, risks, actions, generated_at: stamp },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Analytics failed' },
      { status: 500 }
    )
  }
}
