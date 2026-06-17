import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://18.213.66.136:8000'

// SEO Engine — proxy to backend AI for real SEO audits + keyword research
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const message = (body.message || body.url || body.topic || '').toString().trim()
    const url = (body.url || '').toString().trim()
    const mode = (body.mode || '').toString().trim()
    const clientName = (body.client_name || body.clientName || 'Client').toString().trim()

    if (!message && !mode) {
      return NextResponse.json(
        { success: false, error: 'A URL, topic, or mode is required. Example: { message: "https://example.com", mode: "on-page" }' },
        { status: 400 }
      )
    }

    const targetUrl = `${BACKEND_URL}/api/agents/seo-engine/chat`
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, url, mode, client_name: clientName }),
      signal: AbortSignal.timeout(60000),
    })

    const contentType = response.headers.get('content-type') || ''
    let data
    if (contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = { success: false, error: `Backend returned non-JSON: ${response.status}` }
    }

    return NextResponse.json(data, { status: response.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Backend unreachable: ${err.message}`, offline: true },
      { status: 503 }
    )
  }
}
