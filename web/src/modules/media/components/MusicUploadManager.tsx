import { useState } from 'react'
import { uploadMusicAsset } from '../services/mediaService'
import { UploadProgress } from './UploadProgress'
import type { UploadProgressState } from '../types'

export function MusicUploadManager({
  disabled,
  templateId,
  onUploaded,
}: {
  disabled?: boolean
  templateId?: string | null
  onUploaded: (url: string) => void
}) {
  const [progress, setProgress] = useState<UploadProgressState | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    try {
      setProgress({ label: `Validating ${file.name}`, value: 10 })
      const result = await uploadMusicAsset(file, {
        templateId,
        onProgress: (value) => setProgress({ label: `Uploading ${file.name}`, value }),
      })
      onUploaded(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Music upload failed')
    } finally {
      setProgress(null)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-black/20 bg-white/80 p-4 dark:border-white/15 dark:bg-white/10">
      <label className="block">
        <span className="block text-sm font-bold">Upload your own music</span>
        <span className="block text-sm text-zinc-500">Premium only, validated audio under 10MB</span>
        <input className="mt-3 block w-full text-sm" type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/mp4" disabled={disabled || Boolean(progress)} onChange={(event) => event.target.files?.[0] && handleFile(event.target.files[0])} />
      </label>
      <UploadProgress progress={progress} />
      {error ? <p className="text-sm font-semibold text-rose-600 dark:text-rose-200">{error}</p> : null}
    </div>
  )
}
