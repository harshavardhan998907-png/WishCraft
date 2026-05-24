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
import { useToastStore } from '../store/toastStore'
import { Modal } from '../components/ui/Modal'
import { motion } from 'framer-motion'
import { ShimmerSweep } from '../components/ui/MotionDecor'
import { MusicUploadManager } from '../modules/media/components/MusicUploadManager'
import { AIWishGenerator } from '../modules/ai/components/AIWishGenerator'
import { AITemplateRecommendations } from '../modules/ai/components/AITemplateRecommendations'

const musicTracks = ['Gentle Piano', 'Warm Celebration', 'Soft Romance', 'Festival Lights', 'Bright Future']

export function Editor() {
  const { templateSlug } = useParams()
  const navigate = useNavigate()
  const toast = useToastStore()
  const store = useEditorStore()
  const [previewOpen, setPreviewOpen] = useState(false)
  const selectedTemplate = store.template

  useEffect(() => {
    const local = demoTemplates.find((template) => template.slug === templateSlug)
    if (local) store.setTemplate(local)
    supabase.from('templates').select('*').eq('slug', templateSlug).eq('is_active', true).eq('status', 'published').single().then(({ data, error }) => {
      console.info('[Editor] template lookup result', { templateSlug, found: Boolean(data), error })
      if (data) store.setTemplate(data)
      if (error) {
        console.warn('[Editor] using local fallback template because database lookup failed', error)
      }
    })
  }, [templateSlug])

  const previewData = useMemo(() => ({
    recipientName: store.recipientName,
    senderName: store.senderName,
    customMessage: store.customMessage,
    photoUrls: store.photoUrls,
    musicUrl: store.musicUrl,
  }), [store.recipientName, store.senderName, store.customMessage, store.photoUrls, store.musicUrl])

  function goPreview() {
    if (!store.recipientName || !store.senderName) {
      toast.push('error', 'Recipient and sender names are required')
      return
    }
    navigate('/preview')
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[430px_1fr]">
      <motion.div className="glass-panel space-y-5 rounded-xl p-5" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}>
        <div className="relative overflow-hidden rounded-xl bg-ink p-5 text-white">
          <ShimmerSweep />
          <p className="text-sm font-black uppercase tracking-[0.16em] text-sun">Wish studio</p>
          <h1 className="mt-2 text-3xl font-black">Customize wish</h1>
          <p className="mt-2 text-sm leading-6 text-white/70">{store.template?.name ?? 'Selected template'} updates live as you type.</p>
        </div>
        <Input label="Recipient name" value={store.recipientName} onChange={(event) => store.setRecipientName(event.target.value)} required />
        <Input label="Sender name" value={store.senderName} onChange={(event) => store.setSenderName(event.target.value)} required />
        <Textarea label="Custom message" maxLength={300} value={store.customMessage} onChange={(event) => store.setCustomMessage(event.target.value)} />
        <AIWishGenerator initialOccasion={selectedTemplate?.occasion ?? 'birthday'} onApply={store.setCustomMessage} />
        <ImageUpload urls={store.photoUrls} onUploaded={store.addPhoto} onRemove={store.removePhoto} templateId={selectedTemplate?.id ?? null} />
        {selectedTemplate && selectedTemplate.tier !== 'free' ? (
          <div className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Music</span>
              <select className="w-full rounded-md border p-3" value={store.useCustomMusic ? '' : store.musicUrl ?? ''} onChange={(event) => { store.setUseCustomMusic(false); store.setMusicUrl(event.target.value || null) }}>
                <option value="">No music</option>
                {musicTracks.map((track) => <option key={track} value={track}>{track}</option>)}
              </select>
            </label>
            {selectedTemplate.tier === 'premium' ? (
              <MusicUploadManager
                templateId={selectedTemplate.id}
                onUploaded={(url) => {
                  store.setMusicUrl(url)
                  store.setUseCustomMusic(true)
                  toast.push('success', 'Custom music uploaded')
                }}
              />
            ) : null}
          </div>
        ) : null}
        <AITemplateRecommendations occasion={selectedTemplate?.occasion} />
        <Button type="button" variant="secondary" className="w-full lg:hidden" onClick={() => setPreviewOpen(true)}>See Preview</Button>
        <Button onClick={goPreview} className="w-full">Preview & create</Button>
      </motion.div>
      <div className="hidden lg:block lg:sticky lg:top-24 lg:h-fit">
        <p className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-zinc-500">Live receiver view</p>
        <LivePreview template={store.template} data={previewData} />
      </div>
      <Modal open={previewOpen} title="Live preview" onClose={() => setPreviewOpen(false)}>
        <div className="max-h-[75vh] overflow-auto rounded-xl">
          <LivePreview template={store.template} data={previewData} />
        </div>
      </Modal>
    </section>
  )
}
