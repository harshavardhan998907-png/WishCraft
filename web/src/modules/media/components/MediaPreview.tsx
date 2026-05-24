import { Button } from '../../../components/ui/Button'

export function MediaPreview({ urls, onRemove }: { urls: string[]; onRemove?: (url: string) => void }) {
  if (!urls.length) return null

  return (
    <div className="grid grid-cols-5 gap-2">
      {urls.map((url) => (
        <div key={url} className="relative aspect-square overflow-hidden rounded-md bg-zinc-100 dark:bg-white/10">
          <img src={url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          {onRemove ? (
            <Button type="button" size="sm" variant="danger" className="absolute right-1 top-1 h-7 px-2 text-xs" onClick={() => onRemove(url)}>X</Button>
          ) : null}
        </div>
      ))}
    </div>
  )
}
