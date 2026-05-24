import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsonResponse } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, { status: 405 })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: job, error: jobError } = await supabase
    .from('media_cleanup_jobs')
    .insert({ job_type: 'orphan_cleanup', status: 'running' })
    .select('id')
    .single()

  if (jobError) return jsonResponse({ error: jobError.message }, { status: 500 })

  try {
    await supabase.rpc('mark_expired_media_assets')

    const { data: assets, error: assetsError } = await supabase
      .from('media_assets')
      .select('id, storage_bucket, storage_path, related_wish_id')
      .or(`is_orphaned.eq.true,expires_at.lt.${new Date().toISOString()}`)
      .limit(250)

    if (assetsError) throw assetsError

    let processed = 0
    for (const asset of assets ?? []) {
      const { data: wish } = asset.related_wish_id
        ? await supabase.from('wishes').select('status, is_paid, expires_at').eq('id', asset.related_wish_id).maybeSingle()
        : { data: null }
      const activePaid = wish?.status === 'active' && wish?.is_paid === true && (!wish?.expires_at || new Date(wish.expires_at).getTime() > Date.now())
      if (activePaid) continue

      const { error: removeError } = await supabase.storage.from(asset.storage_bucket).remove([asset.storage_path])
      if (removeError) console.warn('[cleanup-orphan-assets] storage remove failed', removeError)
      const { error: deleteError } = await supabase.from('media_assets').delete().eq('id', asset.id)
      if (deleteError) console.warn('[cleanup-orphan-assets] metadata delete failed', deleteError)
      else processed += 1
    }

    await supabase
      .from('media_cleanup_jobs')
      .update({ status: 'completed', assets_processed: processed, completed_at: new Date().toISOString() })
      .eq('id', job.id)

    await supabase.from('analytics_events').insert({
      event_name: 'orphan_cleanup_completed',
      metadata: { assets_processed: processed },
    })

    return jsonResponse({ ok: true, assets_processed: processed })
  } catch (error) {
    await supabase
      .from('media_cleanup_jobs')
      .update({ status: 'failed', completed_at: new Date().toISOString() })
      .eq('id', job.id)

    return jsonResponse({ error: error instanceof Error ? error.message : 'Cleanup failed' }, { status: 500 })
  }
})
