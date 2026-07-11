import { FormEvent, useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Badge, OccasionBadge, TierBadge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { useAuth } from '../../../hooks/useAuth'
import { useToastStore } from '../../../store/toastStore'
import { Skeleton } from '../../../components/ui/Skeleton'
import type { OccasionType, TemplateTier } from '../../../types'
import { ensureCreatorProfile } from '../services/creatorProfile'
import { archiveCreatorTemplate, createTemplateDraft, fetchCreatorTemplates, submitTemplateForReview, updateTemplateMetadata, uploadTemplateThumbnail } from '../services/creatorTemplates'
import { marketplaceSchemaMessage } from '../services/marketplaceSchema'
import type { CreatorProfile, CreatorTemplate, CreatorTemplateInput } from '../types'
import { CreatorAIAssistant } from '../../ai/components/CreatorAIAssistant'
import { getRegisteredTemplateNames } from '../../../components/templates/registry'
import { Sparkles } from 'lucide-react'

const occasions: OccasionType[] = ['birthday', 'wedding', 'anniversary', 'festival', 'graduation', 'baby_shower', 'farewell', 'valentine', 'other']
const tiers: TemplateTier[] = ['free', 'standard', 'premium']
const registryNames = getRegisteredTemplateNames()

const emptyDraft: CreatorTemplateInput = {
  name: '',
  slug: '',
  occasion: 'birthday',
  tier: 'free',
  price_paise: 0,
  thumbnail_url: '',
  has_animation: true,
  has_music: false,
  component_name: 'birthday-classic',
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function statusTone(status: CreatorTemplate['status']) {
  if (status === 'published') return 'green'
  if (status === 'rejected' || status === 'hidden') return 'red'
  if (status === 'archived') return 'gray'
  return 'yellow'
}

export function CreatorTemplates() {
  const { user, profile } = useAuth()
  const toast = useToastStore()
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null)
  const [templates, setTemplates] = useState<CreatorTemplate[]>([])
  const [draft, setDraft] = useState<CreatorTemplateInput>(emptyDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    ensureCreatorProfile({
      userId: user.id,
      displayName: profile?.full_name || profile?.email || user.email || 'Creator',
      avatarUrl: profile?.avatar_url,
    })
      .then(async (nextProfile) => {
        if (!nextProfile) {
          setCreatorProfile(null)
          setTemplates([])
          return
        }
        setCreatorProfile(nextProfile)
        setTemplates(await fetchCreatorTemplates(nextProfile.id))
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [profile, user])

  const counts = useMemo(() => ({
    draft: templates.filter((template) => template.status === 'draft').length,
    review: templates.filter((template) => template.status === 'review').length,
    published: templates.filter((template) => template.status === 'published').length,
    archived: templates.filter((template) => template.status === 'archived').length,
  }), [templates])

  async function reloadTemplates(nextProfile = creatorProfile) {
    if (!nextProfile) return
    setTemplates(await fetchCreatorTemplates(nextProfile.id))
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!creatorProfile) return
    setSaving(true)
    try {
      if (editingId) {
        await updateTemplateMetadata(editingId, draft)
        toast.push('success', 'Template metadata updated')
      } else {
        await createTemplateDraft(creatorProfile.id, draft)
        toast.push('success', 'Template draft created')
      }
      setDraft(emptyDraft)
      setEditingId(null)
      await reloadTemplates()
    } catch (err) {
      toast.push('error', err instanceof Error ? err.message : 'Could not save template')
    } finally {
      setSaving(false)
    }
  }

  async function handleThumbnail(file: File) {
    if (!creatorProfile) return
    setSaving(true)
    try {
      const url = await uploadTemplateThumbnail(file, creatorProfile.id)
      setDraft((current) => ({ ...current, thumbnail_url: url }))
      toast.push('success', 'Thumbnail uploaded')
    } catch (err) {
      toast.push('error', err instanceof Error ? err.message : 'Could not upload thumbnail')
    } finally {
      setSaving(false)
    }
  }

  function editTemplate(template: CreatorTemplate) {
    setEditingId(template.id)
    setDraft({
      name: template.name,
      slug: template.slug,
      occasion: template.occasion,
      tier: template.tier,
      price_paise: template.price_paise,
      thumbnail_url: template.thumbnail_url,
      has_animation: template.has_animation,
      has_music: template.has_music,
      component_name: template.component_name,
    })
  }

  async function runTemplateAction(action: 'review' | 'archive', template: CreatorTemplate) {
    try {
      if (action === 'review') {
        await submitTemplateForReview(template.id)
        toast.push('success', 'Template submitted for review')
      } else {
        await archiveCreatorTemplate(template.id)
        toast.push('success', 'Template archived')
      }
      await reloadTemplates()
    } catch (err) {
      toast.push('error', err instanceof Error ? err.message : 'Template action failed')
    }
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><Skeleton className="h-10 w-48" /><Skeleton className="h-10 w-32" /></div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    </div>
  )
  if (error) return <Card className="border-rose-200 bg-rose-50 text-rose-700">{error}</Card>
  if (!creatorProfile) {
    return (
      <Card>
        <h2 className="text-2xl font-black text-ink dark:text-white">Creator templates</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-white/70">{marketplaceSchemaMessage()}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end mb-6">
        <PageHeader 
          title="Templates" 
          subtitle="Create drafts, edit metadata, upload thumbnails, submit for review, and archive creator templates."
          backTo="/creator"
        />
        <div className="grid grid-cols-4 gap-2 text-center text-sm">
          <Card className="p-3"><p className="font-black">{counts.draft}</p><p className="text-zinc-500">Draft</p></Card>
          <Card className="p-3"><p className="font-black">{counts.review}</p><p className="text-zinc-500">Review</p></Card>
          <Card className="p-3"><p className="font-black">{counts.published}</p><p className="text-zinc-500">Live</p></Card>
          <Card className="p-3"><p className="font-black">{counts.archived}</p><p className="text-zinc-500">Archived</p></Card>
        </div>
      </div>

      <Card>
        <form className="grid gap-4 lg:grid-cols-2" onSubmit={saveDraft}>
          <Input label="Template name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value, slug: current.slug || slugify(event.target.value) }))} required />
          <Input label="Slug" value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: slugify(event.target.value) }))} required />
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink dark:text-white/90">Occasion</span>
            <select className="focus-ring h-11 w-full rounded-md border border-black/15 bg-white px-3 dark:border-white/10 dark:bg-white/10 dark:text-white" value={draft.occasion} onChange={(event) => setDraft((current) => ({ ...current, occasion: event.target.value as OccasionType }))}>
              {occasions.map((occasion) => <option key={occasion} value={occasion}>{occasion.replace('_', ' ')}</option>)}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink dark:text-white/90">Tier</span>
            <select className="focus-ring h-11 w-full rounded-md border border-black/15 bg-white px-3 dark:border-white/10 dark:bg-white/10 dark:text-white" value={draft.tier} onChange={(event) => setDraft((current) => ({ ...current, tier: event.target.value as TemplateTier }))}>
              {tiers.map((tier) => <option key={tier} value={tier}>{tier}</option>)}
            </select>
          </label>
          <Input label="Price paise" type="number" min={0} value={draft.price_paise} onChange={(event) => setDraft((current) => ({ ...current, price_paise: Number(event.target.value) }))} />
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink dark:text-white/90">Registry component name</span>
            <select className="focus-ring h-11 w-full rounded-md border border-black/15 bg-white px-3 dark:border-white/10 dark:bg-white/10 dark:text-white" value={draft.component_name} onChange={(event) => setDraft((current) => ({ ...current, component_name: event.target.value }))}>
              {registryNames.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <Input label="Thumbnail URL" value={draft.thumbnail_url ?? ''} onChange={(event) => setDraft((current) => ({ ...current, thumbnail_url: event.target.value }))} />
          <label className="flex min-h-11 items-center rounded-md border border-dashed border-black/15 px-3 text-sm font-semibold dark:border-white/10">
            Upload thumbnail
            <input className="sr-only" type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && handleThumbnail(event.target.files[0])} />
          </label>
          <label className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 font-semibold dark:bg-white/5">Animation <input type="checkbox" checked={draft.has_animation} onChange={(event) => setDraft((current) => ({ ...current, has_animation: event.target.checked }))} /></label>
          <label className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 font-semibold dark:bg-white/5">Music <input type="checkbox" checked={draft.has_music} onChange={(event) => setDraft((current) => ({ ...current, has_music: event.target.checked }))} /></label>
          <div className="flex gap-3 lg:col-span-2">
            <Button type="submit" loading={saving}>{editingId ? 'Save metadata' : 'Create draft'}</Button>
            {editingId ? <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setDraft(emptyDraft) }}>Cancel</Button> : null}
          </div>
        </form>
      </Card>

      <CreatorAIAssistant
        input={{ templateName: draft.name, occasion: draft.occasion, tier: draft.tier, description: draft.slug }}
        onApplyDescription={(value) => setDraft((current) => ({ ...current, name: current.name || value.split('.')[0] || current.name }))}
      />

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="grid gap-4 lg:grid-cols-[96px_1fr_auto] lg:items-center">
            <img src={template.thumbnail_url ?? ''} alt="" className="aspect-video w-full rounded-md bg-zinc-100 object-cover sm:h-28 lg:h-24 lg:w-24 dark:bg-white/10" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="min-w-0 break-words text-lg font-black text-ink dark:text-white">{template.name}</h3>
                <Badge tone={statusTone(template.status)}>{template.status}</Badge>
                <TierBadge tier={template.tier} />
                <OccasionBadge occasion={template.occasion} />
              </div>
              <p className="mt-1 break-all text-sm font-semibold text-zinc-500">{template.slug}</p>
              {template.moderation_notes ? <p className="mt-2 text-sm text-rose-600 dark:text-rose-200">{template.moderation_notes}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button type="button" variant="ghost" onClick={() => editTemplate(template)}>Edit</Button>
              <Button type="button" variant="secondary" disabled={!['draft', 'rejected'].includes(template.status)} onClick={() => runTemplateAction('review', template)}>Submit</Button>
              <Button type="button" variant="danger" disabled={template.status === 'archived'} onClick={() => runTemplateAction('archive', template)}>Archive</Button>
            </div>
          </Card>
        ))}
        {templates.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-zinc-200 dark:border-white/10 p-12 text-center bg-white/50 dark:bg-ink/50">
            <div className="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-4">
              <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-black text-ink dark:text-white mb-1">No templates registered</h3>
            <p className="text-zinc-500 max-w-sm mx-auto text-sm">
              You haven't uploaded or drafted any templates yet. Fill out the form above to create your first design!
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
