import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader } from './Loader'

const variants = {
  primary: 'bg-brand text-white hover:bg-[#5244c4]',
  secondary: 'bg-ink text-white hover:bg-black dark:bg-white dark:text-ink dark:hover:bg-white/85',
  ghost: 'bg-transparent text-ink hover:bg-black/5 dark:text-white dark:hover:bg-white/10',
  danger: 'bg-coral text-white hover:bg-[#ef5c50]',
}

const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5',
  lg: 'h-13 px-7 text-lg',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  loading?: boolean
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', loading, className = '', children, disabled, ...props }: ButtonProps) {
  return (
    <button className={`focus-ring inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? <Loader variant="spinner" size="sm" /> : null}
      {children}
    </button>
  )
}
