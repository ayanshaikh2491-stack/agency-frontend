import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://18.213.66.136:8000'
const N8N_PIPELINE_URL = process.env.N8N_PIPELINE_URL || 'https://nexus-n8n-x17d.onrender.com/webhook/n8n-pipeline-status'

async function proxy(request, { params }) {
  const slug = params?.slug
  if (!slug || !Array.isArray(slug)) {
    return NextResponse.json({ success: false, error: 'Invalid route' }, { status: 400 })
  }

  const path = `/api/${slug.join('/')}`

  // Route pipeline/* calls to n8n webhook instead of EC2
  if (slug[0] === 'pipeline') {
    return proxyToN8nPipeline(request, path, slug)
  }

  const url = new URL(request.url)
  const targetUrl = `${BACKEND_URL}${path}${url.search}`
  const method = request.method

  try {
    let body
    if (method !== 'GET' && method !== 'HEAD') {
      body = await request.text()
    }

    // Forward session_token from cookie as X-Session-Token header for backend auth
    const sessionCookie = request.cookies.get('session_token')
    const sessionToken = sessionCookie?.value || ''

    const fetchHeaders = {
      'Content-Type': request.headers.get('content-type') || 'application/json',
      'Accept': 'application/json',
      ...(sessionToken ? { 'X-Session-Token': sessionToken } : {}),
    }

    const response = await fetch(targetUrl, {
      method,
      headers: fetchHeaders,
      body: body || undefined,
      redirect: 'manual',
      signal: AbortSignal.timeout(120000),
    })

    const location = response.headers.get('location')
    if (location) {
      return NextResponse.redirect(location, {
        status: response.status,
        headers: response.headers,
      })
    }

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

/**
 * Route pipeline/* API calls to n8n webhook instead of EC2
 */
async function proxyToN8nPipeline(request, path, slug) {
  const targetUrl = N8N_PIPELINE_URL

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(15000),
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        offline: true,
        pipeline: {
          pipeline_active: false,
          errors: ['Pipeline backend unreachable'],
          queue: { total: 0, new: 0 }
        }
      },
      { status: 503 }
    )
  }
}

export async function GET(request, { params }) { return proxy(request, { params }) }
export async function POST(request, { params }) { return proxy(request, { params }) }
export async function PUT(request, { params }) { return proxy(request, { params }) }
export async function DELETE(request, { params }) { return proxy(request, { params }) }
export async function PATCH(request, { params }) { return proxy(request, { params }) }
