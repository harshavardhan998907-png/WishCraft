import type { HTMLAttributes } from 'react'

export function ResponsiveCard({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-black/10 bg-white p-4 shadow-sm transition-colors dark:border-white/10 dark:bg-[#181824] dark:text-white sm:p-5 ${className}`}
      {...props}
    />
  )
}
