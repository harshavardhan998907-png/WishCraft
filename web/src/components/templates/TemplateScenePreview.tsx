import { motion } from 'framer-motion'
import type { OccasionType } from '../../types'
import { FloatingRibbons, OrbitGlow, ShimmerSweep } from '../ui/MotionDecor'

type SceneKind = OccasionType | 'valentine'

interface TemplateScenePreviewProps {
  occasion?: OccasionType
  slug?: string
  name?: string
  thumbnailUrl?: string | null
  compact?: boolean
}

const sceneCopy: Record<SceneKind, { label: string; description: string; bg: string; glow: string; accent: string }> = {
  birthday: {
    label: 'Birthday',
    description: 'Cake, balloons, candles, and party sparks',
    bg: 'from-[#ff7a5e] via-[#ffc84f] to-[#49c7a4]',
    glow: 'bg-sun/35',
    accent: 'bg-coral',
  },
  wedding: {
    label: 'Wedding',
    description: 'Rings, petals, silk light, and floral glow',
    bg: 'from-[#56379e] via-[#7d72de] to-[#ff7065]',
    glow: 'bg-white/35',
    accent: 'bg-sun',
  },
  anniversary: {
    label: 'Anniversary',
    description: 'Hearts, soft romance, and warm memories',
    bg: 'from-[#56379e] via-[#7d72de] to-[#ff7065]',
    glow: 'bg-coral/30',
    accent: 'bg-brand',
  },
  festival: {
    label: 'Festival',
    description: 'Diyas, festive lights, sparkles, and gold',
    bg: 'from-[#ff7a5e] via-[#ffc84f] to-[#49c7a4]',
    glow: 'bg-sun/45',
    accent: 'bg-mint',
  },
  graduation: {
    label: 'Graduation',
    description: 'Caps, certificates, stars, and bright wins',
    bg: 'from-[#ff7a5e] via-[#ffc84f] to-[#49c7a4]',
    glow: 'bg-mint/35',
    accent: 'bg-sun',
  },
  baby_shower: {
    label: 'Baby Shower',
    description: 'Clouds, blocks, toys, and soft pastels',
    bg: 'from-[#dff7ff] via-[#ffdcea] to-[#fff8ec]',
    glow: 'bg-white/65',
    accent: 'bg-mint',
  },
  farewell: {
    label: 'Farewell',
    description: 'Memory notes, stars, and thoughtful goodbyes',
    bg: 'from-[#56379e] via-[#7d72de] to-[#49c7a4]',
    glow: 'bg-brand/35',
    accent: 'bg-sun',
  },
  valentine: {
    label: 'Valentine',
    description: 'Hearts, blush light, and romantic motion',
    bg: 'from-[#56379e] via-[#d75a87] to-[#ffb5c0]',
    glow: 'bg-coral/35',
    accent: 'bg-sun',
  },
  other: {
    label: 'Special',
    description: 'Elegant details for a personal moment',
    bg: 'from-[#15141f] via-[#56379e] to-[#7d72de]',
    glow: 'bg-brand/35',
    accent: 'bg-mint',
  },
}

function sceneFromProps({ occasion, slug = '', name = '' }: TemplateScenePreviewProps): SceneKind {
  const source = `${slug} ${name}`.toLowerCase()
  if (source.includes('birthday')) return 'birthday'
  if (source.includes('wedding')) return 'wedding'
  if (source.includes('anniversary')) return 'anniversary'
  if (source.includes('diwali') || source.includes('festival')) return 'festival'
  if (source.includes('graduation')) return 'graduation'
  if (source.includes('baby')) return 'baby_shower'
  if (source.includes('farewell')) return 'farewell'
  if (source.includes('valentine')) return 'valentine'
  return occasion ?? 'other'
}

function Sparkles({ light = true }: { light?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {Array.from({ length: 14 }).map((_, index) => (
        <motion.span
          key={index}
          className={`absolute h-1.5 w-1.5 rounded-full ${light ? 'bg-white/80' : 'bg-ink/30'}`}
          style={{ left: `${8 + ((index * 17) % 84)}%`, top: `${10 + ((index * 23) % 78)}%` }}
          animate={{ scale: [0.65, 1.7, 0.65], opacity: [0.25, 0.95, 0.25] }}
          transition={{ duration: 1.8 + (index % 4) * 0.3, repeat: Infinity, delay: index * 0.11 }}
        />
      ))}
    </div>
  )
}

