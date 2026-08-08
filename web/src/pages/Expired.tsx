import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Clock } from 'lucide-react'

export function Expired() {
  return (
    <section className="grid min-h-screen place-items-center bg-soft-cream dark:bg-deep-navy px-4 text-center">
      <div className="glass-panel max-w-xl rounded-2xl p-8 shadow-premium">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-coral/10 text-coral">
          <Clock size={40} />
        </div>
        <p className="font-black uppercase tracking-[0.18em] text-coral">Validity Expired</p>
        <h1 className="mt-4 text-4xl font-black text-ink dark:text-white">This wish is no longer active</h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-white/70 leading-relaxed">
          Wishes are active for 24 hours. This one has expired. Ask the sender to reactivate it or create your own wish!
        </p>
        <div className="mt-8 flex justify-center">
          <Link to="/">
            <Button className="px-8 shadow-premium">Create a Wish Now</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
