import { motion } from 'framer-motion'

interface ProgressProps {
  value: number // 0 to 100
  className?: string
}

export function Progress({ value, className = '' }: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value))
  
  return (
    <div 
      role="progressbar" 
      aria-valuenow={clampedValue} 
      aria-valuemin={0} 
      aria-valuemax={100}
      className={`h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10 ${className}`}
    >
      <motion.div
        className="h-full bg-brand"
        initial={{ width: 0 }}
        animate={{ width: `${clampedValue}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </div>
  )
}
