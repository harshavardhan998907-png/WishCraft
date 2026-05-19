import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Footer } from '../components/layout/Footer'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { FloatingRibbons, OrbitGlow, ShimmerSweep } from '../components/ui/MotionDecor'
import { TemplateScenePreview } from '../components/templates/TemplateScenePreview'
import type { OccasionType } from '../types'

const occasions = [
  ['Birthday', 'Confetti, candles, photo memories'],
  ['Wedding', 'Petals, gold accents, couple gallery'],
  ['Anniversary', 'Romantic notes and timeline moments'],
  ['Festival', 'Lamps, sparkle, rich festive motion'],
  ['Graduation', 'Stars, achievements, bright celebration'],
  ['Valentine', 'Soft reveal, hearts, music-ready pages'],
  ['Farewell', 'Memory wall and heartfelt goodbye'],
  ['Baby Shower', 'Gentle colors and warm wishes'],
]

const showcase: Array<{ name: string; slug: string; occasion: OccasionType; detail: string }> = [
  { name: 'Birthday Classic', slug: 'birthday-classic', occasion: 'birthday', detail: 'Balloons, cake, candles, and confetti.' },
  { name: 'Wedding Elegant', slug: 'wedding-elegant', occasion: 'wedding', detail: 'Rings, petals, gold light, and romance.' },
  { name: 'Festival Diwali', slug: 'festival-diwali', occasion: 'festival', detail: 'Diyas, warm sparkle, and festive motion.' },
  { name: 'Anniversary Romantic', slug: 'anniversary-romantic', occasion: 'anniversary', detail: 'Hearts, soft particles, and memory glow.' },
  { name: 'Graduation Celebration', slug: 'graduation-celebration', occasion: 'graduation', detail: 'Caps, certificates, stars, and bright wins.' },
]

const pricingPlans = [
  {
    tier: 'Free',
    title: 'Start with elegant essentials',
    body: 'Static music-free templates, live for 7 days.',
    features: ['Core templates', 'Photo-ready layout', 'Shareable wish link'],
  },
  {
    tier: 'Standard',
    title: 'Animated with music',
    body: 'Premium motion, built-in music library, richer scenes.',
    features: ['Animated reveal', 'Built-in music', 'Richer scene effects'],
  },
  {
    tier: 'Premium',
    title: 'Full cinematic experience',
    body: 'Custom music, HD motion, advanced transitions, and the most expressive reveal pages.',
    features: ['Cinematic animations', 'Premium music support', 'Up to 5 photo memories', 'Custom themes and effects', 'HD share experience'],
  },
]

