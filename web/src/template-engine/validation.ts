import type { TemplateManifest, TemplateValidationIssue, TemplateValidationResult } from './types'

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
