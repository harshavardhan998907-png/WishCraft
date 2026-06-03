import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LivePreview } from '../components/editor/LivePreview'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { addDays, formatPrice, generateWishSlug } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { useEditorStore } from '../store/editorStore'
import { useToastStore } from '../store/toastStore'
import type { Template } from '../types'
import { markPaymentFailed, startPayment, verifyPayment } from '../modules/payments/services/paymentService'
import { linkMediaAssetsToWish } from '../modules/media/services/mediaService'
import { createSelfNotification, enqueueScheduledJob } from '../modules/notifications/services/notificationService'
import { Sparkles } from 'lucide-react'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const missingTableCode = 'PGRST205'

export function Preview() {
  const editor = useEditorStore()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const toast = useToastStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const data = { recipientName: editor.recipientName, senderName: editor.senderName, customMessage: editor.customMessage, photoUrls: editor.photoUrls, musicUrl: editor.musicUrl }

  async function ensureProfileExists() {
    if (!user) throw new Error('You must be signed in before creating a wish')

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email ?? '',
      full_name: profile?.full_name ?? editor.senderName,
      avatar_url: profile?.avatar_url ?? null,
      role: profile?.role ?? 'user',
    })

    if (error) {
      console.error('[Preview] profile upsert failed before wish creation', { userId: user.id, error })
      throw new Error(`Could not prepare your profile: ${error.message}`)
    }
  }

  async function resolveDatabaseTemplate(): Promise<Template> {
    if (!editor.template) throw new Error('Missing selected template')

    if (uuidPattern.test(editor.template.id)) {
      return editor.template
    }

    console.warn('[Preview] selected template is a local fallback; resolving database template by slug', {
      localTemplateId: editor.template.id,
      slug: editor.template.slug,
    })

    const { data: template, error } = await supabase
      .from('templates')
      .select('*')
      .eq('slug', editor.template.slug)
      .single()

    console.info('[Preview] database template lookup result', {
      slug: editor.template.slug,
      found: Boolean(template),
      error,
    })

    if (error?.code === missingTableCode) {
      throw new Error('Supabase cannot find public.templates. Run migrations 001 through 009, then refresh the schema cache.')
    }

    if (error || !template) {
      throw new Error(`Template "${editor.template.slug}" is missing in Supabase. Run migration 009_ensure_default_templates.sql before creating wishes.`)
    }

    return template as Template
  }

  async function createWish(status: 'draft' | 'active', paid = false) {
    if (!user) throw new Error('You must be signed in before creating a wish')
    await ensureProfileExists()
    const template = await resolveDatabaseTemplate()
    let slug = generateWishSlug()
    for (let i = 0; i < 3; i += 1) {
      const { data: existing } = await supabase.from('wishes').select('id').eq('slug', slug).maybeSingle()
      if (!existing) break
      slug = generateWishSlug()
    }
    const row = {
      user_id: user.id,
      template_id: template.id,
      slug,
      recipient_name: editor.recipientName,
      sender_name: editor.senderName,
      custom_message: editor.customMessage,
      photo_urls: editor.photoUrls,
      music_url: editor.musicUrl,
      status,
      is_paid: paid,
      expires_at: status === 'active' ? addDays(new Date(), 7) : null,
      activated_at: status === 'active' ? new Date().toISOString() : null,
    }
    console.info('[Preview] inserting wish', {
      status,
      paid,
      slug,
      userId: user.id,
      templateId: template.id,
      templateSlug: template.slug,
    })
    const { data, error } = await supabase.from('wishes').insert(row).select('id, slug').single()
    console.info('[Preview] wish insert result', { data, error })
    if (error) throw new Error(error.message)
    await linkMediaAssetsToWish([...editor.photoUrls, editor.musicUrl ?? ''], data.id)
    void createSelfNotification({
      type: status === 'active' ? 'wish_published' : 'abandoned_wish_reminder',
      title: status === 'active' ? 'Wish created' : 'Wish draft created',
      message: status === 'active' ? 'Your wish is live and ready to share.' : 'Your wish draft is ready. Finish payment to activate it.',
      metadata: { wish_id: data.id, slug, template_id: template.id },
    })
    if (status === 'active') {
      void enqueueScheduledJob({
        jobType: 'wish_expiry_reminder',
        payload: { user_id: user.id, wish_id: data.id, template_id: template.id },
        scheduledFor: addDays(new Date(), 6),
      }).catch(() => undefined)
    } else {
      void enqueueScheduledJob({
        jobType: 'abandoned_wish_reminder',
        payload: { user_id: user.id, wish_id: data.id, template_id: template.id },
        scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      }).catch(() => undefined)
    }
    return data as { id: string; slug: string }
  }

  async function handleShare() {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      if (!editor.template) return
      console.info('[Preview] share submit started', {
        templateId: editor.template.id,
        templateSlug: editor.template.slug,
        pricePaise: editor.template.price_paise,
        userId: user?.id,
        hasSession: Boolean(user),
      })
      const template = await resolveDatabaseTemplate()
      if (template.price_paise === 0) {
        const wish = await createWish('active', false)
        console.info('[Preview] free wish created', wish)
        toast.push('success', 'Wish published successfully!')
        navigate(`/share/${wish.slug}`)
      }
      else {
        const wish = await createWish('draft', false)
        console.info('[Preview] draft wish created, opening payment', wish)
        const payment = await startPayment({
          amount: template.price_paise,
          wishId: wish.id,
          templateId: template.id,
          userName: profile?.full_name ?? editor.senderName,
          userEmail: user?.email ?? '',
        })
        console.info('[Preview] Razorpay payment success callback', { paymentId: payment.paymentId, orderId: payment.orderId, dbOrderId: payment.dbOrderId, wishId: wish.id })
        await verifyPayment({ ...payment, wishId: wish.id, templateId: template.id })
        toast.push('success', 'Wish published successfully!')
        navigate(`/share/${wish.slug}`)
      }
    } catch (err) {
      console.error('[Preview] create/share failed', err)
      if (editor.template) {
        await markPaymentFailed({
          wishId: undefined,
          templateId: editor.template.id,
          reason: err instanceof Error ? err.message : 'Payment failed',
        })
      }
      toast.push('error', err instanceof Error ? err.message : 'Could not create wish')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!editor.template) {
    return (
      <div className="mx-auto max-w-md p-12 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-4">
          <Sparkles size={32} />
        </div>
        <h2 className="text-2xl font-heading font-black text-ink dark:text-white">No template selected</h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          Please select a template from the collection to preview and customize your wish experience.
        </p>
        <Button onClick={() => navigate('/browse')} className="rounded-xl px-6">
          Browse Collection
        </Button>
      </div>
    )
  }
  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <LivePreview template={editor.template} data={data} />
      <div className="flex flex-col sm:flex-row items-center justify-between rounded-2xl bg-white p-6 shadow-premium border border-zinc-100 dark:border-white/10 dark:bg-ink dark:text-white gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-brand" />
        <div className="pl-4 text-center sm:text-left">
          <h3 className="font-heading font-black text-xl mb-1">Ready to share the magic?</h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Your personalized {editor.template.name.toLowerCase()} experience is finalized and ready for {editor.recipientName}.</p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {editor.template.price_paise > 0 && <p className="font-bold text-lg hidden sm:block">{formatPrice(editor.template.price_paise)}</p>}
          <Button onClick={handleShare} size="lg" className="shadow-lg rounded-xl w-full sm:w-auto px-8" disabled={isSubmitting} loading={isSubmitting}>
            {editor.template.price_paise === 0 ? 'Publish & Share' : `Pay ${formatPrice(editor.template.price_paise)} & Share`}
          </Button>
        </div>
      </div>
    </section>
  )
}
