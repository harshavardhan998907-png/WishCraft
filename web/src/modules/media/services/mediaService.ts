import { supabase } from '../../../lib/supabase'
import { trackEvent, trackStorageWarning, trackUpload } from '../../analytics/services/analyticsService'
import type { ImageUploadResult, MediaAsset, MediaAssetType, MediaCleanupJob, MusicUploadResult, StorageUsageMetrics } from '../types'

const imageMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const audioMimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/mp4']
const maxImageBytes = 5 * 1024 * 1024
const maxAudioBytes = 10 * 1024 * 1024

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('You must be signed in to upload media')
  return data.user.id
}

async function sniffFile(file: File) {
  const buffer = await file.slice(0, 12).arrayBuffer()
  return Array.from(new Uint8Array(buffer))
}

function matchesImageSignature(bytes: number[]) {
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  const isGif = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46
  const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  return isJpeg || isPng || isGif || isWebp
}

function matchesAudioSignature(bytes: number[]) {
  const isMp3 = (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
  const isWav = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45
  const isOgg = bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53
  const isMp4 = bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70
  return isMp3 || isWav || isOgg || isMp4
}

async function validateImage(file: File) {
  if (file.size > maxImageBytes) throw new Error(`${file.name} is larger than 5MB`)
  if (!imageMimeTypes.includes(file.type)) throw new Error(`${file.name} is not a supported image`)
  if (!matchesImageSignature(await sniffFile(file))) throw new Error(`${file.name} does not look like a valid image`)
}

async function validateAudio(file: File) {
  if (file.size > maxAudioBytes) throw new Error('Music file must be under 10MB')
  if (!audioMimeTypes.includes(file.type)) throw new Error('Unsupported music file type')
  if (!matchesAudioSignature(await sniffFile(file))) throw new Error('Music file content is not valid audio')
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Image optimization failed')), 'image/webp', quality)
  })
}

async function resizeImage(file: File, maxDimension: number, quality: number) {
  if (file.type === 'image/gif') return file
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Image optimizer is unavailable')
  context.drawImage(bitmap, 0, 0, width, height)
  const blob = await canvasBlob(canvas, quality)
  return new File([blob], `${crypto.randomUUID()}.webp`, { type: 'image/webp' })
}

async function insertAsset(input: {
  ownerUserId: string
  assetType: MediaAssetType
  bucket: string
  path: string
  publicUrl: string
  mimeType: string
  originalSize: number
  optimizedSize: number
  status: 'optimized' | 'validated'
  relatedTemplateId?: string | null
}) {
  const { data, error } = await supabase.from('media_assets').insert({
    owner_user_id: input.ownerUserId,
    related_template_id: input.relatedTemplateId ?? null,
    asset_type: input.assetType,
    storage_bucket: input.bucket,
    storage_path: input.path,
    public_url: input.publicUrl,
    mime_type: input.mimeType,
    original_size_bytes: input.originalSize,
    optimized_size_bytes: input.optimizedSize,
    optimization_status: input.status,
    is_orphaned: true,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }).select('*').single()

  if (error) {
    console.warn('[Media] asset metadata insert failed', error)
    trackStorageWarning({ reason: 'media_asset_metadata_insert_failed', metadata: { bucket: input.bucket, path: input.path } })
    return null
  }
  return data as MediaAsset
}

