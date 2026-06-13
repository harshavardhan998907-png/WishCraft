import type { TemplateManifest } from '../../template-engine/types'
import { register as registerBirthday } from '../birthday-letter-in-light/register'
import { birthdayLetterInLightManifest } from '../birthday-letter-in-light/manifest'

export const founderTemplateManifests: TemplateManifest[] = [
  birthdayLetterInLightManifest
]

let registered = false

export function registerFounderTemplates() {
  if (registered) return
  try {
    registerBirthday()
    registered = true
  } catch (error) {
    // Avoid double registration errors if called multiple times in hot reload
    if (error instanceof Error && error.message.includes('already registered')) {
      registered = true
    } else {
      throw error
    }
  }
}
