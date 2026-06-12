import type { OccasionType, Template, Wish, WishData } from '../types'
import type { FormFieldDefinition, FormSchema, TemplateManifest, TemplateProps } from './types'

export const baseSchemas: Record<OccasionType, FormSchema> = {
  birthday: [
    { id: 'recipient_name', label: "Recipient's Name", type: 'text', required: true, placeholder: 'e.g. Jessica' },
    { id: 'sender_name', label: 'Your Name', type: 'text', required: true, placeholder: 'e.g. David' },
    { id: 'message', label: 'Heartfelt Message', type: 'textarea', maxLength: 300 },
    { id: 'photos', label: 'Photos', type: 'gallery', maxItems: 5 },
    { id: 'music', label: 'Background Music', type: 'music' },
  ],
  wedding: [
    { id: 'recipient_name', label: 'Couple or Recipient', type: 'text', required: true },
    { id: 'sender_name', label: 'Sender Name', type: 'text', required: true },
    { id: 'message', label: 'Blessing Message', type: 'textarea', maxLength: 300 },
    { id: 'wedding_date', label: 'Wedding Date', type: 'date' },
    { id: 'venue', label: 'Venue', type: 'text' },
    { id: 'photos', label: 'Gallery', type: 'gallery', maxItems: 8 },
    { id: 'music', label: 'Background Music', type: 'music' },
  ],
  anniversary: [
    { id: 'recipient_name', label: 'Recipient or Couple', type: 'text', required: true },
    { id: 'sender_name', label: 'Sender Name', type: 'text', required: true },
    { id: 'message', label: 'Romantic Message', type: 'textarea', maxLength: 300 },
    { id: 'photos', label: 'Memories', type: 'gallery', maxItems: 8 },
    { id: 'music', label: 'Background Music', type: 'music' },
  ],
  graduation: [
    { id: 'recipient_name', label: 'Graduate Name', type: 'text', required: true },
    { id: 'sender_name', label: 'Sender Name', type: 'text', required: true },
    { id: 'message', label: 'Congratulation Message', type: 'textarea', maxLength: 300 },
    { id: 'photos', label: 'Photos', type: 'gallery', maxItems: 5 },
  ],
  festival: [
    { id: 'recipient_name', label: 'Recipient Name', type: 'text', required: true },
    { id: 'sender_name', label: 'Sender Name', type: 'text', required: true },
    { id: 'message', label: 'Festival Message', type: 'textarea', maxLength: 300 },
    { id: 'photos', label: 'Photos', type: 'gallery', maxItems: 5 },
    { id: 'music', label: 'Background Music', type: 'music' },
  ],
  baby_shower: [],
  farewell: [],
  valentine: [],
  other: [],
}

export const templateExtensionSchemas: Record<string, FormSchema> = {}


function mergeSchemas(base: FormSchema, extension: FormSchema): FormSchema {
  const fields = new Map<string, FormFieldDefinition>()
  base.forEach((field) => fields.set(field.id, field))
  extension.forEach((field) => fields.set(field.id, { ...fields.get(field.id), ...field }))
  return Array.from(fields.values())
}

export function getTemplateSchema(template: Pick<Template, 'slug' | 'occasion'> | TemplateManifest): FormSchema {
  const slug = 'slug' in template ? template.slug : ''
  const occasion = 'occasion' in template ? template.occasion : template.category
  const manifestSchema = 'schema' in template ? template.schema ?? [] : []
  const manifestExtension = 'extensionSchema' in template ? template.extensionSchema ?? [] : []
  return mergeSchemas(
    mergeSchemas(baseSchemas[occasion] ?? baseSchemas.other, manifestSchema),
    mergeSchemas(templateExtensionSchemas[slug] ?? [], manifestExtension),
  )
}

export function legacyWishDataToFormData(data: WishData): Record<string, unknown> {
  return {
    recipient_name: data.recipientName,
    sender_name: data.senderName,
    message: data.customMessage ?? '',
    photos: data.photoUrls,
    music: data.musicUrl,
  }
}

export function wishToFormData(wish: Wish): Record<string, unknown> {
  return {
    ...legacyWishDataToFormData({
      recipientName: wish.recipient_name,
      senderName: wish.sender_name,
      customMessage: wish.custom_message,
      photoUrls: wish.photo_urls ?? [],
      musicUrl: wish.music_url ?? null,
    }),
    ...(wish.form_data ?? {}),
  }
}

export function formDataToTemplateProps(formData: Record<string, unknown>, previewMode = false): TemplateProps {
  return {
    recipientName: String(formData.recipient_name ?? ''),
    senderName: String(formData.sender_name ?? ''),
    message: String(formData.message ?? ''),
    photos: Array.isArray(formData.photos) ? formData.photos.filter((item): item is string => typeof item === 'string') : [],
    musicUrl: typeof formData.music === 'string' ? formData.music : undefined,
    customData: formData,
    previewMode,
  }
}

