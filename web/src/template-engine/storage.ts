import { supabase } from '../lib/supabase'

export const templateStorageBucket = 'templates'

export type TemplateAssetFolder = 'thumbnails' | 'previews' | 'assets'

export function buildTemplateAssetPath(folder: TemplateAssetFolder, templateSlug: string, fileName: string) {
  const baseName = fileName.split(/[/\\]/).pop() || ''
  const parts = baseName.split('.')
  const ext = parts.pop()?.toLowerCase() || ''
  const allowedExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'mp3', 'wav', 'ogg', 'aac', 'm4a', 'json', 'woff', 'woff2', 'ttf', 'otf', 'css']
  
  if (!allowedExtensions.includes(ext)) {
    throw new Error(`Forbidden file extension: .${ext}`)
  }

  const nameWithoutExt = parts.join('-').replace(/[^a-zA-Z0-9_-]/g, '-')
  const safeFileName = `${nameWithoutExt || 'file'}.${ext}`
  return `${folder}/${templateSlug}/${safeFileName}`
}

export async function uploadTemplateAsset(folder: TemplateAssetFolder, templateSlug: string, file: File) {
  const path = buildTemplateAssetPath(folder, templateSlug, file.name)
  const { data, error } = await supabase.storage.from(templateStorageBucket).upload(path, file, {
    cacheControl: '31536000',
    upsert: true,
  })

  if (error) throw new Error(error.message)

  const { data: publicUrl } = supabase.storage.from(templateStorageBucket).getPublicUrl(data.path)
  return { path: data.path, publicUrl: publicUrl.publicUrl }
}

export async function getSignedTemplateAssetUrl(path: string, expiresInSeconds = 60 * 60) {
  const { data, error } = await supabase.storage.from(templateStorageBucket).createSignedUrl(path, expiresInSeconds)
  if (error) throw new Error(error.message)
  return data.signedUrl
}
