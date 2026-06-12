import { lazy, Suspense, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Sparkles } from 'lucide-react'
import { useWish } from '../hooks/useWish'
import { Skeleton } from '../components/ui/Skeleton'
import { Expired } from './Expired'
import { useAnalytics } from '../modules/analytics/hooks/useAnalytics'
import { preloadMedia } from '../modules/media/services/mediaService'
import { TemplateNotFound, WishRenderer } from '../template-engine'

const WishReactions = lazy(() => import('../modules/engagement/components/WishReactions').then((module) => ({ default: module.WishReactions })))
const WishMessages = lazy(() => import('../modules/engagement/components/WishMessages').then((module) => ({ default: module.WishMessages })))

export function WishPage() {
  const { slug } = useParams()
  const { data, loading, error } = useWish(slug)
  const analytics = useAnalytics()
  const trackedWishId = useRef<string | null>(null)

  useEffect(() => {
    if (!data || data.isExpired || trackedWishId.current === data.wish.id) return
    trackedWishId.current = data.wish.id
    analytics.trackWishOpen({ wishId: data.wish.id, templateId: data.template.id, slug })
  }, [analytics, data, slug])

  useEffect(() => {
    if (!data) return
    preloadMedia([
      data.template.thumbnail_url,
      ...(data.wish.photo_urls ?? []),
      data.wish.music_url,
    ])
  }, [data])

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex flex-col items-center justify-center p-8 space-y-8">
        <Skeleton className="w-24 h-24 rounded-2xl bg-white/5" />
        <Skeleton className="h-12 w-64 rounded-xl bg-white/5" />
        <Skeleton className="h-4 w-48 bg-white/5" />
      </div>
    )
  }

  if (error || !data) {
    return <div className="grid min-h-screen place-items-center bg-ink px-4 text-center text-2xl font-black text-white">This memory could not be found.</div>
  }

  if (data.isExpired) return <Expired />

  const templateIdentity = data.wish.template_slug ?? data.template.slug ?? data.template.component_key ?? data.template.component_name

  return (
    <>
      <Helmet>
        <title>A special surprise for {data.wish.recipient_name}</title>
        <meta property="og:title" content={`${data.wish.recipient_name} has a wish for you!`} />
        <meta property="og:description" content="Tap to open your special wish" />
        {data.template.thumbnail_url ? <meta property="og:image" content={data.template.thumbnail_url} /> : null}
      </Helmet>

      {!templateIdentity ? (
        <TemplateNotFound templateId={data.wish.template_id} />
      ) : (
        <WishRenderer
          wish={data.wish}
          template={data.template}
          fallback={<div className="grid min-h-screen place-items-center bg-cream font-bold">Loading template...</div>}
        />
      )}

      <div className="relative z-10 mx-auto grid max-w-5xl gap-4 px-4 py-12 lg:grid-cols-[360px_1fr]">
        <Suspense fallback={<div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/50">Loading reactions...</div>}>
          <WishReactions wishId={data.wish.id} templateId={data.template.id} />
          <WishMessages wishId={data.wish.id} templateId={data.template.id} />
        </Suspense>
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 pb-24 text-center">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg shadow-premium">
          <Sparkles size={32} className="mx-auto mb-4 text-gold-accent" />
          <h3 className="mb-3 text-2xl font-heading font-black">Make Someone's Day</h3>
          <p className="mb-6 text-white/70">Create a magical, unforgettable memory for someone you care about.</p>
          <a className="inline-flex rounded-full bg-white px-8 py-3 font-bold text-ink shadow-lg" href="/">
            Create Your Own Wish
          </a>
        </div>
      </div>
    </>
  )
}

