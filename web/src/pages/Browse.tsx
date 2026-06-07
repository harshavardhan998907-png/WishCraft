import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTemplates } from '../hooks/useTemplates'
import { OccasionBadge, TierBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { TemplateScenePreview } from '../components/templates/TemplateScenePreview'
import { LivePreview } from '../components/editor/LivePreview'
import type { OccasionType, Template, TemplateTier } from '../types'
import { formatPrice } from '../lib/utils'
import { FloatingRibbons, OrbitGlow } from '../components/ui/MotionDecor'
import { useAnalytics } from '../modules/analytics/hooks/useAnalytics'
import { Play, Sparkles, X, ChevronRight, Music } from 'lucide-react'
import { Modal } from '../components/ui/Modal'

const occasions: Array<'all' | OccasionType> = ['all', 'birthday', 'wedding', 'anniversary', 'festival', 'graduation', 'baby_shower', 'farewell', 'valentine']
const tiers: Array<'all' | TemplateTier> = ['all', 'free', 'standard', 'premium']

function TemplateCard({ template, onCustomize, onPreview }: { template: Template; onCustomize: () => void; onPreview: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="group h-full flex flex-col"
    >
      <Card className="flex-1 overflow-hidden p-0 transition-all duration-300 group-hover:shadow-[0_24px_72px_rgba(125,114,222,0.15)] ring-1 ring-zinc-200 dark:ring-white/10 group-hover:ring-brand/30 flex flex-col bg-white dark:bg-ink">
        <div className="relative h-64 overflow-hidden bg-zinc-100 dark:bg-zinc-900 cursor-pointer" onClick={onPreview}>
          <TemplateScenePreview occasion={template.occasion} slug={template.slug} name={template.name} thumbnailUrl={template.thumbnail_url} />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
          
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <TierBadge tier={template.tier} />
            <OccasionBadge occasion={template.occasion} />
          </div>

          {/* Hover Overlay Actions */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-300 bg-black/55 backdrop-blur-[3px]">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); onPreview(); }}
              className="focus-ring flex items-center justify-center gap-2 bg-white text-ink px-6 py-2.5 rounded-full font-bold shadow-xl text-sm w-[210px]"
            >
              <Play size={16} fill="currentColor" className="text-brand" />
              Preview Experience
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); onCustomize(); }}
              className="focus-ring flex items-center justify-center gap-2 bg-brand text-white px-6 py-2.5 rounded-full font-bold shadow-xl text-sm w-[210px]"
            >
              <Sparkles size={16} className="text-sun" />
              Customize Template
            </motion.button>
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-white z-10 pointer-events-none">
            <h2 className="text-2xl font-heading font-black truncate">{template.name}</h2>
            <div className="flex gap-4 mt-2 text-sm font-medium text-white/80">
              {template.has_animation && <span className="flex items-center gap-1"><Sparkles size={14} /> Animated</span>}
              {template.has_music && <span className="flex items-center gap-1"><Music size={14} /> Music ready</span>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-4 p-5 mt-auto border-t border-zinc-100 dark:border-white/5 bg-white dark:bg-ink">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-zinc-400">Ready to personalize</p>
            <p className="text-lg font-black text-ink dark:text-white mt-0.5">{formatPrice(template.price_paise)}</p>
          </div>
          <button 
            onClick={onCustomize}
            className="focus-ring flex items-center gap-2 px-6 py-3 rounded-xl bg-ink dark:bg-white text-white dark:text-ink font-bold shadow-sm transition-all group-hover:bg-brand group-hover:text-white group-hover:shadow-brand/25 group-hover:shadow-lg"
          >
            Select <ChevronRight size={18} />
          </button>
        </div>
      </Card>
    </motion.div>
  )
}

