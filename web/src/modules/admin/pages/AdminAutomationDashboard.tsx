import { useEffect, useState } from 'react'
import { Badge } from '../../../components/ui/Badge'
import { Card } from '../../../components/ui/Card'
import { ResponsiveCard } from '../../../components/responsive/ResponsiveCard'
import { ResponsiveGrid } from '../../../components/responsive/ResponsiveGrid'
import { fetchAutomationLogs, fetchNotificationMetrics, fetchScheduledJobs } from '../../notifications/services/notificationService'
import type { AutomationLog, NotificationMetrics, ScheduledJob } from '../../notifications/types'

function statusTone(status: string): 'green' | 'red' | 'yellow' | 'gray' {
  if (status === 'completed') return 'green'
  if (status === 'failed' || status === 'dead_letter') return 'red'
  if (status === 'processing' || status === 'pending') return 'yellow'
  return 'gray'
}

export function AdminAutomationDashboard() {
  const [metrics, setMetrics] = useState<NotificationMetrics | null>(null)
  const [jobs, setJobs] = useState<ScheduledJob[]>([])
  const [logs, setLogs] = useState<AutomationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchNotificationMetrics(), fetchScheduledJobs(), fetchAutomationLogs()])
      .then(([nextMetrics, nextJobs, nextLogs]) => {
        setMetrics(nextMetrics)
        setJobs(nextJobs)
        setLogs(nextLogs)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    ['Notifications', metrics?.total_notifications ?? 0],
    ['Unread', metrics?.unread_notifications ?? 0],
    ['Failed jobs', metrics?.failed_jobs ?? 0],
    ['Engagement reminders', metrics?.engagement_reminders_sent ?? 0],
    ['Payment notifications', metrics?.payment_notifications_sent ?? 0],
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">Automation</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-white/70 sm:text-base">Scheduled jobs, retry queue health, notification metrics, and automation execution logs.</p>
      </div>

      {error ? <Card className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</Card> : null}
      {loading ? <Card className="text-sm font-semibold text-zinc-500">Loading automation dashboard...</Card> : null}

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
            <h3 className="text-xl font-black">Scheduled jobs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-zinc-100 text-xs font-black uppercase tracking-[0.12em] text-zinc-500 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Retries</th>
                  <th className="px-4 py-3">Scheduled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 dark:divide-white/10">
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="px-4 py-4 font-black">{job.job_type}</td>
                    <td className="px-4 py-4"><Badge tone={statusTone(job.status)}>{job.status}</Badge></td>
                    <td className="px-4 py-4">{job.retry_count}</td>
                    <td className="px-4 py-4">{new Date(job.scheduled_for).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-black">Execution logs</h3>
          <div className="mt-4 grid gap-3">
            {logs.map((log) => (
              <div key={log.id} className="rounded-md border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-black text-ink dark:text-white">{log.execution_status}</p>
                  <Badge tone={statusTone(log.execution_status)}>{new Date(log.executed_at).toLocaleDateString()}</Badge>
                </div>
                {log.error_message ? <p className="mt-2 text-sm leading-6 text-rose-600 dark:text-rose-200">{log.error_message}</p> : null}
              </div>
            ))}
            {!loading && logs.length === 0 ? <p className="text-sm text-zinc-500">No automation logs yet.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  )
}
