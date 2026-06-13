import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const dynamic = 'force-dynamic'

async function proxyToBackend(request) {
  const url = new URL(request.url)
  const targetUrl = `${BACKEND_URL}/api/agents${url.search}`

  try {
    let body
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.text()
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        'Accept': 'application/json',
      },
      body: body || undefined,
      signal: AbortSignal.timeout(30000),
    })

    const contentType = response.headers.get('content-type') || ''
    let data
    if (contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message, offline: true },
      { status: 503 }
    )
  }
}

export async function GET(request) { return proxyToBackend(request) }
export async function POST(request) { return proxyToBackend(request) }
export async function PUT(request) { return proxyToBackend(request) }
export async function DELETE(request) { return proxyToBackend(request) }
export async function PATCH(request) { return proxyToBackend(request) }
