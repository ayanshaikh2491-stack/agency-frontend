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
      // Don't follow redirects so we can handle them ourselves
      redirect: 'manual',
      signal: AbortSignal.timeout(30000),
    })

    // ── Handle OAuth callback (popup flow) ──
    // After user authorizes on FB, the popup hits this URL.
    // Backend returns a 302 redirect. Instead of following it,
    // we return an HTML page that sends a postMessage to the
    // parent window and closes itself.
    if (path.includes('callback') && (resp.status >= 300 && resp.status < 400)) {
      const location = resp.headers.get('location') || ''
      const channel = decodeURIComponent(location.match(/[?&]oauth=([^&]+)/)?.[1] || 'linkedin')
      const success = location.includes('success=1')
      const error = location.match(/error=([^&]+)/)?.[1] || null
      const userMatch = location.match(/user=([^&]+)/)
      const user = userMatch ? decodeURIComponent(userMatch[1]) : null

      const msgFields = [
        `type: 'oauth-result'`,
        `platform: '${String(channel).replace(/'/g, "\\'")}'`,
        `success: ${success}`,
      ]
      if (user) msgFields.push(`user: '${String(user).replace(/'/g, "\\'")}'`)
      if (error) msgFields.push(`error: '${String(error).replace(/'/g, "\\'")}'`)

      const html = `<!DOCTYPE html>
<html><head><title>OAuth Complete</title></head>
<body>
<script>
  (function() {
    const msg = { ${msgFields.join(', ')} };
    if (window.opener) {
      window.opener.postMessage(msg, '*');
    }
    window.close();
  })();
</script>
<p>OAuth complete — closing this window...</p>
</body></html>`

      return new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    // ── Handle backend redirect (non-callback) ──
    if (resp.status >= 300 && resp.status < 400) {
      const location = resp.headers.get('location')
      if (location) {
        return NextResponse.redirect(location, { status: 302 })
      }
    }

    const contentType = resp.headers.get('content-type') || ''
    if (contentType.includes('text/html')) {
      const text = await resp.text()
      return new NextResponse(text, {
        status: resp.status,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    // Try JSON
    try {
      const data = await resp.json()
      return NextResponse.json(data, { status: resp.status })
    } catch {
      const text = await resp.text()
      return new NextResponse(text, {
        status: resp.status,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: `OAuth proxy error: ${error.message}` },
      { status: 502 }
    )
  }
}
