import { useEffect, useState } from 'react'
import { Badge, OccasionBadge, TierBadge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { ResponsiveCard } from '../../../components/responsive/ResponsiveCard'
import { useAuth } from '../../../hooks/useAuth'
import { useToastStore } from '../../../store/toastStore'
import { fetchAdminTemplates, setTemplateActive } from '../services/adminTemplates'
import { moderateTemplate } from '../../creator/services/templateModeration'
import type { AdminTemplate } from '../types'

export function AdminTemplates() {
  const { user } = useAuth()
  const toast = useToastStore()
  const [templates, setTemplates] = useState<AdminTemplate[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true)
      fetchAdminTemplates(search)
        .then(setTemplates)
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false))
    }, 200)

    return () => window.clearTimeout(timer)
  }, [search])

  async function toggleTemplate(template: AdminTemplate) {
    if (!user) return
    setSavingId(template.id)
    try {
      await setTemplateActive(template.id, !template.is_active, user.id)
      setTemplates((items) => items.map((item) => item.id === template.id ? { ...item, is_active: !template.is_active } : item))
      toast.push('success', template.is_active ? 'Template disabled' : 'Template enabled')
    } catch (err) {
      toast.push('error', err instanceof Error ? err.message : 'Could not update template')
    } finally {
      setSavingId(null)
    }
  }

  async function moderate(template: AdminTemplate, status: 'published' | 'rejected' | 'hidden' | 'archived') {
    if (!user) return
    setSavingId(template.id)
    try {
      await moderateTemplate({
        templateId: template.id,
        status,
        notes: status === 'rejected' ? 'Rejected from admin moderation queue.' : undefined,
        adminUserId: user.id,
      })
      setTemplates((items) => items.map((item) => item.id === template.id ? {
        ...item,
        status,
        is_active: status === 'published',
        moderation_notes: status === 'rejected' ? 'Rejected from admin moderation queue.' : null,
        published_at: status === 'published' ? new Date().toISOString() : null,
      } : item))
      toast.push('success', `Template ${status}`)
    } catch (err) {
      toast.push('error', err instanceof Error ? err.message : 'Could not moderate template')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">Templates</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-white/70 sm:text-base">Search templates and control public availability.</p>
        </div>
        <div className="w-full md:w-80">
          <Input label="Search templates" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, slug, component" />
        </div>
      </div>

      {error ? <Card className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</Card> : null}
      {loading ? <Card className="text-sm font-semibold text-zinc-500">Loading templates...</Card> : null}

      <div className="grid gap-4">
        {templates.map((template) => (
          <ResponsiveCard key={template.id} className="grid gap-4 lg:grid-cols-[96px_1fr_auto] lg:items-center">
            <img src={template.thumbnail_url ?? ''} alt="" className="aspect-video w-full rounded-md object-cover sm:h-28 lg:h-24 lg:w-24" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="min-w-0 break-words text-lg font-black text-ink dark:text-white sm:text-xl">{template.name}</h3>
                <Badge tone={template.is_active ? 'green' : 'red'}>{template.is_active ? 'active' : 'disabled'}</Badge>
                <Badge tone={template.status === 'published' ? 'green' : template.status === 'rejected' || template.status === 'hidden' ? 'red' : 'yellow'}>{template.status ?? 'published'}</Badge>
              </div>
              <p className="mt-1 break-all text-sm font-semibold text-zinc-500">{template.slug}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <TierBadge tier={template.tier} />
                <OccasionBadge occasion={template.occasion} />
                <Badge tone="gray">{template.has_music ? 'music' : 'no music'}</Badge>
                <Badge tone="gray">{template.has_animation ? 'animated' : 'static'}</Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button className="min-h-11 w-full lg:w-auto" variant={template.is_active ? 'danger' : 'secondary'} loading={savingId === template.id} onClick={() => toggleTemplate(template)}>
                {template.is_active ? 'Disable' : 'Enable'}
              </Button>
              <Button className="min-h-11 w-full lg:w-auto" variant="secondary" disabled={savingId === template.id} onClick={() => moderate(template, 'published')}>Approve</Button>
              <Button className="min-h-11 w-full lg:w-auto" variant="ghost" disabled={savingId === template.id} onClick={() => moderate(template, 'hidden')}>Hide</Button>
              <Button className="min-h-11 w-full lg:w-auto" variant="danger" disabled={savingId === template.id} onClick={() => moderate(template, 'rejected')}>Reject</Button>
              <Button className="min-h-11 w-full lg:w-auto" variant="ghost" disabled={savingId === template.id} onClick={() => moderate(template, 'archived')}>Archive</Button>
            </div>
          </ResponsiveCard>
        ))}
        {!loading && templates.length === 0 ? <Card className="text-center font-semibold text-zinc-500">No templates found.</Card> : null}
      </div>
    </div>
  )
}
