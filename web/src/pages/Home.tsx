import { Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Footer } from '../components/layout/Footer'
import { Button } from '../components/ui/Button'
import { Loader } from '../components/ui/Loader'
import { useAuth } from '../hooks/useAuth'
import { HOW_IT_WORKS_STEPS } from '../data/howItWorks'
import { FloatingRibbons, OrbitGlow } from '../components/ui/MotionDecor'
import { Sparkles, Image as ImageIcon, Music, Heart, Star, Layout, Play } from 'lucide-react'

export function Home() {
  const { user, loading } = useAuth()

  if (loading) return <Loader variant="fullPage" />
  if (user) return <Navigate to="/browse" replace />

  return (
    <div className="bg-soft-cream dark:bg-deep-navy overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] md:min-h-[90vh] flex items-center justify-center pt-16 md:pt-24 pb-12 md:pb-16 px-6">
        <div className="absolute inset-0 bg-celebration-light dark:bg-celebration-dark opacity-60 pointer-events-none" />
        <FloatingRibbons density={20} />
        <OrbitGlow className="left-[10%] top-[20%] h-64 w-64 opacity-30" />
        <OrbitGlow className="right-[10%] bottom-[20%] h-72 w-72 opacity-20" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-white/10 backdrop-blur-md border border-brand/20 text-brand font-bold text-sm mb-8 shadow-soft">
              <Sparkles size={16} /> Make memories magical
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-black leading-[1.1] text-ink dark:text-white tracking-tight">
              Turn greetings into <br/>
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-sun via-coral to-brand bg-clip-text text-transparent">cinematic memories.</span>
                <motion.span 
                  className="absolute bottom-2 left-0 w-full h-4 bg-sun/20 -z-10 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                />
              </span>
            </h1>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.4, duration: 0.8 }}
            className="max-w-2xl mx-auto text-xl text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium"
          >
            Bespoke animated celebration sites. Personal photos, custom music sync, and immersive motion design to create unforgettable surprise experiences.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4"
          >
            <Link to="/browse">
              <Button size="lg" className="px-8 py-4 text-lg rounded-full shadow-premium hover:shadow-[0_24px_54px_rgba(125,114,222,0.4)] transition-all">
                Create Wish <Sparkles size={18} className="ml-2" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="ghost" size="lg" className="px-8 py-4 text-lg rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors text-zinc-700 dark:text-zinc-200">
                Experience Demo <Play size={18} className="ml-2" />
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Showcase Transformation Section */}
      <section className="py-24 px-6 bg-white dark:bg-ink relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-heading font-black text-ink dark:text-white">The Transformation</h2>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">See how a simple template becomes an emotional journey.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-center relative">
            {/* Subtle connecting line for desktop */}
            <div className="hidden lg:block absolute top-1/2 left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-brand/20 to-transparent -translate-y-1/2 pointer-events-none" />

            {/* Template Phase */}
            <motion.div className="relative z-10 lg:-translate-y-16 transition-transform">
              <div className="glass-panel p-6 rounded-3xl h-[500px] flex flex-col items-center justify-center text-center space-y-6 shadow-soft group hover:shadow-premium transition-all">
                <div className="w-24 h-24 rounded-2xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-brand">
                  <Layout size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-ink dark:text-white">1. Template</h3>
                  <p className="text-zinc-500 text-sm">A beautiful blank canvas</p>
                </div>
                <div className="w-full h-48 bg-zinc-100 dark:bg-white/5 rounded-xl border-2 border-dashed border-zinc-200 dark:border-white/10 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                  <span className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Awaiting Magic</span>
                </div>
              </div>
            </motion.div>

            {/* Customization Phase */}
            <motion.div className="relative z-10 transition-transform">
              <div className="glass-panel p-6 rounded-3xl h-[550px] flex flex-col items-center justify-center text-center space-y-6 shadow-premium ring-2 ring-brand/20 bg-white/80 dark:bg-ink/80 backdrop-blur-xl">
                <div className="w-24 h-24 rounded-2xl bg-sun/20 flex items-center justify-center text-sun">
                  <Star size={40} fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-ink dark:text-white">2. Customized Result</h3>
                  <p className="text-zinc-500 text-sm">Infused with your memories</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-brand animate-bounce"><ImageIcon size={20} /></div>
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-coral animate-bounce" style={{ animationDelay: '100ms' }}><Music size={20} /></div>
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-mint animate-bounce" style={{ animationDelay: '200ms' }}><Heart size={20} /></div>
                </div>
                <div className="w-full flex-1 bg-gradient-to-br from-brand/10 to-sun/10 rounded-xl flex items-center justify-center">
                   <div className="text-brand font-bold px-4 py-2 bg-white dark:bg-ink rounded-lg shadow-sm">Your Story</div>
                </div>
              </div>
            </motion.div>

            {/* Recipient Experience Phase */}
            <motion.div className="relative z-10 lg:translate-y-16 transition-transform">
               <div className="glass-panel p-6 rounded-3xl h-[500px] flex flex-col items-center justify-center text-center space-y-6 shadow-soft bg-gradient-to-br from-brand/5 to-plum/5 border-none">
                <div className="w-24 h-24 rounded-2xl bg-brand flex items-center justify-center text-white shadow-lg shadow-brand/30">
                  <Sparkles size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-ink dark:text-white">3. Recipient Experience</h3>
                  <p className="text-zinc-500 text-sm">Tears of joy & surprise</p>
                </div>
                <div className="w-full h-48 bg-ink rounded-xl shadow-2xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,.3),transparent_70%)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-heading text-xl font-bold">Unforgettable.</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Visual Storytelling How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-ink text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(125,114,222,0.2),transparent_50%)]" />
        
        <div className="max-w-4xl mx-auto relative z-10">
           <div className="text-center mb-20 space-y-4">
            <span className="text-sun font-bold uppercase tracking-[0.2em] text-sm">The Process</span>
            <h2 className="text-4xl md:text-6xl font-heading font-black">Crafting emotion, made simple.</h2>
          </div>

          <div className="space-y-24">
            {HOW_IT_WORKS_STEPS.map((step, idx) => (
              <motion.div 
                key={step.num}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`flex flex-col md:flex-row items-center gap-10 ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}
              >
                <div className="w-full md:w-1/2">
                   <div className="aspect-[4/3] rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                     <step.icon size={80} className="text-white/20 group-hover:scale-110 group-hover:text-white/40 transition-all duration-500" />
                   </div>
                </div>
                <div className="w-full md:w-1/2 space-y-4 text-center md:text-left">
                  <span className="text-6xl font-black text-white/5 font-heading block">{step.num}</span>
                  <h3 className="text-3xl font-bold font-heading">{step.title}</h3>
                  <p className="text-lg text-white/60">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-5xl mx-auto glass-panel p-12 md:p-20 rounded-[3rem] text-center shadow-premium relative overflow-hidden bg-white/80 dark:bg-ink/80 border-none">
          <div className="absolute inset-0 bg-celebration-light dark:bg-celebration-dark opacity-50 -z-10" />
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-5xl font-heading font-black text-ink dark:text-white">Ready to make someone smile?</h2>
            <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">Join thousands who have turned standard wishes into premium experiences.</p>
            <div className="flex justify-center">
              <Link to="/browse">
                 <Button size="lg" className="px-10 py-4 text-lg rounded-full shadow-premium hover:shadow-[0_24px_54px_rgba(125,114,222,0.4)] transition-all">
                   Browse Templates <Sparkles size={18} className="ml-2" />
                 </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
