import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://18.213.66.136:8000'

// Client Success — proxy to backend AI for onboarding, retention, QBR
// Delegates communications to Content Creator
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const message = (body.message || body.brief || body.task || '').toString().trim()
    const clientName = (body.client_name || body.clientName || 'Client').toString().trim()

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'A client task is required. Example: { message: "Create onboarding plan for new client" }' },
        { status: 400 }
      )
    }

    // Delegate client communications to Content Creator
    const contentRes = await fetch(`${BACKEND_URL}/api/agents/content-creator/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Write a professional client communication for: ${message}`,
        format: 'email',
        client_name: clientName,
      }),
      signal: AbortSignal.timeout(30000),
    }).then(r => r.json()).catch(() => null)

    const emailDraft = contentRes?.data?.response || contentRes?.response || ''

    const targetUrl = `${BACKEND_URL}/api/agents/client-success/chat`
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message, client_name: clientName,
        email_draft: emailDraft,
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

    if (emailDraft && data?.data) {
      data.data.email_from_creator = emailDraft.substring(0, 500)
    }

    return NextResponse.json(data, { status: response.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Backend unreachable: ${err.message}`, offline: true },
      { status: 503 }
    )
  }
}
