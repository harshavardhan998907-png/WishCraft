interface SkeletonProps {
  className?: string
  variant?: 'default' | 'card' | 'list' | 'table'
}

export function Skeleton({ className = '', variant = 'default' }: SkeletonProps) {
  const baseClass = "animate-pulse rounded-lg bg-zinc-200 dark:bg-white/10"
  
  if (variant === 'card') {
    return (
      <div className={`p-5 rounded-2xl border border-black/5 dark:border-white/10 ${className}`}>
        <div className={`${baseClass} h-10 w-10 rounded-xl mb-4`} aria-hidden="true" />
        <div className={`${baseClass} h-6 w-3/4 mb-2`} aria-hidden="true" />
        <div className={`${baseClass} h-4 w-1/2`} aria-hidden="true" />
      </div>
    )
  }

  if (variant === 'list') {
    return (
      <div className={`flex items-center gap-4 p-4 ${className}`}>
        <div className={`${baseClass} h-12 w-12 rounded-full flex-shrink-0`} aria-hidden="true" />
        <div className="flex-1 space-y-2">
          <div className={`${baseClass} h-5 w-1/3`} aria-hidden="true" />
          <div className={`${baseClass} h-4 w-2/3`} aria-hidden="true" />
        </div>
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className={`${baseClass} h-10 w-full`} aria-hidden="true" />
        <div className={`${baseClass} h-12 w-full`} aria-hidden="true" />
        <div className={`${baseClass} h-12 w-full`} aria-hidden="true" />
        <div className={`${baseClass} h-12 w-full`} aria-hidden="true" />
      </div>
    )
  }

  return <div className={`${baseClass} ${className}`} aria-hidden="true" />
}
