import { useState } from 'react'
import { uploadOptimizedImage } from '../services/mediaService'
import { MediaPreview } from './MediaPreview'
import { UploadProgress } from './UploadProgress'
import type { UploadProgressState } from '../types'
import { useToastStore } from '../../../store/toastStore'

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
  const toast = useToastStore()

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files || files.length === 0) return

    if (maxFiles === 1 && urls.length >= 1) {
      toast.push('info', 'One image is already selected for this memory. Add another memory to upload another image.', 'top-left')
      event.target.value = ''
      return
    }

    setError(null)
    const remaining = Math.max(0, maxFiles - urls.length)
    const filesArray = Array.from(files).slice(0, remaining)
    event.target.value = ''

    for (const file of filesArray) {
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
        <span className="font-semibold">{maxFiles === 1 ? 'Upload photo' : 'Upload photos'}</span>
        <span className="text-sm text-zinc-500 dark:text-white/55">
          {maxFiles === 1 ? 'One photo per memory' : `Optimized to WebP, up to ${maxFiles} photos`}
        </span>
        <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple={maxFiles > 1} disabled={disabled || Boolean(progress)} onChange={handleFiles} />
      </label>
      <UploadProgress progress={progress} />
      {error ? <p className="text-sm font-semibold text-rose-600 dark:text-rose-200">{error}</p> : null}
      <MediaPreview urls={urls} onRemove={onRemove} />
    </div>
  )
}