export function Home() {
  return (
    <>
      <section className="relative min-h-[calc(100vh-66px)] overflow-hidden px-4 py-14 md:py-18">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#fff6e4_0%,#fff8ed_42%,#f7fbef_100%)] dark:bg-[linear-gradient(135deg,#080812_0%,#111121_48%,#171327_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-cream to-transparent dark:from-[#080812]" />
        <FloatingRibbons density={30} />
        <OrbitGlow className="left-[6%] top-[16%] h-56 w-56 opacity-40" />
        <OrbitGlow className="bottom-[10%] right-[8%] h-72 w-72 opacity-35" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_460px]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="inline-flex rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-plum shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-sun">Animated wish pages</p>
            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[1.03] text-ink dark:text-white md:text-7xl">
              Send wishes that feel handcrafted, cinematic, and personal.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-700">
              Choose a premium occasion template, customize photos, music, names, and message, then share a live animated page that opens like a gift.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/browse"><Button size="lg">Browse Templates</Button></Link>
              <a href="#how-it-works"><Button size="lg" variant="secondary">See how it works</Button></a>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              {['6 starter templates', '7-day live links', 'Music + photos'].map((item) => (
                <div key={item} className="rounded-lg border border-black/10 bg-white/65 p-4 text-sm font-black shadow-sm dark:border-white/10 dark:bg-white/10">{item}</div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.94, rotate: -1 }} animate={{ opacity: 1, scale: [1, 1.025, 1], rotate: [-1, 1, -1] }} transition={{ opacity: { duration: 0.8, delay: 0.1 }, scale: { duration: 5, repeat: Infinity }, rotate: { duration: 6, repeat: Infinity } }} className="glass-panel relative overflow-hidden rounded-2xl p-4">
            <ShimmerSweep />
            <div className="relative min-h-[560px] overflow-hidden rounded-xl bg-[#171127] p-6 text-white">
              <img src="https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=900&q=80" alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#171127]/20 via-[#171127]/35 to-[#171127]" />
              <FloatingRibbons density={18} light />
              <OrbitGlow className="right-8 top-8 h-44 w-44" />
              <div className="relative flex min-h-[508px] flex-col justify-end">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-sun">Live preview</p>
                <h2 className="mt-3 text-5xl font-black">Birthday Glow</h2>
                <p className="mt-4 max-w-sm text-white/80">Dark candlelight, floating particles, music support, and a dramatic reveal.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-black uppercase tracking-[0.18em] text-brand">Simple flow</p>
              <h2 className="mt-2 text-4xl font-black">From idea to shareable magic</h2>
            </div>
            <Link to="/browse"><Button variant="ghost">Explore all templates</Button></Link>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              ['01', 'Pick a template', 'Filter by occasion, price, animation, and music support.'],
              ['02', 'Customize it', 'Add names, message, photos, and soundtrack with live preview.'],
              ['03', 'Share the link', 'Create a 7-day wish page with a reveal experience.'],
            ].map(([number, title, body], index) => (
              <motion.div key={title} initial={{ opacity: 0, y: 30, rotate: -1 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} whileHover={{ y: -10, rotate: index === 1 ? 1 : -1 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }}>
                <Card className="glass-panel relative h-full overflow-hidden">
                  <ShimmerSweep />
                  <span className="text-sm font-black text-brand">{number}</span>
                  <h3 className="mt-4 text-2xl font-black">{title}</h3>
                  <p className="mt-3 leading-7 text-zinc-600">{body}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white/65 px-4 py-16 dark:bg-white/[0.03]">
        <div className="mx-auto max-w-7xl">
          <p className="font-black uppercase tracking-[0.18em] text-mint">Occasion library</p>
          <h2 className="mt-2 text-4xl font-black">Every celebration gets its own mood</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {occasions.map(([occasion, detail], index) => (
              <motion.div key={occasion} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} whileHover={{ y: -10, scale: 1.02 }} viewport={{ once: true }} transition={{ delay: index * 0.04 }}>
                <Card className="relative h-full overflow-hidden bg-gradient-to-br from-white to-[#fff3df] text-ink dark:border-white/10 dark:from-[#201d2c] dark:via-[#181724] dark:to-[#251d31] dark:text-white dark:shadow-[0_18px_46px_rgba(0,0,0,.34)]">
                  <motion.div className="absolute right-4 top-4 h-12 w-12 rounded-full bg-brand/10 dark:bg-brand/20" animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.65, 0.3] }} transition={{ duration: 2.2, repeat: Infinity, delay: index * 0.12 }} />
                  <motion.div className="mb-5 h-12 w-12 rounded-lg bg-ink text-center text-lg font-black leading-[48px] text-white shadow-soft dark:bg-white dark:text-ink dark:shadow-[0_14px_34px_rgba(127,114,222,.22)]" animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 3, repeat: Infinity, delay: index * 0.08 }}>{index + 1}</motion.div>
                  <h3 className="text-xl font-black text-ink dark:text-white">{occasion}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-white/72">{detail}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-4xl font-black">Template showcase</h2>
          <div className="mt-8 flex gap-5 overflow-x-auto pb-4">
            {showcase.map((template, index) => (
              <motion.div key={template.slug} animate={{ y: [0, index % 2 ? 12 : -12, 0] }} transition={{ duration: 4 + index * 0.3, repeat: Infinity }} whileHover={{ scale: 1.05, rotate: 1 }} className="group relative min-w-[300px] overflow-hidden rounded-xl bg-ink text-white shadow-premium">
                <div className="relative h-52 overflow-hidden">
                  <TemplateScenePreview occasion={template.occasion} slug={template.slug} name={template.name} compact />
                </div>
                <div className="p-5">
                  <h3 className="text-2xl font-black">{template.name}</h3>
                  <p className="mt-2 text-sm text-white/70">{template.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-stretch gap-5 md:grid-cols-3">
            {pricingPlans.map((plan, index) => (
              <motion.div key={plan.tier} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} whileHover={{ y: -8 }} viewport={{ once: true }} transition={{ delay: index * 0.06 }} className="h-full">
                <Card className={`relative flex h-full min-h-[320px] flex-col overflow-hidden ${plan.tier === 'Premium' ? 'border-ink/20 !bg-ink text-white shadow-premium' : 'glass-panel'}`}>
                  {plan.tier === 'Premium' ? (
                    <>
                      <ShimmerSweep />
                      <OrbitGlow className="-right-8 -top-8 h-32 w-32 opacity-35" />
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sun via-coral to-mint" />
                    </>
                  ) : null}
                  <div className="relative">
                    <div className="flex items-center justify-between gap-3">
                      <p className={`font-black uppercase tracking-[0.18em] ${plan.tier === 'Premium' ? 'text-sun' : 'text-brand'}`}>{plan.tier}</p>
                      {plan.tier === 'Premium' ? <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/80">Best experience</span> : null}
                    </div>
                    <h3 className="mt-4 text-2xl font-black">{plan.title}</h3>
                    <p className={`mt-3 min-h-[56px] leading-7 ${plan.tier === 'Premium' ? 'text-white/75' : 'text-zinc-600'}`}>{plan.body}</p>
                  </div>
                  <div className="relative mt-6 grid gap-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-bold ${plan.tier === 'Premium' ? 'bg-white/10 text-white/90' : 'bg-white/70 text-zinc-700 shadow-sm dark:bg-white/10 dark:text-white/80'}`}>
                        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs ${plan.tier === 'Premium' ? 'bg-sun text-ink' : 'bg-ink text-white dark:bg-white dark:text-ink'}`}>✓</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  {plan.tier === 'Premium' ? (
                    <div className="relative mt-auto pt-6">
                      <div className="rounded-lg border border-white/10 bg-white/10 p-3 text-sm font-semibold text-white/75">
                        Designed for weddings, anniversaries, festivals, and polished share moments.
                      </div>
                    </div>
                  ) : <div className="mt-auto" />}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}
