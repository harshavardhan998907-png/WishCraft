import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { useWish } from '../hooks/useWish'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { Expired } from './Expired'
import { useAnalytics } from '../modules/analytics/hooks/useAnalytics'
import { preloadMedia } from '../modules/media/services/mediaService'
import { TemplateRenderer, wishDataToTemplateProps } from '../template-engine'
import { Sparkles, Music, VolumeX, Heart, ChevronRight } from 'lucide-react'

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

  const [sceneIndex, setSceneIndex] = useState(0)

  const scenes = useMemo(() => {
    const list: Array<'memories' | 'message' | 'music' | 'final'> = []
    if (data?.wish.photo_urls && data.wish.photo_urls.length > 0) {
      list.push('memories')
    }
    list.push('message')
    if (data?.wish.music_url) {
      list.push('music')
    }
    list.push('final')
    return list
  }, [data])

  const currentScene = scenes[sceneIndex] || 'final'

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

  if (loading) return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center p-8 space-y-8">
      <Skeleton className="w-24 h-24 rounded-2xl bg-white/5" />
      <Skeleton className="h-12 w-64 rounded-xl bg-white/5" />
      <Skeleton className="h-4 w-48 bg-white/5" />
    </div>
  )
  if (error || !data) return <div className="grid min-h-screen place-items-center px-4 text-center text-2xl font-black bg-ink text-white">This memory could not be found.</div>
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
        <title>A special surprise for {data.wish.recipient_name}</title>
        <meta property="og:title" content={`${data.wish.recipient_name} has a wish for you!`} />
        <meta property="og:description" content="Tap to open your special wish" />
        {data.template.thumbnail_url ? <meta property="og:image" content={data.template.thumbnail_url} /> : null}
      </Helmet>

      <AnimatePresence mode="wait">
        {!opened ? (
          <motion.section 
            key="envelope"
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-ink px-5 py-12 text-center text-white sm:px-8"
          >
            <div className="absolute inset-0 bg-celebration-dark opacity-60" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,.15),transparent_60%)] pointer-events-none" />
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 1, delay: 0.2 }}
              className="relative mx-auto flex w-full max-w-2xl flex-col items-center z-10"
            >
              <motion.div 
                className="mb-8 text-gold-accent"
                animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }} 
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              >
                <Sparkles size={48} strokeWidth={1} />
              </motion.div>
              
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-gold-accent/80 mb-4">A surprise awaits</h2>
              <h1 className="max-w-xl text-balance text-4xl font-heading font-black leading-tight sm:text-6xl bg-gradient-to-r from-white via-soft-cream to-white bg-clip-text text-transparent break-words">
                For {data.wish.recipient_name}
              </h1>
              
              <p className="mt-6 text-lg text-white/60 font-medium break-words">Crafted with care by {data.wish.sender_name}</p>
              
              <motion.div 
                className="mt-12"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button 
                  onClick={() => setOpened(true)}
                  className="px-8 py-4 rounded-full bg-white text-ink font-bold text-lg shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all flex items-center gap-3"
                >
                  Unveil Experience
                  <Sparkles size={20} className="text-brand" />
                </button>
              </motion.div>
            </motion.div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {opened && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.2 }}
          className="relative min-h-screen"
        >
          {wishData.musicUrl && (
            <>
              <audio ref={audioRef} src={wishData.musicUrl} loop />
              <motion.button 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="fixed right-6 top-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-premium hover:bg-white/20 transition-colors" 
                onClick={() => setMuted((m) => !m)}
              >
                {muted ? <VolumeX size={20} /> : <Music size={20} />}
              </motion.button>
            </>
          )}

          <AnimatePresence mode="wait">
            {currentScene === 'memories' && (
              <motion.div
                key="memories"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.8 }}
                className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-celebration-dark text-white p-6"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.1),transparent_60%)]" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gold-accent/80 mb-6">Chapter I: Memories</h3>
                <h2 className="text-3xl md:text-5xl font-heading font-black mb-12 text-center text-balance">Moments Captured in Time</h2>
                
                <div className="flex flex-wrap justify-center gap-6 max-w-4xl px-4 w-full">
                  {wishData.photoUrls.slice(0, 3).map((url, i) => (
                    <motion.div
                      key={url}
                      initial={{ opacity: 0, rotate: i % 2 === 0 ? -6 : 6, y: 30 }}
                      animate={{ opacity: 1, rotate: i % 2 === 0 ? -3 : 3, y: 0 }}
                      transition={{ delay: i * 0.2, duration: 0.6 }}
                      className="p-3 bg-white/5 border border-white/10 rounded-2xl shadow-premium backdrop-blur-sm w-full max-w-[280px]"
                    >
                      <img src={url} alt={`Memory photo ${i + 1} for ${data.wish.recipient_name}`} className="h-48 w-full object-cover rounded-xl" />
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSceneIndex(prev => prev + 1)}
                  className="focus-ring mt-16 px-8 py-3.5 rounded-full bg-white text-ink font-bold text-sm tracking-wider uppercase shadow-lg flex items-center gap-2"
                >
                  Continue Story <ChevronRight size={16} />
                </motion.button>
              </motion.div>
            )}

            {currentScene === 'message' && (
              <motion.div
                key="message"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.8 }}
                className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-celebration-dark text-white p-6"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(125,114,222,0.1),transparent_60%)]" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gold-accent/80 mb-6">Chapter II: The Message</h3>
                
                <div className="max-w-2xl text-center bg-white/5 border border-white/10 p-8 md:p-12 rounded-3xl backdrop-blur-md shadow-premium relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-brand flex items-center justify-center">
                    <Heart size={20} fill="currentColor" />
                  </div>
                  <p className="text-2xl md:text-3xl font-heading font-medium leading-relaxed italic text-white/90 mb-8 pt-4 break-words">
                    "{wishData.customMessage || 'A heartfelt wish made just for you.'}"
                  </p>
                  <p className="text-lg font-bold text-gold-accent break-words">— Crafted with love by {wishData.senderName}</p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSceneIndex(prev => prev + 1)}
                  className="focus-ring mt-12 px-8 py-3.5 rounded-full bg-white text-ink font-bold text-sm tracking-wider uppercase shadow-lg flex items-center gap-2"
                >
                  Continue Story <ChevronRight size={16} />
                </motion.button>
              </motion.div>
            )}

            {currentScene === 'music' && (
              <motion.div
                key="music"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.8 }}
                className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-celebration-dark text-white p-6"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.1),transparent_60%)]" />
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gold-accent/80 mb-6">Chapter III: Sound</h3>
                <h2 className="text-3xl md:text-5xl font-heading font-black mb-6 text-center">A Soundtrack for You</h2>
                <p className="text-white/60 mb-12 text-center max-w-sm">We've added a special song to match this occasion. Turn up your volume to feel the music.</p>

                <div className="relative flex items-center justify-center mb-16">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                    className="w-32 h-32 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center"
                  >
                    <Music size={40} className="text-gold-accent" />
                  </motion.div>
                  <span className="absolute w-40 h-40 rounded-full border border-white/10 animate-ping" />
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setMuted(false);
                    setSceneIndex(prev => prev + 1);
                  }}
                  className="focus-ring px-8 py-3.5 rounded-full bg-white text-ink font-bold text-sm tracking-wider uppercase shadow-lg flex items-center gap-2"
                >
                  Reveal Celebration <Sparkles size={16} className="text-brand" />
                </motion.button>
              </motion.div>
            )}

            {currentScene === 'final' && (
              <motion.div
                key="final"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2 }}
              >
                <TemplateRenderer
                  templateId={data.template.id}
                  slug={data.template.slug}
                  componentKey={data.template.component_name}
                  props={wishDataToTemplateProps(wishData)}
                  fallback={<div className="grid min-h-screen place-items-center bg-cream font-bold">Loading template...</div>}
                />
                
                <div className="relative z-10 mx-auto grid max-w-5xl gap-4 px-4 py-12 lg:grid-cols-[360px_1fr]">
                  <Suspense fallback={<div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 text-center text-white/50">Loading reactions...</div>}>
                    <WishReactions wishId={data.wish.id} templateId={data.template.id} />
                    <WishMessages wishId={data.wish.id} templateId={data.template.id} />
                  </Suspense>
                </div>
                
                <div className="relative z-10 mx-auto max-w-2xl px-4 pb-24 text-center">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg shadow-premium mt-12 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-brand/20 to-transparent pointer-events-none" />
                    <Sparkles size={32} className="text-gold-accent mx-auto mb-4" />
                    <h3 className="text-2xl font-heading font-black mb-3">Make Someone's Day</h3>
                    <p className="text-white/70 mb-6">Create a magical, unforgettable memory for someone you care about.</p>
                    <a href="/">
                      <Button size="lg" className="shadow-lg rounded-full font-bold px-8">Create Your Own Wish</Button>
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  )
}