export function Browse() {
  const { templates, loading } = useTemplates()
  const [occasion, setOccasion] = useState<'all' | OccasionType>('all')
  const [tier, setTier] = useState<'all' | TemplateTier>('all')
  const [animation, setAnimation] = useState(false)
  const [music, setMusic] = useState(false)
  
  // Preview Modal State
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)

  const navigate = useNavigate()
  const analytics = useAnalytics()

  const filtered = useMemo(() => templates.filter((template) =>
    (occasion === 'all' || template.occasion === occasion) &&
    (tier === 'all' || template.tier === tier) &&
    (!animation || template.has_animation) &&
    (!music || template.has_music)
  ), [templates, occasion, tier, animation, music])

  const handleCustomize = (template: Template) => {
    analytics.trackTemplateSelection({
      templateId: template.id,
      templateSlug: template.slug,
      templateName: template.name,
      tier: template.tier,
      occasion: template.occasion,
    })
    navigate(`/editor/${template.slug}`)
  }

  // Demo data for full-screen preview
  const demoData = {
    recipientName: "Sarah",
    senderName: "Alex",
    customMessage: "Wishing you a lifetime of joy and beautiful memories together. Have a magical celebration!",
    photoUrls: ["https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800"],
    musicUrl: null
  }

  return (
    <section className="min-h-screen bg-soft-cream dark:bg-deep-navy pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-ink text-white py-20 px-6 sm:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,.15),transparent_40rem),radial-gradient(circle_at_80%_10%,rgba(125,114,222,.2),transparent_35rem)]" />
        <div className="absolute inset-0 bg-celebration-dark opacity-40 mix-blend-overlay" />
        <FloatingRibbons density={15} light={false} />
        <OrbitGlow className="right-20 top-10 h-64 w-64 opacity-30" />
        
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-gold-accent font-bold text-sm tracking-widest uppercase mb-6 shadow-glow-gold">
              The Collection
            </span>
            <h1 className="text-5xl md:text-7xl font-heading font-black leading-tight mb-6 text-balance">
              Find the perfect canvas for your <span className="bg-gradient-to-r from-sun via-coral to-brand bg-clip-text text-transparent">emotion</span>
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto font-medium">
              Every template is a crafted journey. Preview the experience, add your memories, and share the magic in minutes.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 mt-8 lg:-mt-8 relative z-10 grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Filters Sidebar */}
        <aside className="glass-panel h-fit rounded-2xl p-6 shadow-premium bg-white/80 dark:bg-ink/80 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles size={20} className="text-brand" />
            <h2 className="text-lg font-heading font-black">Curate</h2>
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="browse-occasion-select" className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Occasion</label>
              <div className="relative">
                <select id="browse-occasion-select" className="focus-ring w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 appearance-none dark:border-white/10 dark:bg-white/5 dark:text-white font-medium" value={occasion} onChange={(event) => setOccasion(event.target.value as any)}>
                  {occasions.map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}
                </select>
                <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-zinc-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="browse-tier-select" className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Experience Tier</label>
              <div className="relative">
                <select id="browse-tier-select" className="focus-ring w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 appearance-none dark:border-white/10 dark:bg-white/5 dark:text-white font-medium" value={tier} onChange={(event) => setTier(event.target.value as any)}>
                  {tiers.map((item) => <option key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</option>)}
                </select>
                <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-zinc-400 pointer-events-none" />
              </div>
            </div>
            
            <div className="pt-4 border-t border-zinc-100 dark:border-white/10 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-2">Features</span>
              <label htmlFor="browse-reveal-checkbox" className="flex items-center justify-between rounded-xl bg-zinc-50/50 border border-zinc-100 p-3.5 font-semibold cursor-pointer dark:bg-white/5 dark:border-white/5 hover:border-brand/30 transition-colors">
                <span className="flex items-center gap-2"><Sparkles size={16} className="text-brand"/> Cinematic Reveal</span>
                <input id="browse-reveal-checkbox" type="checkbox" checked={animation} onChange={(event) => setAnimation(event.target.checked)} className="accent-brand w-4 h-4" />
              </label>
              <label htmlFor="browse-audio-checkbox" className="flex items-center justify-between rounded-xl bg-zinc-50/50 border border-zinc-100 p-3.5 font-semibold cursor-pointer dark:bg-white/5 dark:border-white/5 hover:border-brand/30 transition-colors">
                <span className="flex items-center gap-2"><Music size={16} className="text-brand"/> Audio Sync</span>
                <input id="browse-audio-checkbox" type="checkbox" checked={music} onChange={(event) => setMusic(event.target.checked)} className="accent-brand w-4 h-4" />
              </label>
            </div>
          </div>
        </aside>

        {/* Gallery Grid */}
        <div>
          <div className="mb-6 flex items-center justify-between px-1">
            <p className="font-semibold text-zinc-500 dark:text-zinc-400">
              Showing <span className="text-ink dark:text-white font-black">{filtered.length}</span> curated experiences
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-2xl" />)
            ) : filtered.length === 0 ? (
              <div className="col-span-full rounded-2xl border-2 border-dashed border-zinc-200 dark:border-white/10 p-12 text-center bg-white/50 dark:bg-ink/50 mt-4">
                <div className="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-xl font-black text-ink dark:text-white mb-1">No templates match your filters</h3>
                <p className="text-zinc-500 max-w-sm mx-auto text-sm">
                  Try clearing some features or changing the occasion/tier filter to see more templates.
                </p>
                <Button 
                  onClick={() => { setOccasion('all'); setTier('all'); setAnimation(false); setMusic(false); }} 
                  className="mt-6 rounded-xl px-6"
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              filtered.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onCustomize={() => handleCustomize(template)}
                  onPreview={() => setPreviewTemplate(template)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Full-Screen Experience Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <Modal 
            open={!!previewTemplate} 
            title="" 
            onClose={() => setPreviewTemplate(null)}
          >
             <div className="absolute inset-0 bg-ink flex flex-col overflow-hidden">
               {/* Modal Header Overlay */}
               <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/80 to-transparent z-50 flex items-center justify-between px-6 pointer-events-none">
                 <div className="pointer-events-auto">
                    <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-sm font-bold border border-white/20 flex items-center gap-2 shadow-lg">
                      <Play size={14} fill="currentColor" /> Experience Demo Mode
                    </span>
                 </div>
                 <button 
                   onClick={() => setPreviewTemplate(null)}
                   className="pointer-events-auto p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"
                 >
                   <X size={24} />
                 </button>
               </div>
               
               {/* Content */}
               <div className="flex-1 bg-ink w-full h-full relative">
                 <LivePreview template={previewTemplate} data={demoData} />
               </div>

               {/* Modal Footer CTA */}
               <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-50 flex justify-center pointer-events-none">
                 <motion.button 
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   transition={{ delay: 0.5 }}
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={() => handleCustomize(previewTemplate)}
                   className="pointer-events-auto flex items-center gap-3 bg-white text-ink px-10 py-4 rounded-full font-black text-lg shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transition-all"
                 >
                   Use this template <ChevronRight size={20} />
                 </motion.button>
               </div>
             </div>
          </Modal>
        )}
      </AnimatePresence>
    </section>
  )
}
