import { Outlet, useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { RoleBadge } from '../../../components/ui/RoleBadge'
import { useAuth } from '../../../hooks/useAuth'
import { AdminSidebar } from '../components/AdminSidebar'

export function AdminLayout() {
  const { profile, role, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-[calc(100vh-66px)] bg-white/35 dark:bg-[#080812]">
      <div className="grid lg:grid-cols-[240px_1fr]">
        <AdminSidebar />
        <main className="min-w-0">
          <div className="border-b border-black/10 bg-white/75 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-[#10101a]/85">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-brand">Admin console</p>
                <h1 className="text-2xl font-black text-ink dark:text-white">Platform management</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <RoleBadge role={role} />
                <span className="max-w-[220px] truncate text-sm font-semibold text-zinc-600 dark:text-white/70">{profile?.email}</span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
              </div>
            </div>
          </div>
          <div className="mx-auto max-w-7xl px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
