import type { TextareaHTMLAttributes } from 'react'

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
      <textarea className={`focus-ring min-h-28 w-full rounded-md border border-black/15 bg-white px-3 py-2.5 text-ink transition-colors placeholder:text-zinc-400 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/35 ${className}`} maxLength={maxLength} value={value} {...props} />
      <span className="flex justify-between text-sm">
        <span className="text-rose-600 dark:text-rose-300">{error}</span>
        {maxLength ? <span className="text-zinc-500 dark:text-white/50">{count}/{maxLength}</span> : null}
      </span>
    </label>
  )
}
