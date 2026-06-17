import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://18.213.66.136:8000'

// Social Manager — routes to backend AI, delegates content to Content Creator
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const message = (body.message || body.brief || body.task || '').toString().trim()
    const platform = (body.platform || body.mode || 'linkedin').toString().toLowerCase()
    const clientName = (body.client_name || body.clientName || 'Client').toString().trim()

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'A brand/topic brief is required. Example: { message: "B2B SaaS for HR teams" }' },
        { status: 400 }
      )
    }

    // Delegate content creation to Content Creator
    const contentRes = await fetch(`${BACKEND_URL}/api/agents/content-creator/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Create ${platform} social media content for: ${message}`,
        format: 'caption',
        client_name: clientName,
      }),
      signal: AbortSignal.timeout(30000),
    }).then(r => r.json()).catch(() => null)

    const socialContent = contentRes?.data?.response || contentRes?.response || ''

    // Get social strategy from backend
    const targetUrl = `${BACKEND_URL}/api/agents/social-manager/chat`
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message, platform, client_name: clientName,
        pre_generated_content: socialContent,
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

    if (socialContent && data?.data) {
      data.data.content_from_creator = socialContent.substring(0, 500)
    }

    return NextResponse.json(data, { status: response.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Backend unreachable: ${err.message}`, offline: true },
      { status: 503 }
    )
  }
}
