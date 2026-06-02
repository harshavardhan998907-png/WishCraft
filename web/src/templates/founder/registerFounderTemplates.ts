import { lazy } from 'react'
import { createLegacyTemplateAdapter } from '../../template-engine/LegacyTemplateAdapter'
import { getTemplateByComponentKey, registerTemplate } from '../../template-engine/registry'
import type { TemplateManifest, TemplatePlugin } from '../../template-engine/types'
import { manifest as basicBirthdayTestManifest } from './basic-birthday-test/manifest'

const founder = 'TemplateHub Founders'

const manifests: TemplateManifest[] = [
  {
    id: 'birthday-classic',
    slug: 'birthday-classic',
    name: 'Birthday Classic',
    description: 'A warm birthday wish with confetti, photos, and a simple heartfelt reveal.',
    category: 'birthday',
    version: '1.0.0',
    author: founder,
    authorType: 'founder',
    thumbnailUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=900&q=80',
    editableFields: ['recipientName', 'senderName', 'message', 'photos'],
    supportedFeatures: ['animation', 'photos', 'custom_message', 'responsive'],
    price: 0,
    tier: 'free',
    status: 'published',
    rendererType: 'react-component',
    componentKey: 'birthday-classic',
  },
  {
    id: 'birthday-glow',
    slug: 'birthday-glow',
    name: 'Birthday Glow',
    description: 'A premium glowing birthday scene with animated accents, photos, and music support.',
    category: 'birthday',
    version: '1.0.0',
    author: founder,
    authorType: 'founder',
    thumbnailUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=900&q=80',
    editableFields: ['recipientName', 'senderName', 'message', 'photos', 'musicUrl'],
    supportedFeatures: ['animation', 'music', 'photos', 'custom_message', 'responsive'],
    price: 9900,
    tier: 'standard',
    status: 'published',
    rendererType: 'react-component',
    componentKey: 'birthday-glow',
  },
  {
    id: 'wedding-elegant',
    slug: 'wedding-elegant',
    name: 'Wedding Elegant',
    description: 'An elegant wedding wish template with romantic motion, gallery support, and music.',
    category: 'wedding',
    version: '1.0.0',
    author: founder,
    authorType: 'founder',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
    editableFields: ['recipientName', 'senderName', 'message', 'photos', 'musicUrl'],
    supportedFeatures: ['animation', 'music', 'photos', 'gallery', 'custom_message', 'responsive'],
    price: 19900,
    tier: 'premium',
    status: 'published',
    rendererType: 'react-component',
    componentKey: 'wedding-elegant',
  },
  {
    id: 'anniversary-romantic',
    slug: 'anniversary-romantic',
    name: 'Anniversary Romantic',
    description: 'A romantic anniversary reveal with animated effects, photo memories, and music support.',
    category: 'anniversary',
    version: '1.0.0',
    author: founder,
    authorType: 'founder',
    thumbnailUrl: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=900&q=80',
    editableFields: ['recipientName', 'senderName', 'message', 'photos', 'musicUrl'],
    supportedFeatures: ['animation', 'music', 'photos', 'custom_message', 'responsive'],
    price: 12900,
    tier: 'standard',
    status: 'published',
    rendererType: 'react-component',
    componentKey: 'anniversary-romantic',
  },
  {
    id: 'festival-diwali',
    slug: 'festival-diwali',
    name: 'Festival Diwali',
    description: 'A festive Diwali wish with bright motion, music, and photo support.',
    category: 'festival',
    version: '1.0.0',
    author: founder,
    authorType: 'founder',
    thumbnailUrl: 'https://images.unsplash.com/photo-1605292356183-a77d0a9c9d1d?auto=format&fit=crop&w=900&q=80',
    editableFields: ['recipientName', 'senderName', 'message', 'photos', 'musicUrl'],
    supportedFeatures: ['animation', 'music', 'photos', 'custom_message', 'responsive'],
    price: 17900,
    tier: 'premium',
    status: 'published',
    rendererType: 'react-component',
    componentKey: 'festival-diwali',
  },
  {
    id: 'graduation-celebration',
    slug: 'graduation-celebration',
    name: 'Graduation Celebration',
    description: 'A bright graduation celebration template with motion and photo memories.',
    category: 'graduation',
    version: '1.0.0',
    author: founder,
    authorType: 'founder',
    thumbnailUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80',
    editableFields: ['recipientName', 'senderName', 'message', 'photos'],
    supportedFeatures: ['animation', 'photos', 'custom_message', 'responsive'],
    price: 0,
    tier: 'free',
    status: 'published',
    rendererType: 'react-component',
    componentKey: 'graduation-celebration',
  },
  basicBirthdayTestManifest,
]

const components: Record<string, TemplatePlugin['component']> = {
  'birthday-classic': lazy(() => import('../../components/templates/BirthdayClassic').then((module) => ({ default: createLegacyTemplateAdapter(module.BirthdayClassic) }))),
  'birthday-glow': lazy(() => import('../../components/templates/BirthdayGlow').then((module) => ({ default: createLegacyTemplateAdapter(module.BirthdayGlow) }))),
  'wedding-elegant': lazy(() => import('../../components/templates/WeddingElegant').then((module) => ({ default: createLegacyTemplateAdapter(module.WeddingElegant) }))),
  'anniversary-romantic': lazy(() => import('../../components/templates/AnniversaryRomantic').then((module) => ({ default: createLegacyTemplateAdapter(module.AnniversaryRomantic) }))),
  'festival-diwali': lazy(() => import('../../components/templates/FestivalDiwali').then((module) => ({ default: createLegacyTemplateAdapter(module.FestivalDiwali) }))),
  'graduation-celebration': lazy(() => import('../../components/templates/GraduationCelebration').then((module) => ({ default: createLegacyTemplateAdapter(module.GraduationCelebration) }))),
  'basic-birthday-test': lazy(() => import('./basic-birthday-test')),
}

let registered = false

export function registerFounderTemplates() {
  if (registered) return

  manifests.forEach((manifest) => {
    if (!getTemplateByComponentKey(manifest.componentKey)) {
      registerTemplate({
        manifest,
        component: components[manifest.componentKey],
        config: {
          maxPhotos: 5,
          supportsCustomMusic: manifest.supportedFeatures.includes('music'),
          requiredFields: ['recipientName', 'senderName'],
        },
      })
    }
  })

  registered = true
}

export { manifests as founderTemplateManifests }
