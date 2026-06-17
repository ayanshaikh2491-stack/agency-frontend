import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://18.213.66.136:8000'

// Ads Runner — routes to backend AI, delegates ad copy to Content Creator
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const message = (body.message || body.brief || body.task || '').toString().trim()
    const budget = Number(body.budget) || 1000
    const clientName = (body.client_name || body.clientName || 'Client').toString().trim()

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'A campaign brief is required. Example: { message: "Lead gen for B2B SaaS HR tool", budget: 3000 }' },
        { status: 400 }
      )
    }

    // Delegate ad copy generation to Content Creator
    const contentRes = await fetch(`${BACKEND_URL}/api/agents/content-creator/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Write ad copy for: ${message}. Include 3 headlines, 3 primary texts, and CTAs for Facebook and Google Ads.`,
        format: 'ad-copy',
        client_name: clientName,
      }),
      signal: AbortSignal.timeout(30000),
    }).then(r => r.json()).catch(() => null)

    const adCopy = contentRes?.data?.response || contentRes?.response || ''

    // Get full campaign plan from backend ads-runner
    const targetUrl = `${BACKEND_URL}/api/agents/ads-runner/chat`
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message, budget, client_name: clientName, ad_copy: adCopy,
      }),
      signal: AbortSignal.timeout(60000),
    })

    const contentType = response.headers.get('content-type') || ''
    let data
    if (contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = { success: false, error: `Backend returned non-JSON: ${response.status}` }
    }

    if (adCopy && data?.data) {
      data.data.ad_copy_generated = adCopy.substring(0, 500)
    }

    return NextResponse.json(data, { status: response.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Backend unreachable: ${err.message}`, offline: true },
      { status: 503 }
    )
  }
}
