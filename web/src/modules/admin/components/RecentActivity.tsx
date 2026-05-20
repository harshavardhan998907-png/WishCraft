import { useEffect, useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { fetchRecentActivity } from '../services/adminMetrics'
import type { ActivityItem } from '../types'

export function RecentActivity() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRecentActivity()
      .then(setItems)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card className="h-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black">Recent activity</h2>
        <Badge tone="gray">{items.length}</Badge>
      </div>

      {loading ? <p className="mt-6 text-sm font-semibold text-zinc-500">Loading activity...</p> : null}
      {error ? <p className="mt-6 text-sm font-semibold text-rose-600 dark:text-rose-300">{error}</p> : null}

      {!loading && !error ? (
        <div className="mt-5 grid gap-3">
          {items.length === 0 ? <p className="text-sm text-zinc-500">No recent platform activity.</p> : null}
          {items.map((item) => (
            <div key={item.id} className="rounded-md border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge tone={item.tone}>{item.label}</Badge>
                <span className="text-xs font-semibold text-zinc-500">{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
              <p className="mt-2 break-words text-sm font-semibold text-zinc-700 dark:text-white/75">{item.detail}</p>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  )
}
