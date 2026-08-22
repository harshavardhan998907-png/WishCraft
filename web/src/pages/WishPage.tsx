import { useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { HeartCrack, ArrowLeft } from 'lucide-react'
import { useWish } from '../hooks/useWish'
import { useAuth } from '../hooks/useAuth'
import { Skeleton } from '../components/ui/Skeleton'
import { Button } from '../components/ui/Button'
import { Expired } from './Expired'
import { useAnalytics } from '../modules/analytics/hooks/useAnalytics'
import { preloadMedia } from '../modules/media/services/mediaService'
import { TemplateNotFound, WishRenderer } from '../template-engine'


export function WishPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { data, loading, error } = useWish(slug)
  const { user } = useAuth()
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

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1)
    } else {
      navigate(user ? '/dashboard' : '/')
    }
  }

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
    return (
      <div className="grid min-h-screen place-items-center bg-celebration-light dark:bg-celebration-dark px-4 text-center">
        <div className="max-w-md w-full bg-white/80 dark:bg-ink/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-premium border border-white/20 dark:border-white/10">
          <div className="w-20 h-20 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-6">
            <HeartCrack size={36} />
          </div>
          <h1 className="text-3xl font-heading font-black text-ink dark:text-white mb-3">Wish Not Found</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
            This memory could not be found. It may have been deleted, expired, or the link might be incorrect.
          </p>
          <Link to={user ? "/browse" : "/"}>
            <Button size="lg" className="w-full shadow-lg rounded-xl">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (data.isExpired) return <Expired />

  const templateIdentity = data.wish.template_slug ?? data.template.slug ?? data.template.component_key ?? data.template.component_name

  return (
    <div className="flex flex-col min-h-screen bg-celebration-light dark:bg-celebration-dark">
      <Helmet>
        <title>A special surprise for {data.wish.recipient_name}</title>
        <meta property="og:title" content={`${data.wish.recipient_name} has a wish for you!`} />
        <meta property="og:description" content="Tap to open your special wish" />
        {data.template.thumbnail_url ? <meta property="og:image" content={data.template.thumbnail_url} /> : null}
      </Helmet>

      {/* Trusted WishCraft Navigation Shell */}
      <div className="w-full bg-white/80 dark:bg-ink/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/10 px-4 py-2 flex items-center shrink-0 z-50">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBack} 
          className="text-zinc-600 dark:text-zinc-300 hover:text-ink dark:hover:text-white"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
          <span className="font-medium">Back</span>
        </Button>
      </div>

      <div className="flex-1 w-full relative">
        {!templateIdentity ? (
          <TemplateNotFound templateId={data.wish.template_id} />
        ) : (
          <WishRenderer
            wish={data.wish}
            template={data.template}
            className="w-full min-h-[calc(100vh-56px)]"
            fallback={<div className="grid min-h-[500px] place-items-center bg-cream font-bold">Loading template...</div>}
          />
        )}
      </div>
    </div>
  )
}

