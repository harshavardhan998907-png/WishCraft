import type { OccasionType, Template, Wish, WishData } from '../types'
import type { FormFieldDefinition, FormFieldType, FormSchema, TemplateManifest, TemplateProps } from './types'

const formFieldTypes: readonly FormFieldType[] = [
  'text', 'textarea', 'gallery', 'music', 'date', 'url', 'toggle', 'repeater', 'section',
]

function isFormFieldType(value: unknown): value is FormFieldType {
  return typeof value === 'string' && (formFieldTypes as readonly string[]).includes(value)
}

// External (creator-submitted) templates store their schema as raw JSON in
// templates.manifest_json.schema. Coerce it into a typed FormSchema, dropping
// any entries that don't declare a valid id + field type.
function coerceFormField(raw: unknown): FormFieldDefinition | null {
  if (typeof raw !== 'object' || raw === null) return null
  const record = raw as Record<string, unknown>
  if (typeof record.id !== 'string' || !isFormFieldType(record.type)) return null

  const field: FormFieldDefinition = {
    id: record.id,
    label: typeof record.label === 'string' ? record.label : record.id,
    type: record.type,
  }
  if (typeof record.required === 'boolean') field.required = record.required
  if (typeof record.placeholder === 'string') field.placeholder = record.placeholder
  if (typeof record.helper === 'string') field.helper = record.helper
  if (typeof record.maxLength === 'number') field.maxLength = record.maxLength
  if (typeof record.maxItems === 'number') field.maxItems = record.maxItems
  if ('defaultValue' in record) field.defaultValue = record.defaultValue
  if (Array.isArray(record.subFields)) field.subFields = coerceFormSchema(record.subFields)
  if (typeof record.dependsOn === 'object' && record.dependsOn !== null) {
    const dep = record.dependsOn as Record<string, unknown>
    if (typeof dep.field === 'string') field.dependsOn = { field: dep.field, value: dep.value }
  }
  return field
}

function coerceFormSchema(value: unknown): FormSchema {
  if (!Array.isArray(value)) return []
  return value
    .map(coerceFormField)
    .filter((field): field is FormFieldDefinition => field !== null)
}

function externalManifestSchema(manifest: Record<string, unknown> | null | undefined): FormSchema {
  if (!manifest || typeof manifest !== 'object') return []
  return coerceFormSchema(manifest.schema)
}

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

export function getTemplateSchema(
  template: Pick<Template, 'slug' | 'occasion' | 'is_external' | 'manifest_json'> | TemplateManifest,
): FormSchema {
  // External creator templates carry creator-defined fields in
  // manifest_json.schema (populated at approval time by review-template). When
  // present, that schema fully replaces the occasion-based base schema.
  if ('is_external' in template && template.is_external) {
    const externalSchema = externalManifestSchema(template.manifest_json)
    if (externalSchema.length > 0) return externalSchema
  }

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

