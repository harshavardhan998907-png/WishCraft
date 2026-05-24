import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { usePerformanceMetrics } from '../../performance/hooks/usePerformanceMetrics'

function formatPercent(value?: number) {
  return `${Number(value ?? 0).toFixed(2)}%`
}

export function AdminProductionDashboard() {
  const { metrics, healthLogs, errorLogs, loading, error, reload } = usePerformanceMetrics()
  const queue = metrics?.queue_health ?? {}

  if (loading) return <div className="p-6 font-bold">Loading production metrics...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-ink dark:text-white">Production</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-white/70">Operational health, queue pressure, errors, and cache behavior.</p>
        </div>
        <Button variant="ghost" onClick={() => void reload()}>Refresh</Button>
      </div>

      {error ? <Card className="border-red-200 bg-red-50 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{error}</Card> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <p className="text-xs font-black uppercase text-zinc-500">Avg response</p>
          <p className="mt-2 text-3xl font-black">{Number(metrics?.average_response_time ?? 0).toFixed(0)} ms</p>
        </Card>
        <Card>
          <p className="text-xs font-black uppercase text-zinc-500">Failed jobs</p>
          <p className="mt-2 text-3xl font-black">{metrics?.failed_jobs ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs font-black uppercase text-zinc-500">Payment success</p>
          <p className="mt-2 text-3xl font-black">{formatPercent(metrics?.payment_success_rate)}</p>
        </Card>
        <Card>
          <p className="text-xs font-black uppercase text-zinc-500">AI failure</p>
          <p className="mt-2 text-3xl font-black">{formatPercent(metrics?.ai_failure_rate)}</p>
        </Card>
        <Card>
          <p className="text-xs font-black uppercase text-zinc-500">Cache hit ratio</p>
          <p className="mt-2 text-3xl font-black">{formatPercent(metrics?.cache_hit_ratio)}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="font-black">Queue Health</h2>
          <div className="mt-4 grid gap-3 text-sm">
            {['pending', 'processing', 'failed'].map((key) => (
              <div key={key} className="flex items-center justify-between rounded-md bg-black/5 px-3 py-2 dark:bg-white/10">
                <span className="capitalize">{key}</span>
                <strong>{queue[key] ?? 0}</strong>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="font-black">System Health</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs uppercase text-zinc-500">
                <tr><th className="py-2">Service</th><th>Status</th><th>Response</th><th>Created</th></tr>
              </thead>
              <tbody>
                {healthLogs.map((log) => (
                  <tr key={log.id} className="border-t border-black/10 dark:border-white/10">
                    <td className="py-3 font-bold">{log.service_name}</td>
                    <td>{log.health_status}</td>
                    <td>{log.response_time_ms ?? 0} ms</td>
                    <td>{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {healthLogs.length === 0 ? <tr><td className="py-4 text-zinc-500" colSpan={4}>No health logs yet.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="font-black">Recent Errors</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase text-zinc-500">
              <tr><th className="py-2">Service</th><th>Type</th><th>Severity</th><th>Message</th><th>Created</th></tr>
            </thead>
            <tbody>
              {errorLogs.map((log) => (
                <tr key={log.id} className="border-t border-black/10 dark:border-white/10">
                  <td className="py-3 font-bold">{log.service_name}</td>
                  <td>{log.error_type}</td>
                  <td>{log.severity}</td>
                  <td className="max-w-sm truncate">{log.error_message}</td>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {errorLogs.length === 0 ? <tr><td className="py-4 text-zinc-500" colSpan={5}>No production errors logged.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
