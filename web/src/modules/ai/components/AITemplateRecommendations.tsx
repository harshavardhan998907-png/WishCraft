import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import type { OccasionType } from '../../../types'
import { fetchAITemplateRecommendations } from '../services/aiService'
import type { AITemplateRecommendation, AITone } from '../types'

export function AITemplateRecommendations({ occasion, tone }: { occasion?: OccasionType; tone?: AITone }) {
  const [recommendations, setRecommendations] = useState<AITemplateRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setRecommendations(await fetchAITemplateRecommendations({ occasion, tone }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recommendations are unavailable')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-ink dark:text-white">Smart recommendations</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-white/70">Occasion-aware suggestions from template and engagement signals.</p>
        </div>
        <Button size="sm" variant="secondary" loading={loading} onClick={load}>Recommend</Button>
      </div>
      {error ? <p className="text-sm font-semibold text-rose-600 dark:text-rose-200">{error}</p> : null}
      {loading ? <div className="grid gap-2">{[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-md bg-zinc-100 dark:bg-white/10" />)}</div> : null}
      <div className="grid gap-3">
        {recommendations.map((template) => (
          <div key={template.id} className="rounded-md border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-black text-ink dark:text-white">{template.name}</p>
              <Badge tone="green">{Math.round(template.recommendation_score)}%</Badge>
            </div>
            <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-white/70">{template.recommendation_reason}</p>
            <Button size="sm" className="mt-3" onClick={() => navigate(`/editor/${template.slug}`)}>Customize</Button>
          </div>
        ))}
      </div>
    </Card>
  )
}
