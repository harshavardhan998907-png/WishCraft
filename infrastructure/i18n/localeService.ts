export interface LocaleDefinition {
  localeCode: string
  localeName: string
  active: boolean
}

export interface LocalePreference {
  preferredLocale: string
  preferredTimezone: string
}

export const fallbackLocale = 'en'
export const fallbackTimezone = 'UTC'

export const defaultSupportedLocales: LocaleDefinition[] = [
  { localeCode: 'en', localeName: 'English', active: true },
  { localeCode: 'hi', localeName: 'Hindi', active: true },
  { localeCode: 'es', localeName: 'Spanish', active: true },
  { localeCode: 'fr', localeName: 'French', active: true },
]

export function sanitizeTranslation(value: string) {
  return value.replace(/<[^>]*>/g, '').replace(/[{}[\]<>]/g, '').replace(/\s+/g, ' ').trim()
}

export function detectLocale(input?: { browserLanguage?: string; supportedLocales?: string[] }) {
  const supported = input?.supportedLocales?.length ? input.supportedLocales : defaultSupportedLocales.map((locale) => locale.localeCode)
  const browserLanguage = input?.browserLanguage?.toLowerCase() ?? fallbackLocale
  const exact = supported.find((locale) => locale.toLowerCase() === browserLanguage)
  if (exact) return exact

  const language = browserLanguage.split('-')[0]
  return supported.find((locale) => locale.toLowerCase() === language) ?? fallbackLocale
}

export function resolveTimezone(timezone?: string | null) {
  try {
    if (timezone) {
      new Intl.DateTimeFormat('en', { timeZone: timezone }).format(new Date())
      return timezone
    }
  } catch {
    return fallbackTimezone
  }
  return fallbackTimezone
}

export function formatLocaleDate(value: string | number | Date, preference: LocalePreference) {
  return new Intl.DateTimeFormat(preference.preferredLocale || fallbackLocale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: resolveTimezone(preference.preferredTimezone),
  }).format(new Date(value))
}
