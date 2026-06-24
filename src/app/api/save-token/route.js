import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { client_name, platform, access_token } = body

    if (!platform || !access_token) {
      return NextResponse.json(
        { success: false, error: 'platform and access_token are required' },
        { status: 400 }
      )
    }

    // Use supabase server client
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    const row = {
      client_name: client_name || 'default',
      platform: platform,
      access_token: access_token,
      refresh_token: body.refresh_token || '',
      token_expires_at: body.token_expires_at || null,
      account_id: body.account_id || '',
      meta: body.meta ? JSON.stringify(body.meta) : '{}',
      status: 'connected',
    }

    const { data, error } = await supabase
      .from('social_accounts')
      .upsert(row, { onConflict: 'client_name,platform' })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: `${platform} connected!` })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    )
  }
}
