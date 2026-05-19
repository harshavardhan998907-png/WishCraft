import { motion } from 'framer-motion'

export function FloatingRibbons({ density = 18, light = false }: { density?: number; light?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: density }).map((_, index) => (
        <motion.span
          key={index}
          className={`absolute rounded-[3px] ${light ? 'bg-white/55' : index % 3 === 0 ? 'bg-coral/45' : index % 3 === 1 ? 'bg-sun/55' : 'bg-mint/45'}`}
          style={{
            width: 8 + (index % 4) * 7,
            height: 22 + (index % 5) * 10,
            left: `${(index * 37) % 100}%`,
            top: `${-12 + ((index * 19) % 118)}%`,
          }}
          animate={{
            y: [0, 80, 0],
            x: [0, index % 2 ? 22 : -22, 0],
            rotate: [0, 180, 360],
            opacity: [0.12, 0.8, 0.12],
          }}
          transition={{ duration: 6 + (index % 5), repeat: Infinity, delay: index * 0.14, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

export function OrbitGlow({ className = '' }: { className?: string }) {
  return (
    <motion.div className={`pointer-events-none absolute rounded-full border border-white/40 ${className}`} animate={{ rotate: 360, scale: [1, 1.08, 1] }} transition={{ rotate: { duration: 18, repeat: Infinity, ease: 'linear' }, scale: { duration: 4, repeat: Infinity } }}>
      <motion.span className="absolute -right-2 top-1/2 h-4 w-4 rounded-full bg-sun shadow-[0_0_28px_rgba(255,189,74,.9)]" animate={{ scale: [0.8, 1.4, 0.8] }} transition={{ duration: 2, repeat: Infinity }} />
    </motion.div>
  )
}

export function ShimmerSweep() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/30 to-transparent"
      animate={{ x: ['0%', '320%'] }}
      transition={{ duration: 3.4, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
    />
  )
}
