import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { getShareableUrl } from '../lib/utils'
import { useToastStore } from '../store/toastStore'
import { useAnalytics } from '../modules/analytics/hooks/useAnalytics'

export function Share() {
  const { slug = '' } = useParams()
  const toast = useToastStore()
  const analytics = useAnalytics()
  const url = getShareableUrl(slug)
  return (
    <section className="grid min-h-[calc(100vh-70px)] place-items-center px-4">
      <div className="max-w-xl rounded-lg bg-white p-8 text-center shadow-soft dark:border dark:border-white/10 dark:bg-[#181824] dark:text-white">
        <h1 className="text-4xl font-black">Your wish is live</h1>
        <p className="mt-4 break-all rounded-md bg-zinc-100 p-3 font-semibold dark:bg-white/10">{url}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => navigator.clipboard.writeText(url).then(() => {
            analytics.trackShareClick({ slug, action: 'copy' })
            toast.push('success', 'Link copied')
          })}>Copy link</Button>
          <Link to={`/w/${slug}`} onClick={() => analytics.trackShareClick({ slug, action: 'open' })}><Button variant="secondary">Open wish</Button></Link>
        </div>
      </div>
    </section>
  )
}
