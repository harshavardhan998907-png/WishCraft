import { supabase } from '../../../lib/supabase'
import { trackEvent } from '../../analytics/services/analyticsService'
import { logSecurityAudit } from '../../security/services/governanceService'
import { en } from '../locales/en'
import { es } from '../locales/es'
import { fr } from '../locales/fr'
import { hi } from '../locales/hi'

export type LocaleCode = 'en' | 'hi' | 'es' | 'fr'

export interface SupportedLocale {
  id: string
  locale_code: LocaleCode
  locale_name: string
  is_active: boolean
  created_at: string
}

export interface LocalePreference {
  id?: string
  user_id?: string
  preferred_locale: LocaleCode
  preferred_timezone: string
  created_at?: string
  updated_at?: string
}

const dictionaries = { en, hi, es, fr }
const fallbackLocale: LocaleCode = 'en'
const storageKey = 'template-hub-locale-preference'

export const defaultTimezones = ['UTC', 'Asia/Kolkata', 'America/New_York', 'Europe/London', 'Europe/Paris']

function clean(value: string, maxLength = 120) {
  return value.replace(/<[^>]*>/g, '').replace(/[{}[\]<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

export function isLocaleCode(value: string): value is LocaleCode {
  return Object.keys(dictionaries).includes(value)
}

export function detectBrowserLocale(): LocaleCode {
  const language = navigator.language.toLowerCase()
  const exact = Object.keys(dictionaries).find((locale) => locale === language)
  if (exact && isLocaleCode(exact)) return exact
  const short = language.split('-')[0]
  return isLocaleCode(short) ? short : fallbackLocale
}

export function getStoredLocalePreference(): LocalePreference {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as Partial<LocalePreference>
    return {
      preferred_locale: parsed.preferred_locale && isLocaleCode(parsed.preferred_locale) ? parsed.preferred_locale : detectBrowserLocale(),
      preferred_timezone: parsed.preferred_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    }
  } catch {
    return {
      preferred_locale: detectBrowserLocale(),
      preferred_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    }
  }
}

export function storeLocalePreference(preference: LocalePreference) {
  localStorage.setItem(storageKey, JSON.stringify({
    preferred_locale: preference.preferred_locale,
    preferred_timezone: preference.preferred_timezone,
  }))
}

export function loadTranslations(locale: LocaleCode) {
  return dictionaries[locale] ?? dictionaries[fallbackLocale]
}

export function translate(locale: LocaleCode, key: keyof typeof en) {
  const value = loadTranslations(locale)[key] ?? dictionaries[fallbackLocale][key] ?? key
  return clean(value, 180)
}

export async function fetchSupportedLocales(): Promise<SupportedLocale[]> {
  const { data, error } = await supabase
    .from('supported_locales')
    .select('*')
    .eq('is_active', true)
    .order('locale_code')
  if (error) return [
    { id: 'en', locale_code: 'en', locale_name: 'English', is_active: true, created_at: new Date().toISOString() },
    { id: 'hi', locale_code: 'hi', locale_name: 'Hindi', is_active: true, created_at: new Date().toISOString() },
    { id: 'es', locale_code: 'es', locale_name: 'Spanish', is_active: true, created_at: new Date().toISOString() },
    { id: 'fr', locale_code: 'fr', locale_name: 'French', is_active: true, created_at: new Date().toISOString() },
  ]
  return (data ?? []) as SupportedLocale[]
}

export async function fetchLocalePreference(): Promise<LocalePreference> {
  const stored = getStoredLocalePreference()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return stored

  const { data, error } = await supabase
    .from('user_locale_preferences')
    .select('*')
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (error || !data) return stored
  const preference = data as LocalePreference
  storeLocalePreference(preference)
  return preference
}

export async function saveLocalePreference(input: { locale: LocaleCode; timezone: string }) {
  const preference = {
    preferred_locale: input.locale,
    preferred_timezone: clean(input.timezone, 80) || 'UTC',
  }
  storeLocalePreference(preference)

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return preference

  const { error } = await supabase.rpc('set_user_locale_preference', {
    target_locale: input.locale,
    target_timezone: preference.preferred_timezone,
  })
  if (error) throw new Error(error.message)

  void trackEvent({ eventName: 'locale_changed', metadata: { locale: input.locale, timezone: preference.preferred_timezone } })
  void logSecurityAudit({
    eventType: 'locale_changed',
    targetType: 'user_locale_preferences',
    riskLevel: 'low',
    metadata: { locale: input.locale, timezone: preference.preferred_timezone },
  }).catch(() => undefined)
  return preference
}

export function formatLocalizedDate(value: string | Date, preference: Pick<LocalePreference, 'preferred_locale' | 'preferred_timezone'>) {
  return new Intl.DateTimeFormat(preference.preferred_locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: preference.preferred_timezone || 'UTC',
  }).format(new Date(value))
}
