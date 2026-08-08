import type { UploadProgressState } from '../types'
import { Progress } from '../../../components/ui/Progress'

export function UploadProgress({ progress }: { progress: UploadProgressState | null }) {
  if (!progress) return null

  return (
    <div className="rounded-md bg-zinc-100 p-3 dark:bg-white/10">
      <div className="flex items-center justify-between gap-3 text-sm font-semibold mb-2">
        <span>{progress.label}</span>
        <span>{progress.value}%</span>
      </div>
      <Progress value={progress.value} />
    </div>
  )
}
