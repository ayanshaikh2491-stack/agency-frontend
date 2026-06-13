import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase Auth signup — replaces PocketBase signup (Session 54 migration)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function POST(request) {
  try {
    const body = await request.json()
    const { fullName, email, password } = body

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { success: false, error: 'Auth not configured' },
        { status: 500 }
      )
    }

    // Use service-role client to create the user (admin signup, no email confirmation)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'client' },
    })

    if (createErr || !created?.user) {
      const msg = createErr?.message || 'Failed to create account'
      if (/already|registered|exists/i.test(msg)) {
        return NextResponse.json(
          { success: false, error: 'This email is already registered' },
          { status: 409 }
        )
      }
      return NextResponse.json({ success: false, error: msg }, { status: 400 })
    }

    // S83: EspoCRM mirror removed. NocoBase is the new CRM.
    // The /api/nocobase-auth/signup route handles the workspace account creation.

    // Sign the new user in immediately to get a session
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: signed, error: signErr } = await anonClient.auth.signInWithPassword({ email, password })

    const userId = created.user.id
    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: userId,
            email,
            name: fullName,
            role: 'client',
            agency_id: null,
          },
          message: 'Account created successfully.',
        },
      },
      { status: 201 }
    )

    if (signed?.session) {
      response.cookies.set('session_token', signed.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
      response.cookies.set('sb-access-token', signed.session.access_token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
    }

    return response
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
