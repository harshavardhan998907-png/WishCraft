import type { ComponentType, LazyExoticComponent } from 'react'
import type { WishData } from '../types'
import type { TemplateProps } from './types'
import { templatePropsToWishData } from './types'

type LegacyTemplateComponent =
  | ComponentType<{ data: WishData }>
  | LazyExoticComponent<ComponentType<{ data: WishData }>>

export function createLegacyTemplateAdapter(Component: LegacyTemplateComponent) {
  return function LegacyTemplateAdapter(props: TemplateProps) {
    return <Component data={templatePropsToWishData(props)} />
  }
}
