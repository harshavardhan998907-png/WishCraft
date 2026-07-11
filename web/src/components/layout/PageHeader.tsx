import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '../ui/Button'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  backTo?: string
  onBack?: () => void
}

export function PageHeader({ title, subtitle, actions, backTo, onBack }: PageHeaderProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (backTo) {
      navigate(backTo)
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          className="group mt-0.5 shrink-0 px-2.5 hover:bg-black/5 dark:hover:bg-white/10"
          onClick={handleBack}
          aria-label="Go back"
        >
          <ArrowLeft size={20} className="text-zinc-500 transition-transform group-hover:-translate-x-1 dark:text-zinc-400" />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">{title}</h1>
          {subtitle && (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-white/70 sm:text-base">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3 sm:mt-0">{actions}</div>}
    </div>
  )
}
