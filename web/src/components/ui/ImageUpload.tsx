import { OptimizedImageUpload } from '../../modules/media/components/OptimizedImageUpload'

export function ImageUpload({
  urls,
  onUploaded,
  onRemove,
  disabled,
  templateId,
}: {
  urls: string[]
  onUploaded: (url: string) => void
  onRemove: (url: string) => void
  disabled?: boolean
  templateId?: string | null
}) {
  return <OptimizedImageUpload urls={urls} onUploaded={onUploaded} onRemove={onRemove} disabled={disabled} templateId={templateId} />
}
