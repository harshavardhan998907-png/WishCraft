import type { ComponentType, LazyExoticComponent } from 'react'
import { createElement } from 'react'
import type { WishData } from '../../types'
import { getTemplateByComponentKey, listTemplates } from '../../template-engine/registry'
import { wishDataToTemplateProps } from '../../template-engine/types'
import { registerFounderTemplates } from '../../templates/founder/registerFounderTemplates'

type TemplateComponent = ComponentType<{ data: WishData }> | LazyExoticComponent<ComponentType<{ data: WishData }>>

registerFounderTemplates()

export const templateRegistry: Record<string, TemplateComponent> = Object.fromEntries(
  listTemplates({ includeDisabled: true }).map((entry) => [
    entry.manifest.componentKey,
    function LegacyRegistryComponent({ data }: { data: WishData }) {
      const Component = entry.component
      return createElement(Component, wishDataToTemplateProps(data))
    },
  ])
)

export function getTemplateComponent(componentName: string | null | undefined) {
  if (!componentName) return null
  const entry = getTemplateByComponentKey(componentName)
  if (!entry) return null

  return function LegacyRegistryComponent({ data }: { data: WishData }) {
    const Component = entry.component
    return createElement(Component, wishDataToTemplateProps(data))
  }
}

export function getRegisteredTemplateNames() {
  return listTemplates({ includeDisabled: true }).map((entry) => entry.manifest.componentKey)
}
