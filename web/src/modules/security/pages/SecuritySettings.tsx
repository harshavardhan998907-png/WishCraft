import { useState } from 'react'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useToastStore } from '../../../store/toastStore'
import { requestAccountDeletion, requestDataExport } from '../services/governanceService'
import { useSecurityOverview } from '../hooks/useSecurityOverview'
import { useDeferredLoading } from '../../../hooks/useDeferredLoading'

function dateLabel(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : 'Pending'
}

export function SecuritySettings() {
  const { sessions, consents, exports, deletions, loading, error, setExports, setDeletions } = useSecurityOverview()
  const deferredLoading = useDeferredLoading(loading)
  const [requestingExport, setRequestingExport] = useState(false)
  const [requestingDeletion, setRequestingDeletion] = useState(false)
  const toast = useToastStore()

  async function submitExportRequest() {
    setRequestingExport(true)
    try {
      const id = await requestDataExport()
      setExports((current) => [{
        id,
        user_id: '',
        export_status: 'pending',
        requested_at: new Date().toISOString(),
        completed_at: null,
      }, ...current])
      toast.push('success', 'Data export request submitted')
    } catch (err) {
      toast.push('error', err instanceof Error ? err.message : 'Could not request export')
    } finally {
      setRequestingExport(false)
    }
  }

  async function submitDeletionRequest() {
    setRequestingDeletion(true)
    try {
      const id = await requestAccountDeletion()
      const scheduled = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      setDeletions((current) => [{
        id,
        user_id: '',
        request_status: 'scheduled',
        scheduled_deletion_at: scheduled,
        completed_at: null,
      }, ...current])
      toast.push('success', 'Account deletion request scheduled')
    } catch (err) {
      toast.push('error', err instanceof Error ? err.message : 'Could not request deletion')
    } finally {
      setRequestingDeletion(false)
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader 
        title="Security settings" 
        subtitle="Manage session visibility, privacy requests, account deletion recovery, and consent history."
        backTo="/dashboard"
      />

      {error ? <Card className="mb-6 border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</Card> : null}
      {deferredLoading ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] animate-in fade-in duration-500">
          <div className="space-y-6">
            <Card>
              <div className="flex flex-col gap-4">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-full max-w-md" />
                <div className="mt-4 grid gap-3">
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            </Card>
            <Card>
              <Skeleton className="h-7 w-48 mb-4" />
              <div className="grid gap-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <Skeleton className="h-7 w-32 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-10 w-full mb-4 rounded-full" />
              <div className="grid gap-3">
                <Skeleton className="h-16 w-full" />
              </div>
            </Card>
            <Card>
              <Skeleton className="h-7 w-40 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-10 w-full mb-4 rounded-full" />
            </Card>
          </div>
        </div>
      ) : null}

      {!deferredLoading && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
          <Card>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <h2 className="text-xl font-black">Active sessions</h2>
                <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-white/70">Current authenticated session visibility is available now; full multi-device revocation can be added server-side.</p>
              </div>
              <Badge tone="green">Hardened</Badge>
            </div>
            <div className="mt-4 grid gap-3">
              {sessions.map((session) => (
                <div key={session.id} className="rounded-md border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="max-w-xl break-words text-sm font-black">{session.device}</p>
                    {session.current ? <Badge tone="green">Current</Badge> : null}
                  </div>
                  <p className="mt-2 text-xs font-semibold text-zinc-500">Last active {dateLabel(session.lastActiveAt)}</p>
                </div>
              ))}
              {!deferredLoading && sessions.length === 0 ? <p className="text-sm text-zinc-500">No active session found.</p> : null}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-black">Consent history</h2>
            <div className="mt-4 grid gap-3">
              {consents.map((record) => (
                <div key={record.id} className="grid gap-2 rounded-md border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="font-black">{record.consent_type}</p>
                    <p className="text-sm text-zinc-500">Version {record.consent_version} · {dateLabel(record.granted_at)}</p>
                  </div>
                  <Badge tone={record.granted ? 'green' : 'red'}>{record.granted ? 'Granted' : 'Revoked'}</Badge>
                </div>
              ))}
              {!deferredLoading && consents.length === 0 ? <p className="text-sm text-zinc-500">No consent records yet.</p> : null}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-black">Data export</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-white/70">Exports require verification before processing.</p>
            <Button className="mt-4 w-full" type="button" loading={requestingExport} onClick={submitExportRequest}>Request export</Button>
            <div className="mt-4 grid gap-3">
              {exports.map((request) => (
                <div key={request.id} className="rounded-md bg-zinc-100 p-3 dark:bg-white/10">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black">{request.export_status}</p>
                    <Badge tone={request.export_status === 'completed' ? 'green' : 'yellow'}>{request.export_status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{dateLabel(request.requested_at)}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-black">Account deletion</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-white/70">Deletion requests use a 30-day recovery window before completion.</p>
            <Button className="mt-4 w-full" variant="danger" type="button" loading={requestingDeletion} onClick={submitDeletionRequest}>Request deletion</Button>
            <div className="mt-4 grid gap-3">
              {deletions.map((request) => (
                <div key={request.id} className="rounded-md bg-zinc-100 p-3 dark:bg-white/10">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black">{request.request_status}</p>
                    <Badge tone={request.request_status === 'completed' ? 'green' : 'yellow'}>{request.request_status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">Scheduled {dateLabel(request.scheduled_deletion_at)}</p>
                </div>
              ))}
            </div>
          </Card>
          </div>
        </div>
      )}
    </section>
  )
}
