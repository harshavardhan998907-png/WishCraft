import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { ResponsiveCard } from '../../../components/responsive/ResponsiveCard'
import { ResponsiveGrid } from '../../../components/responsive/ResponsiveGrid'
import {
  fetchEngagementMetrics,
  fetchEngagementReports,
  fetchModerationMessages,
  moderateWishMessage,
  updateEngagementReport,
} from '../../engagement/services/engagementService'
import type { EngagementMetrics, EngagementReport, WishMessage } from '../../engagement/types'

export function AdminEngagementModeration() {
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null)
  const [messages, setMessages] = useState<WishMessage[]>([])
  const [reports, setReports] = useState<EngagementReport[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [nextMetrics, nextMessages, nextReports] = await Promise.all([
        fetchEngagementMetrics(),
        fetchModerationMessages(),
        fetchEngagementReports(),
      ])
      setMetrics(nextMetrics)
      setMessages(nextMessages)
      setReports(nextReports)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load engagement moderation')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const needsReview = useMemo(() => messages.filter((message) => message.is_hidden || message.moderation_status !== 'approved'), [messages])
  const openReports = reports.filter((report) => report.status === 'open' || report.status === 'reviewing')
  const cards = [
    ['Reactions', metrics?.total_reactions ?? 0],
    ['Messages', metrics?.total_messages ?? 0],
    ['Review queue', needsReview.length],
    ['Open reports', openReports.length],
    ['Engagement rate', `${metrics?.engagement_rate ?? 0}%`],
  ]

  async function handleMessage(messageId: string, hidden: boolean) {
    setBusyId(messageId)
    try {
      await moderateWishMessage({ messageId, hidden })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not moderate message')
    } finally {
      setBusyId(null)
    }
  }

  async function handleReport(reportId: string, status: EngagementReport['status']) {
    setBusyId(reportId)
    try {
      await updateEngagementReport({ reportId, status })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update report')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">Engagement</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-white/70 sm:text-base">Moderate wish messages, review reports, and monitor community interaction.</p>
      </div>

      {error ? <Card className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</Card> : null}
      {loading ? <Card className="text-sm font-semibold text-zinc-500">Loading engagement moderation...</Card> : null}

      <ResponsiveGrid columns="metrics">
        {cards.map(([label, value]) => (
          <ResponsiveCard key={label} className="min-h-28 sm:min-h-32">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-zinc-500">{label}</p>
            <p className="mt-4 break-words text-2xl font-black text-ink dark:text-white sm:text-3xl">{value}</p>
          </ResponsiveCard>
        ))}
      </ResponsiveGrid>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-black">Messages</h3>
            <Badge tone="gray">{messages.length}</Badge>
          </div>
          <div className="mt-5 grid gap-3">
            {messages.map((message) => (
              <div key={message.id} className="rounded-md border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-black text-ink dark:text-white">{message.sender_name}</p>
                  <Badge tone={message.is_hidden || message.moderation_status !== 'approved' ? 'yellow' : 'green'}>{message.moderation_status}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-white/70">{message.sender_message}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" loading={busyId === message.id} onClick={() => handleMessage(message.id, false)}>Approve</Button>
                  <Button size="sm" variant="danger" loading={busyId === message.id} onClick={() => handleMessage(message.id, true)}>Hide</Button>
                </div>
              </div>
            ))}
            {!loading && messages.length === 0 ? <p className="text-sm text-zinc-500">No messages yet.</p> : null}
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-black">Reports</h3>
            <Badge tone="gray">{reports.length}</Badge>
          </div>
          <div className="mt-5 grid gap-3">
            {reports.map((report) => (
              <div key={report.id} className="rounded-md border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-black text-ink dark:text-white">{report.target_type}</p>
                  <Badge tone={report.status === 'resolved' || report.status === 'dismissed' ? 'green' : 'yellow'}>{report.status}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-white/70">{report.reason}</p>
                <p className="mt-2 break-all font-mono text-xs text-zinc-500">{report.target_id}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" loading={busyId === report.id} onClick={() => handleReport(report.id, 'reviewing')}>Review</Button>
                  <Button size="sm" loading={busyId === report.id} onClick={() => handleReport(report.id, 'resolved')}>Resolve</Button>
                  <Button size="sm" variant="ghost" loading={busyId === report.id} onClick={() => handleReport(report.id, 'dismissed')}>Dismiss</Button>
                </div>
              </div>
            ))}
            {!loading && reports.length === 0 ? <p className="text-sm text-zinc-500">No reports yet.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  )
}
