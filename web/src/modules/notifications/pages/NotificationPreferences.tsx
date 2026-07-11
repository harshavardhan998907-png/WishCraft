import { FormEvent, useEffect, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useToastStore } from '../../../store/toastStore'
import { fetchNotificationPreferences, updateNotificationPreferences } from '../services/notificationService'
import type { NotificationPreferences as NotificationPreferencesType } from '../types'

const preferenceLabels: Array<[keyof Omit<NotificationPreferencesType, 'id' | 'user_id' | 'created_at'>, string]> = [
  ['email_enabled', 'Email notifications'],
  ['engagement_enabled', 'Engagement notifications'],
  ['creator_updates_enabled', 'Creator updates'],
  ['payment_notifications_enabled', 'Payment notifications'],
  ['reminder_notifications_enabled', 'Reminder notifications'],
]

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferencesType | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToastStore()

  useEffect(() => {
    fetchNotificationPreferences()
      .then(setPreferences)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!preferences) return
    setSaving(true)
    try {
      setPreferences(await updateNotificationPreferences({
        email_enabled: preferences.email_enabled,
        engagement_enabled: preferences.engagement_enabled,
        creator_updates_enabled: preferences.creator_updates_enabled,
        payment_notifications_enabled: preferences.payment_notifications_enabled,
        reminder_notifications_enabled: preferences.reminder_notifications_enabled,
      }))
      toast.push('success', 'Notification preferences saved')
    } catch (err) {
      toast.push('error', err instanceof Error ? err.message : 'Could not save preferences')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <Card>
        <div>
          <h1 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">Notification preferences</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-white/70">Control lifecycle, engagement, creator, and payment communication.</p>
        </div>

        {error ? <p className="mt-4 text-sm font-semibold text-rose-600 dark:text-rose-200">{error}</p> : null}
        {loading ? (
          <div className="mt-6 grid gap-3 animate-in fade-in duration-500">
            <Skeleton className="h-[52px] w-full" />
            <Skeleton className="h-[52px] w-full" />
            <Skeleton className="h-[52px] w-full" />
            <Skeleton className="h-[52px] w-full" />
            <Skeleton className="h-[52px] w-full" />
            <Skeleton className="h-11 w-full rounded-full mt-2" />
          </div>
        ) : null}

        {!loading && preferences ? (
          <form className="mt-6 grid gap-3" onSubmit={save}>
            {preferenceLabels.map(([key, label]) => (
              <label key={key} className="flex items-center justify-between rounded-md bg-zinc-100 p-3 font-semibold dark:bg-white/10">
                {label}
                <input
                  type="checkbox"
                  checked={Boolean(preferences[key])}
                  onChange={(event) => setPreferences((current) => current ? { ...current, [key]: event.target.checked } : current)}
                />
              </label>
            ))}
            <Button type="submit" loading={saving}>Save preferences</Button>
          </form>
        ) : null}
      </Card>
    </section>
  )
}
