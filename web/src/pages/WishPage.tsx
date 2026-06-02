import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { useWish } from '../hooks/useWish'
import { Button } from '../components/ui/Button'
import { Expired } from './Expired'
import { useAnalytics } from '../modules/analytics/hooks/useAnalytics'
import { preloadMedia } from '../modules/media/services/mediaService'
import { TemplateRenderer, wishDataToTemplateProps } from '../template-engine'

const WishReactions = lazy(() => import('../modules/engagement/components/WishReactions').then((module) => ({ default: module.WishReactions })))
const WishMessages = lazy(() => import('../modules/engagement/components/WishMessages').then((module) => ({ default: module.WishMessages })))

export function WishPage() {
  const { slug } = useParams()
  const { data, loading, error } = useWish(slug)
  const analytics = useAnalytics()
  const [opened, setOpened] = useState(false)
  const [muted, setMuted] = useState(false)
  const trackedWishId = useRef<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!data || data.isExpired || trackedWishId.current === data.wish.id) return
    trackedWishId.current = data.wish.id
    analytics.trackWishOpen({ wishId: data.wish.id, templateId: data.template.id, slug })
  }, [analytics, data, slug])

  useEffect(() => {
    if (!opened || !audioRef.current) return
    audioRef.current.muted = muted
    audioRef.current.play().catch(() => setMuted(true))
  }, [opened, muted])

  useEffect(() => {
    if (!data) return
    preloadMedia([data.template.thumbnail_url, ...data.wish.photo_urls, data.wish.music_url])
  }, [data])

  if (loading) return <div className="grid min-h-screen place-items-center">Loading wish...</div>
  if (error || !data) return <div className="grid min-h-screen place-items-center px-4 text-center text-2xl font-black">This wish does not exist.</div>
  if (data.isExpired) return <Expired />

  const wishData = {
    recipientName: data.wish.recipient_name,
    senderName: data.wish.sender_name,
    customMessage: data.wish.custom_message,
    photoUrls: data.wish.photo_urls,
    musicUrl: data.wish.music_url,
  }

  return (
    <>
      <Helmet>
        <title>{data.wish.recipient_name} has a wish for you</title>
        <meta property="og:title" content={`${data.wish.recipient_name} has a wish for you!`} />
        <meta property="og:description" content="Tap to open your special wish" />
        {data.template.thumbnail_url ? <meta property="og:image" content={data.template.thumbnail_url} /> : null}
        {data.template.thumbnail_url ? <link rel="preload" as="image" href={data.template.thumbnail_url} /> : null}
        {data.wish.photo_urls[0] ? <link rel="preload" as="image" href={data.wish.photo_urls[0]} /> : null}
        {data.wish.music_url ? <link rel="preload" as="audio" href={data.wish.music_url} /> : null}
      </Helmet>
      {!opened ? (
        <section className="grid min-h-screen place-items-center overflow-hidden bg-ink px-5 py-12 text-center text-white sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(127,119,221,.32),transparent_30rem)]" />
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="relative mx-auto flex w-full max-w-2xl flex-col items-center">
            <motion.div className="grid h-24 w-24 place-items-center rounded-2xl bg-white/10 text-5xl shadow-soft sm:h-32 sm:w-32 sm:text-6xl" animate={{ y: [0, -10, 0], boxShadow: ['0 0 0 rgba(255,255,255,0)', '0 0 42px rgba(255,255,255,.28)', '0 0 0 rgba(255,255,255,0)'] }} transition={{ repeat: Infinity, duration: 2.4 }}>
              <span aria-hidden="true">✉</span>
            </motion.div>
            <h1 className="mt-8 max-w-xl text-balance text-3xl font-black leading-tight sm:mt-10 sm:text-5xl">You have a wish from {data.wish.sender_name}</h1>
            <div className="mt-7 sm:mt-8">
              <Button size="lg" onClick={() => setOpened(true)}>Tap to open</Button>
            </div>
          </motion.div>
        </section>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          {wishData.musicUrl ? (
            <>
              <audio ref={audioRef} src={wishData.musicUrl} loop />
              <button className="fixed right-4 top-4 z-50 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white shadow-premium" onClick={() => setMuted((value) => !value)}>
                {muted ? 'Unmute' : 'Mute'}
              </button>
            </>
          ) : null}
          <TemplateRenderer
            templateId={data.template.id}
            slug={data.template.slug}
            componentKey={data.template.component_name}
            props={wishDataToTemplateProps(wishData)}
            fallback={<div className="grid min-h-screen place-items-center bg-cream font-bold">Loading template...</div>}
          />
          <div className="mx-auto grid max-w-5xl gap-4 px-4 py-6 lg:grid-cols-[360px_1fr]">
            <Suspense fallback={<div className="rounded-lg border border-black/10 bg-white p-4 font-bold dark:border-white/10 dark:bg-[#181824]">Loading engagement...</div>}>
              <WishReactions wishId={data.wish.id} templateId={data.template.id} />
              <WishMessages wishId={data.wish.id} templateId={data.template.id} />
            </Suspense>
          </div>
        </motion.div>
      )}
    </>
  )
}
