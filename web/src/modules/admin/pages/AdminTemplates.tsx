import { motion } from 'framer-motion'
import { Card } from '../../../components/ui/Card'
import { Sparkles } from 'lucide-react'

export function AdminTemplates() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">Template Registry Empty</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-white/70 sm:text-base">
          Templates Registered: 0
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="mt-6"
      >
        <Card className="rounded-3xl border border-black/10 bg-white/80 p-12 text-center shadow-premium backdrop-blur-xl dark:border-white/10 dark:bg-ink/80">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-white/5 text-zinc-400 dark:text-zinc-500 flex items-center justify-center mx-auto mb-6">
            <Sparkles size={28} />
          </div>
          <h3 className="text-xl font-black text-ink dark:text-white mb-2">Registry is Ready</h3>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto text-sm font-medium">
            Import a template to get started.
          </p>
        </Card>
      </motion.div>
    </div>
  )
}
