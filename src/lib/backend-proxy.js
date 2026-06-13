import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function proxyToBackend(request, { params } = {}) {
  const url = new URL(request.url)
  let path = url.pathname
  if (params && params.slug) {
    path = `/api/${Array.isArray(params.slug) ? params.slug.join('/') : params.slug}`
  }
  const search = url.search
  const targetUrl = `${BACKEND_URL}${path}${search}`

  try {
    const headers = new Headers(request.headers)
    headers.delete('host')

    const body = request.method !== 'GET' && request.method !== 'HEAD'
      ? await request.text()
      : undefined

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      signal: AbortSignal.timeout(30000),
    })

    const contentType = response.headers.get('content-type') || ''
    let data
    if (contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    return NextResponse.json(
      { success: response.ok, data },
      { status: response.status }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message, offline: true },
      { status: 503 }
    )
  }
}

export async function proxyGet(request, { params } = {}) {
  const url = new URL(request.url)
  const path = params?.slug
    ? `/api/${Array.isArray(params.slug) ? params.slug.join('/') : params.slug}`
    : url.pathname
  const targetUrl = `${BACKEND_URL}${path}${url.search}`

  try {
    const res = await fetch(targetUrl, { signal: AbortSignal.timeout(30000) })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message, offline: true }, { status: 503 })
  }
}

export async function proxyPost(request, { params } = {}) {
  const url = new URL(request.url)
  const path = params?.slug
    ? `/api/${Array.isArray(params.slug) ? params.slug.join('/') : params.slug}`
    : url.pathname
  const targetUrl = `${BACKEND_URL}${path}${url.search}`
  const body = await request.json()

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message, offline: true }, { status: 503 })
  }
}

export async function proxyPut(request, { params } = {}) {
  const url = new URL(request.url)
  const path = params?.slug
    ? `/api/${Array.isArray(params.slug) ? params.slug.join('/') : params.slug}`
    : url.pathname
  const targetUrl = `${BACKEND_URL}${path}${url.search}`
  const body = await request.json()

  try {
    const res = await fetch(targetUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message, offline: true }, { status: 503 })
  }
}

export async function proxyDelete(request, { params } = {}) {
  const url = new URL(request.url)
  const path = params?.slug
    ? `/api/${Array.isArray(params.slug) ? params.slug.join('/') : params.slug}`
    : url.pathname
  const targetUrl = `${BACKEND_URL}${path}${url.search}`

  try {
    const res = await fetch(targetUrl, { method: 'DELETE', signal: AbortSignal.timeout(30000) })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message, offline: true }, { status: 503 })
  }
}
