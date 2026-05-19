import { Button } from './Button'

export function ImageUpload({ urls, onFiles, onRemove, disabled }: { urls: string[]; onFiles: (files: FileList) => void; onRemove: (url: string) => void; disabled?: boolean }) {
  return (
    <div className="space-y-3">
      <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-black/20 bg-white p-4 text-center transition-colors dark:border-white/15 dark:bg-white/10">
        <span className="font-semibold">Upload photos</span>
        <span className="text-sm text-zinc-500 dark:text-white/55">Up to 5 photos, under 5MB each</span>
        <input className="sr-only" type="file" accept="image/*" multiple disabled={disabled} onChange={(event) => event.target.files && onFiles(event.target.files)} />
      </label>
      <div className="grid grid-cols-5 gap-2">
        {urls.map((url) => (
          <div key={url} className="relative aspect-square overflow-hidden rounded-md bg-zinc-100 dark:bg-white/10">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <Button type="button" size="sm" variant="danger" className="absolute right-1 top-1 h-7 px-2 text-xs" onClick={() => onRemove(url)}>X</Button>
          </div>
        ))}
      </div>
    </div>
  )
}
