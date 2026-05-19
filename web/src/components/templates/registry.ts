import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'
import type { WishData } from '../../types'

type TemplateComponent = ComponentType<{ data: WishData }> | LazyExoticComponent<ComponentType<{ data: WishData }>>

export const templateRegistry: Record<string, TemplateComponent> = {
  'birthday-classic': lazy(() => import('./BirthdayClassic').then((module) => ({ default: module.BirthdayClassic }))),
  'birthday-glow': lazy(() => import('./BirthdayGlow').then((module) => ({ default: module.BirthdayGlow }))),
  'wedding-elegant': lazy(() => import('./WeddingElegant').then((module) => ({ default: module.WeddingElegant }))),
  'anniversary-romantic': lazy(() => import('./AnniversaryRomantic').then((module) => ({ default: module.AnniversaryRomantic }))),
  'festival-diwali': lazy(() => import('./FestivalDiwali').then((module) => ({ default: module.FestivalDiwali }))),
  'graduation-celebration': lazy(() => import('./GraduationCelebration').then((module) => ({ default: module.GraduationCelebration }))),
}
