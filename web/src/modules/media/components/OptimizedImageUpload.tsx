import { useState } from 'react'
import { uploadOptimizedImage } from '../services/mediaService'
import { MediaPreview } from './MediaPreview'
import { UploadProgress } from './UploadProgress'
import type { UploadProgressState } from '../types'

export function OptimizedImageUpload({
  urls,
  onUploaded,
  onRemove,
  disabled,
  maxFiles = 5,
  templateId,
}: {
  urls: string[]
  onUploaded: (url: string) => void
  onRemove: (url: string) => void
  disabled?: boolean
  maxFiles?: number
  templateId?: string | null
}) {
  const [progress, setProgress] = useState<UploadProgressState | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(files: FileList) {
    setError(null)
    const remaining = Math.max(0, maxFiles - urls.length)
    for (const file of Array.from(files).slice(0, remaining)) {
      try {
        setProgress({ label: `Optimizing ${file.name}`, value: 5 })
        const result = await uploadOptimizedImage(file, {
          templateId,
          onProgress: (value) => setProgress({ label: `Optimizing ${file.name}`, value }),
        })
        onUploaded(result.url)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Image upload failed')
      } finally {
        setProgress(null)
      }
    }
  }

  return (
    <div className="space-y-3">
      <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-black/20 bg-white p-4 text-center transition-colors dark:border-white/15 dark:bg-white/10">
        <span className="font-semibold">Upload photos</span>
        <span className="text-sm text-zinc-500 dark:text-white/55">Optimized to WebP, up to 5 photos</span>
        <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={disabled || Boolean(progress)} onChange={(event) => event.target.files && handleFiles(event.target.files)} />
      </label>
      <UploadProgress progress={progress} />
      {error ? <p className="text-sm font-semibold text-rose-600 dark:text-rose-200">{error}</p> : null}
      <MediaPreview urls={urls} onRemove={onRemove} />
    </div>
  )
}