export async function uploadOptimizedImage(file: File, input: { templateId?: string | null; pathPrefix?: string; bucket?: string; onProgress?: (value: number) => void } = {}): Promise<ImageUploadResult> {
  input.onProgress?.(10)
  await validateImage(file)
  const ownerUserId = await currentUserId()
  input.onProgress?.(30)

  const optimized = await resizeImage(file, 1600, 0.82)
  const thumbnail = await resizeImage(file, 420, 0.72)
  input.onProgress?.(55)

  const prefix = input.pathPrefix ?? `draft/${ownerUserId}`
  const imagePath = `${prefix}/${crypto.randomUUID()}.webp`
  const thumbnailPath = `${prefix}/thumb-${crypto.randomUUID()}.webp`
  const imageFile = optimized.size < file.size ? optimized : file
  const bucket = input.bucket ?? 'wish-photos'

  const { error: imageError } = await supabase.storage.from(bucket).upload(imagePath, imageFile, { upsert: true, contentType: imageFile.type })
  if (imageError) throw new Error(imageError.message)
  const { error: thumbError } = await supabase.storage.from(bucket).upload(thumbnailPath, thumbnail, { upsert: true, contentType: thumbnail.type })
  if (thumbError) console.warn('[Media] thumbnail upload failed', thumbError)
  input.onProgress?.(80)

  const { data: imageUrl } = supabase.storage.from(bucket).getPublicUrl(imagePath)
  const { data: thumbnailUrl } = supabase.storage.from(bucket).getPublicUrl(thumbnailPath)
  const asset = await insertAsset({
    ownerUserId,
    assetType: 'image',
    bucket,
    path: imagePath,
    publicUrl: imageUrl.publicUrl,
    mimeType: imageFile.type,
    originalSize: file.size,
    optimizedSize: imageFile.size,
    status: imageFile.type === 'image/webp' ? 'optimized' : 'validated',
    relatedTemplateId: input.templateId,
  })

  if (!thumbError) {
    await insertAsset({
      ownerUserId,
      assetType: 'image_thumbnail',
      bucket,
      path: thumbnailPath,
      publicUrl: thumbnailUrl.publicUrl,
      mimeType: thumbnail.type,
      originalSize: file.size,
      optimizedSize: thumbnail.size,
      status: 'optimized',
      relatedTemplateId: input.templateId,
    })
  }

  trackUpload({ type: 'photo', templateId: input.templateId ?? null, fileCount: 1 })
  void trackEvent({ eventName: 'image_optimized', templateId: input.templateId ?? null, metadata: { original_size: file.size, optimized_size: imageFile.size } })
  input.onProgress?.(100)
  return { asset, url: imageUrl.publicUrl, thumbnailUrl: thumbError ? null : thumbnailUrl.publicUrl, originalSize: file.size, optimizedSize: imageFile.size }
}

export async function uploadMusicAsset(file: File, input: { templateId?: string | null; pathPrefix?: string; onProgress?: (value: number) => void } = {}): Promise<MusicUploadResult> {
  input.onProgress?.(15)
  await validateAudio(file)
  const ownerUserId = await currentUserId()
  const extension = file.name.split('.').pop() || 'mp3'
  const prefix = input.pathPrefix ?? `draft/${ownerUserId}`
  const path = `${prefix}/${crypto.randomUUID()}.${extension}`
  const bucket = 'wish-music'
  input.onProgress?.(50)

  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  const asset = await insertAsset({
    ownerUserId,
    assetType: 'music',
    bucket,
    path,
    publicUrl: data.publicUrl,
    mimeType: file.type,
    originalSize: file.size,
    optimizedSize: file.size,
    status: 'validated',
    relatedTemplateId: input.templateId,
  })

  trackUpload({ type: 'music', templateId: input.templateId ?? null, fileCount: 1 })
  input.onProgress?.(100)
  return { asset, url: data.publicUrl, size: file.size }
}

export async function uploadTemplateThumbnailAsset(file: File, creatorId: string, templateId?: string | null) {
  const result = await uploadOptimizedImage(file, { templateId, pathPrefix: `creator/${creatorId}`, bucket: 'template-thumbnails' })
  if (result.asset) {
    await supabase
      .from('media_assets')
      .update({ asset_type: 'template_thumbnail', is_orphaned: false, expires_at: null })
      .eq('id', result.asset.id)
  }
  return result.url
}

export async function linkMediaAssetsToWish(urls: string[], wishId: string) {
  const assetUrls = urls.filter(Boolean)
  if (!assetUrls.length) return
  const { error } = await supabase.rpc('mark_media_assets_linked', { asset_urls: assetUrls, target_wish_id: wishId })
  if (error) console.warn('[Media] linking assets to wish failed', error)
}

export function preloadMedia(urls: Array<string | null | undefined>) {
  urls.filter(Boolean).forEach((url) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = url as string
    link.as = /\.(mp3|wav|ogg|aac|m4a)$/i.test(url as string) ? 'audio' : 'image'
    document.head.appendChild(link)
  })
}

export async function fetchStorageUsageMetrics(): Promise<StorageUsageMetrics> {
  const { data, error } = await supabase.from('storage_usage_metrics').select('*').single()
  if (error) throw new Error(error.message)
  return data as StorageUsageMetrics
}

export async function fetchMediaCleanupJobs(): Promise<MediaCleanupJob[]> {
  const { data, error } = await supabase.from('media_cleanup_jobs').select('*').order('started_at', { ascending: false }).limit(20)
  if (error) throw new Error(error.message)
  return (data ?? []) as MediaCleanupJob[]
}

export async function fetchOwnedMediaAssets(): Promise<MediaAsset[]> {
  const { data, error } = await supabase.from('media_assets').select('*').order('created_at', { ascending: false }).limit(200)
  if (error) throw new Error(error.message)
  return (data ?? []) as MediaAsset[]
}
