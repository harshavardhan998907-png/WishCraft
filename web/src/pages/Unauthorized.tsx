import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { ShieldAlert } from 'lucide-react'

export function Unauthorized() {
  return (
    <section className="grid min-h-screen place-items-center bg-soft-cream dark:bg-deep-navy px-4 text-center">
      <div className="glass-panel max-w-xl rounded-2xl p-8 shadow-premium">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-coral/10 text-coral">
          <ShieldAlert size={40} />
        </div>
        <p className="font-black uppercase tracking-[0.18em] text-coral">Permission denied</p>
        <h1 className="mt-4 text-4xl font-black text-ink dark:text-white">You do not have access to this page.</h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-zinc-600 dark:text-white/70">
          This area is protected by your account role. You can return home or continue from your dashboard.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/"><Button variant="secondary">Return home</Button></Link>
          <Link to="/dashboard"><Button className="shadow-premium">Go to dashboard</Button></Link>
        </div>
      </div>
    </section>
  )
}
