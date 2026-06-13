import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase Auth — replaces PocketBase auth (Session 54 migration)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return NextResponse.json(
        { success: false, error: 'Auth not configured (missing Supabase env vars)' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Use a per-request anon client to perform the password sign-in
    const supabaseAnon = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password })

    if (error || !data?.session) {
      return NextResponse.json(
        { success: false, error: error?.message || 'Invalid email or password' },
        { status: 401 }
      )
    }

    // S83: EspoCRM mirror removed. NocoBase is the new CRM.
    // The /api/nocobase-auth/login route handles the workspace auth.

    const { session, user } = data
    const role = user.user_metadata?.role || user.app_metadata?.role || 'client'

    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role,
            agency_id: user.user_metadata?.agency_id || null,
          },
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
        },
      },
      { status: 200 }
    )

    // Set both legacy session_token (for old middleware) + new sb-access-token (for Supabase SSR)
    response.cookies.set('session_token', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    response.cookies.set('sb-access-token', session.access_token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
