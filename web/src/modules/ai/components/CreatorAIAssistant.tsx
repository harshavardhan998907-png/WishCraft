import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import type { CreatorMetadataInput } from '../types'
import { generateCreatorMetadata } from '../services/aiService'

export function CreatorAIAssistant({ input, onApplyDescription }: { input: CreatorMetadataInput; onApplyDescription: (value: string) => void }) {
  const [suggestion, setSuggestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const result = await generateCreatorMetadata(input)
      setSuggestion(result.suggestion)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Creator AI assistant is unavailable')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-ink dark:text-white">Creator AI assistant</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-white/70">Generate moderatable metadata suggestions for your draft.</p>
        </div>
        <Button type="button" size="sm" variant="secondary" loading={loading} onClick={generate}>Suggest</Button>
      </div>
      {error ? <p className="text-sm font-semibold text-rose-600 dark:text-rose-200">{error}</p> : null}
      {suggestion ? (
        <div className="rounded-md bg-zinc-100 p-3 dark:bg-white/10">
          <p className="text-sm leading-6">{suggestion}</p>
          <Button type="button" size="sm" className="mt-3" onClick={() => onApplyDescription(suggestion)}>Use as notes</Button>
        </div>
      ) : null}
    </Card>
  )
}
