import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

interface WishReferralFooterProps {
  wishId: string
  templateSlug: string
}

export function WishReferralFooter({ wishId, templateSlug }: WishReferralFooterProps) {
  const navigate = useNavigate()
  const referralId = useRef<string | null>(null)
  const trackedWishId = useRef<string | null>(null)

  useEffect(() => {
    if (trackedWishId.current === wishId) return
    trackedWishId.current = wishId
    referralId.current = null

    supabase
      .from('wish_referrals')
      .insert({ wish_id: wishId, template_slug: templateSlug })
      .select('id')
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          console.warn('[WishReferralFooter] referral insert failed', { wishId, error })
          return
        }
        referralId.current = (data as { id: string }).id
      })
  }, [wishId, templateSlug])

  function handleCreateOwn() {
    if (referralId.current) {
      void supabase
        .from('wish_referrals')
        .update({ converted: true })
        .eq('id', referralId.current)
        .then(({ error }) => {
          if (error) console.warn('[WishReferralFooter] referral conversion failed', error)
        })
    }
    navigate(`/?template=${encodeURIComponent(templateSlug)}`)
  }

  return (
    <footer className="relative z-10 border-t border-white/10 bg-ink/95 px-4 py-6 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/40">Made with WishCraft</p>
        <button
          type="button"
          onClick={handleCreateOwn}
          className="focus-ring inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          Create your own <span aria-hidden="true">→</span>
        </button>
      </div>
    </footer>
  )
}
