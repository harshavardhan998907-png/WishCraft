import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../../../components/ui/Badge'
import { Card } from '../../../components/ui/Card'
import { ResponsiveCard } from '../../../components/responsive/ResponsiveCard'
import { ResponsiveGrid } from '../../../components/responsive/ResponsiveGrid'
import { fetchAIGenerationLogs, fetchAIUsageMetrics } from '../../ai/services/aiService'
import type { AIGenerationLog, AIUsageMetrics } from '../../ai/types'

function formatCount(value: number) {
  return new Intl.NumberFormat('en-IN').format(value)
}

export function AdminAIAnalytics() {
  const [metrics, setMetrics] = useState<AIUsageMetrics | null>(null)
  const [logs, setLogs] = useState<AIGenerationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchAIUsageMetrics(), fetchAIGenerationLogs()])
      .then(([nextMetrics, nextLogs]) => {
        setMetrics(nextMetrics)
        setLogs(nextLogs)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const failures = useMemo(() => logs.filter((log) => log.generation_status !== 'completed'), [logs])
  const topTypes = Object.entries(metrics?.popular_generation_types ?? {})

  const cards = [
    ['Generations', formatCount(metrics?.total_generations ?? 0)],
    ['Failed', formatCount(metrics?.failed_generations ?? failures.length)],
    ['Conversion impact', formatCount(metrics?.ai_conversion_impact ?? 0)],
    ['Types', formatCount(topTypes.length)],
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">AI analytics</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-white/70 sm:text-base">Usage, generation trends, failure patterns, and AI-assisted conversion signals.</p>
      </div>

      {error ? <Card className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</Card> : null}
      {loading ? <Card className="text-sm font-semibold text-zinc-500">Loading AI analytics...</Card> : null}

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
            <h3 className="text-xl font-black">Generation logs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-zinc-100 text-xs font-black uppercase tracking-[0.12em] text-zinc-500 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">Tokens</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 dark:divide-white/10">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-4 font-black">{log.generation_type}</td>
                    <td className="px-4 py-4"><Badge tone={log.generation_status === 'completed' ? 'green' : 'red'}>{log.generation_status}</Badge></td>
                    <td className="px-4 py-4">{log.model_name ?? 'fallback'}</td>
                    <td className="px-4 py-4">{log.token_usage ?? 0}</td>
                    <td className="px-4 py-4">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-black">Popular types</h3>
          <div className="mt-4 grid gap-2">
            {topTypes.map(([type, count]) => (
              <div key={type} className="flex items-center justify-between rounded-md bg-zinc-100 p-3 text-sm font-semibold dark:bg-white/10">
                <span>{type}</span>
                <span>{formatCount(count)}</span>
              </div>
            ))}
            {!loading && topTypes.length === 0 ? <p className="text-sm text-zinc-500">No AI usage yet.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  )
}
