import { useId } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  maxLength?: number
}

export function Textarea({ label, error, maxLength, value, required, className = '', id, ...props }: TextareaProps) {
  const count = String(value ?? '').length
  const errorId = useId()
  const hasError = !!error

  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-ink dark:text-white/90">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </span>
      <textarea 
        id={id}
        required={required}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        className={`focus-ring min-h-28 w-full rounded-xl border bg-white px-3 py-2.5 text-ink transition-colors placeholder:text-zinc-400 dark:bg-[#10101a] dark:text-white dark:placeholder:text-white/35 custom-scrollbar ${error ? 'border-rose-500 bg-rose-50/50 focus:ring-rose-500/50 dark:border-rose-500 dark:bg-rose-950/20' : 'border-black/15 dark:border-white/10'} ${className}`} 
        maxLength={maxLength} 
        value={value} 
        {...props} 
      />
      <span className="flex justify-between text-sm min-h-[20px] relative overflow-hidden">
        <span className="flex-1 min-w-0 relative">
          <AnimatePresence initial={false}>
            {error && (
              <motion.span
                key="error"
                id={errorId}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute left-0 top-0 flex items-center gap-1.5 text-rose-600 dark:text-rose-300"
              >
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        {maxLength ? <span className="text-zinc-500 dark:text-white/50">{count}/{maxLength}</span> : null}
      </span>
    </label>
  )
}
