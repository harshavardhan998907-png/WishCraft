import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helper?: string
  rightElement?: ReactNode
}

export function Input({ label, error, helper, rightElement, required, className = '', id, ...props }: InputProps) {
  const errorId = useId()
  const helperId = useId()
  const hasError = !!error
  const hasHelper = !!helper

  const describedBy = [
    hasError ? errorId : null,
    hasHelper ? helperId : null
  ].filter(Boolean).join(' ') || undefined

  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-ink dark:text-white/90">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </span>
      <div className="relative">
        <input 
          id={id}
          required={required} 
          aria-invalid={hasError}
          aria-describedby={describedBy}
          className={`focus-ring w-full rounded-xl border bg-white px-3 py-2.5 text-ink transition-colors placeholder:text-zinc-400 dark:bg-[#10101a] dark:text-white dark:placeholder:text-white/35 ${error ? 'border-rose-500 bg-rose-50/50 focus:ring-rose-500/50 dark:border-rose-500 dark:bg-rose-950/20' : 'border-black/15 dark:border-white/10'} ${rightElement ? 'pr-11' : ''} ${className}`} 
          {...props} 
        />
        {rightElement ? (
          <div className="absolute right-0 top-0 flex h-full items-center pr-3">
            {rightElement}
          </div>
        ) : null}
      </div>
      <div className="min-h-[20px] relative overflow-hidden">
        <AnimatePresence initial={false}>
          {error ? (
            <motion.span
              key="error"
              id={errorId}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute left-0 top-0 flex items-center gap-1.5 text-sm font-medium text-rose-600 dark:text-rose-400"
            >
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </motion.span>
          ) : helper ? (
            <motion.span
              key="helper"
              id={helperId}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute left-0 top-0 text-sm text-zinc-500 dark:text-white/50"
            >
              {helper}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
    </label>
  )
}
