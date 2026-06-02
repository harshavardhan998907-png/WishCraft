import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { fetchLocalePreference, fetchSupportedLocales, loadTranslations, saveLocalePreference, translate } from '../services/localeService'
import type { LocaleCode, LocalePreference, SupportedLocale } from '../services/localeService'
import { en } from '../locales/en'

interface LocalizationContextValue {
  locale: LocaleCode
  timezone: string
  supportedLocales: SupportedLocale[]
  messages: typeof en
  loading: boolean
  t: (key: keyof typeof en) => string
  setLocalePreference: (input: { locale: LocaleCode; timezone: string }) => Promise<void>
}

const LocalizationContext = createContext<LocalizationContextValue | null>(null)

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<LocalePreference>({ preferred_locale: 'en', preferred_timezone: 'UTC' })
  const [supportedLocales, setSupportedLocales] = useState<SupportedLocale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchLocalePreference(), fetchSupportedLocales()])
      .then(([nextPreference, nextLocales]) => {
        setPreference(nextPreference)
        setSupportedLocales(nextLocales)
      })
      .finally(() => setLoading(false))
  }, [])

  const value = useMemo<LocalizationContextValue>(() => ({
    locale: preference.preferred_locale,
    timezone: preference.preferred_timezone,
    supportedLocales,
    messages: loadTranslations(preference.preferred_locale),
    loading,
    t: (key) => translate(preference.preferred_locale, key),
    setLocalePreference: async (input) => {
      const nextPreference = await saveLocalePreference(input)
      setPreference(nextPreference)
    },
  }), [loading, preference, supportedLocales])

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>
}

export function useLocalization() {
  const context = useContext(LocalizationContext)
  if (!context) throw new Error('useLocalization must be used inside LocalizationProvider')
  return context
}
