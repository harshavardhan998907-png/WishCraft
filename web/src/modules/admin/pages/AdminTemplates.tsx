import { useEffect, useState } from 'react'
import { Badge, OccasionBadge, TierBadge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { useAuth } from '../../../hooks/useAuth'
import { useToastStore } from '../../../store/toastStore'
import { fetchAdminTemplates, setTemplateActive } from '../services/adminTemplates'
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-black text-ink dark:text-white">Templates</h2>
          <p className="mt-2 text-zinc-600 dark:text-white/70">Search templates and control public availability.</p>
        </div>
        <div className="w-full md:w-80">
          <Input label="Search templates" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, slug, component" />
        </div>
      </div>

      {error ? <Card className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</Card> : null}
      {loading ? <Card className="text-sm font-semibold text-zinc-500">Loading templates...</Card> : null}

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="grid gap-4 lg:grid-cols-[96px_1fr_auto] lg:items-center">
            <img src={template.thumbnail_url ?? ''} alt="" className="h-24 w-full rounded-md object-cover lg:w-24" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-black text-ink dark:text-white">{template.name}</h3>
                <Badge tone={template.is_active ? 'green' : 'red'}>{template.is_active ? 'active' : 'disabled'}</Badge>
              </div>
              <p className="mt-1 break-all text-sm font-semibold text-zinc-500">{template.slug}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <TierBadge tier={template.tier} />
                <OccasionBadge occasion={template.occasion} />
                <Badge tone="gray">{template.has_music ? 'music' : 'no music'}</Badge>
                <Badge tone="gray">{template.has_animation ? 'animated' : 'static'}</Badge>
              </div>
            </div>
            <Button variant={template.is_active ? 'danger' : 'secondary'} loading={savingId === template.id} onClick={() => toggleTemplate(template)}>
              {template.is_active ? 'Disable' : 'Enable'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
