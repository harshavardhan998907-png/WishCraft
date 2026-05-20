import { useEffect, useMemo, useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { useAuth } from '../../../hooks/useAuth'
import { ensureCreatorProfile } from '../services/creatorProfile'
import { fetchCreatorMetrics } from '../services/creatorAnalytics'
import { fetchCreatorTemplates } from '../services/creatorTemplates'
import { marketplaceSchemaMessage } from '../services/marketplaceSchema'
import type { CreatorProfile, CreatorTemplate, CreatorTemplateMetric } from '../types'

export function CreatorDashboard() {
  const { user, profile } = useAuth()
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null)
  const [metrics, setMetrics] = useState<CreatorTemplateMetric | null>(null)
  const [templates, setTemplates] = useState<CreatorTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    ensureCreatorProfile({
      userId: user.id,
      displayName: profile?.full_name || profile?.email || user.email || 'Creator',
      avatarUrl: profile?.avatar_url,
    })
      .then(async (nextProfile) => {
        if (!nextProfile) {
          setCreatorProfile(null)
          setMetrics(null)
          setTemplates([])
          return
        }
        setCreatorProfile(nextProfile)
        const [nextMetrics, nextTemplates] = await Promise.all([
          fetchCreatorMetrics(user.id),
          fetchCreatorTemplates(nextProfile.id),
        ])
        setMetrics(nextMetrics)
        setTemplates(nextTemplates)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [profile, user])

  const recentTemplates = useMemo(() => templates.slice(0, 4), [templates])
  const totalUses = metrics?.total_uses ?? creatorProfile?.total_template_uses ?? 0

  if (loading) return <Card className="text-sm font-semibold text-zinc-500">Loading creator dashboard...</Card>
  if (error) return <Card className="border-rose-200 bg-rose-50 text-rose-700">{error}</Card>
  if (!creatorProfile) {
    return (
      <Card>
        <h2 className="text-2xl font-black text-ink dark:text-white">Creator setup</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-white/70">{marketplaceSchemaMessage()}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">Dashboard</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-white/70">Creator marketplace foundation and recent template lifecycle activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><p className="text-sm font-bold text-zinc-500">Total templates</p><p className="mt-2 text-3xl font-black">{metrics?.template_count ?? templates.length}</p></Card>
        <Card><p className="text-sm font-bold text-zinc-500">Total views</p><p className="mt-2 text-3xl font-black">{metrics?.total_views ?? creatorProfile?.total_template_views ?? 0}</p></Card>
        <Card><p className="text-sm font-bold text-zinc-500">Total wish uses</p><p className="mt-2 text-3xl font-black">{totalUses}</p></Card>
        <Card><p className="text-sm font-bold text-zinc-500">Conversion rate</p><p className="mt-2 text-3xl font-black">{metrics?.conversion_rate ?? 0}%</p></Card>
      </div>

      <Card>
        <h3 className="text-lg font-black text-ink dark:text-white">Recent activity</h3>
        <div className="mt-4 grid gap-3">
          {recentTemplates.map((template) => (
            <div key={template.id} className="flex flex-col justify-between gap-2 rounded-md bg-zinc-50 p-3 dark:bg-white/5 sm:flex-row sm:items-center">
              <div>
                <p className="font-black">{template.name}</p>
                <p className="text-sm text-zinc-500">{template.slug}</p>
              </div>
              <Badge tone={template.status === 'published' ? 'green' : template.status === 'rejected' ? 'red' : 'yellow'}>{template.status}</Badge>
            </div>
          ))}
          {recentTemplates.length === 0 ? <p className="text-sm font-semibold text-zinc-500">No creator templates yet.</p> : null}
        </div>
      </Card>
    </div>
  )
}
