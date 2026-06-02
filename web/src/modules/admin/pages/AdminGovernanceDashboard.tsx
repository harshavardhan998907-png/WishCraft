import { useEffect, useState } from 'react'
import { Badge } from '../../../components/ui/Badge'
import { Card } from '../../../components/ui/Card'
import { ResponsiveCard } from '../../../components/responsive/ResponsiveCard'
import { ResponsiveGrid } from '../../../components/responsive/ResponsiveGrid'
import { fetchRateLimitEvents, fetchSecurityAuditLogs, fetchSecurityMonitoringMetrics } from '../../security/services/governanceService'
import type { SecurityAuditLog, SecurityMonitoringMetrics, SecurityRateLimitEvent } from '../../security/services/governanceService'

function riskTone(risk: string): 'green' | 'red' | 'yellow' | 'gray' {
  if (risk === 'critical' || risk === 'high') return 'red'
  if (risk === 'medium') return 'yellow'
  if (risk === 'low') return 'green'
  return 'gray'
}

export function AdminGovernanceDashboard() {
  const [metrics, setMetrics] = useState<SecurityMonitoringMetrics | null>(null)
  const [logs, setLogs] = useState<SecurityAuditLog[]>([])
  const [rateLimits, setRateLimits] = useState<SecurityRateLimitEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchSecurityMonitoringMetrics(), fetchSecurityAuditLogs(), fetchRateLimitEvents()])
      .then(([nextMetrics, nextLogs, nextRateLimits]) => {
        setMetrics(nextMetrics)
        setLogs(nextLogs)
        setRateLimits(nextRateLimits)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    ['Failed logins', metrics?.failed_login_attempts ?? 0],
    ['Suspicious actions', metrics?.suspicious_actions ?? 0],
    ['Privilege changes', metrics?.admin_privilege_changes ?? 0],
    ['Abuse reports', metrics?.abuse_reports ?? 0],
    ['Blocked requests', metrics?.blocked_requests ?? 0],
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">Governance</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-white/70 sm:text-base">Security posture, audit governance, privilege monitoring, abuse patterns, and blocked request visibility.</p>
      </div>

      {error ? <Card className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</Card> : null}
      {loading ? <Card className="text-sm font-semibold text-zinc-500">Loading governance dashboard...</Card> : null}

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
            <h3 className="text-xl font-black">Governance logs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-zinc-100 text-xs font-black uppercase tracking-[0.12em] text-zinc-500 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 dark:divide-white/10">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-4 font-black">{log.event_type}</td>
                    <td className="px-4 py-4"><Badge tone={riskTone(log.risk_level)}>{log.risk_level}</Badge></td>
                    <td className="px-4 py-4">
                      <span className="font-semibold">{log.target_type ?? 'platform'}</span>
                      {log.target_id ? <span className="block break-all text-xs text-zinc-500">{log.target_id}</span> : null}
                    </td>
                    <td className="px-4 py-4">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-black">Suspicious activity alerts</h3>
          <div className="mt-4 grid gap-3">
            {logs.filter((log) => log.risk_level === 'high' || log.risk_level === 'critical').slice(0, 8).map((log) => (
              <div key={log.id} className="rounded-md border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-black text-ink dark:text-white">{log.event_type}</p>
                  <Badge tone={riskTone(log.risk_level)}>{log.risk_level}</Badge>
                </div>
                <p className="mt-2 text-xs text-zinc-500">{new Date(log.created_at).toLocaleString()}</p>
              </div>
            ))}
            {!loading && logs.filter((log) => log.risk_level === 'high' || log.risk_level === 'critical').length === 0 ? <p className="text-sm text-zinc-500">No high-risk alerts.</p> : null}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-xl font-black">Blocked request patterns</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rateLimits.map((event) => (
            <div key={event.id} className="rounded-md border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="break-words font-black">{event.action}</p>
                <Badge tone={event.blocked ? 'red' : 'gray'}>{event.blocked ? 'blocked' : 'observed'}</Badge>
              </div>
              <p className="mt-2 break-all text-xs text-zinc-500">{event.rate_limit_key}</p>
              <p className="mt-1 text-xs text-zinc-500">{new Date(event.created_at).toLocaleString()}</p>
            </div>
          ))}
          {!loading && rateLimits.length === 0 ? <p className="text-sm text-zinc-500">No rate-limit events yet.</p> : null}
        </div>
      </Card>
    </div>
  )
}
