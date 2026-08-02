import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * CEO API target.
 * Set CEO_API_URL in .env.local to point to the local FastAPI backend.
 * Default: builds from BACKEND_API_URL for backward compat.
 *
 * Local dev:   CEO_API_URL=http://localhost:9002/api/chat/agency
 * Production:  CEO_API_URL=http://18.213.66.136:8000/api/ceo/chat
 */
const CEO_API_URL = process.env.CEO_API_URL ||
  `${process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://18.213.66.136:8000'}/api/ceo/chat`

/**
 * CEO Chat — proxy between frontend and backend.
 *
 * Request mapping (frontend → backend):
 *   session_id  →  conversation_id
 *
 * Response mapping (backend → frontend):
 *   ChatResponse.{ response, conversation_id, agent_type, thinking_phases }
 *   → { success: true, response, conversation_id, agent_type, thinking_phases }
 *
 * POST /api/ceo/chat
 * Body: { message: string, session_id?: string }
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const message = (body.message || '').toString().trim()
    const sessionId = (body.session_id || 'web').toString().trim()

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    // Forward to backend with mapped field names
    const backendResp = await fetch(CEO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversation_id: sessionId,       // frontend session_id → backend conversation_id
      }),
      signal: AbortSignal.timeout(120000),
    })

    const contentType = backendResp.headers.get('content-type') || ''
    let data
    if (contentType.includes('application/json')) {
      data = await backendResp.json()
    } else {
      const text = await backendResp.text()
      return NextResponse.json(
        { success: false, error: `Backend returned non-JSON: ${backendResp.status}`, raw: text },
        { status: backendResp.status }
      )
    }

    // Map backend ChatResponse to frontend format
    return NextResponse.json({
      success: true,
      response: data.response || data.message || '',
      conversation_id: data.conversation_id || sessionId,
      agent_type: data.agent_type || 'ceo',
      thinking_phases: data.thinking_phases || [],
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Backend unreachable: ${err.message}`, offline: true },
      { status: 503 }
    )
  }
}
