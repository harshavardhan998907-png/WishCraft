import { FormEvent, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Card } from '../../../components/ui/Card'
import type { OccasionType } from '../../../types'
import { generateWishMessage } from '../services/aiService'
import { aiToneOptions, languageOptions } from '../prompts/presets'
import type { AITone } from '../types'

const occasions: OccasionType[] = ['birthday', 'wedding', 'anniversary', 'festival', 'graduation', 'baby_shower', 'farewell', 'valentine', 'other']

export function AIWishGenerator({ initialOccasion = 'birthday', onApply }: { initialOccasion?: OccasionType; onApply: (message: string) => void }) {
  const [occasion, setOccasion] = useState<OccasionType>(initialOccasion)
  const [tone, setTone] = useState<AITone>('emotional')
  const [relationship, setRelationship] = useState('')
  const [recipientAge, setRecipientAge] = useState('')
  const [language, setLanguage] = useState('English')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const result = await generateWishMessage({ occasion, tone, relationship, recipientAge, language })
      setMessage(result.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI could not generate a message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-ink dark:text-white">AI wish helper</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-white/70">Generate an optional starting point, then edit it your way.</p>
      </div>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-ink dark:text-white/90">Occasion</span>
          <select className="focus-ring h-11 w-full rounded-md border border-black/15 bg-white px-3 dark:border-white/10 dark:bg-white/10 dark:text-white" value={occasion} onChange={(event) => setOccasion(event.target.value as OccasionType)}>
            {occasions.map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-ink dark:text-white/90">Tone</span>
          <select className="focus-ring h-11 w-full rounded-md border border-black/15 bg-white px-3 dark:border-white/10 dark:bg-white/10 dark:text-white" value={tone} onChange={(event) => setTone(event.target.value as AITone)}>
            {aiToneOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <Input label="Relationship" value={relationship} onChange={(event) => setRelationship(event.target.value)} placeholder="Friend, sister, partner" />
        <Input label="Recipient age" value={recipientAge} onChange={(event) => setRecipientAge(event.target.value)} placeholder="Optional" />
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-sm font-semibold text-ink dark:text-white/90">Language</span>
          <select className="focus-ring h-11 w-full rounded-md border border-black/15 bg-white px-3 dark:border-white/10 dark:bg-white/10 dark:text-white" value={language} onChange={(event) => setLanguage(event.target.value)}>
            {languageOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <Button type="submit" loading={loading} className="sm:col-span-2">Generate message</Button>
      </form>
      {error ? <p className="text-sm font-semibold text-rose-600 dark:text-rose-200">{error}</p> : null}
      {loading ? <div className="h-20 animate-pulse rounded-md bg-zinc-100 dark:bg-white/10" /> : null}
      {message ? (
        <div className="rounded-md bg-zinc-100 p-3 dark:bg-white/10">
          <p className="text-sm leading-6">{message}</p>
          <Button type="button" size="sm" className="mt-3" onClick={() => onApply(message)}>Use this</Button>
        </div>
      ) : null}
    </Card>
  )
}
