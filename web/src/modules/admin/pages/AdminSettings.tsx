import { Card } from '../../../components/ui/Card'

export function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-ink dark:text-white">Settings</h2>
        <p className="mt-2 text-zinc-600 dark:text-white/70">Operational settings foundation for future admin modules.</p>
      </div>
      <Card>
        <h3 className="text-xl font-black">Platform controls</h3>
        <p className="mt-3 leading-7 text-zinc-600 dark:text-white/70">
          This module keeps settings read-only until specific backend-authorized controls are introduced.
        </p>
      </Card>
    </div>
  )
}
