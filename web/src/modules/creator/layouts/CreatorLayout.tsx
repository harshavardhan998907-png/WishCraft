import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { Badge } from '../../../components/ui/Badge'
import { Card } from '../../../components/ui/Card'
import { useAuth } from '../../../hooks/useAuth'
import { hasAnyPermission } from '../../../lib/permissions'

const links = [
  { to: '/creator', label: 'Dashboard', end: true },
  { to: '/creator/templates', label: 'Templates' },
  { to: '/creator/analytics', label: 'Analytics' },
  { to: '/creator/settings', label: 'Settings' },
]

export function CreatorLayout() {
  const { profile, role } = useAuth()

  if (!hasAnyPermission(role, ['creator_templates:manage', 'creator_analytics:access', 'creator_profile:manage'])) {
    return <Navigate to="/unauthorized" replace />
  }

  return (
    <section className="min-h-screen bg-soft-cream dark:bg-deep-navy">
      <div className="border-b border-black/5 bg-white px-4 py-4 dark:border-white/5 dark:bg-ink">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-zinc-500">Creator Studio</p>
            <h1 className="text-2xl font-black text-ink dark:text-white">{profile?.full_name || profile?.email || 'Creator'}</h1>
          </div>
          <Badge tone={role === 'admin' ? 'purple' : 'green'}>{role}</Badge>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-4">
          <Card className="p-3">
            <nav className="grid gap-1" aria-label="Creator Navigation">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => `focus-ring rounded-xl px-3 py-2 text-sm font-black transition ${
                    isActive
                      ? 'bg-ink text-white dark:bg-white dark:text-ink'
                      : 'text-zinc-600 hover:bg-black/5 hover:text-ink dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white'
                  }`}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </Card>
          <Card>
            <p className="text-sm font-black uppercase text-zinc-500">Marketplace</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-white/70">Draft, submit, and track creator-owned templates.</p>
          </Card>
        </aside>
        <main>
          <Outlet />
        </main>
      </div>
    </section>
  )
}