function Balloon({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div className={`absolute ${className}`} animate={{ y: [0, -10, 0], rotate: [-2, 3, -2] }} transition={{ duration: 3.2, repeat: Infinity, delay }}>
      <div className="h-16 w-12 rounded-full bg-gradient-to-br from-coral to-sun shadow-premium" />
      <div className="mx-auto h-10 w-px bg-white/60" />
    </motion.div>
  )
}

function Cake() {
  return (
    <motion.div className="absolute bottom-5 left-1/2 w-28 -translate-x-1/2" animate={{ y: [0, -3, 0] }} transition={{ duration: 2.6, repeat: Infinity }}>
      <div className="mx-auto mb-1 flex w-16 justify-around">
        {[0, 1, 2].map((i) => <span key={i} className="h-8 w-2 rounded-full bg-white shadow-[0_-8px_18px_rgba(255,189,74,.9)]" />)}
      </div>
      <div className="h-10 rounded-t-lg bg-white/95 shadow-soft" />
      <div className="h-9 rounded-b-xl bg-coral shadow-premium" />
    </motion.div>
  )
}

function Rings() {
  return (
    <motion.div className="absolute bottom-8 left-1/2 h-28 w-36 -translate-x-1/2" animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 3, repeat: Infinity }}>
      <div className="absolute left-4 top-7 h-20 w-20 rounded-full border-[10px] border-sun shadow-[0_0_36px_rgba(255,189,74,.55)]" />
      <div className="absolute right-4 top-7 h-20 w-20 rounded-full border-[10px] border-white/85 shadow-[0_0_34px_rgba(255,255,255,.45)]" />
      <div className="absolute left-1/2 top-0 h-5 w-12 -translate-x-1/2 rounded-full bg-white/80" />
    </motion.div>
  )
}

function Hearts() {
  return (
    <div className="absolute inset-0">
      {Array.from({ length: 9 }).map((_, index) => (
        <motion.div
          key={index}
          className="absolute h-8 w-8 rotate-45 rounded-br-md bg-coral shadow-soft before:absolute before:-left-4 before:top-0 before:h-8 before:w-8 before:rounded-full before:bg-coral after:absolute after:-top-4 after:left-0 after:h-8 after:w-8 after:rounded-full after:bg-coral"
          style={{ left: `${12 + ((index * 19) % 74)}%`, top: `${16 + ((index * 13) % 62)}%`, opacity: 0.22 + (index % 3) * 0.12 }}
          animate={{ y: [0, -18, 0], scale: [0.8, 1.08, 0.8] }}
          transition={{ duration: 3 + (index % 4) * 0.35, repeat: Infinity, delay: index * 0.15 }}
        />
      ))}
    </div>
  )
}

function Diyas() {
  return (
    <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-5">
      {Array.from({ length: 3 }).map((_, index) => (
        <motion.div key={index} className="relative" animate={{ y: [0, index === 1 ? -7 : -3, 0] }} transition={{ duration: 2.4, repeat: Infinity, delay: index * 0.2 }}>
          <div className="absolute -top-10 left-1/2 h-12 w-8 -translate-x-1/2 rounded-full bg-sun blur-sm" />
          <div className="absolute -top-8 left-1/2 h-8 w-4 -translate-x-1/2 rounded-full bg-[#fff8c9] shadow-[0_0_28px_rgba(255,189,74,.9)]" />
          <div className="h-9 w-20 rounded-b-full rounded-t-[100%] bg-coral shadow-premium" />
        </motion.div>
      ))}
    </div>
  )
}

function Graduation() {
  return (
    <motion.div className="absolute bottom-7 left-1/2 h-28 w-44 -translate-x-1/2" animate={{ rotate: [-1, 1, -1] }} transition={{ duration: 3.4, repeat: Infinity }}>
      <div className="absolute left-8 top-9 h-16 w-28 rounded-md bg-white/90 shadow-soft" />
      <div className="absolute left-4 top-3 h-12 w-36 rotate-[-10deg] bg-ink shadow-premium" style={{ clipPath: 'polygon(50% 0, 100% 35%, 50% 70%, 0 35%)' }} />
      <div className="absolute left-[86px] top-10 h-12 w-px bg-sun" />
      <div className="absolute left-[79px] top-20 h-4 w-4 rounded-full bg-sun" />
    </motion.div>
  )
}

