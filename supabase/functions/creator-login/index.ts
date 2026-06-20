import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

function isCreatorRole(role: string | null | undefined): boolean {
  return role === 'creator' || role === 'admin'
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, { status: 405 })

    const body = await req.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    const password = typeof body?.password === 'string' ? body.password : ''

    if (!email || !password.trim()) {
      return jsonResponse({ error: 'Email and password required' }, { status: 400 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authClient = createClient(supabaseUrl, anonKey)
    const { data, error } = await authClient.auth.signInWithPassword({ email, password })

    if (error || !data.session || !data.user) {
      return jsonResponse({ error: 'Invalid credentials' }, { status: 401 })
    }

    const authedClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
    })
    const profileResult = await authedClient
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle()

    const profile = profileResult.data as { role: string | null } | null
    if (profileResult.error || !profile || !isCreatorRole(profile.role)) {
      return jsonResponse({ error: 'Not a creator account' }, { status: 403 })
    }

    return jsonResponse({
      token: data.session.access_token,
      email: data.user.email ?? email,
    })
  } catch {
    return jsonResponse({ error: 'Invalid credentials' }, { status: 401 })
  }
})
