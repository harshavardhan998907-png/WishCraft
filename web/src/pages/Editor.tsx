import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useEditorStore } from '../store/editorStore'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { ImageUpload } from '../components/ui/ImageUpload'
import { LivePreview } from '../components/editor/LivePreview'
import { DynamicFormRenderer } from '../components/editor/DynamicFormRenderer'
import { useToastStore } from '../store/toastStore'
import { Modal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { motion } from 'framer-motion'
import { AIWishGenerator } from '../modules/ai/components/AIWishGenerator'
import { AITemplateRecommendations } from '../modules/ai/components/AITemplateRecommendations'
import { getTemplateSchema } from '../template-engine'
import { Image as ImageIcon, Music, UserCircle, Palette, Sparkles, Monitor, Smartphone, Trash2, Plus, CheckCircle } from 'lucide-react'
import type { Template } from '../types'
import { uploadOptimizedImage } from '../modules/media/services/mediaService'

const musicTracks = ['Gentle Piano', 'Warm Celebration', 'Soft Romance', 'Festival Lights', 'Bright Future']

// ─── Sub-components extracted outside to avoid recreation on every render ────

// Applies a schema-driven field change to the editor store, keeping the legacy
// named fields (recipientName/customMessage/photoUrls/musicUrl) in sync with the
// generic formData map. Shared by the desktop (ContentEditor) and mobile
// (MobileWizard) editors so both render the exact same creator-defined schema.
function applySchemaChange(store: StoreSnapshot, fieldId: string, value: unknown) {
  store.setFieldValue(fieldId, value)
  if (fieldId === 'recipient_name') store.setRecipientName(String(value ?? ''))
  if (fieldId === 'sender_name') store.setSenderName(String(value ?? ''))
  if (fieldId === 'message') store.setCustomMessage(String(value ?? ''))
  if (fieldId === 'photos' && Array.isArray(value)) {
    store.photoUrls.forEach(store.removePhoto)
    value.filter((item): item is string => typeof item === 'string').forEach(store.addPhoto)
  }
  if (fieldId === 'music') store.setMusicUrl(typeof value === 'string' ? value : null)
}

// Builds the `values` map DynamicFormRenderer expects: legacy named fields merged
// with the generic formData (custom creator fields live in formData).
function schemaValues(store: StoreSnapshot): Record<string, unknown> {
  return {
    recipient_name: store.recipientName,
    sender_name: store.senderName,
    message: store.customMessage,
    photos: store.photoUrls,
    music: store.musicUrl,
    ...store.formData,
  }
}

type StoreSnapshot = {
  recipientName: string
  senderName: string
  customMessage: string
  photoUrls: string[]
  musicUrl: string | null
  formData: Record<string, unknown>
  useCustomMusic: boolean
  template: Template | null
  setFieldValue: (fieldId: string, value: unknown) => void
  setRecipientName: (v: string) => void
  setSenderName: (v: string) => void
  setCustomMessage: (v: string) => void
  addPhoto: (url: string) => void
  removePhoto: (url: string) => void
  setMusicUrl: (url: string | null) => void
  setUseCustomMusic: (v: boolean) => void
}

function ContentEditor({ store }: { store: StoreSnapshot }) {
  const selectedTemplate = store.template
  const [showGuide, setShowGuide] = useState(true)
  const schema = selectedTemplate ? getTemplateSchema(selectedTemplate) : []

  const isDetailsComplete = store.recipientName.trim().length > 0 && store.senderName.trim().length > 0

  return (
    <div className="space-y-8 p-6 glass-panel rounded-2xl h-full overflow-y-auto">
      {/* Onboarding Guide */}
      {showGuide && (
        <div className="bg-gradient-to-r from-brand/10 to-brand/5 border border-brand/20 rounded-xl p-4 relative overflow-hidden">
          <button 
            onClick={() => setShowGuide(false)}
            className="absolute top-2 right-2 text-zinc-400 hover:text-ink dark:hover:text-white text-xs font-bold px-1.5 py-0.5 rounded-md hover:bg-zinc-200/50"
            title="Dismiss guide"
          >
            ✕
          </button>
          <h3 className="font-heading font-bold text-sm text-brand flex items-center gap-1.5 mb-1">
            <Sparkles size={14} className="text-brand animate-pulse" />
            Quick Customizer Guide
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pr-6">
            Customize this wish template in 3 simple parts. As you fill in the fields, your live preview updates immediately. Click the device switcher on the preview to check how it looks on mobile!
          </p>
        </div>
      )}

      {/* Schema-driven fields */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading font-bold flex items-center gap-2">
            <UserCircle className="text-brand" size={24} />
            Template Details
          </h2>
          {isDetailsComplete ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-mint/10 text-mint border border-mint/20">Done</span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">Required</span>
          )}
        </div>
        <DynamicFormRenderer
          schema={schema}
          values={schemaValues(store)}
          templateId={selectedTemplate?.id ?? null}
          allowMusic={selectedTemplate?.tier !== 'free'}
          onChange={(fieldId, value) => applySchemaChange(store, fieldId, value)}
        />
      </div>
      <AIWishGenerator initialOccasion={selectedTemplate?.occasion ?? 'birthday'} onApply={store.setCustomMessage} />
      <AITemplateRecommendations occasion={selectedTemplate?.occasion} />
    </div>
  )
}

function CustomizationStudio({ onPublish }: { onPublish: () => void }) {
  return (
    <div className="space-y-6 p-6 glass-panel rounded-2xl h-full overflow-y-auto bg-white dark:bg-ink">
      <div className="mb-6 pb-6 border-b border-zinc-200 dark:border-white/10">
        <h2 className="text-xl font-heading font-bold mb-4 flex items-center gap-2">
          <Palette className="text-brand" size={24} />
          Theme Style
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center p-3 rounded-lg border-2 border-brand bg-brand/5 text-brand font-medium transition-all">Light</button>
          <button className="flex items-center justify-center p-3 rounded-lg border-2 border-transparent hover:border-zinc-300 dark:hover:border-white/20 bg-zinc-100 dark:bg-white/5 font-medium transition-all text-zinc-600 dark:text-zinc-400">Dark</button>
        </div>
      </div>

      <div className="mb-6 pb-6 border-b border-zinc-200 dark:border-white/10">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-3">Color Palette</h3>
        <div className="flex gap-3">
          {['#ff7460', '#7d72de', '#45c8a5', '#d4af37', '#ffc34d'].map((color, i) => (
            <button
              key={i}
              className={`w-8 h-8 rounded-full shadow-soft hover:scale-110 transition-transform ${i === 1 ? 'ring-2 ring-offset-2 ring-zinc-800 dark:ring-white dark:ring-offset-ink' : ''}`}
              style={{ backgroundColor: color }}
              aria-label={`Color option ${i + 1}: ${color}`}
            />
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="editor-typography-select" className="block text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          Typography
        </label>
        <select 
          id="editor-typography-select"
          className="w-full rounded-md border border-zinc-200 dark:border-white/10 p-3 bg-white dark:bg-white/5 focus-ring font-heading"
        >
          <option>Playfair Display</option>
          <option>Inter (Default)</option>
          <option>Outfit</option>
        </select>
      </div>

      <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-white/10 space-y-3">
        <Button onClick={onPublish} className="w-full py-4 text-lg shadow-premium group">
          <Sparkles size={20} className="mr-2 group-hover:animate-pulse text-sun" />
          Preview & Continue
        </Button>
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          ✨ Free to preview! You will review the full wish design before publishing or sharing.
        </p>
      </div>
    </div>
  )
}

function MobileWizard({
  store,
  onPreview,
}: {
  store: StoreSnapshot
  onPreview: () => void
}) {
  const selectedTemplate = store.template
  // Schema-driven so creator-defined fields (external templates) render on mobile
  // too — the previous hardcoded 3-step form only knew the standard 5 fields.
  const schema = selectedTemplate ? getTemplateSchema(selectedTemplate) : []
  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl overflow-hidden relative">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-ink/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand/10 text-brand rounded-xl"><Sparkles size={20} className="animate-pulse" /></div>
          <div>
            <h2 className="text-lg font-bold font-heading">Wish Studio</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Customize your wish — preview updates live.</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 overflow-y-auto space-y-6">
        <DynamicFormRenderer
          schema={schema}
          values={schemaValues(store)}
          templateId={selectedTemplate?.id ?? null}
          allowMusic={selectedTemplate?.tier !== 'free'}
          onChange={(fieldId, value) => applySchemaChange(store, fieldId, value)}
        />
        <AIWishGenerator initialOccasion={selectedTemplate?.occasion ?? 'birthday'} onApply={store.setCustomMessage} />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-ink/50 backdrop-blur-md">
        <Button onClick={onPreview} className="w-full py-3 shadow-premium">
          Preview <Sparkles size={18} className="ml-2" />
        </Button>
      </div>
    </div>
  )
}

function SceneNavigator({ store }: { store: StoreSnapshot }) {
  const scenes = [
    { name: 'Welcome', status: store.recipientName && store.senderName ? 'completed' : 'empty', desc: 'Greeting card details' },
    { name: 'Memories', status: store.photoUrls.length > 0 ? 'completed' : 'optional', desc: `${store.photoUrls.length}/5 photos added` },
    { name: 'Heartfelt Message', status: store.customMessage ? 'completed' : 'empty', desc: 'Wish letter body' },
    { name: 'Soundtrack', status: store.musicUrl ? 'completed' : 'optional', desc: store.musicUrl || 'No music chosen' },
  ]

  return (
    <div className="absolute bottom-4 left-4 right-4 z-20 bg-white/80 dark:bg-ink/80 backdrop-blur-md border border-zinc-200 dark:border-white/10 p-4 rounded-xl shadow-soft">
      <p className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-1.5">
        <Sparkles size={12} className="text-gold-accent animate-pulse" /> Scene Navigator
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {scenes.map((s) => (
          <div 
            key={s.name}
            className={`flex-1 min-w-[120px] p-2.5 rounded-lg border transition-all text-left ${
              s.status === 'completed' 
                ? 'border-mint/30 bg-mint/5 dark:bg-mint/10' 
                : s.status === 'optional'
                ? 'border-brand/20 bg-brand/5 dark:bg-brand/10'
                : 'border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/5 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink dark:text-white">{s.name}</span>
              <span className={`w-2 h-2 rounded-full ${s.status === 'completed' ? 'bg-mint' : s.status === 'optional' ? 'bg-brand' : 'bg-zinc-300 dark:bg-white/20'}`} />
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 truncate">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Editor ─────────────────────────────────────────────────────────────

export function Editor() {
  const { templateSlug } = useParams()
  const isBirthdayTemplate = templateSlug === 'birthday-letter-in-light'
  const navigate = useNavigate()
  const toast = useToastStore()
  const store = useEditorStore()

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')

  const selectedTemplate = store.template

  useEffect(() => {
    supabase
      .from('templates')
      .select('*')
      .eq('slug', templateSlug)
      .eq('is_active', true)
      .eq('status', 'published')
      .single()
      .then(({ data, error }) => {
        console.info('[Editor] template lookup result', { templateSlug, found: Boolean(data), error })
        if (data) store.setTemplate(data)
        if (error) console.error('[Editor] template lookup failed', error)
      })
  }, [templateSlug])

  const previewData = useMemo(() => ({
    recipientName: store.recipientName,
    senderName: store.senderName,
    customMessage: store.customMessage,
    photoUrls: store.photoUrls,
    musicUrl: store.musicUrl,
    customData: store.formData,
  }), [store.recipientName, store.senderName, store.customMessage, store.photoUrls, store.musicUrl, store.formData])

  if (!selectedTemplate) {
    return (
      <div className="h-[calc(100vh-80px)] max-w-[1600px] mx-auto p-4 lg:p-6 grid lg:grid-cols-[380px_1fr_320px] gap-6">
        <Skeleton className="h-full w-full rounded-2xl" />
        <Skeleton className="h-full w-full rounded-2xl hidden lg:block" />
        <Skeleton className="h-full w-full rounded-2xl hidden lg:block" />
      </div>
    )
  }

  function goPreview() {
    if (!store.recipientName || !store.senderName) {
      toast.push('error', 'Recipient and sender names are required')
      return
    }
    navigate('/preview')
  }

  // Flatten store into a plain snapshot so sub-components receive stable props
  const storeSnapshot: StoreSnapshot = {
    recipientName: store.recipientName,
    senderName: store.senderName,
    customMessage: store.customMessage,
    photoUrls: store.photoUrls,
    musicUrl: store.musicUrl,
    formData: store.formData,
    useCustomMusic: store.useCustomMusic,
    template: selectedTemplate,
    setFieldValue: store.setFieldValue,
    setRecipientName: store.setRecipientName,
    setSenderName: store.setSenderName,
    setCustomMessage: store.setCustomMessage,
    addPhoto: store.addPhoto,
    removePhoto: store.removePhoto,
    setMusicUrl: store.setMusicUrl,
    setUseCustomMusic: store.setUseCustomMusic,
  }

  if (isBirthdayTemplate) {
    return (
      <BirthdayEditorLayout
        store={storeSnapshot}
        goPreview={goPreview}
        previewData={previewData}
      />
    )
  }

  return (
    <section className="h-[calc(100vh-80px)] overflow-hidden bg-soft-cream dark:bg-deep-navy">

      {/* ── Desktop 3-Column Layout (lg+) ── */}
      <div className="h-full max-w-[1600px] mx-auto p-4 lg:p-6 hidden lg:grid lg:grid-cols-[380px_1fr_320px] lg:gap-6">

        {/* Column 1: Content Controls */}
        <ContentEditor store={storeSnapshot} />

        {/* Column 2: Dominant Live Preview */}
        <div className="relative h-full flex flex-col glass-panel rounded-2xl overflow-hidden">
          {/* Top bar */}
          <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/5 to-transparent z-10 flex items-center justify-between px-6 pointer-events-none">
            <span className="font-heading font-black text-lg tracking-widest uppercase opacity-30 text-ink dark:text-white">Live View</span>
            <div className="flex gap-2 pointer-events-auto bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-full p-1">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-2 rounded-full transition-colors ${previewMode === 'desktop' ? 'bg-white shadow-sm dark:bg-ink text-brand' : 'text-zinc-600 dark:text-zinc-400 hover:text-brand'}`}
              >
                <Monitor size={18} />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-2 rounded-full transition-colors ${previewMode === 'mobile' ? 'bg-white shadow-sm dark:bg-ink text-brand' : 'text-zinc-600 dark:text-zinc-400 hover:text-brand'}`}
              >
                <Smartphone size={18} />
              </button>
            </div>
          </div>

          {/* Preview area */}
          <div className="flex-1 overflow-hidden bg-zinc-100/50 dark:bg-ink/50 flex items-center justify-center p-6 pb-36">
            <div className={`transition-all duration-500 ease-in-out h-full w-full rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-ink ${previewMode === 'mobile' ? 'max-w-[400px] aspect-[9/19] h-auto max-h-[850px]' : ''}`}>
              <LivePreview template={store.template} data={previewData} />
            </div>
          </div>
          <SceneNavigator store={storeSnapshot} />
        </div>

        {/* Column 3: Customization */}
        <CustomizationStudio onPublish={goPreview} />
      </div>

      {/* ── Mobile Wizard (< lg) ── */}
      <div className="h-full p-4 lg:hidden">
        <MobileWizard
          store={storeSnapshot}
          onPreview={() => setPreviewOpen(true)}
        />
      </div>

      {/* Mobile Preview Modal */}
      <Modal open={previewOpen} title="Experience Preview" onClose={() => setPreviewOpen(false)}>
        <div className="max-h-[75vh] w-full overflow-hidden rounded-xl bg-white dark:bg-ink relative">
          <LivePreview template={store.template} data={previewData} />
          <div className="absolute bottom-6 inset-x-6">
            <Button onClick={goPreview} className="w-full py-4 shadow-premium shadow-brand/50 text-lg">
              Continue to Share <Sparkles size={20} className="ml-2" />
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM BIRTHDAY LETTER IN LIGHT WIZARD COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

interface BirthdayEditorLayoutProps {
  store: StoreSnapshot
  goPreview: () => void
  previewData: {
    recipientName: string
    senderName: string
    customMessage: string
    photoUrls: string[]
    musicUrl: string | null
  }
}

export function BirthdayEditorLayout({ store, goPreview, previewData }: BirthdayEditorLayoutProps) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const canPublish =
    store.recipientName.trim().length > 0 &&
    store.senderName.trim().length > 0 &&
    String(store.formData.birthday_date || '').trim().length > 0

  // Pre-populates default timeline/constellation/gallery details when entering custom modes
  const handleToggleChange = (fieldId: string, value: boolean) => {
    store.setFieldValue(fieldId, value)
    
    // Auto populate custom arrays with template defaults if they are blank/undefined
    if (!value) {
      if (fieldId === 'useDefaultTimeline' && !store.formData.timeline_events) {
        const defaultTimeline = [
          { year: "2012", title: "We met", description: "A rainy library, two wrong books, one right friendship." },
          { year: "2015", title: "First road trip", description: "Three states, one mixtape, infinite singing." },
          { year: "2018", title: "The big move", description: "New city, same window, still calling at midnight." },
          { year: "2021", title: "Your first show", description: "Front row. I cried twice. Don't tell anyone." },
          { year: "2024", title: "And here we are", description: "Another year of being insufferably proud of you." }
        ]
        store.setFieldValue('timeline_events', defaultTimeline)
      }
      if (fieldId === 'useDefaultConstellation' && !store.formData.constellation_messages) {
        const defaultConstellation = [
          { title: "First coffee", message: "You ordered something impossible. The barista loved you." },
          { title: "Rainy walk", message: "We made up a language. We still use three words from it." },
          { title: "The proposal", message: "You said yes to being my person, in a noisy bar, over pasta." },
          { title: "Sunday calls", message: "Forty‑seven minutes average. The world's longest voicemail." },
          { title: "Your laugh", message: "A small public hazard. A national treasure." },
          { title: "Tonight", message: "A page made of you. Click everything. Stay a while." }
        ]
        store.setFieldValue('constellation_messages', defaultConstellation)
      }
      if (fieldId === 'useDefaultMemories' && (!store.photoUrls || store.photoUrls.length === 0)) {
        store.setFieldValue('memory_captions', [])
      }
    }
  }

  const handleFiles = async (files: FileList) => {
    setUploadError(null)
    setUploading(true)
    const maxFiles = 10
    const remaining = Math.max(0, maxFiles - store.photoUrls.length)
    
    for (const file of Array.from(files).slice(0, remaining)) {
      try {
        setUploadProgress(`Optimizing ${file.name}...`)
        const result = await uploadOptimizedImage(file, {
          templateId: store.template?.id ?? null,
          onProgress: (value) => setUploadProgress(`Optimizing ${file.name}: ${value}%`),
        })
        
        store.addPhoto(result.url)
        
        const currentCaptions = Array.isArray(store.formData.memory_captions) 
          ? [...store.formData.memory_captions] 
          : []
        currentCaptions.push({ caption: '' })
        store.setFieldValue('memory_captions', currentCaptions)
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Image upload failed')
      }
    }
    setUploading(false)
    setUploadProgress(null)
  }

  return (
    <section className="min-h-[calc(100vh-80px)] bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 items-start gap-6 p-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(520px,1.05fr)] lg:p-6">
        
        <div className="bg-white dark:bg-zinc-900 shadow-soft lg:rounded-2xl overflow-hidden relative border border-zinc-200/50 dark:border-white/5">
          
          <div className="p-4 lg:p-6 border-b border-zinc-100 dark:border-white/5 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md sticky top-0 z-20">
            <div className="flex justify-between items-center gap-4">
              <div>
                <h1 className="text-lg lg:text-xl font-heading font-black text-ink dark:text-white flex items-center gap-2">
                  <Sparkles className="text-brand animate-pulse" size={20} />
                  Birthday Light Customizer
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Single-page builder with live preview sync</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/20 hover:bg-brand/20 transition-all"
              >
                <Smartphone size={14} /> Preview
              </button>
            </div>
          </div>

          <div className="p-4 lg:p-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
                  <article
                    className="space-y-6 rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-zinc-900/70 lg:p-5"
                  >
                    <div className="border-b border-zinc-100 dark:border-white/5 pb-2">
                      <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-100">Recipient & Sender Info</h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Enter the essential details for the birthday card greeting.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Recipient's Name (Required)"
                        value={store.recipientName}
                        onChange={(e) => store.setRecipientName(e.target.value)}
                        placeholder="e.g. Amelia"
                        required
                      />
                      <Input
                        label="Birthday Date (Required)"
                        value={String(store.formData.birthday_date || '')}
                        onChange={(e) => store.setFieldValue('birthday_date', e.target.value)}
                        placeholder="e.g. December 4th"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Your Name (Required)"
                        value={store.senderName}
                        onChange={(e) => store.setSenderName(e.target.value)}
                        placeholder="e.g. Daniel"
                        required
                      />
                      <Input
                        label="Nickname (Optional)"
                        value={String(store.formData.nickname || '')}
                        onChange={(e) => store.setFieldValue('nickname', e.target.value)}
                        placeholder="e.g. Mia"
                      />
                    </div>
                  </article>

                  <article
                    className="space-y-6 rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-zinc-900/70 lg:p-5"
                  >
                    <div className="border-b border-zinc-100 dark:border-white/5 pb-2">
                      <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-100">Hero Section Message</h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Poetic one-liner and core message that flashes when they open the page.</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Textarea
                          label="Hero Tagline"
                          value={String(store.formData.tagline ?? '')}
                          onChange={(e) => store.setFieldValue('tagline', e.target.value)}
                          placeholder="A quiet love letter, written in light."
                          maxLength={200}
                        />
                        <span className="text-[10px] text-zinc-400 block -mt-2">Poetic tagline displayed beneath the name.</span>
                      </div>

                      <div>
                        <Textarea
                          label="Main Birthday Message (Required)"
                          value={store.customMessage}
                          onChange={(e) => store.setCustomMessage(e.target.value)}
                          placeholder="Today the world feels a little brighter — because the day it learned your name is the day everything began to glow..."
                          maxLength={300}
                          rows={4}
                        />
                        <span className="text-[10px] text-zinc-400 block -mt-2">The core birthday greeting. Revealed word-by-word.</span>
                      </div>

                      <div className="pt-2">
                        <AIWishGenerator
                          initialOccasion="birthday"
                          onApply={store.setCustomMessage}
                        />
                      </div>
                    </div>
                  </article>

                  <article
                    className="space-y-6 rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-zinc-900/70 lg:p-5"
                  >
                    <div className="border-b border-zinc-100 dark:border-white/5 pb-2">
                      <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-100">Memory Gallery</h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Share your favorite photos. Each photo can have an inline caption.</p>
                    </div>

                    <SegmentedToggle
                      value={store.formData.useDefaultMemories !== false}
                      onChange={(val) => handleToggleChange('useDefaultMemories', val)}
                    />

                    {store.formData.useDefaultMemories !== false ? (
                      <DefaultContentBanner
                        message="Rendering template standard memories (6 beautiful aesthetic placeholders with default captions)."
                      />
                    ) : (
                      <div className="space-y-4">
                        <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 p-4 text-center hover:border-brand/40 transition-colors">
                          <ImageIcon size={28} className="text-zinc-400 dark:text-zinc-500 mb-1.5" />
                          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Upload photos (max 10)</span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Optimized web formats (JPEG, PNG, WebP)</span>
                          <input
                            className="sr-only"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            multiple
                            disabled={uploading}
                            onChange={(e) => e.target.files && handleFiles(e.target.files)}
                          />
                        </label>

                        {uploadProgress && (
                          <div className="bg-brand/10 border border-brand/20 rounded-xl p-3 text-xs text-brand animate-pulse">
                            {uploadProgress}
                          </div>
                        )}

                        {uploadError && (
                          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-500">
                            {uploadError}
                          </div>
                        )}

                        <BirthdayGalleryManager store={store} />
                      </div>
                    )}
                  </article>

                  <article
                    className="space-y-8 rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-zinc-900/70 lg:p-5"
                  >
                    <div
                      className="space-y-4"
                    >
                      <div className="border-b border-zinc-100 dark:border-white/5 pb-2">
                        <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-100">Timeline Milestones</h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Map out the major moments and years in your friendship journey.</p>
                      </div>

                      <SegmentedToggle
                        value={store.formData.useDefaultTimeline !== false}
                        onChange={(val) => handleToggleChange('useDefaultTimeline', val)}
                      />

                      {store.formData.useDefaultTimeline !== false ? (
                        <DefaultContentBanner
                          message="Showing the default aesthetic friendship timeline (5 major historical events with dates & notes)."
                        />
                      ) : (
                        <BirthdayRepeaterTimeline store={store} />
                      )}
                    </div>

                    <div
                      className="space-y-4 pt-4 border-t border-zinc-100 dark:border-white/5"
                    >
                      <div className="pb-2">
                        <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-100">Memory Constellation Star Messages</h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Each event shows up as a shining star in an interactive constellation map.</p>
                      </div>

                      <SegmentedToggle
                        value={store.formData.useDefaultConstellation !== false}
                        onChange={(val) => handleToggleChange('useDefaultConstellation', val)}
                      />

                      {store.formData.useDefaultConstellation !== false ? (
                        <DefaultContentBanner
                          message="Using standard starry constellation containing 6 default celestial coordinate points."
                        />
                      ) : (
                        <BirthdayRepeaterConstellation store={store} />
                      )}
                    </div>
                  </article>

                  <article
                    className="space-y-8 rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-zinc-900/70 lg:p-5"
                  >
                    <div
                      className="space-y-4"
                    >
                      <div className="border-b border-zinc-100 dark:border-white/5 pb-2">
                        <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-100">Poetic Quote</h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">A structured quote displayed as a separate divider layout.</p>
                      </div>

                      <SegmentedToggle
                        value={store.formData.useDefaultQuote !== false}
                        onChange={(val) => handleToggleChange('useDefaultQuote', val)}
                      />

                      {store.formData.useDefaultQuote !== false ? (
                        <DefaultContentBanner
                          message="Displays William Arthur Ward quote: 'Count not the candles… see the lights they give. Count not the years, but the life you live.'"
                        />
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          <Textarea
                            label="Quote Content"
                            value={String(store.formData.quote_text ?? '')}
                            onChange={(e) => store.setFieldValue('quote_text', e.target.value)}
                            placeholder="Type a inspiring or emotional quote..."
                            maxLength={300}
                          />
                          <Input
                            label="Author attribution"
                            value={String(store.formData.quote_author ?? '')}
                            onChange={(e) => store.setFieldValue('quote_author', e.target.value)}
                            placeholder="e.g. William Arthur Ward"
                          />
                        </div>
                      )}
                    </div>

                    <div
                      className="space-y-4 pt-4 border-t border-zinc-100 dark:border-white/5"
                    >
                      <div className="pb-2">
                        <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-100">Personal Love Letter</h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">A long-form personal letter revealed as they scroll down the layout.</p>
                      </div>

                      <SegmentedToggle
                        value={store.formData.useDefaultLetter !== false}
                        onChange={(val) => handleToggleChange('useDefaultLetter', val)}
                      />

                      {store.formData.useDefaultLetter !== false ? (
                        <DefaultContentBanner
                          message="Displays standard heartfelt template letter: 'There is a particular kind of magic in knowing someone...'"
                        />
                      ) : (
                        <div>
                          <Textarea
                            label="Letter Content"
                            value={String(store.formData.letter_content ?? '')}
                            onChange={(e) => store.setFieldValue('letter_content', e.target.value)}
                            placeholder="Dearest..., Write a multi-paragraph personalized message here..."
                            maxLength={2000}
                            rows={8}
                          />
                          <span className="text-[10px] text-zinc-400 block -mt-2">Rich scroll block. Supports line breaks.</span>
                        </div>
                      )}
                    </div>

                    <div
                      className="space-y-4 pt-4 border-t border-zinc-100 dark:border-white/5"
                    >
                      <div className="pb-2">
                        <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-100">Secret Envelope Surprise</h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">An interactive locked envelope requiring a click to open and read.</p>
                      </div>

                      <SegmentedToggle
                        value={store.formData.useDefaultSecret !== false}
                        onChange={(val) => handleToggleChange('useDefaultSecret', val)}
                      />

                      {store.formData.useDefaultSecret !== false ? (
                        <DefaultContentBanner
                          message="Displays default envelope hint: 'Look out your window at 8:47pm tonight. I sent something into the sky...'"
                        />
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          <Input
                            label="Secret Title"
                            value={String(store.formData.secret_title ?? '')}
                            onChange={(e) => store.setFieldValue('secret_title', e.target.value)}
                            placeholder="e.g. There is one more thing..."
                          />
                          <Textarea
                            label="Secret Message Body"
                            value={String(store.formData.secret_message ?? '')}
                            onChange={(e) => store.setFieldValue('secret_message', e.target.value)}
                            placeholder="e.g. Look out your window at 8:47pm tonight..."
                            maxLength={500}
                            rows={3}
                          />
                        </div>
                      )}
                    </div>
                  </article>

                  <article
                    className="space-y-4 rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-zinc-900/70 lg:p-5"
                  >
                    <div className="border-b border-zinc-100 dark:border-white/5 pb-2">
                      <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-100">Music</h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Choose the existing background music value used by the wish state.</p>
                    </div>

                    <label className="block space-y-1.5">
                      <span className="text-sm font-semibold flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                        <Music size={16} /> Background Music
                      </span>
                      <select
                        className="w-full rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 p-3 bg-white dark:bg-zinc-800/30 focus-ring"
                        value={store.useCustomMusic ? '' : store.musicUrl ?? ''}
                        onChange={(e) => { store.setUseCustomMusic(false); store.setMusicUrl(e.target.value || null) }}
                      >
                        <option value="">No music</option>
                        {musicTracks.map((track) => <option key={track} value={track}>{track}</option>)}
                      </select>
                    </label>
                  </article>

                  <article
                    className="space-y-6 rounded-2xl border border-brand/20 bg-brand/5 p-4 shadow-sm dark:border-brand/20 dark:bg-brand/10 lg:p-5"
                  >
                    <div className="border-b border-zinc-100 dark:border-white/5 pb-2">
                      <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-100">Review & Publish</h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Quick status check of your customized birthday card details.</p>
                    </div>

                    <div className="rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/10 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                      <div className="p-3.5 flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Basic Information</span>
                        <div className="flex items-center gap-1.5 text-mint font-semibold text-xs">
                          <CheckCircle size={14} /> Complete
                        </div>
                      </div>

                      <div className="p-3.5 flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Memory Gallery</span>
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          {store.formData.useDefaultMemories !== false 
                            ? 'Default Template Content' 
                            : `Custom (${store.photoUrls.length} photos uploaded)`
                          }
                        </span>
                      </div>

                      <div className="p-3.5 flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Timeline & Star Journey</span>
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          {store.formData.useDefaultTimeline !== false ? 'Default Timeline' : 'Custom Timeline'} / {store.formData.useDefaultConstellation !== false ? 'Default Stars' : 'Custom Stars'}
                        </span>
                      </div>

                      <div className="p-3.5 flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Special Letter & Secret Envelope</span>
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          {store.formData.useDefaultLetter !== false ? 'Default Letter' : 'Custom Letter'} / {store.formData.useDefaultSecret !== false ? 'Default Secret' : 'Custom Secret'}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-gradient-to-br from-brand/10 to-brand/5 border border-brand/20 flex items-start gap-4">
                      <div className="p-3 bg-brand/10 text-brand rounded-xl">
                        <Sparkles size={24} className="animate-spin-slow" />
                      </div>
                      <div>
                        <h3 className="font-heading font-black text-sm text-brand mb-1">
                          You're all set!
                        </h3>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          Your custom birthday wish for <strong className="text-ink dark:text-white">{store.recipientName}</strong> is ready. Please review the live view on the right to make sure everything looks perfect.
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={goPreview}
                      disabled={!canPublish}
                      className="w-full py-3 text-xs lg:text-sm font-bold shadow-premium bg-brand text-white"
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        Publish Wish <Sparkles size={16} />
                      </span>
                    </Button>
                  </article>
            </motion.div>
          </div>
        </div>

        <div className="sticky top-[80px] hidden h-[calc(100vh-112px)] min-h-[560px] lg:flex flex-col bg-zinc-100/50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-200/50 dark:border-white/5 overflow-hidden relative">
          
          <div className="p-4 border-b border-zinc-200/40 dark:border-white/5 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md flex items-center justify-between absolute top-0 inset-x-0 z-10 pointer-events-none">
            <span className="font-heading font-black text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 pl-2">
              Live Preview
            </span>
            <div className="flex gap-1.5 pointer-events-auto bg-white/70 dark:bg-zinc-800/80 backdrop-blur-md rounded-full p-1 border border-zinc-200/50 dark:border-zinc-700/50">
              <button
                type="button"
                onClick={() => setPreviewMode('desktop')}
                className={`p-1.5 rounded-full transition-all ${
                  previewMode === 'desktop'
                    ? 'bg-zinc-100 dark:bg-zinc-700 text-brand shadow-sm'
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-brand'
                }`}
                title="Desktop view"
              >
                <Monitor size={14} />
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('mobile')}
                className={`p-1.5 rounded-full transition-all ${
                  previewMode === 'mobile'
                    ? 'bg-zinc-100 dark:bg-zinc-700 text-brand shadow-sm'
                    : 'text-zinc-400 dark:text-zinc-500 hover:text-brand'
                }`}
                title="Mobile view"
              >
                <Smartphone size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center p-6 pt-16">
            <div className={`transition-all duration-500 ease-in-out h-full w-full rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-zinc-900 ${
              previewMode === 'mobile' ? 'max-w-[375px] aspect-[9/19] h-auto max-h-[780px]' : ''
            }`}>
              <LivePreview template={store.template} data={previewData} />
            </div>
          </div>
        </div>
      </div>

      <Modal open={previewOpen} title="Live Preview" onClose={() => setPreviewOpen(false)}>
        <div className="h-[75vh] w-full overflow-hidden rounded-xl bg-white dark:bg-zinc-900 relative">
          <LivePreview template={store.template} data={previewData} />
          <div className="absolute bottom-4 inset-x-4">
            <Button onClick={() => setPreviewOpen(false)} className="w-full py-3 text-sm">
              Close Preview
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}

function SegmentedToggle({
  value,
  onChange,
  leftLabel = 'Use Template Content',
  rightLabel = 'Customize Content'
}: {
  value: boolean
  onChange: (val: boolean) => void
  leftLabel?: string
  rightLabel?: string
}) {
  return (
    <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50 relative">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all z-10 ${
          value 
            ? 'bg-white dark:bg-zinc-700 text-brand shadow-sm' 
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
        }`}
      >
        {leftLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all z-10 ${
          !value 
            ? 'bg-white dark:bg-zinc-700 text-brand shadow-sm' 
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
        }`}
      >
        {rightLabel}
      </button>
    </div>
  )
}

function DefaultContentBanner({ message }: { message: string }) {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-800/30 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-xs text-zinc-500 dark:text-zinc-400 italic leading-relaxed">
      ℹ️ {message}
    </div>
  )
}

function BirthdayGalleryManager({ store }: { store: StoreSnapshot }) {
  const captions = Array.isArray(store.formData.memory_captions) 
    ? (store.formData.memory_captions as Array<{ caption: string }>)
    : []

  const updateCaption = (idx: number, text: string) => {
    const current = [...captions]
    while (current.length <= idx) {
      current.push({ caption: '' })
    }
    current[idx] = { caption: text }
    store.setFieldValue('memory_captions', current)
  }

  const handleRemove = (url: string, idx: number) => {
    store.removePhoto(url)
    const current = [...captions]
    if (idx < current.length) {
      current.splice(idx, 1)
      store.setFieldValue('memory_captions', current)
    }
  }

  if (store.photoUrls.length === 0) {
    return (
      <div className="text-center py-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/30 dark:bg-zinc-900/10">
        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">No custom photos uploaded yet. Upload images above to build your gallery.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 mt-4">
      {store.photoUrls.map((url, idx) => {
        const cap = captions[idx]?.caption || ''
        return (
          <div 
            key={url + idx}
            className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200/60 dark:border-zinc-800/80 rounded-xl group hover:shadow-soft transition-all"
          >
            <div className="w-14 h-14 rounded-lg overflow-hidden border border-zinc-200/50 dark:border-zinc-700/50 relative flex-shrink-0 bg-zinc-100 dark:bg-zinc-800">
              <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1">
              <input
                type="text"
                value={cap}
                onChange={(e) => updateCaption(idx, e.target.value)}
                placeholder={`Caption for photo #${idx + 1}...`}
                className="w-full bg-transparent outline-none border-b border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 focus:border-brand transition-all text-xs font-medium text-zinc-700 dark:text-zinc-300 py-1"
              />
            </div>

            <button
              type="button"
              onClick={() => handleRemove(url, idx)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Remove photo"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

function BirthdayRepeaterTimeline({ store }: { store: StoreSnapshot }) {
  const events = Array.isArray(store.formData.timeline_events)
    ? (store.formData.timeline_events as Array<{ year: string; title: string; description: string }>)
    : []

  const updateEvent = (idx: number, field: 'year' | 'title' | 'description', value: string) => {
    const current = [...events]
    if (current[idx]) {
      current[idx] = { ...current[idx], [field]: value }
      store.setFieldValue('timeline_events', current)
    }
  }

  const addEvent = () => {
    const current = [...events, { year: '', title: '', description: '' }]
    store.setFieldValue('timeline_events', current)
  }

  const removeEvent = (idx: number) => {
    const current = [...events]
    current.splice(idx, 1)
    store.setFieldValue('timeline_events', current)
  }

  return (
    <div className="space-y-4">
      {events.map((evt, idx) => (
        <div 
          key={idx}
          className="p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-800/10 space-y-3 relative group hover:shadow-soft transition-all"
        >
          <div className="absolute top-3 right-3">
            <button
              type="button"
              onClick={() => removeEvent(idx)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Remove event"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            Timeline Milestone #{idx + 1}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <input
                type="text"
                value={evt.year}
                onChange={(e) => updateEvent(idx, 'year', e.target.value)}
                placeholder="Year (e.g. 2020)"
                className="w-full text-xs font-semibold rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 p-2.5 bg-white dark:bg-zinc-800/30 focus-ring"
              />
            </div>
            <div className="sm:col-span-2">
              <input
                type="text"
                value={evt.title}
                onChange={(e) => updateEvent(idx, 'title', e.target.value)}
                placeholder="Milestone title (e.g. We met)"
                className="w-full text-xs font-semibold rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 p-2.5 bg-white dark:bg-zinc-800/30 focus-ring"
              />
            </div>
          </div>

          <div>
            <textarea
              value={evt.description}
              onChange={(e) => updateEvent(idx, 'description', e.target.value)}
              placeholder="Describe the milestone..."
              maxLength={200}
              rows={2}
              className="w-full text-xs font-semibold rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 p-2.5 bg-white dark:bg-zinc-800/30 focus-ring"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addEvent}
        className="w-full flex items-center justify-center gap-1.5 py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-brand/40 hover:text-brand transition-colors rounded-xl text-xs font-bold text-zinc-500"
      >
        <Plus size={14} /> Add Timeline Event
      </button>
    </div>
  )
}

function BirthdayRepeaterConstellation({ store }: { store: StoreSnapshot }) {
  const stars = Array.isArray(store.formData.constellation_messages)
    ? (store.formData.constellation_messages as Array<{ title: string; message: string }>)
    : []

  const updateStar = (idx: number, field: 'title' | 'message', value: string) => {
    const current = [...stars]
    if (current[idx]) {
      current[idx] = { ...current[idx], [field]: value }
      store.setFieldValue('constellation_messages', current)
    }
  }

  const addStar = () => {
    const current = [...stars, { title: '', message: '' }]
    store.setFieldValue('constellation_messages', current)
  }

  const removeStar = (idx: number) => {
    const current = [...stars]
    current.splice(idx, 1)
    store.setFieldValue('constellation_messages', current)
  }

  return (
    <div className="space-y-4">
      {stars.map((star, idx) => (
        <div 
          key={idx}
          className="p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-800/10 space-y-3 relative group hover:shadow-soft transition-all"
        >
          <div className="absolute top-3 right-3">
            <button
              type="button"
              onClick={() => removeStar(idx)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Remove star"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            Star Node #{idx + 1}
          </div>

          <div>
            <input
              type="text"
              value={star.title}
              onChange={(e) => updateStar(idx, 'title', e.target.value)}
              placeholder="Star name/title (e.g. First coffee)"
              className="w-full text-xs font-semibold rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 p-2.5 bg-white dark:bg-zinc-800/30 focus-ring"
            />
          </div>

          <div>
            <textarea
              value={star.message}
              onChange={(e) => updateStar(idx, 'message', e.target.value)}
              placeholder="Star memory message description..."
              maxLength={200}
              rows={2}
              className="w-full text-xs font-semibold rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 p-2.5 bg-white dark:bg-zinc-800/30 focus-ring"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addStar}
        className="w-full flex items-center justify-center gap-1.5 py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-brand/40 hover:text-brand transition-colors rounded-xl text-xs font-bold text-zinc-500"
      >
        <Plus size={14} /> Add Star Memory
      </button>
    </div>
  )
}
