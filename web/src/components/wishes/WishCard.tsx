import { useNavigate } from 'react-router-dom'
import type { Wish } from '../../types'
import { Clock, CheckCircle2 } from 'lucide-react'

interface WishCardProps {
  wish: Wish
}

export function WishCard({ wish }: WishCardProps) {
  const navigate = useNavigate()
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate(`/preview/${wish.slug}`)
    }
  }

  const isDraft = wish.status === 'draft'
  const dateStr = new Date(wish.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div 
      onClick={() => navigate(`/preview/${wish.slug}`)} 
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      className="group cursor-pointer relative flex flex-col rounded-3xl border border-black/5 bg-white shadow-soft overflow-hidden dark:border-white/5 dark:bg-ink hover:-translate-y-1 hover:shadow-premium transition-all duration-300 focus-ring"
    >
      <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-white/5 overflow-hidden">
        {wish.template?.thumbnail_url ? (
          <img
            src={wish.template.thumbnail_url}
            alt={wish.template.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 text-zinc-400">
            No Image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Status Badge Overlaid on Image */}
        <div className="absolute top-3 right-3 z-10">
          <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm backdrop-blur-md ${isDraft ? 'bg-black/50 text-white' : 'bg-brand/90 text-white'}`}>
            {isDraft ? <Clock size={12} /> : <CheckCircle2 size={12} />}
            {isDraft ? 'Draft' : 'Published'}
          </div>
        </div>
      </div>
      
      <div className="p-5 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold text-ink dark:text-white line-clamp-1">To: {wish.recipient_name || 'Someone Special'}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1">
              {wish.template?.name || 'Custom Wish'}
            </p>
          </div>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {dateStr}
          </p>
          <span className="text-xs font-semibold text-brand opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
            {isDraft ? 'Continue Editing' : 'View Wish'} →
          </span>
        </div>
      </div>
    </div>
  )
}
