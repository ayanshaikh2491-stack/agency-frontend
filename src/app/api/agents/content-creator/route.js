import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://18.213.66.136:8000'

// Content Creator — proxy to backend ContentExecutor (Groq AI-powered)
// Spec: marketing-ai-agency/agents/content-creator.md
// Modes: blog, caption, email, hook, ad-copy, brand-voice, quality-check, review-analysis, niche-research, content-matrix, full-content-pack
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const message = (body.message || body.brief || body.task || '').toString().trim()
    const format = (body.format || body.mode || 'blog').toString().toLowerCase()
    const clientName = (body.client_name || body.clientName || 'Client').toString().trim()
    const website = (body.website || body.url || '').toString().trim()

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'A brief is required. Example: { message: "Write a 600-word blog about AI marketing for SaaS founders" }' },
        { status: 400 }
      )
    }

    // Proxy to backend ContentExecutor via agent chat endpoint
    const targetUrl = `${BACKEND_URL}/api/agents/content-creator/chat`
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        message,
        format,
        client_name: clientName,
        website,
        industry: body.industry || 'general',
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

    return NextResponse.json(data, { status: response.status })
  } catch (err) {
    // Fallback: direct backend agent execution endpoint
    try {
      const execUrl = `${BACKEND_URL}/api/agent/execute`
      const response = await fetch(execUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'content-creator',
          task: `Create ${format} content: ${message}`,
          context: {
            client_name: body.client_name || 'Client',
            industry: body.industry || 'general',
            website: body.website || '',
          },
        }),
        signal: AbortSignal.timeout(60000),
      })
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } catch (err2) {
      return NextResponse.json(
        { success: false, error: `Backend unreachable: ${err2.message}`, offline: true },
        { status: 503 }
      )
    }
  }
}
