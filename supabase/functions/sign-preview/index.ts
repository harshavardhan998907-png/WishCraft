import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

// Signed URLs live this long. A preview is a one-off action, so an hour is
// comfortably enough while still bounding exposure of the URL.
const SIGNED_URL_TTL_SECONDS = 60 * 60

type TemplateSubmissionRow = {
  id: string
  bundle_path: string | null
}

function readBearerToken(req: Request): string | null {
  const header = req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (!header) return null
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, { status: 405 })

  // The admin's session JWT is attached as a Bearer header by
  // supabase.functions.invoke. This is the single point where the caller is
  // authenticated — preview-template trusts the signed URL we hand back.
  const bearerToken = readBearerToken(req)
  if (!bearerToken) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Identify the caller from their access token.
    const anonClient = createClient(supabaseUrl, anonKey)
    const { data: userData, error: userError } = await anonClient.auth.getUser(bearerToken)
    const user = userData.user
    if (userError || !user) {
      return jsonResponse({ error: 'Invalid or expired access token' }, { status: 401 })
    }

    // Service-role client checks the role and signs the storage object.
    const admin = createClient(supabaseUrl, serviceRoleKey)

    // Only admins may preview pending submissions.
    const profileResult = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
    const profile = profileResult.data as { role: string | null } | null
    if (profileResult.error || !profile || profile.role !== 'admin') {
      return jsonResponse({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    const submissionId = typeof body?.submissionId === 'string' ? body.submissionId.trim() : ''
    if (!submissionId) {
      return jsonResponse({ error: 'submissionId is required' }, { status: 400 })
    }

    const submissionResult = await admin
      .from('template_submissions')
      .select('id, bundle_path')
      .eq('id', submissionId)
      .maybeSingle()
    const submission = submissionResult.data as TemplateSubmissionRow | null
    if (submissionResult.error || !submission) {
      return jsonResponse({ error: 'Submission not found' }, { status: 404 })
    }

    const bundlePath = submission.bundle_path ?? `pending/${submissionId}/bundle.js`

    const signed = await admin.storage
      .from('templates-pending')
      .createSignedUrl(bundlePath, SIGNED_URL_TTL_SECONDS)
    if (signed.error || !signed.data?.signedUrl) {
      return jsonResponse({ error: signed.error?.message ?? 'Could not sign bundle URL' }, { status: 500 })
    }

    return jsonResponse({ signedUrl: signed.data.signedUrl })
  } catch (error) {
    console.error('[sign-preview] unhandled error', error)
    return jsonResponse({ error: error instanceof Error ? error.message : 'Failed to sign preview' }, { status: 500 })
  }
})
