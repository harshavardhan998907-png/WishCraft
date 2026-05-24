import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsonResponse } from '../_shared/cors.ts'

type Job = {
  id: string
  job_type: string
  payload: Record<string, unknown>
  retry_count: number
}

function sanitize(value: unknown, maxLength = 600) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/[{}[\]<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

async function sendEmail(input: { to: string | null; subject: string; html: string }) {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('NOTIFICATION_FROM_EMAIL')
  if (!apiKey || !from || !input.to) return { skipped: true }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: sanitize(input.subject, 140),
      html: sanitize(input.html, 2000),
    }),
  })

  if (!response.ok) throw new Error(`Email delivery failed: ${response.status}`)
  return { skipped: false }
}

async function profileEmail(supabase: ReturnType<typeof createClient>, userId: string | null) {
  if (!userId) return null
  const { data } = await supabase.from('profiles').select('email').eq('id', userId).maybeSingle()
  return data?.email ?? null
}

async function preferencesAllowEmail(supabase: ReturnType<typeof createClient>, userId: string | null, type: string) {
  if (!userId) return false
  const { data } = await supabase.from('notification_preferences').select('*').eq('user_id', userId).maybeSingle()
  if (!data) return true
  if (!data.email_enabled) return false
  if (type.includes('payment')) return data.payment_notifications_enabled
  if (type.includes('reminder') || type.includes('expiry')) return data.reminder_notifications_enabled
  if (type.includes('engagement')) return data.engagement_enabled
  if (type.includes('creator') || type.includes('moderation')) return data.creator_updates_enabled
  return true
}

async function createNotification(supabase: ReturnType<typeof createClient>, input: {
  userId: string
  type: string
  title: string
  message: string
  metadata?: Record<string, unknown>
}) {
  const { data, error } = await supabase.rpc('create_notification', {
    target_user_id: input.userId,
    target_notification_type: input.type,
    target_title: input.title,
    target_message: input.message,
    target_metadata: input.metadata ?? {},
  })
  if (error) throw error
  return data as string | null
}

async function logEvent(supabase: ReturnType<typeof createClient>, eventName: string, metadata: Record<string, unknown>) {
  await supabase.from('analytics_events').insert({ event_name: eventName, metadata })
}

async function processJob(supabase: ReturnType<typeof createClient>, job: Job) {
  const payload = job.payload ?? {}
  const userId = sanitize(payload.user_id, 80)
  const wishId = sanitize(payload.wish_id, 80)
  const templateId = sanitize(payload.template_id, 80)

  let type = job.job_type
  let title = 'Template Hub update'
  let message = 'You have a new update.'

  if (job.job_type === 'wish_expiry_reminder') {
    type = 'wish_expiry_reminder'
    title = 'Your wish is expiring soon'
    message = 'A shared wish is nearing the end of its 7-day live window.'
  }

  if (job.job_type === 'abandoned_wish_reminder') {
    type = 'abandoned_wish_reminder'
    title = 'Finish your wish'
    message = 'Your draft wish is still waiting. You can finish and share it anytime.'
  }

  if (job.job_type === 'creator_moderation_reminder') {
    type = 'template_moderation'
    title = 'Template moderation update'
    message = sanitize(payload.message ?? 'A creator template needs review or has a moderation update.')
  }

  if (job.job_type === 'payment_status_reminder') {
    type = 'payment_failed'
    title = 'Payment needs attention'
    message = 'A payment is still pending or failed. You can retry safely from your payment history.'
  }

  if (job.job_type === 'engagement_reminder') {
    type = 'engagement_reminder'
    title = 'Your wish is getting attention'
    message = 'People are interacting with your celebration page.'
  }

  if (!userId) throw new Error('Scheduled job missing user_id')

  const notificationId = await createNotification(supabase, {
    userId,
    type,
    title,
    message,
    metadata: { ...payload, job_id: job.id },
  })

  if (notificationId && await preferencesAllowEmail(supabase, userId, type)) {
    try {
      await sendEmail({
        to: await profileEmail(supabase, userId),
        subject: title,
        html: `<p>${message}</p>`,
      })
    } catch (error) {
      await logEvent(supabase, 'email_delivery_failed', { job_id: job.id, type, error: error instanceof Error ? error.message : 'Email failed' })
    }
  }

  await logEvent(supabase, 'notification_sent', { job_id: job.id, notification_id: notificationId, type, wish_id: wishId || null, template_id: templateId || null })
}

serve(async (req) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, { status: 405 })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: jobs, error } = await supabase
    .from('scheduled_jobs')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(25)

  if (error) return jsonResponse({ error: error.message }, { status: 500 })

  let processed = 0
  for (const job of (jobs ?? []) as Job[]) {
    await supabase.from('scheduled_jobs').update({ status: 'processing' }).eq('id', job.id).eq('status', 'pending')
    try {
      await processJob(supabase, job)
      await supabase.from('scheduled_jobs').update({ status: 'completed', processed_at: new Date().toISOString() }).eq('id', job.id)
      await supabase.from('automation_logs').insert({ job_id: job.id, execution_status: 'completed' })
      await logEvent(supabase, 'automation_job_executed', { job_id: job.id, job_type: job.job_type })
      processed += 1
    } catch (error) {
      const retryCount = job.retry_count + 1
      const terminal = retryCount >= 3
      await supabase
        .from('scheduled_jobs')
        .update({
          status: terminal ? 'dead_letter' : 'pending',
          retry_count: retryCount,
          scheduled_for: new Date(Date.now() + retryCount * 15 * 60 * 1000).toISOString(),
          processed_at: terminal ? new Date().toISOString() : null,
        })
        .eq('id', job.id)
      await supabase.from('automation_logs').insert({
        job_id: job.id,
        execution_status: terminal ? 'dead_letter' : 'failed',
        error_message: error instanceof Error ? error.message : 'Automation failed',
      })
      await logEvent(supabase, 'automation_job_failed', { job_id: job.id, job_type: job.job_type, terminal })
    }
  }

  return jsonResponse({ ok: true, processed })
})
