import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTemplates } from '../hooks/useTemplates'
import { OccasionBadge, TierBadge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { TemplateScenePreview } from '../components/templates/TemplateScenePreview'
import type { OccasionType, Template, TemplateTier } from '../types'
import { formatPrice } from '../lib/utils'
import { FloatingRibbons, OrbitGlow, ShimmerSweep } from '../components/ui/MotionDecor'
import { useAnalytics } from '../modules/analytics/hooks/useAnalytics'

const occasions: Array<'all' | OccasionType> = ['all', 'birthday', 'wedding', 'anniversary', 'festival', 'graduation', 'baby_shower', 'farewell', 'valentine']
const tiers: Array<'all' | TemplateTier> = ['all', 'free', 'standard', 'premium']

function TemplateCard({ template, onClick }: { template: Template; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: [0, -4, 0] }}
      whileHover={{ y: -12, rotate: 0.6 }}
      transition={{ duration: 4, repeat: Infinity, repeatType: 'mirror' }}
      onClick={onClick}
      className="group h-full text-left"
    >
      <Card className="premium-ring h-full overflow-hidden p-0 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-premium">
        <div className="relative h-72 overflow-hidden">
          <TemplateScenePreview occasion={template.occasion} slug={template.slug} name={template.name} thumbnailUrl={template.thumbnail_url} />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/92 via-ink/18 to-transparent" />
          <div className="absolute left-4 top-4 flex gap-2">
            <TierBadge tier={template.tier} />
            <OccasionBadge occasion={template.occasion} />
          </div>
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h2 className="text-2xl font-black">{template.name}</h2>
            <p className="mt-2 text-sm font-semibold text-white/80">{template.has_animation ? 'Immersive animated reveal' : 'Elegant static reveal'} {template.has_music ? '+ music support' : ''}</p>
          </div>
        </div>
        <div className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-zinc-500">Starting at</p>
            <p className="text-xl font-black">{formatPrice(template.price_paise)}</p>
          </div>
          <motion.span className="rounded-md bg-ink px-4 py-2 text-sm font-black text-white shadow-soft transition group-hover:bg-brand group-hover:shadow-premium" animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2.4, repeat: Infinity }}>Customize</motion.span>
        </div>
      </Card>
    </motion.button>
  )
}

export function Browse() {
  const { templates, loading } = useTemplates()
  const [occasion, setOccasion] = useState<'all' | OccasionType>('all')
  const [tier, setTier] = useState<'all' | TemplateTier>('all')
  const [animation, setAnimation] = useState(false)
  const [music, setMusic] = useState(false)
  const navigate = useNavigate()
  const analytics = useAnalytics()

  const filtered = useMemo(() => templates.filter((template) =>
    (occasion === 'all' || template.occasion === occasion) &&
    (tier === 'all' || template.tier === tier) &&
    (!animation || template.has_animation) &&
    (!music || template.has_music)
  ), [templates, occasion, tier, animation, music])

  return (
    <section className="px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-2xl bg-ink px-6 py-10 text-white shadow-premium md:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,189,74,.28),transparent_28rem),radial-gradient(circle_at_80%_10%,rgba(43,191,159,.22),transparent_24rem)]" />
          <FloatingRibbons density={20} light />
          <OrbitGlow className="right-10 top-8 h-52 w-52 opacity-50" />
          <div className="relative max-w-3xl">
            <p className="font-black uppercase tracking-[0.18em] text-sun">Template marketplace</p>
            <h1 className="mt-3 text-4xl font-black md:text-6xl">Choose the wish experience that matches the moment</h1>
            <p className="mt-4 text-lg leading-8 text-white/75">Filter by occasion, price tier, music, and animation. Every card is built to become a shareable 7-day celebration page.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="glass-panel h-fit rounded-xl p-5">
            <h2 className="text-xl font-black">Filters</h2>
            <div className="mt-5 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-black uppercase tracking-[0.12em] text-zinc-500">Occasion</span>
                <select className="focus-ring w-full rounded-md border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/10 dark:text-white" value={occasion} onChange={(event) => setOccasion(event.target.value as any)}>
                  {occasions.map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-black uppercase tracking-[0.12em] text-zinc-500">Tier</span>
                <select className="focus-ring w-full rounded-md border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/10 dark:text-white" value={tier} onChange={(event) => setTier(event.target.value as any)}>
                  {tiers.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="flex items-center justify-between rounded-lg bg-white p-3 font-bold shadow-sm dark:bg-white/10">
                Has animation
                <input type="checkbox" checked={animation} onChange={(event) => setAnimation(event.target.checked)} />
              </label>
              <label className="flex items-center justify-between rounded-lg bg-white p-3 font-bold shadow-sm dark:bg-white/10">
                Has music
                <input type="checkbox" checked={music} onChange={(event) => setMusic(event.target.checked)} />
              </label>
            </div>
          </aside>

          <div>
            <div className="mb-5 flex items-center justify-between">
              <p className="font-bold text-zinc-600">{filtered.length} templates found</p>
              <p className="hidden rounded-full bg-white px-4 py-2 text-sm font-black shadow-sm dark:bg-white/10 md:block">Live preview cards</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-96" />)
                : filtered.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onClick={() => {
                      analytics.trackTemplateSelection({
                        templateId: template.id,
                        templateSlug: template.slug,
                        templateName: template.name,
                        tier: template.tier,
                        occasion: template.occasion,
                      })
                      navigate(`/editor/${template.slug}`)
                    }}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
