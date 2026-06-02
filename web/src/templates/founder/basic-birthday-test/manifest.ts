import type { TemplateManifest } from '../../../template-engine/types'

export const manifest = {
  id: 'basic-birthday-test',
  slug: 'basic-birthday-test',
  name: 'Basic Birthday Test',
  description: 'Testing plugin architecture',
  category: 'birthday',
  version: '1.0.0',
  author: 'founder-team',
  authorType: 'founder',
  thumbnailUrl: new URL('./preview.jpg', import.meta.url).href,
  editableFields: ['recipientName', 'senderName', 'message', 'photos'],
  supportedFeatures: ['animation', 'photos', 'custom_message', 'responsive'],
  price: 0,
  tier: 'free',
  status: 'published',
  rendererType: 'react-component',
  componentKey: 'basic-birthday-test',
} satisfies TemplateManifest
