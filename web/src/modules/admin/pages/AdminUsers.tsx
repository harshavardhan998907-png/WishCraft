import { useEffect, useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { RoleBadge } from '../../../components/ui/RoleBadge'
import { ResponsiveTable, type ResponsiveTableColumn } from '../../../components/responsive/ResponsiveTable'
import { fetchAdminUsers } from '../services/adminUsers'
import type { AdminUser } from '../types'

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const columns: ResponsiveTableColumn<AdminUser>[] = [
    {
      key: 'user',
      header: 'User',
      priority: 'primary',
      render: (user) => (
        <div className="min-w-0">
          <p className="break-words font-black text-ink dark:text-white">{user.full_name || 'Unnamed user'}</p>
          <p className="mt-1 break-all text-zinc-500">{user.email}</p>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: (user) => <RoleBadge role={user.role} /> },
    { key: 'created_at', header: 'Signup date', render: (user) => <span>{new Date(user.created_at).toLocaleDateString()}</span> },
    { key: 'id', header: 'User ID', render: (user) => <span className="break-all font-mono text-xs text-zinc-500">{user.id}</span> },
  ]

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
          <h2 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">Users</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-white/70 sm:text-base">Search profiles and inspect platform roles.</p>
        </div>
        <div className="w-full md:w-80">
          <Input label="Search users" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Email or name" />
        </div>
      </div>

      {error ? <Card className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</Card> : null}
      {loading ? <Card className="text-sm font-semibold text-zinc-500">Loading users...</Card> : null}

      <ResponsiveTable items={users} columns={columns} getKey={(user) => user.id} emptyMessage="No users found." loading={loading} />
    </div>
  )
}
