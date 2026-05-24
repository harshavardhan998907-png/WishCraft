import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../../../components/ui/Badge'
import { Card } from '../../../components/ui/Card'
import { ResponsiveCard } from '../../../components/responsive/ResponsiveCard'
import { ResponsiveGrid } from '../../../components/responsive/ResponsiveGrid'
import { fetchMediaCleanupJobs, fetchOwnedMediaAssets, fetchStorageUsageMetrics } from '../../media/services/mediaService'
import type { MediaAsset, MediaCleanupJob, StorageUsageMetrics } from '../../media/types'

function formatBytes(bytes: number) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

export function AdminStorageDashboard() {
  const [metrics, setMetrics] = useState<StorageUsageMetrics | null>(null)
  const [jobs, setJobs] = useState<MediaCleanupJob[]>([])
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchStorageUsageMetrics(), fetchMediaCleanupJobs(), fetchOwnedMediaAssets()])
      .then(([nextMetrics, nextJobs, nextAssets]) => {
        setMetrics(nextMetrics)
        setJobs(nextJobs)
        setAssets(nextAssets)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const uploadTrend = useMemo(() => {
    const buckets = new Map<string, number>()
    assets.forEach((asset) => {
      const day = new Date(asset.created_at).toLocaleDateString()
      buckets.set(day, (buckets.get(day) ?? 0) + 1)
    })
    return Array.from(buckets.entries()).slice(0, 7)
  }, [assets])

  const cards = [
    ['Total storage', formatBytes(metrics?.total_storage_bytes ?? 0)],
    ['Images', formatBytes(metrics?.image_storage_bytes ?? 0)],
    ['Music', formatBytes(metrics?.music_storage_bytes ?? 0)],
    ['Orphaned', metrics?.orphaned_assets ?? 0],
    ['Expired', metrics?.expired_assets ?? 0],
    ['Creator users', metrics?.creator_storage_usage?.length ?? 0],
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">Storage</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-white/70 sm:text-base">Media usage, orphan cleanup, upload trends, and creator storage consumption.</p>
      </div>

      {error ? <Card className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</Card> : null}
      {loading ? <Card className="text-sm font-semibold text-zinc-500">Loading storage metrics...</Card> : null}

      <ResponsiveGrid columns="metrics">
        {cards.map(([label, value]) => (
          <ResponsiveCard key={label} className="min-h-28 sm:min-h-32">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-zinc-500">{label}</p>
            <p className="mt-4 break-words text-2xl font-black text-ink dark:text-white sm:text-3xl">{value}</p>
          </ResponsiveCard>
        ))}
      </ResponsiveGrid>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-black/10 p-4 dark:border-white/10 sm:p-5">
            <h3 className="text-xl font-black">Recent media assets</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-zinc-100 text-xs font-black uppercase tracking-[0.12em] text-zinc-500 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Path</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 dark:divide-white/10">
                {assets.slice(0, 50).map((asset) => (
                  <tr key={asset.id}>
                    <td className="px-4 py-4 font-black">{asset.asset_type}</td>
                    <td className="px-4 py-4"><Badge tone={asset.is_orphaned ? 'yellow' : 'green'}>{asset.is_orphaned ? 'orphaned' : asset.optimization_status}</Badge></td>
                    <td className="px-4 py-4">{formatBytes(asset.optimized_size_bytes ?? asset.original_size_bytes ?? 0)}</td>
                    <td className="break-all px-4 py-4 font-mono text-xs text-zinc-500">{asset.storage_bucket}/{asset.storage_path}</td>
                    <td className="px-4 py-4">{new Date(asset.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h3 className="text-xl font-black">Cleanup jobs</h3>
            <div className="mt-4 grid gap-3">
              {jobs.map((job) => (
                <div key={job.id} className="rounded-md border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-black">{job.job_type}</p>
                    <Badge tone={job.status === 'completed' ? 'green' : job.status === 'failed' ? 'red' : 'yellow'}>{job.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-zinc-500">{job.assets_processed} assets processed</p>
                </div>
              ))}
              {!loading && jobs.length === 0 ? <p className="text-sm text-zinc-500">No cleanup jobs yet.</p> : null}
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-black">Upload trends</h3>
            <div className="mt-4 grid gap-2">
              {uploadTrend.map(([day, count]) => (
                <div key={day} className="flex items-center justify-between rounded-md bg-zinc-100 p-3 text-sm font-semibold dark:bg-white/10">
                  <span>{day}</span>
                  <span>{count} uploads</span>
                </div>
              ))}
              {!loading && uploadTrend.length === 0 ? <p className="text-sm text-zinc-500">No uploads tracked yet.</p> : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
