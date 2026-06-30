import { NextResponse } from 'next/server'

const SBA_URL = process.env.SBA_API_URL || 'http://127.0.0.1:9001'

export const dynamic = 'force-dynamic'

async function proxyToSBA(request) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/sba', '')
  const targetUrl = `${SBA_URL}${path}${url.search}`

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
      signal: AbortSignal.timeout(120000),
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

export async function GET(request) { return proxyToSBA(request) }
export async function POST(request) { return proxyToSBA(request) }
export async function PUT(request) { return proxyToSBA(request) }
export async function DELETE(request) { return proxyToSBA(request) }
export async function PATCH(request) { return proxyToSBA(request) }
