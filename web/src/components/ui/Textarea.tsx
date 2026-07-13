import type { TextareaHTMLAttributes } from 'react'
import { AlertCircle } from 'lucide-react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  maxLength?: number
}

export function Textarea({ label, error, maxLength, value, className = '', ...props }: TextareaProps) {
  const count = String(value ?? '').length
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-ink dark:text-white/90">{label}</span>
      <textarea className={`focus-ring min-h-28 w-full rounded-md border bg-white px-3 py-2.5 text-ink transition-colors placeholder:text-zinc-400 dark:bg-white/10 dark:text-white dark:placeholder:text-white/35 ${error ? 'border-rose-500 focus:ring-rose-500/50 dark:border-rose-500' : 'border-black/15 dark:border-white/10'} ${className}`} maxLength={maxLength} value={value} {...props} />
      <span className="flex justify-between text-sm">
        <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-300">
          {error && <AlertCircle size={14} />}
          {error}
        </span>
        {maxLength ? <span className="text-zinc-500 dark:text-white/50">{count}/{maxLength}</span> : null}
      </span>
    </label>
  )
}
