import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { ThemeToggle } from '../ui/ThemeToggle'
import { NavbarLanguageSelector } from './NavbarLanguageSelector'
import { Sparkles, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function Navbar() {
  const { user, role, signOut } = useAuth()
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

  function handleCreateWish() {
    if (user) {
      navigate('/browse')
    } else {
      navigate('/auth?redirect=/browse')
    }
  }

  // Prevent background scrolling when menu is open
  useEffect(() => {
    if (menuOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalStyle
      }
    }
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-50 border-b border-white/70 bg-cream/85 backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-[#10101a]/90">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3" aria-label="Main Navigation">
        <Link to="/" onClick={closeMenu} className="flex items-center gap-2 text-xl font-black tracking-normal text-ink transition-colors dark:text-white">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-ink text-sm text-white shadow-soft dark:bg-white dark:text-ink">TH</span>
          Template Hub
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          <NavLink to="/browse" className="font-semibold text-zinc-700 transition-colors hover:text-ink dark:text-white/70 dark:hover:text-white">Browse</NavLink>
          <a href="/#how-it-works" className="font-semibold text-zinc-700 transition-colors hover:text-ink dark:text-white/70 dark:hover:text-white">How it works</a>
          {user ? <NavLink to="/dashboard" className="font-semibold text-zinc-700 transition-colors hover:text-ink dark:text-white/70 dark:hover:text-white">Dashboard</NavLink> : null}
          {user && role === 'admin' ? <NavLink to="/admin" className="font-semibold text-zinc-700 transition-colors hover:text-ink dark:text-white/70 dark:hover:text-white">Admin</NavLink> : null}
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden xl:block"><NavbarLanguageSelector /></div>
          <div className="hidden md:block"><ThemeToggle /></div>
          <Button
            className="hidden md:inline-flex px-5 py-2 rounded-full shadow-soft hover:shadow-premium transition-all"
            onClick={handleCreateWish}
          >
            Create Wish <Sparkles size={16} className="ml-1" />
          </Button>
          {user ? <Button className="hidden md:inline-flex" variant="ghost" onClick={handleLogout}>Logout</Button> : <Button className="hidden md:inline-flex" variant="ghost" onClick={() => navigate('/auth')}>Login</Button>}
          <button
            type="button"
            className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-ink hover:bg-black/5 dark:text-white dark:hover:bg-white/10 md:hidden"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Premium Full-Viewport mobile menu dropdown overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 h-[calc(100vh-100%)] bg-cream/95 backdrop-blur-xl dark:bg-[#10101a]/95 flex flex-col z-40 overflow-y-auto"
          >
            <div className="flex-1 flex flex-col justify-between px-6 py-8">
              <nav className="flex flex-col gap-6 text-center">
                <NavLink onClick={closeMenu} to="/browse" className="text-2xl font-black text-ink dark:text-white hover:text-brand dark:hover:text-brand transition-colors">Browse</NavLink>
                <a onClick={closeMenu} href="/#how-it-works" className="text-2xl font-black text-ink dark:text-white hover:text-brand dark:hover:text-brand transition-colors">How It Works</a>
                
                {user ? (
                  <>
                    <NavLink onClick={closeMenu} to="/dashboard" className="text-2xl font-black text-ink dark:text-white hover:text-brand dark:hover:text-brand transition-colors">Dashboard</NavLink>
                    {role === 'admin' ? (
                      <NavLink onClick={closeMenu} to="/admin" className="text-2xl font-black text-ink dark:text-white hover:text-brand dark:hover:text-brand transition-colors">Admin</NavLink>
                    ) : null}
                  </>
                ) : null}
              </nav>

              <div className="mt-8 space-y-6">
                {/* Secondary Settings Section */}
                <div className="flex flex-col gap-4 border-t border-black/10 pt-6 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-ink dark:text-white">Theme</span>
                    <div className="scale-90 origin-right">
                      <ThemeToggle />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-ink dark:text-white">Language</span>
                    <NavbarLanguageSelector />
                  </div>
                </div>

                {/* CTAs Section */}
                <div className="flex flex-col gap-3">
                  <Button
                    className="w-full justify-center rounded-full py-3.5 shadow-premium text-base font-black animate-pulse-subtle"
                    onClick={() => { closeMenu(); handleCreateWish() }}
                  >
                    Create Wish <Sparkles size={18} className="ml-2" />
                  </Button>
                  {user ? (
                    <Button variant="ghost" className="w-full justify-center py-3 text-base" onClick={handleLogout}>Logout</Button>
                  ) : (
                    <Button variant="ghost" className="w-full justify-center py-3 text-base" onClick={() => { closeMenu(); navigate('/auth') }}>Login</Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
