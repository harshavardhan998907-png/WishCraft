import { motion } from 'framer-motion'
import type { WishData } from '../../types'
import { FloatingRibbons, OrbitGlow, ShimmerSweep } from '../ui/MotionDecor'

interface TemplateFrameProps {
  data: WishData
  theme: string
  title: string
  accent: string
  motif?: 'confetti' | 'glow' | 'petals' | 'sparks' | 'stars' | 'hearts'
  children?: React.ReactNode
}

function floatingSymbol(motif: TemplateFrameProps['motif'], index: number) {
  const symbols = {
    confetti: ['+', '*', 'x', 'o'],
    glow: ['o', '*', 'o', '+'],
    petals: ['v', 'u', 'v', '~'],
    sparks: ['*', '+', 'o', 'x'],
    stars: ['*', '+', 'x', '.'],
    hearts: ['v', '<3', 'v', '*'],
  }
  return symbols[motif ?? 'confetti'][index % 4]
}

export function TemplateFrame({ data, theme, title, accent, motif = 'confetti', children }: TemplateFrameProps) {
  return (
    <section className={`relative flex min-h-screen min-h-[100svh] items-center justify-center overflow-hidden px-5 py-8 text-center sm:py-10 ${theme}`}>
      <FloatingRibbons density={motif === 'confetti' || motif === 'sparks' ? 34 : 22} light={motif === 'glow' || motif === 'sparks'} />
      <OrbitGlow className="left-6 top-12 h-52 w-52 opacity-40" />
      <OrbitGlow className="bottom-8 right-8 h-72 w-72 opacity-35" />

      <div className="absolute inset-0 opacity-80">
        {Array.from({ length: 42 }).map((_, index) => (
          <motion.span
            key={index}
            className={`absolute grid place-items-center rounded-full text-lg font-black ${accent}`}
            style={{
              left: `${(index * 23) % 100}%`,
              top: `${(index * 41) % 100}%`,
              width: 18 + (index % 4) * 10,
              height: 18 + (index % 4) * 10,
            }}
            animate={{
              y: [0, -70, 0],
              x: [0, index % 2 ? 28 : -28, 0],
              rotate: [0, 160, 360],
              opacity: [0.12, 0.94, 0.12],
              scale: [0.8, 1.35, 0.8],
            }}
            transition={{ duration: 3.4 + (index % 5), repeat: Infinity, delay: index * 0.06 }}
          >
            {floatingSymbol(motif, index)}
          </motion.span>
        ))}
      </div>

      <motion.div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-white/25 blur-3xl" animate={{ scale: [1, 1.35, 1], opacity: [0.25, 0.7, 0.25] }} transition={{ repeat: Infinity, duration: 3.6 }} />

      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-4 sm:gap-5 lg:gap-6">
        <motion.div className="relative overflow-hidden rounded-full border border-current/20 bg-white/15 px-5 py-2 backdrop-blur" animate={{ y: [0, -6, 0] }} transition={{ duration: 2.6, repeat: Infinity }}>
          <ShimmerSweep />
          <p className="text-sm font-black uppercase tracking-[0.22em] opacity-80">{title}</p>
        </motion.div>

        <motion.h1 className="text-4xl font-black leading-tight sm:text-5xl md:text-7xl" animate={{ scale: [1, 1.045, 1], y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
          {data.recipientName || 'Someone Special'}
        </motion.h1>

        <motion.p className="max-w-2xl text-base leading-7 opacity-85 md:text-xl md:leading-8" animate={{ opacity: [0.78, 1, 0.78] }} transition={{ duration: 3, repeat: Infinity }}>
          {data.customMessage || 'A heartfelt wish made just for you.'}
        </motion.p>

        {data.photoUrls.length ? (
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
            {data.photoUrls.slice(0, 3).map((url, index) => (
              <motion.div
                key={url}
                className="premium-ring overflow-hidden rounded-xl bg-white/20 p-2 backdrop-blur"
                initial={{ opacity: 0, rotate: index === 1 ? 0 : index === 0 ? -4 : 4, y: 24 }}
                animate={{ opacity: 1, rotate: index === 1 ? [0, 1.5, 0] : index === 0 ? [-2, -5, -2] : [2, 5, 2], y: [0, index % 2 ? -10 : 10, 0] }}
                transition={{ delay: index * 0.14, duration: 4, repeat: Infinity }}
              >
                <img src={url} alt="" className="h-56 w-full rounded-lg object-cover" />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div className="premium-ring relative grid min-h-40 w-full max-w-2xl place-items-center overflow-hidden rounded-xl bg-white/18 p-6 backdrop-blur sm:min-h-52" animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
            <ShimmerSweep />
            <p className="text-lg font-bold opacity-75">Add photos in the editor to turn this into a memory gallery.</p>
          </motion.div>
        )}

        {children}

        <motion.p className="pt-1 text-xl font-black sm:pt-2 sm:text-2xl" initial={{ opacity: 0 }} animate={{ opacity: [0.75, 1, 0.75], scale: [1, 1.03, 1] }} transition={{ delay: 0.45, duration: 2.8, repeat: Infinity }}>
          With love, {data.senderName || 'Your friend'}
        </motion.p>
      </motion.div>
    </section>
  )
}
