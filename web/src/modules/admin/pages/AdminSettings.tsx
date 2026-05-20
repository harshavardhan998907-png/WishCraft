import { Card } from '../../../components/ui/Card'
import { ResponsiveCard } from '../../../components/responsive/ResponsiveCard'

export function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">Settings</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-white/70 sm:text-base">Operational settings foundation for future admin modules.</p>
      </div>
      <ResponsiveCard>
        <h3 className="text-lg font-black sm:text-xl">Platform controls</h3>
        <p className="mt-3 leading-7 text-zinc-600 dark:text-white/70">
          This module keeps settings read-only until specific backend-authorized controls are introduced.
        </p>
      </ResponsiveCard>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="text-lg font-black">Security posture</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-white/70">Admin controls continue to rely on backend role checks and RLS policies.</p>
        </Card>
        <Card>
          <h3 className="text-lg font-black">Frontend scaling</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-white/70">Responsive settings panels are ready for future authorized platform controls.</p>
        </Card>
      </div>
    </div>
  )
}
