import { NextResponse } from 'next/server'

/**
 * SBA API catch-all proxy.
 * Handles /api/sba/* paths (chat, status, leads, meetings, etc.)
 * Routes to the EC2 SBA backend.
 */
const SBA_API_URL = process.env.SBA_API_URL ||
  `${process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://18.213.66.136:8000'}/api/sba`

export const dynamic = 'force-dynamic'

async function proxyToSBA(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/sba', '')
  const targetUrl = `${SBA_API_URL}${path}${url.search}`

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
      signal: AbortSignal.timeout(240000), // 4 min for LLM calls
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

export async function GET(request, { params }) { return proxyToSBA(request) }
export async function POST(request, { params }) { return proxyToSBA(request) }
export async function PUT(request, { params }) { return proxyToSBA(request) }
export async function DELETE(request, { params }) { return proxyToSBA(request) }
export async function PATCH(request, { params }) { return proxyToSBA(request) }
