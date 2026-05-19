import { Suspense, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { useWish } from '../hooks/useWish'
import { templateRegistry } from '../components/templates/registry'
import { Button } from '../components/ui/Button'
import { Expired } from './Expired'

export function WishPage() {
  const { slug } = useParams()
  const { data, loading, error } = useWish(slug)
  const [opened, setOpened] = useState(false)
  const [muted, setMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!opened || !audioRef.current) return
    audioRef.current.muted = muted
    audioRef.current.play().catch(() => setMuted(true))
  }, [opened, muted])

  if (loading) return <div className="grid min-h-screen place-items-center">Loading wish...</div>
  if (error || !data) return <div className="grid min-h-screen place-items-center px-4 text-center text-2xl font-black">This wish does not exist.</div>
  if (data.isExpired) return <Expired />

  const Component = templateRegistry[data.template.component_name]
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
      ) : Component ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          {wishData.musicUrl ? (
            <>
              <audio ref={audioRef} src={wishData.musicUrl} loop />
              <button className="fixed right-4 top-4 z-50 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white shadow-premium" onClick={() => setMuted((value) => !value)}>
                {muted ? 'Unmute' : 'Mute'}
              </button>
            </>
          ) : null}
          <Suspense fallback={<div className="grid min-h-screen place-items-center bg-cream font-bold">Loading template...</div>}>
            <Component data={wishData} />
          </Suspense>
        </motion.div>
      ) : <div>Template missing.</div>}
    </>
  )
}
