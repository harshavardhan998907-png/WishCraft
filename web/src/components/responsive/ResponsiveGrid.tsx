import type { HTMLAttributes } from 'react'

interface ResponsiveGridProps extends HTMLAttributes<HTMLDivElement> {
  columns?: 'cards' | 'metrics' | 'auto'
}

const columnsByMode = {
  cards: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  metrics: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
  auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4',
}

export function ResponsiveGrid({ columns = 'cards', className = '', ...props }: ResponsiveGridProps) {
  return <div className={`grid gap-3 sm:gap-4 ${columnsByMode[columns]} ${className}`} {...props} />
}
