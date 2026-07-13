import { useEffect, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Layout, Heart, Music, Share, ShieldCheck } from 'lucide-react'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { HOW_IT_WORKS_STEPS } from '../../data/howItWorks'
import { Button } from '../ui/Button'

interface AboutDialogProps {
  open: boolean
  onClose: () => void
}

const FEATURES = [
  { icon: Layout, title: 'Beautiful Templates', desc: 'Professionally designed templates for every occasion.' },
  { icon: Heart, title: 'Personalized Wishes', desc: 'Customize names, messages, photos, colors and content.' },
  { icon: Music, title: 'Interactive Experiences', desc: 'Music, animations and immersive storytelling.' },
  { icon: Share, title: 'Instant Sharing', desc: 'Generate a shareable link in seconds.' },
]

const OCCASIONS = [
  '🎂 Birthday', '🤝 Friendship Day', '💍 Wedding', '❤️ Anniversary', 
  '👩 Mother\'s Day', '👨 Father\'s Day', '🎓 Graduation', 
  '🎄 Christmas', '🎆 New Year', '🪔 Festivals', '✨ Custom Wishes'
]

export function AboutDialog({ open, onClose }: AboutDialogProps) {
  const titleId = useId()
  const focusTrapRef = useFocusTrap(open)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    const handler = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handler)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center p-4 sm:p-6 md:p-8">
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            ref={focusTrapRef}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-[1000px] max-h-[92vh] sm:max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-[24px] sm:rounded-[28px] bg-white text-ink shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] dark:bg-[#12121a] dark:text-white dark:border dark:border-white/10"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 p-2 rounded-full bg-white/50 backdrop-blur-md border border-black/5 hover:bg-black/5 dark:bg-black/50 dark:border-white/10 dark:hover:bg-white/10 transition-colors"
              aria-label="Close dialog"
            >
              <X size={24} className="text-zinc-600 dark:text-zinc-400" />
            </button>

            <div className="p-5 sm:p-8 md:p-10 lg:p-12 space-y-16 sm:space-y-24">
              
              {/* 1. Hero Section */}
              <section className="text-center space-y-6 pt-4 sm:pt-8 max-w-2xl mx-auto flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/20 text-brand shadow-inner mb-2">
                  <Sparkles size={32} />
                </div>
                <h2 id={titleId} className="text-3xl sm:text-4xl md:text-5xl font-heading font-black tracking-tight">
                  About WishCraft
                </h2>
                <p className="text-lg sm:text-xl font-bold text-zinc-700 dark:text-zinc-300 leading-snug">
                  Creating unforgettable digital celebrations,<br className="hidden sm:block" /> one wish at a time.
                </p>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-base sm:text-lg max-w-xl mx-auto">
                  WishCraft transforms ordinary greetings into beautiful interactive celebration experiences. Create personalized wish pages with photos, messages, music, animations, and instantly share memorable moments with your loved ones.
                </p>
              </section>

              {/* 2. Our Mission */}
              <section>
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-white/5 dark:to-white/[0.02] border border-black/5 dark:border-white/10 p-8 sm:p-10 shadow-sm">
                  <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-brand/10 blur-3xl rounded-full pointer-events-none" />
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 font-heading">Our Mission</h3>
                  <div className="space-y-4 text-zinc-700 dark:text-zinc-300 leading-relaxed text-base sm:text-lg relative z-10">
                    <p className="font-semibold text-ink dark:text-white text-xl">We believe memories deserve more than a simple text message.</p>
                    <p>WishCraft helps people celebrate life's special moments through immersive, personalized digital experiences that feel emotional, meaningful, and unforgettable.</p>
                  </div>
                </div>
              </section>

              {/* 3. What Makes WishCraft Different */}
              <section className="space-y-8">
                <h3 className="text-2xl sm:text-3xl font-bold font-heading text-center">What Makes WishCraft Different</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {FEATURES.map((feature, idx) => (
                    <div key={idx} className="group p-6 rounded-3xl border border-black/5 dark:border-white/5 bg-white dark:bg-[#181824] shadow-sm hover:shadow-md dark:shadow-none transition-all duration-300 hover:-translate-y-1">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-white/5 text-brand flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-brand group-hover:text-white transition-all duration-300">
                        <feature.icon size={24} />
                      </div>
                      <h4 className="text-lg font-bold mb-2">{feature.title}</h4>
                      <p className="text-zinc-600 dark:text-zinc-400">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 4. Supported Occasions */}
              <section className="space-y-8 text-center max-w-4xl mx-auto">
                <h3 className="text-2xl sm:text-3xl font-bold font-heading">Supported Occasions</h3>
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                  {OCCASIONS.map((occasion, idx) => (
                    <span 
                      key={idx} 
                      className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-full bg-zinc-100 dark:bg-white/5 border border-black/5 dark:border-white/10 text-sm sm:text-base font-medium hover:scale-105 hover:bg-white dark:hover:bg-white/10 hover:shadow-sm hover:border-brand/30 transition-all duration-300 cursor-default"
                    >
                      {occasion}
                    </span>
                  ))}
                </div>
              </section>

              {/* 5. How WishCraft Works */}
              <section className="space-y-8 sm:space-y-12 bg-zinc-50 dark:bg-white/[0.02] -mx-5 sm:-mx-8 md:-mx-10 lg:-mx-12 px-5 sm:px-8 md:px-10 lg:px-12 py-12 sm:py-16 border-y border-black/5 dark:border-white/5">
                <div className="text-center">
                  <h3 className="text-2xl sm:text-3xl font-bold font-heading mb-4">How WishCraft Works</h3>
                  <p className="text-zinc-600 dark:text-zinc-400">Four simple steps to create a magical experience.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative">
                  {/* Desktop Connecting Line */}
                  <div className="hidden lg:block absolute top-10 left-12 right-12 h-0.5 bg-gradient-to-r from-transparent via-brand/20 to-transparent" />
                  
                  {HOW_IT_WORKS_STEPS.map((step, idx) => (
                    <div key={idx} className="relative z-10 flex flex-col items-center sm:items-start lg:items-center text-center sm:text-left lg:text-center">
                      <div className="w-20 h-20 rounded-full bg-white dark:bg-[#1a1a24] border-4 border-zinc-50 dark:border-[#12121a] shadow-sm flex items-center justify-center text-brand mb-6 shrink-0 relative">
                        <step.icon size={32} />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold border-[3px] border-white dark:border-[#12121a]">
                          {step.num.replace(/^0/, '')}
                        </div>
                      </div>
                      <h4 className="text-lg font-bold mb-2">{step.title}</h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xs">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 6. Privacy & Security */}
              <section>
                <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181824] p-8 sm:p-10 shadow-sm relative overflow-hidden">
                  <div className="absolute -right-6 -bottom-6 text-zinc-100 dark:text-white/5 rotate-[-15deg] pointer-events-none">
                    <ShieldCheck size={200} strokeWidth={1} />
                  </div>
                  <div className="relative z-10 space-y-6 max-w-2xl">
                    <div className="flex items-center gap-3 text-brand">
                      <ShieldCheck size={28} />
                      <h3 className="text-xl sm:text-2xl font-bold font-heading text-ink dark:text-white">Privacy & Security</h3>
                    </div>
                    <ul className="space-y-4 text-zinc-600 dark:text-zinc-400">
                      <li className="flex items-start gap-3">
                        <span className="text-brand mt-1">•</span>
                        <span>Your wishes are securely stored.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-brand mt-1">•</span>
                        <span>Personal information is handled responsibly.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-brand mt-1">•</span>
                        <span>Published wishes automatically expire after <strong className="text-brand font-bold">24 hours</strong>.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-brand mt-1">•</span>
                        <span>Shared links are generated securely.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-brand mt-1">•</span>
                        <span>Your content remains under your control.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Dialog Footer Actions */}
              <div className="pt-8 sm:pt-10 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row sm:justify-end gap-4">
                <Button variant="secondary" className="w-full sm:w-auto" onClick={onClose}>
                  Close
                </Button>
              </div>

              {/* 7. Footer Area */}
              <footer className="pt-8 sm:pt-12 text-center space-y-2 pb-4">
                <p className="font-bold text-ink dark:text-white">WishCraft</p>
                <p className="text-xs text-zinc-500">Version 1.0</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-4">Made with ❤️ for creating unforgettable memories.</p>
              </footer>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
