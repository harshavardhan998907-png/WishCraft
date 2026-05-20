import type { HTMLAttributes } from 'react'

interface ResponsiveContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'content' | 'wide' | 'full'
}

const sizes = {
  content: 'max-w-5xl',
  wide: 'max-w-7xl',
  full: 'max-w-none',
}

export function ResponsiveContainer({ size = 'wide', className = '', ...props }: ResponsiveContainerProps) {
  return <div className={`mx-auto w-full ${sizes[size]} px-4 sm:px-5 lg:px-6 ${className}`} {...props} />
}
