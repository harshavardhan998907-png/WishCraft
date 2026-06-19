import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { addWishReaction, fetchWishReactionSummary, reactionOptions, reactionSymbol } from '../services/engagementService'
import type { ReactionType, WishReactionSummary } from '../types'

export function WishReactions({ wishId, templateId }: { wishId: string; templateId?: string }) {
  const [summary, setSummary] = useState<WishReactionSummary[]>([])
  const [loadingType, setLoadingType] = useState<ReactionType | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await fetchWishReactionSummary(wishId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load reactions')
    }
  }, [wishId])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  async function react(reactionType: ReactionType) {
    setLoadingType(reactionType)
    setError(null)
    setSummary((current) => current.map((item) => item.reaction_type === reactionType ? { ...item, total_count: item.total_count + 1 } : item))
    try {
      await addWishReaction({ wishId, templateId, reactionType })
      await loadSummary()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reaction failed')
      await loadSummary()
    } finally {
      setLoadingType(null)
    }
  }

  return (
    <section className="rounded-xl border border-black/10 bg-white/90 p-4 shadow-soft dark:border-white/10 dark:bg-[#181824]/95">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-black text-ink dark:text-white">Reactions</h2>
        {error ? <p className="text-sm font-semibold text-rose-600 dark:text-rose-200">{error}</p> : null}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {reactionOptions.map((option) => {
          const count = summary.find((item) => item.reaction_type === option.type)?.total_count ?? 0
          return (
            <Button key={option.type} type="button" variant="ghost" loading={loadingType === option.type} className="min-h-16 flex-col bg-zinc-100 dark:bg-white/10" onClick={() => react(option.type)}>
              <span className="text-xl font-black">{reactionSymbol(option.type)}</span>
              <span className="text-xs">{option.label} {count}</span>
            </Button>
          )
        })}
      </div>
    </section>
  )
}
