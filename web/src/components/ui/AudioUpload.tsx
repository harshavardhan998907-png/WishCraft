import { useEffect, useRef, useState } from 'react'
import { Music, Pause, Play, Trash2 } from 'lucide-react'
import { uploadMusicAsset } from '../../modules/media/services/mediaService'
import { UploadProgress } from '../../modules/media/components/UploadProgress'
import type { UploadProgressState } from '../../modules/media/types'

function fileNameFromUrl(url: string): string {
  try {
    const segment = new URL(url).pathname.split('/').pop() ?? ''
    return decodeURIComponent(segment) || 'Audio track'
  } catch {
    return 'Audio track'
  }
}

export function AudioUpload({
  url,
  onUploaded,
  onRemove,
  disabled,
  templateId,
}: {
  url: string | null
  onUploaded: (url: string) => void
  onRemove: () => void
  disabled?: boolean
  templateId?: string | null
}) {
  const [progress, setProgress] = useState<UploadProgressState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Stop and reset preview playback whenever the track changes or is removed
  useEffect(() => {
    setIsPlaying(false)
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  }, [url])

  async function handleFile(file: File) {
    setError(null)
    try {
      setProgress({ label: `Validating ${file.name}`, value: 10 })
      const result = await uploadMusicAsset(file, {
        templateId,
        onProgress: (value) => setProgress({ label: `Uploading ${file.name}`, value }),
      })
      setFileName(file.name)
      onUploaded(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Music upload failed')
    } finally {
      setProgress(null)
    }
  }

  function togglePlayback() {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      void audio.play().then(() => setIsPlaying(true)).catch(() => setError('Could not play this audio file'))
    }
  }

  function handleRemove() {
    setFileName(null)
    setError(null)
    onRemove()
  }

  return (
    <div className="space-y-3">
      {url ? (
        <div className="flex items-center gap-3 rounded-lg border border-black/15 bg-white p-3 dark:border-white/15 dark:bg-white/10">
          <audio ref={audioRef} src={url} onEnded={() => setIsPlaying(false)} preload="metadata" />
          <button
            type="button"
            onClick={togglePlayback}
            disabled={disabled}
            className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{fileName ?? fileNameFromUrl(url)}</p>
            <p className="text-xs text-zinc-500 dark:text-white/55">Background music</p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="focus-ring rounded-md p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-400/10 dark:hover:text-red-400"
            aria-label="Remove audio"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-black/20 bg-white p-4 text-center transition-colors dark:border-white/15 dark:bg-white/10">
          <Music size={20} className="mb-1 text-zinc-400 dark:text-white/55" />
          <span className="font-semibold">Upload music</span>
          <span className="text-sm text-zinc-500 dark:text-white/55">MP3, WAV, OGG or AAC, under 10MB</span>
          <input
            className="sr-only"
            type="file"
            accept="audio/*"
            disabled={disabled || Boolean(progress)}
            onChange={(event) => event.target.files?.[0] && handleFile(event.target.files[0])}
          />
        </label>
      )}
      <UploadProgress progress={progress} />
      {error ? <p className="text-sm font-semibold text-rose-600 dark:text-rose-200">{error}</p> : null}
    </div>
  )
}
