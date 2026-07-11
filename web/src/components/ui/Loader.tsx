import { motion } from 'framer-motion'

interface LoaderProps {
  variant?: 'spinner' | 'fullPage'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-3',
  lg: 'h-12 w-12 border-4',
}

export function Loader({ variant = 'spinner', size = 'md', className = '' }: LoaderProps) {
  const spinner = (
    <div 
      role="status" 
      aria-live="polite"
      aria-busy="true" 
      className={`animate-spin rounded-full border-current border-t-transparent text-brand ${sizes[size]} ${className}`}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )

  if (variant === 'fullPage') {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-zinc-50 to-zinc-100 backdrop-blur-md transition-colors duration-500 dark:bg-[#10101a]/95 dark:from-[#181824] dark:via-[#10101a] dark:to-black">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col items-center justify-center gap-6"
        >
          {/* Logo Container with subtle glow */}
          <div className="relative">
            <motion.div 
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-8 rounded-full bg-brand/20 blur-2xl dark:bg-brand/30"
            />
            
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative flex items-center justify-center"
            >
              <div className="flex items-center gap-3 text-3xl font-black tracking-normal text-ink dark:text-white">
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-ink text-lg text-white shadow-premium dark:bg-white dark:text-ink">WC</span>
                WishCraft
              </div>
            </motion.div>
          </div>

          {/* Loading Text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
            className="flex flex-col items-center gap-3"
          >
            <p className="text-sm font-semibold tracking-wider text-zinc-500 dark:text-zinc-400">
              Preparing your experience...
            </p>
            <div className="flex gap-1.5">
              <motion.div 
                animate={{ opacity: [0.2, 1, 0.2] }} 
                transition={{ duration: 1.5, repeat: Infinity, delay: 0, ease: 'easeInOut' }} 
                className="h-1.5 w-1.5 rounded-full bg-brand" 
              />
              <motion.div 
                animate={{ opacity: [0.2, 1, 0.2] }} 
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3, ease: 'easeInOut' }} 
                className="h-1.5 w-1.5 rounded-full bg-brand" 
              />
              <motion.div 
                animate={{ opacity: [0.2, 1, 0.2] }} 
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.6, ease: 'easeInOut' }} 
                className="h-1.5 w-1.5 rounded-full bg-brand" 
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return spinner
}
