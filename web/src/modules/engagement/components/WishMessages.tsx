import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Textarea } from '../../../components/ui/Textarea'
import { addWishMessage, fetchWishMessages, reportEngagement } from '../services/engagementService'
import type { WishMessage } from '../types'

export function WishMessages({ wishId, templateId }: { wishId: string; templateId?: string }) {
  const [messages, setMessages] = useState<WishMessage[]>([])
  const [senderName, setSenderName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMessages = useCallback(async () => {
    setLoading(true)
    try {
      setMessages(await fetchWishMessages(wishId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load messages')
    } finally {
      setLoading(false)
    }
  }, [wishId])

  useEffect(() => {
    void loadMessages()
  }, [loadMessages])

  async function submitMessage(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await addWishMessage({ wishId, templateId, senderName, message })
      setSenderName('')
      setMessage('')
      await loadMessages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Message could not be added')
    } finally {
      setSubmitting(false)
    }
  }

  async function report(messageId: string) {
    const reason = window.prompt('Reason for reporting this message?')
    if (!reason) return
    try {
      await reportEngagement({ targetType: 'message', targetId: messageId, reason })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report could not be created')
    }
  }

  return (
    <section className="rounded-xl border border-black/10 bg-white/90 p-4 shadow-soft dark:border-white/10 dark:bg-[#181824]/95">
      <div>
        <h2 className="text-lg font-black text-ink dark:text-white">Messages</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-white/70">Leave a kind note for this celebration.</p>
      </div>

      <form className="mt-4 grid gap-3" onSubmit={submitMessage}>
        <Input label="Your name" value={senderName} onChange={(event) => setSenderName(event.target.value)} maxLength={80} required />
        <Textarea label="Message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} required />
        <Button type="submit" loading={submitting}>Add message</Button>
      </form>

      {error ? <p className="mt-3 text-sm font-semibold text-rose-600 dark:text-rose-200">{error}</p> : null}
      {loading ? <p className="mt-4 text-sm font-semibold text-zinc-500">Loading messages...</p> : null}

      <div className="mt-5 grid gap-3">
        {messages.map((item) => (
          <article key={item.id} className="rounded-md bg-zinc-100 p-3 dark:bg-white/10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-black text-ink dark:text-white">{item.sender_name}</p>
              <button type="button" className="text-xs font-semibold text-zinc-500 hover:text-rose-600" onClick={() => report(item.id)}>Report</button>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-white/75">{item.sender_message}</p>
          </article>
        ))}
        {!loading && messages.length === 0 ? <p className="text-sm font-semibold text-zinc-500">No messages yet.</p> : null}
      </div>
    </section>
  )
}
