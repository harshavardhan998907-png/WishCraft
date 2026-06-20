import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Inbox, Eye, Check, X, Loader2 } from 'lucide-react'
import {
  fetchSubmissions,
  createSubmissionPreviewUrl,
  reviewSubmission,
  type TemplateSubmission,
  type SubmissionStatus,
} from '../services/adminSubmissions'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { Textarea } from '../../../components/ui/Textarea'
import { useToastStore } from '../../../store/toastStore'

type TabKey = Extract<SubmissionStatus, 'pending' | 'approved' | 'rejected'>

const tabs: ReadonlyArray<{ key: TabKey; label: string }> = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-zinc-500 dark:text-white/50">{label}</span>
      <span className="font-semibold text-ink dark:text-white truncate">{value}</span>
    </div>
  )
}

export function AdminSubmissions() {
  const pushToast = useToastStore((state) => state.push)
  const [activeTab, setActiveTab] = useState<TabKey>('pending')
  const [submissions, setSubmissions] = useState<TemplateSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState('')

  const [rejectTarget, setRejectTarget] = useState<TemplateSubmission | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchSubmissions(activeTab)
      setSubmissions(data)
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }, [activeTab, pushToast])

  useEffect(() => {
    loadSubmissions()
  }, [loadSubmissions])

  const handlePreview = async (submission: TemplateSubmission) => {
    const actionId = `preview-${submission.id}`
    try {
      setActionLoading(actionId)
      const url = await createSubmissionPreviewUrl(submission)
      setPreviewUrl(url)
      setPreviewName(submission.config.name)
      setPreviewOpen(true)
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Failed to open preview')
    } finally {
      setActionLoading(null)
    }
  }

  const handleApprove = async (submission: TemplateSubmission) => {
    if (!window.confirm(`Approve "${submission.config.name}"? It will be published to the marketplace.`)) return
    const actionId = `approve-${submission.id}`
    try {
      setActionLoading(actionId)
      await reviewSubmission(submission.id, 'approve')
      pushToast('success', 'Template approved and published')
      await loadSubmissions()
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Failed to approve submission')
    } finally {
      setActionLoading(null)
    }
  }

  const confirmReject = async () => {
    if (!rejectTarget) return
    const actionId = `reject-${rejectTarget.id}`
    try {
      setActionLoading(actionId)
      await reviewSubmission(rejectTarget.id, 'reject', rejectNote.trim() || undefined)
      pushToast('success', 'Submission rejected')
      setRejectTarget(null)
      setRejectNote('')
      await loadSubmissions()
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Failed to reject submission')
    } finally {
      setActionLoading(null)
    }
  }

  const closePreview = () => {
    // Free the Blob URL created in createSubmissionPreviewUrl.
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewOpen(false)
    setPreviewUrl(null)
    setPreviewName('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">Template Submissions</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-white/70">
          Review creator-submitted templates before they go live.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`focus-ring rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-brand text-white'
                : 'bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-ink dark:text-zinc-400 dark:hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-56 animate-pulse bg-white/5 border border-white/10 rounded-2xl" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mt-6">
          <Card className="rounded-3xl border border-black/10 bg-white/80 p-12 text-center shadow-premium backdrop-blur-xl dark:border-white/10 dark:bg-ink/80">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-white/5 text-zinc-400 dark:text-zinc-500 flex items-center justify-center mx-auto mb-6">
              <Inbox size={28} />
            </div>
            <h3 className="text-xl font-black text-ink dark:text-white mb-2">No {activeTab} submissions</h3>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto text-sm font-medium">
              There are no {activeTab} template submissions right now.
            </p>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {submissions.map((submission) => {
            const { config } = submission
            return (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col rounded-2xl border border-black/5 bg-white shadow-soft overflow-hidden dark:border-white/5 dark:bg-ink"
              >
                <div className="flex-1 p-5 space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-ink dark:text-white truncate">{config.name}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate">{config.slug}</p>
                  </div>

                  <div className="space-y-2 border-t border-zinc-100 pt-3 dark:border-white/5">
                    <MetaRow label="Category" value={config.category} />
                    <MetaRow label="Price" value={String(config.price)} />
                    <MetaRow label="Creator" value={submission.creator_id} />
                    {activeTab === 'pending' && <MetaRow label="Submitted" value={formatDate(submission.submitted_at)} />}
                    {activeTab === 'approved' && <MetaRow label="Approved" value={formatDate(submission.reviewed_at)} />}
                  </div>

                  {activeTab === 'rejected' && (
                    <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/20 dark:text-rose-300">
                      <p className="font-semibold mb-0.5">Rejection note</p>
                      <p className="text-xs leading-relaxed">{submission.rejection_note || 'No note provided.'}</p>
                    </div>
                  )}

                  {activeTab === 'pending' && (
                    <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-3 dark:border-white/5">
                      <Button
                        onClick={() => handlePreview(submission)}
                        variant="ghost"
                        size="sm"
                        className="rounded-full flex items-center gap-1"
                        disabled={actionLoading === `preview-${submission.id}`}
                      >
                        {actionLoading === `preview-${submission.id}` ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Eye size={12} />
                        )}
                        Preview
                      </Button>
                      <Button
                        onClick={() => handleApprove(submission)}
                        size="sm"
                        className="rounded-full flex items-center gap-1"
                        loading={actionLoading === `approve-${submission.id}`}
                      >
                        <Check size={12} />
                        Approve
                      </Button>
                      <Button
                        onClick={() => setRejectTarget(submission)}
                        variant="danger"
                        size="sm"
                        className="rounded-full flex items-center gap-1"
                        disabled={actionLoading === `reject-${submission.id}`}
                      >
                        <X size={12} />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Preview modal — sandboxed iframe loading the bundle directly */}
      <Modal open={previewOpen} title={`Preview — ${previewName}`} onClose={closePreview}>
        <div className="h-[60vh] w-full overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10">
          {previewUrl ? (
            <iframe
              src={previewUrl}
              title={`Template preview: ${previewName}`}
              sandbox="allow-scripts"
              className="h-full w-full border-0"
            />
          ) : null}
        </div>
      </Modal>

      {/* Reject modal — requires confirmation with an optional note */}
      <Modal open={rejectTarget !== null} title="Reject submission" onClose={() => setRejectTarget(null)}>
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-white/70">
            Rejecting <span className="font-semibold text-ink dark:text-white">{rejectTarget?.config.name}</span>. The
            creator will see the note below.
          </p>
          <Textarea
            label="Rejection note"
            placeholder="Explain what needs to change..."
            value={rejectNote}
            maxLength={500}
            onChange={(event) => setRejectNote(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setRejectTarget(null)} className="rounded-full">
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmReject}
              className="rounded-full"
              loading={rejectTarget ? actionLoading === `reject-${rejectTarget.id}` : false}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
