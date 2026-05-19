import { useEffect, useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { RoleBadge } from '../../../components/ui/RoleBadge'
import { fetchAdminUsers } from '../services/adminUsers'
import type { AdminUser } from '../types'

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true)
      fetchAdminUsers(search)
        .then(setUsers)
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false))
    }, 200)

    return () => window.clearTimeout(timer)
  }, [search])

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-black text-ink dark:text-white">Users</h2>
          <p className="mt-2 text-zinc-600 dark:text-white/70">Search profiles and inspect platform roles.</p>
        </div>
        <div className="w-full md:w-80">
          <Input label="Search users" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Email or name" />
        </div>
      </div>

      {error ? <Card className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</Card> : null}
      {loading ? <Card className="text-sm font-semibold text-zinc-500">Loading users...</Card> : null}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-zinc-100 text-xs font-black uppercase tracking-[0.12em] text-zinc-500 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Signup date</th>
                <th className="px-4 py-3">User ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/10">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-4">
                    <p className="font-black text-ink dark:text-white">{user.full_name || 'Unnamed user'}</p>
                    <p className="mt-1 text-zinc-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-4"><RoleBadge role={user.role} /></td>
                  <td className="px-4 py-4 font-semibold text-zinc-600 dark:text-white/70">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-4 font-mono text-xs text-zinc-500">{user.id}</td>
                </tr>
              ))}
              {!loading && users.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center font-semibold text-zinc-500" colSpan={4}>No users found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
