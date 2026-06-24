import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://18.213.66.136:8000'

// Proxy all /api/social/oauth/* requests to backend
export async function GET(request, { params }) {
  const slug = params.slug || []
  const path = slug.join('/')

  // Build query string from the incoming request
  const url = new URL(request.url)
  const queryString = url.search

  const targetUrl = `${BACKEND_URL}/api/social/oauth/${path}${queryString}`

  try {
    const resp = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Follow redirects so we get the final response
      redirect: 'follow',
      signal: AbortSignal.timeout(30000),
    })

    // If backend returned a redirect, forward it to the browser
    if (resp.redirected) {
      return NextResponse.redirect(resp.url, { status: 302 })
    }

    const contentType = resp.headers.get('content-type') || ''
    if (contentType.includes('text/html')) {
      const text = await resp.text()
      return new NextResponse(text, {
        status: resp.status,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    const data = await resp.json()
    return NextResponse.json(data, { status: resp.status })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `OAuth proxy error: ${error.message}` },
      { status: 502 }
    )
  }
}
