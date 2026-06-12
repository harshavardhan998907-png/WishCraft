import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { demoTemplates } from '../hooks/useTemplates'
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
import { motion, AnimatePresence } from 'framer-motion'
import { MusicUploadManager } from '../modules/media/components/MusicUploadManager'
import { AIWishGenerator } from '../modules/ai/components/AIWishGenerator'
import { AITemplateRecommendations } from '../modules/ai/components/AITemplateRecommendations'
import { getTemplateSchema } from '../template-engine'
import { Image as ImageIcon, Music, MessageSquare, UserCircle, Palette, Sparkles, Monitor, Smartphone, ChevronRight, ChevronLeft } from 'lucide-react'
import type { Template } from '../types'

const musicTracks = ['Gentle Piano', 'Warm Celebration', 'Soft Romance', 'Festival Lights', 'Bright Future']

const WIZARD_STEPS = [
  { id: 'details', label: 'Details', icon: UserCircle },
  { id: 'message', label: 'Message', icon: MessageSquare },
  { id: 'media', label: 'Media', icon: ImageIcon },
]

// ─── Sub-components extracted outside to avoid recreation on every render ────

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

function ContentEditor({ store, onToast }: { store: StoreSnapshot; onToast: (msg: string) => void }) {
  const selectedTemplate = store.template
  const [showGuide, setShowGuide] = useState(true)
  const schema = selectedTemplate ? getTemplateSchema(selectedTemplate) : []

  const isDetailsComplete = store.recipientName.trim().length > 0 && store.senderName.trim().length > 0
  const isMessageComplete = store.customMessage.trim().length > 0
  const isMediaComplete = store.photoUrls.length > 0 || store.musicUrl !== null
  const handleSchemaChange = (fieldId: string, value: unknown) => {
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
          values={{
            recipient_name: store.recipientName,
            sender_name: store.senderName,
            message: store.customMessage,
            photos: store.photoUrls,
            music: store.musicUrl,
            ...store.formData,
          }}
          templateId={selectedTemplate?.id ?? null}
          allowMusic={selectedTemplate?.tier !== 'free'}
          onChange={handleSchemaChange}
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
  mobileStepIndex,
  onNext,
  onBack,
  onToast,
}: {
  store: StoreSnapshot
  mobileStepIndex: number
  onNext: () => void
  onBack: () => void
  onToast: (msg: string) => void
}) {
  const selectedTemplate = store.template
  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl overflow-hidden relative">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-ink/50 backdrop-blur-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold font-heading">Wish Studio</h2>
          <span className="text-sm font-semibold text-brand">Step {mobileStepIndex + 1} of {WIZARD_STEPS.length}</span>
        </div>
        <div className="flex gap-2">
          {WIZARD_STEPS.map((step, idx) => (
            <div key={step.id} className={`h-1.5 flex-1 rounded-full transition-colors ${idx <= mobileStepIndex ? 'bg-brand' : 'bg-zinc-200 dark:bg-white/10'}`} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={mobileStepIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            {mobileStepIndex === 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-brand/10 text-brand rounded-xl"><UserCircle size={24} /></div>
                  <h3 className="text-xl font-bold">Who is this for?</h3>
                </div>
                <Input label="Recipient name" value={store.recipientName} onChange={(e) => store.setRecipientName(e.target.value)} required />
                <Input label="Sender name (You)" value={store.senderName} onChange={(e) => store.setSenderName(e.target.value)} required />
              </div>
            )}
            {mobileStepIndex === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-brand/10 text-brand rounded-xl"><MessageSquare size={24} /></div>
                  <h3 className="text-xl font-bold">Write a heartfelt message</h3>
                </div>
                <Textarea label="Custom message" maxLength={300} value={store.customMessage} onChange={(e) => store.setCustomMessage(e.target.value)} />
                <AIWishGenerator initialOccasion={selectedTemplate?.occasion ?? 'birthday'} onApply={store.setCustomMessage} />
              </div>
            )}
            {mobileStepIndex === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-brand/10 text-brand rounded-xl"><ImageIcon size={24} /></div>
                  <h3 className="text-xl font-bold">Add memories</h3>
                </div>
                <ImageUpload urls={store.photoUrls} onUploaded={store.addPhoto} onRemove={store.removePhoto} templateId={selectedTemplate?.id ?? null} />
                {selectedTemplate && selectedTemplate.tier !== 'free' && (
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-white/10">
                    <label className="block space-y-1.5">
                      <span className="text-sm font-semibold flex items-center gap-2"><Music size={16} /> Background Music</span>
                      <select
                        className="w-full rounded-md border p-3 bg-white dark:bg-ink focus-ring"
                        value={store.useCustomMusic ? '' : store.musicUrl ?? ''}
                        onChange={(e) => { store.setUseCustomMusic(false); store.setMusicUrl(e.target.value || null) }}
                      >
                        <option value="">No music</option>
                        {musicTracks.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </label>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="p-4 border-t border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-ink/50 backdrop-blur-md flex gap-3">
        {mobileStepIndex > 0 && (
          <Button variant="secondary" onClick={onBack} className="flex-1 py-3">
            <ChevronLeft size={20} className="mr-1" /> Back
          </Button>
        )}
        <Button onClick={onNext} className="flex-[2] py-3 shadow-premium">
          {mobileStepIndex === WIZARD_STEPS.length - 1 ? (
            <>Preview <Sparkles size={18} className="ml-2" /></>
          ) : (
            <>Next <ChevronRight size={20} className="ml-1" /></>
          )}
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
  const navigate = useNavigate()
  const toast = useToastStore()
  const store = useEditorStore()

  const [mobileStepIndex, setMobileStepIndex] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')

  const selectedTemplate = store.template

  useEffect(() => {
    const local = demoTemplates.find((t) => t.slug === templateSlug)
    if (local) store.setTemplate(local)
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
        if (error) console.warn('[Editor] using local fallback template because database lookup failed', error)
      })
  }, [templateSlug])

  const previewData = useMemo(() => ({
    recipientName: store.recipientName,
    senderName: store.senderName,
    customMessage: store.customMessage,
    photoUrls: store.photoUrls,
    musicUrl: store.musicUrl,
  }), [store.recipientName, store.senderName, store.customMessage, store.photoUrls, store.musicUrl])

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

  const handleNext = () => {
    if (mobileStepIndex < WIZARD_STEPS.length - 1) {
      setMobileStepIndex(mobileStepIndex + 1)
    } else {
      setPreviewOpen(true)
    }
  }

  const handleBack = () => {
    if (mobileStepIndex > 0) setMobileStepIndex(mobileStepIndex - 1)
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

  return (
    <section className="h-[calc(100vh-80px)] overflow-hidden bg-soft-cream dark:bg-deep-navy">

      {/* ── Desktop 3-Column Layout (lg+) ── */}
      <div className="h-full max-w-[1600px] mx-auto p-4 lg:p-6 hidden lg:grid lg:grid-cols-[380px_1fr_320px] lg:gap-6">

        {/* Column 1: Content Controls */}
        <ContentEditor store={storeSnapshot} onToast={(msg) => toast.push('success', msg)} />

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
          mobileStepIndex={mobileStepIndex}
          onNext={handleNext}
          onBack={handleBack}
          onToast={(msg) => toast.push('success', msg)}
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
