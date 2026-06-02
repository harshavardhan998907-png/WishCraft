import { useEffect, useState } from 'react'
import { Badge, OccasionBadge, TierBadge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { ResponsiveCard } from '../../../components/responsive/ResponsiveCard'
import { useAuth } from '../../../hooks/useAuth'
import { useToastStore } from '../../../store/toastStore'
import { createTemplateMetadataFromPlugin, deleteTemplate, fetchAdminTemplates, setTemplateActive, updateTemplateMetadata, updateTemplateStatus } from '../services/adminTemplates'
import type { AdminTemplate } from '../types'
import { TemplateRenderer, wishDataToTemplateProps } from '../../../template-engine'
import { formatPrice } from '../../../lib/utils'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const previewWishData = {
  recipientName: 'Aarav',
  senderName: 'TemplateHub',
  customMessage: 'A beautifully crafted wish preview from the founder template plugin system.',
  photoUrls: [],
  musicUrl: null,
}

export function AdminTemplates() {
  const { user } = useAuth()
  const toast = useToastStore()
  const [templates, setTemplates] = useState<AdminTemplate[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<AdminTemplate | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<AdminTemplate | null>(null)

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

  async function changeStatus(template: AdminTemplate, status: NonNullable<AdminTemplate['status']>) {
    if (!user) return
    setSavingId(template.id)
    try {
      await updateTemplateStatus(template.id, status, user.id)
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

  async function createMetadata(template: AdminTemplate) {
    if (!user) return
    setSavingId(template.id)
    try {
      const created = await createTemplateMetadataFromPlugin(template, user.id)
      setTemplates((items) => items.map((item) => item.id === template.id ? created : item))
      toast.push('success', 'Template metadata created')
    } catch (err) {
      toast.push('error', err instanceof Error ? err.message : 'Could not create template metadata')
    } finally {
      setSavingId(null)
    }
  }

  async function saveMetadata() {
    if (!user || !editingTemplate) return
    setSavingId(editingTemplate.id)
    try {
      await updateTemplateMetadata(editingTemplate.id, {
        name: editingTemplate.name,
        description: editingTemplate.description,
        price_paise: editingTemplate.price_paise,
        thumbnail_url: editingTemplate.thumbnail_url,
        preview_video_url: editingTemplate.preview_video_url,
      }, user.id)
      setTemplates((items) => items.map((item) => item.id === editingTemplate.id ? editingTemplate : item))
      setEditingTemplate(null)
      toast.push('success', 'Template metadata updated')
    } catch (err) {
      toast.push('error', err instanceof Error ? err.message : 'Could not update metadata')
    } finally {
      setSavingId(null)
    }
  }

  async function removeTemplate(template: AdminTemplate) {
    if (!user || !window.confirm(`Delete metadata for ${template.name}? Existing wishes should keep their template rows, so use this only for unused drafts.`)) return
    setSavingId(template.id)
    try {
      await deleteTemplate(template.id, user.id)
      setTemplates((items) => items.filter((item) => item.id !== template.id))
      toast.push('success', 'Template deleted')
    } catch (err) {
      toast.push('error', err instanceof Error ? err.message : 'Could not delete template')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">Templates</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-white/70 sm:text-base">Manage founder-controlled template plugins, metadata, previews, and publishing.</p>
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
                {!uuidPattern.test(template.id) ? <Badge tone="blue">local plugin</Badge> : null}
              </div>
              <p className="mt-1 break-all text-sm font-semibold text-zinc-500">{template.slug}</p>
              {template.description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-white/65">{template.description}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <TierBadge tier={template.tier} />
                <OccasionBadge occasion={template.occasion} />
                <Badge tone="gray">{template.has_music ? 'music' : 'no music'}</Badge>
                <Badge tone="gray">{template.has_animation ? 'animated' : 'static'}</Badge>
                <Badge tone="gray">{formatPrice(template.price_paise)}</Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button className="min-h-11 w-full lg:w-auto" variant="ghost" disabled={savingId === template.id} onClick={() => setPreviewTemplate(template)}>Preview</Button>
              {!uuidPattern.test(template.id) ? (
                <Button className="min-h-11 w-full lg:w-auto" variant="secondary" loading={savingId === template.id} onClick={() => createMetadata(template)}>Create DB metadata</Button>
              ) : (
                <>
                  <Button className="min-h-11 w-full lg:w-auto" variant={template.is_active ? 'danger' : 'secondary'} loading={savingId === template.id} onClick={() => toggleTemplate(template)}>
                    {template.is_active ? 'Disable' : 'Enable'}
                  </Button>
                  <Button className="min-h-11 w-full lg:w-auto" variant="secondary" disabled={savingId === template.id} onClick={() => changeStatus(template, 'published')}>Publish</Button>
                  <Button className="min-h-11 w-full lg:w-auto" variant="ghost" disabled={savingId === template.id} onClick={() => setEditingTemplate(template)}>Edit</Button>
                  <Button className="min-h-11 w-full lg:w-auto" variant="ghost" disabled={savingId === template.id} onClick={() => changeStatus(template, 'hidden')}>Unpublish</Button>
                  <Button className="min-h-11 w-full lg:w-auto" variant="danger" disabled={savingId === template.id} onClick={() => removeTemplate(template)}>Delete</Button>
                </>
              )}
            </div>
          </ResponsiveCard>
        ))}
        {!loading && templates.length === 0 ? <Card className="text-center font-semibold text-zinc-500">No templates found.</Card> : null}
      </div>

      <Modal open={Boolean(previewTemplate)} title={previewTemplate?.name ?? 'Template preview'} onClose={() => setPreviewTemplate(null)}>
        {previewTemplate ? (
          <div className="max-h-[75vh] overflow-auto rounded-lg border border-black/10 dark:border-white/10">
            <TemplateRenderer
              slug={previewTemplate.slug}
              componentKey={previewTemplate.component_key ?? previewTemplate.component_name}
              props={wishDataToTemplateProps(previewWishData, true)}
            />
          </div>
        ) : null}
      </Modal>

      <Modal open={Boolean(editingTemplate)} title="Edit template metadata" onClose={() => setEditingTemplate(null)}>
        {editingTemplate ? (
          <div className="space-y-4">
            <Input label="Name" value={editingTemplate.name} onChange={(event) => setEditingTemplate({ ...editingTemplate, name: event.target.value })} />
            <Input label="Description" value={editingTemplate.description ?? ''} onChange={(event) => setEditingTemplate({ ...editingTemplate, description: event.target.value })} />
            <Input label="Price in paise" type="number" min={0} value={editingTemplate.price_paise} onChange={(event) => setEditingTemplate({ ...editingTemplate, price_paise: Number(event.target.value) })} />
            <Input label="Thumbnail URL" value={editingTemplate.thumbnail_url ?? ''} onChange={(event) => setEditingTemplate({ ...editingTemplate, thumbnail_url: event.target.value })} />
            <Input label="Preview video URL" value={editingTemplate.preview_video_url ?? ''} onChange={(event) => setEditingTemplate({ ...editingTemplate, preview_video_url: event.target.value })} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditingTemplate(null)}>Cancel</Button>
              <Button loading={savingId === editingTemplate.id} onClick={saveMetadata}>Save</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
