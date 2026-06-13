import { registerTemplate } from '../../template-engine/registry'
import { birthdayLetterInLightManifest } from './manifest'
import BirthdayLetterInLight from './BirthdayLetterInLight'

export const birthdayLetterInLightPlugin = {
  manifest: birthdayLetterInLightManifest,
  component: BirthdayLetterInLight,
}

export function register() {
  return registerTemplate(birthdayLetterInLightPlugin)
}
