import { useEffect, useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { useAuth } from '../../../hooks/useAuth'
import { fetchCreatorMetrics, fetchCreatorTemplatePopularity } from '../services/creatorAnalytics'
import { fetchCreatorProfile } from '../services/creatorProfile'
import { marketplaceSchemaMessage } from '../services/marketplaceSchema'
import type { CreatorTemplateMetric, CreatorTemplatePopularity } from '../types'
import { fetchOwnedMediaAssets } from '../../media/services/mediaService'
import type { MediaAsset } from '../../media/types'
import { fetchCreatorEngagementMetrics } from '../../engagement/services/engagementService'
import type { CreatorEngagementMetric } from '../../engagement/types'

function formatBytes(bytes: number) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

export function CreatorAnalytics() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<CreatorTemplateMetric | null>(null)
  const [popularity, setPopularity] = useState<CreatorTemplatePopularity[]>([])
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([])
  const [engagement, setEngagement] = useState<CreatorEngagementMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    fetchCreatorProfile(user.id)
      .then(async (profile) => {
        const [nextMetrics, nextPopularity] = await Promise.all([
          fetchCreatorMetrics(user.id),
          profile ? fetchCreatorTemplatePopularity(profile.id) : Promise.resolve([]),
        ])
        const [nextAssets, nextEngagement] = await Promise.all([
          fetchOwnedMediaAssets(),
          fetchCreatorEngagementMetrics(),
        ])
        setMetrics(nextMetrics)
        setPopularity(nextPopularity)
        setMediaAssets(nextAssets)
        setEngagement(nextEngagement)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <Card className="text-sm font-semibold text-zinc-500">Loading creator analytics...</Card>
  if (error) return <Card className="border-rose-200 bg-rose-50 text-rose-700">{error}</Card>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">Analytics</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-white/70">Views, conversions, popularity, and engagement metrics from the central analytics system.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><p className="text-sm font-bold text-zinc-500">Views</p><p className="mt-2 text-3xl font-black">{metrics?.total_views ?? 0}</p></Card>
        <Card><p className="text-sm font-bold text-zinc-500">Uses</p><p className="mt-2 text-3xl font-black">{metrics?.total_uses ?? 0}</p></Card>
        <Card><p className="text-sm font-bold text-zinc-500">Templates</p><p className="mt-2 text-3xl font-black">{metrics?.template_count ?? 0}</p></Card>
        <Card><p className="text-sm font-bold text-zinc-500">Conversions</p><p className="mt-2 text-3xl font-black">{metrics?.conversion_rate ?? 0}%</p></Card>
        <Card><p className="text-sm font-bold text-zinc-500">Media assets</p><p className="mt-2 text-3xl font-black">{mediaAssets.length}</p></Card>
        <Card><p className="text-sm font-bold text-zinc-500">Storage</p><p className="mt-2 text-3xl font-black">{formatBytes(mediaAssets.reduce((total, asset) => total + (asset.optimized_size_bytes ?? asset.original_size_bytes ?? 0), 0))}</p></Card>
        <Card><p className="text-sm font-bold text-zinc-500">Engagement</p><p className="mt-2 text-3xl font-black">{engagement.reduce((total, item) => total + item.engagement_score, 0)}</p></Card>
      </div>

      <Card>
        <h3 className="text-lg font-black text-ink dark:text-white">Template popularity</h3>
        {!metrics && popularity.length === 0 ? <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-white/70">{marketplaceSchemaMessage()}</p> : null}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="text-zinc-500">
              <tr><th className="py-2">Template</th><th>Views</th><th>Uses</th><th>Paid conversions</th><th>Rate</th></tr>
            </thead>
            <tbody>
              {popularity.map((template) => (
                <tr key={template.template_id} className="border-t border-black/10 dark:border-white/10">
                  <td className="py-3 font-bold">{template.template_name}</td>
                  <td>{template.total_views}</td>
                  <td>{template.total_uses}</td>
                  <td>{template.total_conversions}</td>
                  <td>{template.conversion_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {popularity.length === 0 ? <p className="py-4 text-sm font-semibold text-zinc-500">No template engagement yet.</p> : null}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-black text-ink dark:text-white">Engagement trends</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="text-zinc-500">
              <tr><th className="py-2">Template</th><th>Reactions</th><th>Messages</th><th>Score</th></tr>
            </thead>
            <tbody>
              {engagement.map((template) => (
                <tr key={template.template_id} className="border-t border-black/10 dark:border-white/10">
                  <td className="py-3 font-bold">{template.template_name}</td>
                  <td>{template.total_reactions}</td>
                  <td>{template.total_messages}</td>
                  <td>{template.engagement_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {engagement.length === 0 ? <p className="py-4 text-sm font-semibold text-zinc-500">No social engagement yet.</p> : null}
        </div>
      </Card>
    </div>
  )
}
