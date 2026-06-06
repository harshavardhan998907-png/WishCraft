import { useLocalization } from '../../modules/i18n/providers/LocalizationProvider'
import type { LocaleCode } from '../../modules/i18n/services/localeService'

export function NavbarLanguageSelector() {
  const { locale, timezone, supportedLocales, setLocalePreference, t } = useLocalization()

  async function handleChange(nextLocale: LocaleCode) {
    await setLocalePreference({ locale: nextLocale, timezone })
  }

  if (supportedLocales.length <= 1) return null

  return (
    <div className="flex items-center">
      <label className="sr-only" htmlFor="navbar-locale-select">{t('language')}</label>
      <select
        id="navbar-locale-select"
        className="h-9 rounded-lg border border-black/10 bg-white/80 px-2.5 text-xs font-semibold text-ink backdrop-blur-sm transition-colors hover:border-brand/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-cream dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-white/20 dark:focus-visible:ring-offset-deep-navy"
        value={locale}
        onChange={(e) => handleChange(e.target.value as LocaleCode)}
      >
        {supportedLocales.map((item) => (
          <option key={item.locale_code} value={item.locale_code}>{item.locale_name}</option>
        ))}
      </select>
    </div>
  )
}
