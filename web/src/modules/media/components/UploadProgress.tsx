import type { UploadProgressState } from '../types'

export function UploadProgress({ progress }: { progress: UploadProgressState | null }) {
  if (!progress) return null

  return (
    <div className="rounded-md bg-zinc-100 p-3 dark:bg-white/10">
      <div className="flex items-center justify-between gap-3 text-sm font-semibold">
        <span>{progress.label}</span>
        <span>{progress.value}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white dark:bg-black/30">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, Math.max(0, progress.value))}%` }} />
      </div>
    </div>
  )
}
