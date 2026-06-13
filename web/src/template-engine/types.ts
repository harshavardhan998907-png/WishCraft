import type { ComponentType, LazyExoticComponent } from 'react'
import type { OccasionType, Template, TemplateStatus, TemplateTier, WishData } from '../types'

export type FormFieldType = 'text' | 'textarea' | 'gallery' | 'music' | 'date' | 'url' | 'toggle' | 'repeater' | 'section'

export interface FormFieldDefinition {
  id: string
  label: string
  type: FormFieldType
  required?: boolean
  placeholder?: string
  helper?: string
  maxLength?: number
  maxItems?: number
  defaultValue?: unknown
  subFields?: FormFieldDefinition[]
  dependsOn?: { field: string; value: unknown }
}

export type FormSchema = FormFieldDefinition[]

export type TemplateFeature =
  | 'animation'
  | 'music'
  | 'photos'
  | 'custom_message'
  | 'gallery'
  | 'responsive'

export type TemplateEditableField =
  | 'recipientName'
  | 'senderName'
  | 'message'
  | 'photos'
  | 'musicUrl'
  | 'customData'

export type TemplateRendererType = 'react-component'
export type TemplateAuthorType = 'founder' | 'creator' | 'system'

export interface TemplateProps {
  recipientName: string
  senderName: string
  message: string
  photos: string[]
  musicUrl?: string
  customData?: Record<string, unknown>
  previewMode?: boolean
}

export interface TemplateManifest {
  id: string
  slug: string
  name: string
  description: string
  category: OccasionType
  version: string
  author: string
  authorType: TemplateAuthorType
  thumbnailUrl: string
  previewVideoUrl?: string
  schema?: FormSchema
  extensionSchema?: FormSchema
  editableFields: TemplateEditableField[]
  supportedFeatures: TemplateFeature[]
  price: number
  tier: TemplateTier
  status: Extract<TemplateStatus, 'draft' | 'published' | 'hidden' | 'archived' | 'rejected'>
  rendererType: TemplateRendererType
  componentKey: string
  storagePrefix?: string
}

export type TemplatePluginComponent =
  | ComponentType<TemplateProps>
  | LazyExoticComponent<ComponentType<TemplateProps>>

export interface TemplatePlugin {
  manifest: TemplateManifest
  component: TemplatePluginComponent
  config?: TemplatePluginConfig
}

export interface TemplatePluginConfig {
  maxPhotos?: number
  supportsCustomMusic?: boolean
  requiredFields?: TemplateEditableField[]
  defaultCustomData?: Record<string, unknown>
}

export interface TemplateValidationIssue {
  field: string
  message: string
}

export interface TemplateValidationResult {
  valid: boolean
  issues: TemplateValidationIssue[]
}

export interface TemplateRegistryEntry extends TemplatePlugin {
  registeredAt: string
}

export function wishDataToTemplateProps(data: WishData, previewMode = false): TemplateProps {
  return {
    recipientName: data.recipientName,
    senderName: data.senderName,
    message: data.customMessage ?? '',
    photos: data.photoUrls,
    musicUrl: data.musicUrl ?? undefined,
    previewMode,
    customData: data.customData,
  }
}

export function templatePropsToWishData(props: TemplateProps): WishData {
  return {
    recipientName: props.recipientName,
    senderName: props.senderName,
    customMessage: props.message,
    photoUrls: props.photos,
    musicUrl: props.musicUrl ?? null,
  }
}

export function manifestToTemplate(manifest: TemplateManifest): Template {
  return {
    id: manifest.id,
    name: manifest.name,
    slug: manifest.slug,
    occasion: manifest.category,
    tier: manifest.tier,
    price_paise: manifest.price,
    thumbnail_url: manifest.thumbnailUrl,
    preview_url: manifest.previewVideoUrl ?? null,
    has_animation: manifest.supportedFeatures.includes('animation'),
    has_music: manifest.supportedFeatures.includes('music'),
    component_name: manifest.componentKey,
    is_active: manifest.status === 'published',
    status: manifest.status,
  }
}
