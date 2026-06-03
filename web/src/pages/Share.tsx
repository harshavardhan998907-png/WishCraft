import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { getShareableUrl } from '../lib/utils'
import { useToastStore } from '../store/toastStore'
import { useAnalytics } from '../modules/analytics/hooks/useAnalytics'
import { Copy, ExternalLink, Share2, Sparkles, LayoutDashboard } from 'lucide-react'

export function Share() {
  const { slug = '' } = useParams()
  const toast = useToastStore()
  const analytics = useAnalytics()
  const url = getShareableUrl(slug)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'A special wish for you',
          text: 'I created a special surprise for you! Tap to open.',
          url: url,
        })
        analytics.trackShareClick({ slug, action: 'native_share' })
        toast.push('success', 'Shared successfully!')
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyLink()
        }
      }
    } else {
      copyLink()
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      analytics.trackShareClick({ slug, action: 'copy' })
      toast.push('success', 'Link copied to clipboard! Ready to paste.')
    })
  }

  return (
    <section className="min-h-[calc(100vh-70px)] bg-celebration-light dark:bg-celebration-dark grid place-items-center px-4 py-12">
      <div className="max-w-xl w-full rounded-3xl bg-white/90 p-8 text-center shadow-premium backdrop-blur-xl dark:border dark:border-white/10 dark:bg-ink/90 dark:text-white">
        <div className="w-20 h-20 rounded-full bg-sun/10 text-sun flex items-center justify-center mx-auto mb-6">
          <Sparkles size={36} />
        </div>
        <h1 className="text-4xl font-heading font-black">Your wish is live!</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">Send this link to the recipient to give them their surprise.</p>
        
        <div className="mt-8 relative group">
          <p className="break-all rounded-xl border border-zinc-200 bg-zinc-50 p-4 pr-12 font-semibold text-left dark:border-white/10 dark:bg-white/5 transition-colors group-hover:border-brand/30">{url}</p>
          <button 
            onClick={copyLink}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-zinc-400 hover:text-brand hover:bg-brand/10 transition-colors"
            title="Copy to clipboard"
          >
            <Copy size={18} />
          </button>
        </div>
        
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Button size="lg" className="shadow-lg font-bold" onClick={handleShare}>
            <Share2 size={18} /> Share Wish
          </Button>
          <Link to={`/w/${slug}`} onClick={() => analytics.trackShareClick({ slug, action: 'open' })} className="w-full sm:w-auto">
            <Button size="lg" variant="secondary" className="w-full">
              <ExternalLink size={18} /> Preview It
            </Button>
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-100 dark:border-white/10">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">
            <LayoutDashboard size={16} /> Return to Dashboard
          </Link>
        </div>
      </div>
    </section>
  )
}
