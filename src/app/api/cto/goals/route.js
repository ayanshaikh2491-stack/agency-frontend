import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Server-side proxy: browser (HTTPS Vercel) cannot call HTTP Supabase directly
// (mixed content). This route forwards goals writes to the self-hosted Supabase.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request) {
  try {
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 })
    }
    const body = await request.json()
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Resolve client_id: accept UUID directly, or look up by slug/name
    let clientId = body.client_id || 'default'
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRe.test(clientId)) {
      const { data: client, error: clientErr } = await supabase
        .from('clients')
        .select('id')
        .or(`slug.eq.${clientId},name.eq.${clientId}`)
        .limit(1)
        .maybeSingle()
      if (clientErr || !client) {
        return NextResponse.json({ success: false, error: `Unknown client: ${clientId}` }, { status: 400 })
      }
      clientId = client.id
    }

    // goal_status enum: draft, active, in_progress, completed, cancelled
    const statusMap = { pending: 'active', new: 'draft', done: 'completed', in_progress: 'in_progress' }
    const insertRow = {
      client_id: clientId,
      title: body.content || body.title || '',
      description: body.description || body.content || '',
      status: statusMap[body.status] || body.status || 'active',
      command_type: body.command_type || 'cto-command',
      created_at: body.created_at || new Date().toISOString(),
      updated_at: body.updated_at || new Date().toISOString(),
    }
    // created_by is a UUID FK — only set when a valid UUID is provided
    if (body.created_by && uuidRe.test(body.created_by)) {
      insertRow.created_by = body.created_by
    }
    const { data, error } = await supabase
      .from('goals')
      .insert(insertRow)
      .select()
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
