import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * /api/portal/auth-check
 * Returns the signed-in client user, or 401 if not signed in.
 * Pattern: copy of /api/auth/me with portal-specific error messages.
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value || cookieStore.get('session_token')?.value
    if (!accessToken) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return NextResponse.json({ success: false, error: 'Auth not configured' }, { status: 500 })

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    })
    const { data, error } = await supabase.auth.getUser(accessToken)
    if (error || !data?.user) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })

    const user = data.user
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: user.user_metadata?.role || user.app_metadata?.role || 'client',
        },
      },
    })
  } catch (err) {
    console.error('portal/auth-check error:', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
