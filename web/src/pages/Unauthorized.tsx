import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function Unauthorized() {
  return (
    <section className="grid min-h-[calc(100vh-70px)] place-items-center px-4 py-16 text-center">
      <div className="glass-panel max-w-xl rounded-xl p-8">
        <p className="font-black uppercase tracking-[0.18em] text-coral">Permission denied</p>
        <h1 className="mt-4 text-4xl font-black text-ink dark:text-white">You do not have access to this page.</h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-zinc-600">
          This area is protected by your account role. You can return home or continue from your dashboard.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/"><Button variant="secondary">Return home</Button></Link>
          <Link to="/dashboard"><Button>Go to dashboard</Button></Link>
        </div>
      </div>
    </section>
  )
}
