import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { ThemeToggle } from '../ui/ThemeToggle'

export function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-cream/85 backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-[#10101a]/90">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-black tracking-normal text-ink transition-colors dark:text-white">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-ink text-sm text-white shadow-soft dark:bg-white dark:text-ink">TH</span>
          Template Hub
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          <NavLink to="/browse" className="font-semibold text-zinc-700 transition-colors hover:text-ink dark:text-white/70 dark:hover:text-white">Browse</NavLink>
          <a href="/#how-it-works" className="font-semibold text-zinc-700 transition-colors hover:text-ink dark:text-white/70 dark:hover:text-white">How it works</a>
          {user ? <NavLink to="/dashboard" className="font-semibold text-zinc-700 transition-colors hover:text-ink dark:text-white/70 dark:hover:text-white">Dashboard</NavLink> : null}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? <Button variant="ghost" onClick={handleLogout}>Logout</Button> : <Button onClick={() => navigate('/auth')}>Login</Button>}
        </div>
      </nav>
    </header>
  )
}
