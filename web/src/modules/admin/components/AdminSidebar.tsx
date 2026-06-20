import { NavLink } from 'react-router-dom'

const primaryLinks = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/templates', label: 'Templates' },
  { to: '/admin/submissions', label: 'Submissions' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/analytics', label: 'Analytics' },
]

const advancedLinks = [
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/governance', label: 'Governance' },
  { to: '/admin/production', label: 'Production' },
  { to: '/admin/ai', label: 'AI Services' },
  { to: '/admin/storage', label: 'Storage' },
  { to: '/admin/settings', label: 'Settings' },
]

function NavItem({ to, label, end, onClick }: { to: string; label: string; end?: boolean; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) => `focus-ring whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
        isActive
          ? 'bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand'
          : 'text-zinc-600 hover:bg-zinc-100 hover:text-ink dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white'
      }`}
    >
      {label}
    </NavLink>
  )
}

export function AdminSidebar({ onNavigate, className = '' }: { onNavigate?: () => void; className?: string }) {
  return (
    <aside className={className}>
      <nav className="flex flex-col gap-1" aria-label="Admin Navigation">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-4 py-2 mb-1">Core Operations</span>
        {primaryLinks.map((link) => (
          <NavItem key={link.to} {...link} onClick={onNavigate} />
        ))}

        <div className="mt-8 mb-1">
           <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-4 py-2">Advanced Systems</span>
        </div>
        {advancedLinks.map((link) => (
          <NavItem key={link.to} {...link} onClick={onNavigate} />
        ))}
      </nav>
    </aside>
  )
}
