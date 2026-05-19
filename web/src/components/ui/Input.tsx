import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helper?: string
}

export function Input({ label, error, helper, className = '', ...props }: InputProps) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-ink dark:text-white/90">{label}</span>
      <input className={`focus-ring w-full rounded-md border border-black/15 bg-white px-3 py-2.5 text-ink transition-colors placeholder:text-zinc-400 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/35 ${className}`} {...props} />
      {error ? <span className="text-sm text-rose-600 dark:text-rose-300">{error}</span> : helper ? <span className="text-sm text-zinc-500 dark:text-white/50">{helper}</span> : null}
    </label>
  )
}