function BabyBlocks() {
  return (
    <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 gap-3">
      {['B', 'A', 'B', 'Y'].map((letter, index) => (
        <motion.div key={`${letter}-${index}`} className="grid h-12 w-12 place-items-center rounded-lg border border-white/70 bg-white/80 text-lg font-black text-plum shadow-soft" animate={{ y: [0, index % 2 ? -8 : -4, 0] }} transition={{ duration: 2.8, repeat: Infinity, delay: index * 0.12 }}>
          {letter}
        </motion.div>
      ))}
    </div>
  )
}

function MemoryNotes() {
  return (
    <div className="absolute inset-0">
      {Array.from({ length: 6 }).map((_, index) => (
        <motion.div
          key={index}
          className="absolute h-16 w-12 rounded-md bg-white/80 shadow-soft"
          style={{ left: `${16 + ((index * 13) % 68)}%`, top: `${18 + ((index * 17) % 56)}%` }}
          animate={{ rotate: [-6, 6, -6], y: [0, -10, 0] }}
          transition={{ duration: 3 + index * 0.2, repeat: Infinity, delay: index * 0.12 }}
        />
      ))}
    </div>
  )
}

function SceneIcon({ scene }: { scene: SceneKind }) {
  if (scene === 'birthday') return <><Balloon className="left-8 top-10" /><Balloon className="right-8 top-14" delay={0.35} /><Cake /></>
  if (scene === 'wedding') return <><Rings /><FloatingRibbons density={9} light /></>
  if (scene === 'anniversary' || scene === 'valentine') return <Hearts />
  if (scene === 'festival') return <><Diyas /><Sparkles /></>
  if (scene === 'graduation') return <><Graduation /><Sparkles /></>
  if (scene === 'baby_shower') return <><BabyBlocks /><Sparkles light={false} /></>
  return <><MemoryNotes /><Sparkles /></>
}

export function TemplateScenePreview(props: TemplateScenePreviewProps) {
  const scene = sceneFromProps(props)
  const copy = sceneCopy[scene]
  const textColor = scene === 'baby_shower' ? 'text-ink' : 'text-white'
  const compact = props.compact

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${copy.bg} ${textColor}`}>
      {props.thumbnailUrl ? (
        <img src={props.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25 saturate-125 transition duration-700 group-hover:scale-110 group-hover:opacity-35" loading="lazy" />
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_24%,rgba(255,255,255,.34),transparent_18rem),radial-gradient(circle_at_82%_16%,rgba(255,189,74,.24),transparent_15rem)]" />
      <motion.div className={`absolute -right-10 -top-12 h-36 w-36 rounded-full blur-2xl ${copy.glow}`} animate={{ scale: [1, 1.18, 1] }} transition={{ duration: 3.4, repeat: Infinity }} />
      <motion.div className={`absolute -bottom-10 left-8 h-32 w-32 rounded-full blur-2xl ${copy.accent}/35`} animate={{ x: [0, 18, 0], scale: [1, 1.12, 1] }} transition={{ duration: 4, repeat: Infinity }} />
      <OrbitGlow className="right-7 top-8 h-28 w-28 opacity-45" />
      <SceneIcon scene={scene} />
      <ShimmerSweep />
      <div className="relative flex h-full flex-col justify-between p-5" style={{ minHeight: compact ? 160 : 256 }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] opacity-75">{copy.label}</p>
            <p className="mt-2 max-w-[13rem] text-sm font-semibold leading-5 opacity-80">{copy.description}</p>
          </div>
          <motion.span className="rounded-md bg-white/20 px-3 py-2 text-xs font-black backdrop-blur-md" animate={{ y: [0, -4, 0] }} transition={{ duration: 2.6, repeat: Infinity }}>
            Live
          </motion.span>
        </div>
        {!compact ? <div className="h-16" /> : null}
      </div>
    </div>
  )
}
