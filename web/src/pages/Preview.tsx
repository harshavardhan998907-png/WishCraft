import { useNavigate } from 'react-router-dom'
import { LivePreview } from '../components/editor/LivePreview'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { addDays, formatPrice, generateWishSlug } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { initiatePayment } from '../lib/razorpay'
import { useEditorStore } from '../store/editorStore'
import { useToastStore } from '../store/toastStore'
import type { Template } from '../types'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const missingTableCode = 'PGRST205'

export function Preview() {
  const editor = useEditorStore()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const toast = useToastStore()
  const data = { recipientName: editor.recipientName, senderName: editor.senderName, customMessage: editor.customMessage, photoUrls: editor.photoUrls, musicUrl: editor.musicUrl }

  async function ensureProfileExists() {
    if (!user) throw new Error('You must be signed in before creating a wish')

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email ?? '',
      full_name: profile?.full_name ?? editor.senderName,
      avatar_url: profile?.avatar_url ?? null,
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
    return data as { id: string; slug: string }
  }

  async function handleShare() {
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
        navigate(`/share/${wish.slug}`)
      }
      else {
        const wish = await createWish('draft', false)
        console.info('[Preview] draft wish created, opening payment', wish)
        await initiatePayment({
          amount: template.price_paise,
          wishId: wish.id,
          templateId: template.id,
          userName: profile?.full_name ?? editor.senderName,
          userEmail: user?.email ?? '',
          onSuccess: async (paymentId, orderId, signature, dbOrderId) => {
            console.info('[Preview] Razorpay payment success callback', { paymentId, orderId, dbOrderId, wishId: wish.id })
            const { error } = await supabase.functions.invoke('verify-payment', {
              body: { paymentId, orderId, signature, dbOrderId, wishId: wish.id },
            })
            console.info('[Preview] verify-payment response', { error })
            if (error) throw error
            navigate(`/share/${wish.slug}`)
          },
          onFailure: (error) => {
            console.warn('[Preview] Razorpay payment failed or dismissed', error)
            toast.push('error', 'Payment was not completed')
          },
        })
      }
    } catch (err) {
      console.error('[Preview] create/share failed', err)
      toast.push('error', err instanceof Error ? err.message : 'Could not create wish')
    }
  }

  if (!editor.template) return <div className="p-10">No template selected.</div>
  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <LivePreview template={editor.template} data={data} />
      <div className="flex items-center justify-between rounded-lg bg-white p-5 shadow-soft dark:border dark:border-white/10 dark:bg-[#181824] dark:text-white">
        <p className="font-bold">{formatPrice(editor.template.price_paise)}</p>
        <Button onClick={handleShare}>{editor.template.price_paise === 0 ? 'Create & Share' : `Pay ${formatPrice(editor.template.price_paise)} & Share`}</Button>
      </div>
    </section>
  )
}
