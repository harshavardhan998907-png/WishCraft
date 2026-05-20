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
import { useAnalytics } from '../modules/analytics/hooks/useAnalytics'

const musicTracks = ['Gentle Piano', 'Warm Celebration', 'Soft Romance', 'Festival Lights', 'Bright Future']

export function Editor() {
  const { templateSlug } = useParams()
  const navigate = useNavigate()
  const toast = useToastStore()
  const store = useEditorStore()
  const analytics = useAnalytics()
  const [uploading, setUploading] = useState(false)
  const [musicUploading, setMusicUploading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const selectedTemplate = store.template

  useEffect(() => {
    const local = demoTemplates.find((template) => template.slug === templateSlug)
    if (local) store.setTemplate(local)
    supabase.from('templates').select('*').eq('slug', templateSlug).single().then(({ data, error }) => {
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

  async function uploadFiles(files: FileList) {
    setUploading(true)
    try {
      for (const file of Array.from(files).slice(0, 5 - store.photoUrls.length)) {
        if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name} is larger than 5MB`)
        const path = `draft/${Date.now()}-${file.name}`
        const { error } = await supabase.storage.from('wish-photos').upload(path, file)
        if (error) throw error
        const { data } = supabase.storage.from('wish-photos').getPublicUrl(path)
        store.addPhoto(data.publicUrl)
      }
      analytics.trackUpload({ type: 'photo', templateId: selectedTemplate?.id ?? null, fileCount: Math.min(files.length, 5 - store.photoUrls.length) })
    } catch (err) {
      toast.push('error', err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function uploadMusic(file: File) {
    setMusicUploading(true)
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Music file must be under 10MB')
      const ext = file.name.split('.').pop() || 'mp3'
      const path = `draft/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('wish-music').upload(path, file)
      if (error) throw error
      const { data } = supabase.storage.from('wish-music').getPublicUrl(path)
      store.setMusicUrl(data.publicUrl)
      store.setUseCustomMusic(true)
      analytics.trackUpload({ type: 'music', templateId: selectedTemplate?.id ?? null, fileCount: 1 })
      toast.push('success', 'Custom music uploaded')
    } catch (err) {
      toast.push('error', err instanceof Error ? err.message : 'Music upload failed')
    } finally {
      setMusicUploading(false)
    }
  }

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
        <ImageUpload urls={store.photoUrls} onFiles={uploadFiles} onRemove={store.removePhoto} disabled={uploading} />
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
            <label className="block rounded-lg border border-dashed border-black/20 bg-white/80 p-4 dark:border-white/15 dark:bg-white/10">
                <span className="block text-sm font-bold">Upload your own music</span>
                <span className="block text-sm text-zinc-500">Premium only, max 10MB</span>
                <input className="mt-3 block w-full text-sm" type="file" accept="audio/*" disabled={musicUploading} onChange={(event) => event.target.files?.[0] && uploadMusic(event.target.files[0])} />
              </label>
            ) : null}
          </div>
        ) : null}
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
