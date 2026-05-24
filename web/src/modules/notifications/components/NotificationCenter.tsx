import { useEffect, useState } from 'react'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../services/notificationService'
import type { NotificationItem } from '../types'

function category(type: string) {
  if (type.includes('payment') || type.includes('refund')) return 'Payment'
  if (type.includes('engagement')) return 'Engagement'
  if (type.includes('creator') || type.includes('template')) return 'Creator'
  if (type.includes('reminder') || type.includes('expiry')) return 'Reminder'
  return 'Update'
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      setNotifications(await fetchNotifications())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function readOne(id: string) {
    await markNotificationRead(id)
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, is_read: true } : item))
  }

  async function readAll() {
    await markAllNotificationsRead()
    setNotifications((items) => items.map((item) => ({ ...item, is_read: true })))
  }

  const unread = notifications.filter((item) => !item.is_read).length

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-ink dark:text-white">Notifications</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-white/70">Unread updates, reminders, and creator alerts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={unread ? 'yellow' : 'green'}>{unread} unread</Badge>
          <Button size="sm" variant="ghost" onClick={readAll}>Mark all read</Button>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm font-semibold text-rose-600 dark:text-rose-200">{error}</p> : null}
      {loading ? <p className="mt-4 text-sm font-semibold text-zinc-500">Loading notifications...</p> : null}

      <div className="mt-5 grid gap-3">
        {notifications.map((notification) => (
          <button
            key={notification.id}
            type="button"
            onClick={() => readOne(notification.id)}
            className={`rounded-md border p-3 text-left transition ${
              notification.is_read
                ? 'border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/5'
                : 'border-sun/40 bg-sun/10 dark:border-sun/30 dark:bg-sun/10'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-black text-ink dark:text-white">{notification.title}</p>
              <Badge tone={notification.is_read ? 'gray' : 'yellow'}>{category(notification.notification_type)}</Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-white/70">{notification.message}</p>
            <p className="mt-2 text-xs font-semibold text-zinc-500">{new Date(notification.created_at).toLocaleString()}</p>
          </button>
        ))}
        {!loading && notifications.length === 0 ? <p className="text-sm font-semibold text-zinc-500">No notifications yet.</p> : null}
      </div>
    </Card>
  )
}
