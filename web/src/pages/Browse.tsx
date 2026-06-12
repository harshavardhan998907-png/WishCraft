import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { FloatingRibbons, OrbitGlow } from '../components/ui/MotionDecor'
import { Sparkles, ArrowRight } from 'lucide-react'

export function Browse() {
  const navigate = useNavigate()

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

      {/* Premium Empty State */}
      <div className="mx-auto max-w-3xl px-4 mt-12 relative z-10">
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
    </section>
  )
}
