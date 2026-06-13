import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { FloatingRibbons, OrbitGlow } from '../components/ui/MotionDecor'
import { Sparkles, ArrowRight } from 'lucide-react'
import { useTemplates } from '../hooks/useTemplates'
import { Skeleton } from '../components/ui/Skeleton'

export function Browse() {
  const navigate = useNavigate()
  const { templates, loading, error } = useTemplates()

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
              Templates Collection
            </span>
            <h1 className="text-5xl md:text-7xl font-heading font-black leading-tight mb-6 text-balance">
              Find the perfect canvas for your <span className="bg-gradient-to-r from-sun via-coral to-brand bg-clip-text text-transparent">emotion</span>
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto font-medium">
              Browse cinematic layouts, customize recipient details, and share instant memories.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 mt-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[420px] w-full rounded-3xl" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500 font-bold bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl">
            Failed to load templates: {error}
          </div>
        ) : templates.length === 0 ? (
          /* Premium Empty State */
          <div className="mx-auto max-w-3xl relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl border border-black/10 bg-white/80 p-12 text-center shadow-premium backdrop-blur-xl dark:border-white/10 dark:bg-ink/80"
            >
              <div className="w-20 h-20 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Sparkles size={32} />
              </div>
              <h2 className="text-3xl font-heading font-black text-ink dark:text-white mb-2">
                No Templates Available
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto text-base font-medium mb-8 leading-relaxed">
                Import your first template to begin. As soon as a template is registered in the registry, it will appear here.
              </p>
              <Button 
                onClick={() => navigate('/admin/templates')} 
                size="lg" 
                className="rounded-full px-8 py-4 font-black shadow-premium hover:shadow-[0_24px_54px_rgba(125,114,222,0.4)] transition-all inline-flex items-center gap-2"
              >
                Add Template <ArrowRight size={18} />
              </Button>
            </motion.div>
          </div>
        ) : (
          /* Premium Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map((template, idx) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group relative flex flex-col rounded-3xl border border-black/5 bg-white shadow-premium overflow-hidden hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 dark:border-white/5 dark:bg-ink"
              >
                {/* Thumbnail container */}
                <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-white/5 overflow-hidden">
                  <img
                    src={template.thumbnail_url || undefined}
                    alt={template.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <span className="px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full bg-ink/75 backdrop-blur-md text-white border border-white/10 shadow-sm">
                      {template.occasion}
                    </span>
                    <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full backdrop-blur-md border shadow-sm ${
                      template.tier === 'premium' 
                        ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' 
                        : 'bg-mint/20 text-mint border-mint/30'
                    }`}>
                      {template.tier}
                    </span>
                  </div>
                </div>

                {/* Info body */}
                <div className="flex-1 p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-heading font-black text-ink dark:text-white group-hover:text-brand transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed line-clamp-3">
                      {template.description || (template.manifest_json as any)?.description || 'Create a premium customized page.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                    <span className="text-sm font-black text-zinc-400">
                      {template.price_paise === 0 ? 'FREE' : `₹${(template.price_paise / 100).toFixed(2)}`}
                    </span>
                    <Button
                      onClick={() => navigate(`/editor/${template.slug}`)}
                      size="sm"
                      className="rounded-full px-5 py-2 font-black shadow-soft hover:shadow-md transition-all flex items-center gap-1.5"
                    >
                      Use Template <ArrowRight size={14} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
