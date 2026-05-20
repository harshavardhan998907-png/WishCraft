import { NavLink } from 'react-router-dom'

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/templates', label: 'Templates' },
  { to: '/creator', label: 'Creator Studio' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/settings', label: 'Settings' },
]

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="border-b border-black/10 bg-white/80 p-3 dark:border-white/10 dark:bg-[#10101a]/90 lg:min-h-[calc(100vh-66px)] lg:border-b-0 lg:border-r">
      <nav className="flex gap-2 overflow-x-auto lg:grid">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onNavigate}
            className={({ isActive }) => `whitespace-nowrap rounded-md px-3 py-2 text-sm font-black transition ${
              isActive
                ? 'bg-ink text-white dark:bg-white dark:text-ink'
                : 'text-zinc-600 hover:bg-black/5 hover:text-ink dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white'
            }`}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
