import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fetchAdminTemplates, setTemplateActive, createTemplateMetadataFromPlugin, updateTemplateStatus, deleteTemplate } from '../services/adminTemplates'
import type { AdminTemplate } from '../types'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { useToastStore } from '../../../store/toastStore'
import { useAuth } from '../../../hooks/useAuth'
import { Sparkles, Eye, EyeOff, Trash2, Plus, Check, Loader2 } from 'lucide-react'

export function AdminTemplates() {
  const { user } = useAuth()
  const toast = useToastStore()
  const [templates, setTemplates] = useState<AdminTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const data = await fetchAdminTemplates(search)
      setTemplates(data)
    } catch (err) {
      toast.push('error', err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [search])

  const handleToggleActive = async (template: AdminTemplate) => {
    if (!template.id) return
    const targetState = !template.is_active
    const actionId = `active-${template.id}`
    try {
      setActionLoading(actionId)
      await setTemplateActive(template.id, targetState, user?.id || '')
      toast.push('success', `Template ${targetState ? 'enabled' : 'disabled'} successfully`)
      await loadTemplates()
    } catch (err) {
      toast.push('error', err instanceof Error ? err.message : 'Failed to update template status')
    } finally {
      setActionLoading(null)
    }
  }

  const handlePublishStatus = async (template: AdminTemplate, status: 'published' | 'draft' | 'hidden') => {
    if (!template.id) return
    const actionId = `status-${template.id}-${status}`
    try {
      setActionLoading(actionId)
      await updateTemplateStatus(template.id, status, user?.id || '')
      toast.push('success', `Status updated to ${status}`)
      await loadTemplates()
    } catch (err) {
      toast.push('error', err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleImport = async (template: AdminTemplate) => {
    const actionId = `import-${template.slug}`
    try {
      setActionLoading(actionId)
      await createTemplateMetadataFromPlugin(template, user?.id || '')
      toast.push('success', 'Template imported into database successfully!')
      await loadTemplates()
    } catch (err) {
      toast.push('error', err instanceof Error ? err.message : 'Failed to import template')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template from the database? This won\'t delete the local code.')) return
    const actionId = `delete-${templateId}`
    try {
      setActionLoading(actionId)
      await deleteTemplate(templateId, user?.id || '')
      toast.push('success', 'Template metadata deleted from database')
      await loadTemplates()
    } catch (err) {
      toast.push('error', err instanceof Error ? err.message : 'Failed to delete template')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">Template Registry</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-white/70">
            Registered templates: {templates.length} ({templates.filter((t) => t.is_active).length} active)
          </p>
        </div>
        <div>
          <input
            type="search"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-full border border-black/10 px-4 py-2 bg-white dark:border-white/10 dark:bg-ink focus-ring"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-64 animate-pulse bg-white/5 border border-white/10 rounded-2xl" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6"
        >
          <Card className="rounded-3xl border border-black/10 bg-white/80 p-12 text-center shadow-premium backdrop-blur-xl dark:border-white/10 dark:bg-ink/80">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-white/5 text-zinc-400 dark:text-zinc-500 flex items-center justify-center mx-auto mb-6">
              <Sparkles size={28} />
            </div>
            <h3 className="text-xl font-black text-ink dark:text-white mb-2">No Templates Found</h3>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto text-sm font-medium">
              We couldn't find any templates matching your search criteria.
            </p>
          </Card>
        </motion.div>
      ) : (
        /* Template List */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            const isLocalOnly = !template.id
            const isActive = template.is_active

            return (
              <motion.div
                key={template.slug}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative flex flex-col rounded-2xl border border-black/5 bg-white shadow-soft overflow-hidden dark:border-white/5 dark:bg-ink"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[16/9] bg-zinc-100 dark:bg-white/5 overflow-hidden">
                  <img
                    src={template.thumbnail_url || undefined}
                    alt={template.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-ink/75 backdrop-blur-md text-white border border-white/10">
                      {template.occasion}
                    </span>
                    {isLocalOnly ? (
                      <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-brand/20 text-brand border border-brand/30">
                        Local Plugin
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full backdrop-blur-md border ${
                        template.status === 'published'
                          ? 'bg-mint/20 text-mint border-mint/30'
                          : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                      }`}>
                        {template.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-ink dark:text-white truncate">
                      {template.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                      {template.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-white/5 flex flex-wrap gap-2 items-center justify-between">
                    {isLocalOnly ? (
                      <Button
                        onClick={() => handleImport(template)}
                        size="sm"
                        className="rounded-full flex items-center gap-1"
                        disabled={actionLoading === `import-${template.slug}`}
                      >
                        {actionLoading === `import-${template.slug}` ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Plus size={12} />
                        )}
                        Import to DB
                      </Button>
                    ) : (
                      <div className="flex gap-2 w-full justify-between items-center">
                        <div className="flex gap-1.5">
                          {/* Toggle Active status */}
                          <Button
                            onClick={() => handleToggleActive(template)}
                            variant={isActive ? 'secondary' : 'ghost'}
                            size="sm"
                            className="rounded-full p-2 h-7 w-7"
                            title={isActive ? 'Disable template' : 'Enable template'}
                            disabled={actionLoading === `active-${template.id}`}
                          >
                            {actionLoading === `active-${template.id}` ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : isActive ? (
                              <EyeOff size={12} />
                            ) : (
                              <Eye size={12} />
                            )}
                          </Button>

                          {/* Publish/Draft toggle */}
                          {template.status !== 'published' ? (
                            <Button
                              onClick={() => handlePublishStatus(template, 'published')}
                              variant="secondary"
                              size="sm"
                              className="rounded-full text-[10px] font-black px-2.5 h-7"
                              disabled={actionLoading === `status-${template.id}-published`}
                            >
                              Publish
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handlePublishStatus(template, 'draft')}
                              variant="ghost"
                              size="sm"
                              className="rounded-full text-[10px] font-black px-2.5 h-7"
                              disabled={actionLoading === `status-${template.id}-draft`}
                            >
                              Revoke
                            </Button>
                          )}
                        </div>

                        {/* Delete Button */}
                        <Button
                          onClick={() => handleDelete(template.id!)}
                          variant="ghost"
                          size="sm"
                          className="rounded-full p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 h-7 w-7"
                          disabled={actionLoading === `delete-${template.id}`}
                          title="Delete metadata"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
