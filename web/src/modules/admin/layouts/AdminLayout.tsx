import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { RoleBadge } from '../../../components/ui/RoleBadge'
import { useAuth } from '../../../hooks/useAuth'
import { MobileDrawer } from '../../../components/responsive/MobileDrawer'
import { ResponsiveContainer } from '../../../components/responsive/ResponsiveContainer'
import { AdminSidebar } from '../components/AdminSidebar'

export function AdminLayout() {
  const { profile, role, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (role !== 'admin') {
    return <Navigate to="/unauthorized" replace />
  }

  async function handleLogout() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-[calc(100vh-66px)] bg-soft-cream dark:bg-deep-navy">
      <div className="grid lg:grid-cols-[240px_1fr]">
        <div className="hidden lg:block">
          <AdminSidebar className="bg-white p-4 dark:bg-ink lg:min-h-[calc(100vh-66px)] lg:border-r border-zinc-100 dark:border-white/5 w-64" />
        </div>
        <MobileDrawer open={sidebarOpen} title="Admin menu" onClose={() => setSidebarOpen(false)}>
          <AdminSidebar className="w-full" onNavigate={() => setSidebarOpen(false)} />
        </MobileDrawer>
        <main className="min-w-0">
          <div className="border-b border-black/5 bg-white/75 px-4 py-4 backdrop-blur dark:border-white/5 dark:bg-ink/85">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className="focus-ring mt-1 inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-2xl font-black text-ink hover:bg-black/5 dark:text-white dark:hover:bg-white/10 lg:hidden"
                  aria-label="Open admin navigation"
                  aria-expanded={sidebarOpen}
                  onClick={() => setSidebarOpen(true)}
                >
                  <span className="grid gap-1" aria-hidden="true">
                    <span className="block h-0.5 w-5 rounded-full bg-current" />
                    <span className="block h-0.5 w-5 rounded-full bg-current" />
                    <span className="block h-0.5 w-5 rounded-full bg-current" />
                  </span>
                </button>
                <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-brand">Admin console</p>
                  <h1 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">Platform management</h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <RoleBadge role={role} />
                <span className="max-w-[220px] truncate text-sm font-semibold text-zinc-600 dark:text-white/70">{profile?.email}</span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
              </div>
            </div>
          </div>
          <ResponsiveContainer className="py-4 sm:py-6">
            <Outlet />
          </ResponsiveContainer>
        </main>
      </div>
    </div>
  )
}
