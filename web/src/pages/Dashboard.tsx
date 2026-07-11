import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { Badge } from '../components/ui/Badge'
import { Sparkles } from 'lucide-react'

export function Dashboard() {
  const { user, profile } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  return (
    <div className="min-h-screen overflow-x-hidden bg-soft-cream pb-24 dark:bg-deep-navy">
      <header className="border-b border-black/5 bg-white/70 px-4 py-8 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:px-6 lg:py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge tone="yellow">MAKE A WISH</Badge>
            <h1 className="mt-4 text-3xl font-black tracking-normal text-ink dark:text-white sm:text-4xl lg:text-5xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-zinc-600 dark:text-white/70">
              Create, edit, and share heartfelt wish websites from one calm little studio.
            </p>
          </div>
        </div>
      </header>

      <main id="wishes" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-black/10 bg-white/80 p-12 text-center shadow-premium backdrop-blur-xl dark:border-white/10 dark:bg-ink/80"
        >
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-white/5 text-zinc-400 dark:text-zinc-500 flex items-center justify-center mx-auto mb-6">
            <Sparkles size={28} />
          </div>
          <h2 className="text-2xl font-black text-ink dark:text-white mb-2">
            No templates available
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto text-sm font-medium leading-relaxed">
            Import your first template to start generating wishes.
          </p>
        </motion.div>
      </main>
    </div>
  )
}
