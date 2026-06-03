import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl border border-black/10 bg-white p-5 shadow-soft transition-colors dark:border-white/10 dark:bg-[#181824] dark:text-white ${className}`} {...props} />
}
