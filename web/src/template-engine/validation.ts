import type { Template } from '../types'
import type { FormSchema, TemplateManifest, TemplateValidationIssue, TemplateValidationResult } from './types'
import { getTemplate } from './registry'
import { getTemplateSchema } from './schema'

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const semverPattern = /^\d+\.\d+\.\d+(?:[-+][a-z0-9.-]+)?$/i

function issue(field: string, message: string): TemplateValidationIssue {
  return { field, message }
}

export function validateTemplateManifest(manifest: TemplateManifest): TemplateValidationResult {
  const issues: TemplateValidationIssue[] = []

  if (!manifest.id.trim()) issues.push(issue('id', 'Template id is required.'))
  if (!slugPattern.test(manifest.slug)) issues.push(issue('slug', 'Slug must be lowercase kebab-case.'))
  if (!manifest.name.trim()) issues.push(issue('name', 'Template name is required.'))
  if (!manifest.description.trim()) issues.push(issue('description', 'Template description is required.'))
  if (!semverPattern.test(manifest.version)) issues.push(issue('version', 'Version must use semver, for example 1.0.0.'))
  if (!manifest.author.trim()) issues.push(issue('author', 'Template author is required.'))
  if (!manifest.thumbnailUrl.trim()) issues.push(issue('thumbnailUrl', 'Thumbnail URL is required.'))
  if (!manifest.componentKey.trim()) issues.push(issue('componentKey', 'Component key is required.'))
  if (manifest.rendererType !== 'react-component') issues.push(issue('rendererType', 'Only react-component renderers are supported.'))
  if (manifest.price < 0 || !Number.isInteger(manifest.price)) issues.push(issue('price', 'Price must be a non-negative integer in paise.'))
  if (!manifest.editableFields.length) issues.push(issue('editableFields', 'At least one editable field is required.'))
  if (!manifest.supportedFeatures.includes('responsive')) issues.push(issue('supportedFeatures', 'Templates must declare responsive support.'))

  return { valid: issues.length === 0, issues }
}

export function assertValidTemplateManifest(manifest: TemplateManifest): void {
  const result = validateTemplateManifest(manifest)
  if (!result.valid) {
    const details = result.issues.map((item) => `${item.field}: ${item.message}`).join(' ')
    throw new Error(`Invalid template manifest "${manifest.slug}": ${details}`)
  }
}

export interface WishPublishValidationInput {
  template: Template
  formData: Record<string, unknown>
}

export function validateFormData(schema: FormSchema, formData: Record<string, unknown>): TemplateValidationResult {
  const issues: TemplateValidationIssue[] = []

  schema.forEach((field) => {
    const value = formData[field.id]
    if (field.required && (value === null || value === undefined || String(value).trim() === '')) {
      issues.push(issue(field.id, `${field.label} is required.`))
    }
    if (field.type === 'gallery' && value !== undefined && (!Array.isArray(value) || value.some((item) => typeof item !== 'string'))) {
      issues.push(issue(field.id, `${field.label} must be a list of uploaded asset URLs.`))
    }
    if (field.maxLength && typeof value === 'string' && value.length > field.maxLength) {
      issues.push(issue(field.id, `${field.label} must be ${field.maxLength} characters or fewer.`))
    }
  })

  return { valid: issues.length === 0, issues }
}

export function validateWishBeforePublish({ template, formData }: WishPublishValidationInput): TemplateValidationResult {
  const issues: TemplateValidationIssue[] = []

  // External (creator-submitted) templates render from their bundle_url via
  // ExternalTemplateRenderer, not the in-app registry — so the registry check
  // only applies to internal templates.
  if (!template.is_external) {
    const registeredTemplate = getTemplate(template.slug) ?? getTemplate(template.component_key) ?? getTemplate(template.component_name)
    if (!registeredTemplate) {
      issues.push(issue('template', `Template "${template.slug}" is not registered in the renderer.`))
    }
  }

  const formResult = validateFormData(getTemplateSchema(template), formData)
  issues.push(...formResult.issues)

  return { valid: issues.length === 0, issues }
}
