import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Python ads server — local
const ADS_SERVER = process.env.ADS_SERVER_URL || 'http://localhost:8765'

/**
 * Ads Runner — Calls local Python ads_executor server
 * 
 * Supports both:
 *   - /api/agents/ads-runner/chat (natural language from CEO/agents page)
 *   - /api/agents/ads-runner/command (direct commands)
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const message = (body.message || body.brief || body.task || '').toString().trim()
    const clientName = (body.client_name || body.clientName || '').toString().trim()
    const clientId = body.client_id || body.clientId || clientName.toLowerCase().replace(/\s+/g, '_')
    const skipServer = body.skipServer || false

    // Health check first
    try {
      const healthRes = await fetch(`${ADS_SERVER}/health`, { signal: AbortSignal.timeout(3000) })
      if (!healthRes.ok) throw new Error('Health check failed')
    } catch (e) {
      // Return useful info even if server is down
      return NextResponse.json({
        success: true,
        data: {
          response: `⚠️ **Ads Server is offline** — Python backend not running.\n\nStart karne ke liye terminal mein ye command do:\n\`\`\`\ncd backend && uv run --python 3.13 --with requests python ads_server.py\n\`\`\`\n\nAds Server available commands:\n• Campaign create\n• Research analysis\n• Ad copy generation\n• Campaign performance\n• Activate/pause campaigns`,
          ads_server: false,
        },
      })
    }

    // Route to Python server
    let targetPath = '/chat'
    let payload = { message, client_name: clientName, client_id: clientId }

    // Detect direct commands
    const l = message.toLowerCase()
    if (l.startsWith('store-keys') || l.startsWith('store keys')) {
      targetPath = '/store-keys'
      payload = { ...body }
    } else if (l.startsWith('check') && !l.includes('campaign')) {
      targetPath = '/check'
      payload = { client_id: clientId }
    } else if (l.startsWith('create') || l.startsWith('campaign') || l.startsWith('ban')) {
      targetPath = '/campaign/create'
      payload = { client_id: clientId, name: body.campaignName || message, objective: body.objective || 'OUTCOME_LEADS', daily_budget: body.budget || 500, headline: body.headline || '', body_text: body.body || '', cta: body.cta || 'LEARN_MORE' }
    } else if (l.startsWith('activate') || l.startsWith('active')) {
      targetPath = '/campaign/activate'
      const cid = message.split(/\s+/)[1] || body.campaignId || ''
      payload = { client_id: clientId, campaign_id: cid }
    } else if (l.startsWith('pause') || l.startsWith('stop')) {
      targetPath = '/campaign/pause'
      const cid = message.split(/\s+/)[1] || body.campaignId || ''
      payload = { client_id: clientId, campaign_id: cid }
    } else if (l.startsWith('perf') || l.startsWith('performance') || l.startsWith('stats')) {
      targetPath = '/campaign/performance'
      const cid = message.split(/\s+/)[1] || body.campaignId || ''
      payload = { client_id: clientId, campaign_id: cid }
    } else if (l.startsWith('research') || l.startsWith('opportunity')) {
      targetPath = '/research'
      payload = { name: clientName, industry: body.industry || body.brief || message, budget: body.budget || 15000 }
    } else if (l.startsWith('adcopy') || l.startsWith('ad copy') || l.startsWith('write ad')) {
      targetPath = '/adcopy'
      payload = { name: clientName, industry: body.industry || body.brief || '', offer: body.offer || body.headline || '', audience: body.audience || message }
    }

    const response = await fetch(`${ADS_SERVER}${targetPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000),
    })

    const data = await response.json()

    // Format response for chat display
    if (data.response) {
      return NextResponse.json({ success: true, data: { response: data.response, campaign_id: data.campaign_id } })
    }

    // Raw data response (for commands like check, list clients)
    return NextResponse.json({ success: true, data: { response: formatData(data), raw: data } })

  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Ads Server error: ${err.message}`, offline: true },
      { status: 503 }
    )
  }
}

function formatData(data) {
  if (data.clients) {
    if (!data.clients.length) return "📭 **No clients found.** Pehle client add karo aur keys store karo."
    return `📋 **Clients:**\n${data.clients.map(c => `  • ${c}`).join('\n')}`
  }
  if (data.message) return data.message
  return JSON.stringify(data, null, 2)
}
