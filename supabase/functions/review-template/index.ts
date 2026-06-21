import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

type ReviewAction = 'approve' | 'reject'

type TemplateSubmissionConfig = {
  name: string
  slug: string
  category: string
  price: number
}

type TemplateSubmissionRow = {
  id: string
  creator_id: string
  config: TemplateSubmissionConfig
  status: string
  bundle_path: string | null
  preview_path: string | null
}

// occasion_type enum values from migration 002_templates.sql. The submitted
// config.category does not always map onto this enum (e.g. "thankyou"), so we
// fall back to "other" for anything unknown.
const occasionTypes = [
  'birthday',
  'wedding',
  'anniversary',
  'festival',
  'graduation',
  'baby_shower',
  'farewell',
  'valentine',
  'other',
] as const
type OccasionType = (typeof occasionTypes)[number]

function toOccasion(category: unknown): OccasionType {
  return typeof category === 'string' && (occasionTypes as readonly string[]).includes(category)
    ? (category as OccasionType)
    : 'other'
}

function readBearerToken(req: Request): string | null {
  const header = req.headers.get('authorization') ?? req.headers.get('Authorization')
  if (!header) return null
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}

async function toBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer())
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, { status: 405 })

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
      return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    // Service-role client performs the privileged storage + table work.
    const admin = createClient(supabaseUrl, serviceRoleKey)

    // Only admins may review submissions.
    const profileResult = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    const profile = profileResult.data as { role: string | null } | null
    if (profileResult.error || !profile || profile.role !== 'admin') {
      return jsonResponse({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    const submissionId = typeof body?.submissionId === 'string' ? body.submissionId : ''
    const action = body?.action as ReviewAction | undefined
    const rejectionNote = typeof body?.rejectionNote === 'string' ? body.rejectionNote : ''

    if (!submissionId || (action !== 'approve' && action !== 'reject')) {
      return jsonResponse({ error: 'submissionId and a valid action (approve|reject) are required' }, { status: 400 })
    }

    const submissionResult = await admin
      .from('template_submissions')
      .select('id, creator_id, config, status, bundle_path, preview_path')
      .eq('id', submissionId)
      .maybeSingle()
    const submission = submissionResult.data as TemplateSubmissionRow | null
    if (submissionResult.error || !submission) {
      return jsonResponse({ error: 'Submission not found' }, { status: 404 })
    }

    if (submission.status !== 'pending') {
      return jsonResponse({ error: `Submission already ${submission.status}` }, { status: 409 })
    }

    const reviewedAt = new Date().toISOString()

    if (action === 'reject') {
      const rejectResult = await admin
        .from('template_submissions')
        .update({
          status: 'rejected',
          rejection_note: rejectionNote || null,
          reviewed_at: reviewedAt,
          reviewed_by: user.id,
        })
        .eq('id', submissionId)

      if (rejectResult.error) {
        return jsonResponse({ error: 'Failed to reject submission' }, { status: 500 })
      }

      return jsonResponse({ success: true })
    }

    // ---- APPROVE ----
    const config = submission.config
    const bundlePath = submission.bundle_path ?? `pending/${submissionId}/bundle.js`
    const previewPath = submission.preview_path ?? `pending/${submissionId}/preview.png`

    const bundleDownload = await admin.storage.from('templates-pending').download(bundlePath)
    if (bundleDownload.error || !bundleDownload.data) {
      return jsonResponse({ error: 'Failed to read submitted bundle' }, { status: 500 })
    }

    const previewDownload = await admin.storage.from('templates-pending').download(previewPath)
    if (previewDownload.error || !previewDownload.data) {
      return jsonResponse({ error: 'Failed to read submitted preview' }, { status: 500 })
    }

    const bundleBytes = await toBytes(bundleDownload.data)
    const previewBytes = await toBytes(previewDownload.data)

    const approvedBundlePath = `approved/${submissionId}/bundle.js`
    const approvedPreviewPath = `approved/${submissionId}/preview.png`

    const bundleUpload = await admin.storage.from('templates-approved').upload(approvedBundlePath, bundleBytes, {
      contentType: 'application/javascript',
      upsert: true,
    })
    if (bundleUpload.error) {
      return jsonResponse({ error: 'Failed to publish bundle' }, { status: 500 })
    }

    const previewUpload = await admin.storage.from('templates-approved').upload(approvedPreviewPath, previewBytes, {
      contentType: 'image/png',
      upsert: true,
    })
    if (previewUpload.error) {
      return jsonResponse({ error: 'Failed to publish preview' }, { status: 500 })
    }

    const bundleUrl = admin.storage.from('templates-approved').getPublicUrl(approvedBundlePath).data.publicUrl
    const thumbnailUrl = admin.storage.from('templates-approved').getPublicUrl(approvedPreviewPath).data.publicUrl

    const insertResult = await admin
      .from('templates')
      .insert({
        name: config.name,
        slug: config.slug,
        // templates.occasion is a NOT NULL enum; config.category maps onto it.
        occasion: toOccasion(config.category),
        // templates has no `price` column — store the submitted price in price_paise.
        price_paise: typeof config.price === 'number' ? config.price : 0,
        component_name: config.slug,
        // component_key is NOT NULL with no default (migration 023) and must be
        // unique. The slug is unique per template, so it doubles as the key.
        component_key: config.slug,
        bundle_url: bundleUrl,
        thumbnail_url: thumbnailUrl,
        status: 'published',
        is_active: true,
        is_external: true,
        submission_id: submissionId,
      })
      .select('id')
      .single()

    if (insertResult.error || !insertResult.data) {
      return jsonResponse({ error: insertResult.error?.message ?? 'Failed to create template' }, { status: 500 })
    }

    const templateId = (insertResult.data as { id: string }).id

    const updateResult = await admin
      .from('template_submissions')
      .update({
        status: 'approved',
        reviewed_at: reviewedAt,
        reviewed_by: user.id,
      })
      .eq('id', submissionId)

    if (updateResult.error) {
      return jsonResponse({ error: 'Template created but submission update failed' }, { status: 500 })
    }

    return jsonResponse({ success: true, templateId })
  } catch (error) {
    console.error('[review-template] unhandled error', error)
    return jsonResponse({ error: error instanceof Error ? error.message : 'Review failed' }, { status: 500 })
  }
})
