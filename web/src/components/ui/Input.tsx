import type { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helper?: string
  rightElement?: ReactNode
}

export function Input({ label, error, helper, rightElement, required, className = '', ...props }: InputProps) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-ink dark:text-white/90">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </span>
      <div className="relative">
        <input required={required} className={`focus-ring w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-ink transition-colors placeholder:text-zinc-400 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/35 ${rightElement ? 'pr-11' : ''} ${className}`} {...props} />
        {rightElement ? (
          <div className="absolute right-0 top-0 flex h-full items-center pr-3">
            {rightElement}
          </div>
        ) : null}
      </div>
      {error ? <span className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</span> : helper ? <span className="text-sm text-zinc-500 dark:text-white/50">{helper}</span> : null}
    </label>
  )
}
