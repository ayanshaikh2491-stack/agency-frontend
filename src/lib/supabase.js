import { createBrowserClient } from '@supabase/ssr'
import { createServerClient as _createServerClient } from '@supabase/ssr'

export function createClient() {
  const { cookies } = require('next/headers')

  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookies().get(name)?.value
        },
        set(name, value, options) {
          cookies().set(name, value, options)
        },
        remove(name, options) {
          cookies().set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )
}

export function createBrowserClientInstance() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function createAdminClient() {
  const { createClient } = require('@supabase/supabase-js')

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
