import { useEffect, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { defaultTimezones } from '../services/localeService'
import type { LocaleCode } from '../services/localeService'
import { useLocalization } from '../providers/LocalizationProvider'

export function LanguageSwitcher() {
  const { locale, timezone, supportedLocales, setLocalePreference, t } = useLocalization()
  const [nextLocale, setNextLocale] = useState<LocaleCode>(locale)
  const [nextTimezone, setNextTimezone] = useState(timezone)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setNextLocale(locale)
    setNextTimezone(timezone)
  }, [locale, timezone])

  async function save() {
    setSaving(true)
    try {
      await setLocalePreference({ locale: nextLocale, timezone: nextTimezone })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="locale-select">{t('language')}</label>
      <select
        id="locale-select"
        className="h-10 rounded-md border border-black/10 bg-white px-2 text-sm font-semibold text-ink dark:border-white/10 dark:bg-[#181824] dark:text-white"
        value={nextLocale}
        onChange={(event) => setNextLocale(event.target.value as LocaleCode)}
      >
        {supportedLocales.map((item) => (
          <option key={item.locale_code} value={item.locale_code}>{item.locale_name}</option>
        ))}
      </select>
      <label className="sr-only" htmlFor="timezone-select">{t('timezone')}</label>
      <select
        id="timezone-select"
        className="h-10 max-w-44 rounded-md border border-black/10 bg-white px-2 text-sm font-semibold text-ink dark:border-white/10 dark:bg-[#181824] dark:text-white"
        value={nextTimezone}
        onChange={(event) => setNextTimezone(event.target.value)}
      >
        {Array.from(new Set([timezone, ...defaultTimezones])).map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
      <Button type="button" size="sm" variant="ghost" loading={saving} onClick={save}>{t('save')}</Button>
    </div>
  )
}
