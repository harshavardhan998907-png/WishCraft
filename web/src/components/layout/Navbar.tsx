import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { ThemeToggle } from '../ui/ThemeToggle'
import { MobileDrawer } from '../responsive/MobileDrawer'
import { LanguageSwitcher } from '../../modules/i18n/components/LanguageSwitcher'
import { useLocalization } from '../../modules/i18n/hooks/useLocalization'

export function Navbar() {
  const { user, role, signOut } = useAuth()
  const { t } = useLocalization()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await signOut()
    setMenuOpen(false)
    navigate('/')
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-cream/85 backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-[#10101a]/90">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3" aria-label="Main Navigation">
        <Link to="/" className="flex items-center gap-2 text-xl font-black tracking-normal text-ink transition-colors dark:text-white">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-ink text-sm text-white shadow-soft dark:bg-white dark:text-ink">TH</span>
          Template Hub
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          <NavLink to="/browse" className="font-semibold text-zinc-700 transition-colors hover:text-ink dark:text-white/70 dark:hover:text-white">Browse</NavLink>
          <a href="/#how-it-works" className="font-semibold text-zinc-700 transition-colors hover:text-ink dark:text-white/70 dark:hover:text-white">How it works</a>
          {user ? <NavLink to="/dashboard" className="font-semibold text-zinc-700 transition-colors hover:text-ink dark:text-white/70 dark:hover:text-white">{t('dashboard')}</NavLink> : null}
          {user ? <NavLink to="/security" className="font-semibold text-zinc-700 transition-colors hover:text-ink dark:text-white/70 dark:hover:text-white">{t('security')}</NavLink> : null}
          {user ? <NavLink to="/developer/api-keys" className="font-semibold text-zinc-700 transition-colors hover:text-ink dark:text-white/70 dark:hover:text-white">{t('developer')}</NavLink> : null}
          {user && role === 'admin' ? <NavLink to="/admin" className="font-semibold text-zinc-700 transition-colors hover:text-ink dark:text-white/70 dark:hover:text-white">Admin</NavLink> : null}
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden xl:block"><LanguageSwitcher /></div>
          <ThemeToggle />
          {user && role === 'admin' ? <Button className="hidden md:inline-flex" variant="secondary" onClick={() => navigate('/admin')}>Admin</Button> : null}
          {user ? <Button className="hidden md:inline-flex" variant="ghost" onClick={handleLogout}>Logout</Button> : <Button className="hidden md:inline-flex" onClick={() => navigate('/auth')}>Login</Button>}
          <button
            type="button"
            className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-2xl font-black text-ink hover:bg-black/5 dark:text-white dark:hover:bg-white/10 md:hidden"
            aria-label="Open navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <span className="grid gap-1" aria-hidden="true">
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="block h-0.5 w-5 rounded-full bg-current" />
            </span>
          </button>
        </div>
      </nav>
      <MobileDrawer open={menuOpen} title="Navigation" onClose={closeMenu}>
        <nav className="grid gap-2">
          <NavLink onClick={closeMenu} to="/browse" className="focus-ring rounded-md px-3 py-3 font-black text-ink hover:bg-black/5 dark:text-white dark:hover:bg-white/10">Browse</NavLink>
          <a onClick={closeMenu} href="/#how-it-works" className="focus-ring rounded-md px-3 py-3 font-black text-ink hover:bg-black/5 dark:text-white dark:hover:bg-white/10">How it works</a>
          {user ? <NavLink onClick={closeMenu} to="/dashboard" className="focus-ring rounded-md px-3 py-3 font-black text-ink hover:bg-black/5 dark:text-white dark:hover:bg-white/10">{t('dashboard')}</NavLink> : null}
          {user ? <NavLink onClick={closeMenu} to="/security" className="focus-ring rounded-md px-3 py-3 font-black text-ink hover:bg-black/5 dark:text-white dark:hover:bg-white/10">{t('security')}</NavLink> : null}
          {user ? <NavLink onClick={closeMenu} to="/developer/api-keys" className="focus-ring rounded-md px-3 py-3 font-black text-ink hover:bg-black/5 dark:text-white dark:hover:bg-white/10">{t('developer')}</NavLink> : null}
          {user && role === 'admin' ? <NavLink onClick={closeMenu} to="/admin" className="focus-ring rounded-md px-3 py-3 font-black text-ink hover:bg-black/5 dark:text-white dark:hover:bg-white/10">Admin</NavLink> : null}
        </nav>
        <div className="mt-4 border-t border-black/10 pt-4 dark:border-white/10"><LanguageSwitcher /></div>
        <div className="mt-5 grid gap-2 border-t border-black/10 pt-4 dark:border-white/10">
          {user ? <Button variant="ghost" className="w-full justify-center" onClick={handleLogout}>Logout</Button> : <Button className="w-full justify-center" onClick={() => { closeMenu(); navigate('/auth') }}>Login</Button>}
        </div>
      </MobileDrawer>
    </header>
  )
}
