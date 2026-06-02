import type { TemplateManifest, TemplatePlugin, TemplateRegistryEntry } from './types'
import { assertValidTemplateManifest } from './validation'

const entries = new Map<string, TemplateRegistryEntry>()
const slugs = new Map<string, string>()

export function registerTemplate(plugin: TemplatePlugin): TemplateRegistryEntry {
  assertValidTemplateManifest(plugin.manifest)

  const existingById = entries.get(plugin.manifest.id)
  if (existingById) {
    throw new Error(`Template id "${plugin.manifest.id}" is already registered.`)
  }

  const existingBySlug = slugs.get(plugin.manifest.slug)
  if (existingBySlug) {
    throw new Error(`Template slug "${plugin.manifest.slug}" is already registered by "${existingBySlug}".`)
  }

  const existingByComponentKey = getTemplateByComponentKey(plugin.manifest.componentKey)
  if (existingByComponentKey) {
    throw new Error(`Template component key "${plugin.manifest.componentKey}" is already registered.`)
  }

  const entry: TemplateRegistryEntry = {
    ...plugin,
    registeredAt: new Date().toISOString(),
  }
  entries.set(plugin.manifest.id, entry)
  slugs.set(plugin.manifest.slug, plugin.manifest.id)
  return entry
}

export function unregisterTemplate(idOrSlug: string): boolean {
  const entry = getTemplate(idOrSlug)
  if (!entry) return false
  entries.delete(entry.manifest.id)
  slugs.delete(entry.manifest.slug)
  return true
}

export function getTemplate(idOrSlug: string | null | undefined): TemplateRegistryEntry | null {
  if (!idOrSlug) return null
  const byId = entries.get(idOrSlug)
  if (byId) return byId
  const id = slugs.get(idOrSlug)
  return id ? entries.get(id) ?? null : null
}

export function getTemplateByComponentKey(componentKey: string | null | undefined): TemplateRegistryEntry | null {
  if (!componentKey) return null
  return Array.from(entries.values()).find((entry) => entry.manifest.componentKey === componentKey) ?? null
}

export function listTemplates(options: { includeDisabled?: boolean } = {}): TemplateRegistryEntry[] {
  return Array.from(entries.values())
    .filter((entry) => options.includeDisabled || entry.manifest.status === 'published')
    .sort((left, right) => left.manifest.name.localeCompare(right.manifest.name))
}

export function listTemplateManifests(options: { includeDisabled?: boolean } = {}): TemplateManifest[] {
  return listTemplates(options).map((entry) => entry.manifest)
}

export function clearTemplateRegistryForTests(): void {
  entries.clear()
  slugs.clear()
}
