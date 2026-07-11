import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { ThemeToggle } from '../ui/ThemeToggle'
import { ChevronDown, LogOut, Menu, Shield, Sparkles, UserCircle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function Navbar() {
  const { user, profile, role, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement | null>(null)
  const accountName = profile?.full_name?.trim() || user?.email?.split('@')[0] || 'Account'
  const accountInitial = accountName.charAt(0).toUpperCase()

  async function handleLogout() {
    await signOut()
    setMenuOpen(false)
    setAccountOpen(false)
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

  useEffect(() => {
    if (!accountOpen) return

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setAccountOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [accountOpen])

  const navLinkClass = 'font-semibold text-zinc-700 transition-colors hover:text-ink dark:text-white/70 dark:hover:text-white'
  const mobileLinkClass = 'text-2xl font-black text-ink transition-colors hover:text-brand dark:text-white dark:hover:text-brand'

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

  // Close mobile menu on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && menuOpen) {
        setMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-50 border-b border-white/70 bg-cream/85 backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-[#10101a]/90">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3" aria-label="Main Navigation">
        <Link to="/" onClick={closeMenu} className="flex items-center gap-2 text-xl font-black tracking-normal text-ink transition-colors dark:text-white">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-ink text-sm text-white shadow-soft dark:bg-white dark:text-ink">WC</span>
          WishCraft
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          {user ? (
            <>
              <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
              <a href="/dashboard#wishes" className={navLinkClass}>My Wishes</a>
              <NavLink to="/browse" className={navLinkClass}>Templates</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/browse" className={navLinkClass}>Browse</NavLink>
              <a href="/#how-it-works" className={navLinkClass}>How it works</a>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {!user ? null : null}
          {!user ? <div className="hidden md:block"><ThemeToggle /></div> : null}
          
          <Button
            className="inline-flex px-4 py-2 text-sm md:text-base md:px-5 rounded-full shadow-soft hover:shadow-premium transition-all"
            onClick={handleCreateWish}
          >
            Create Wish <Sparkles size={16} className="ml-1.5 hidden md:block" />
          </Button>

          {user ? (
            <div className="relative hidden md:block" ref={accountRef}>
              <button
                type="button"
                className="focus-ring inline-flex h-11 max-w-[13rem] items-center gap-2 rounded-full border border-black/10 bg-white/80 px-2.5 pr-3 font-bold text-ink shadow-sm transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                aria-label="Open account menu"
                onClick={() => setAccountOpen((open) => !open)}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-sm text-white">
                  {accountInitial || <UserCircle size={18} />}
                </span>
                <span className="truncate">{accountName}</span>
                <ChevronDown size={16} className={`shrink-0 transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {accountOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.14, ease: 'easeOut' }}
                    className="absolute right-0 mt-3 w-64 rounded-2xl border border-black/10 bg-white p-3 shadow-premium dark:border-white/10 dark:bg-[#181824]"
                    role="menu"
                    aria-label="Account menu"
                  >
                    <div className="border-b border-black/10 px-2 pb-3 dark:border-white/10">
                      <p className="truncate text-sm font-black text-ink dark:text-white">{accountName}</p>
                      {user.email ? <p className="truncate text-xs font-semibold text-zinc-500">{user.email}</p> : null}
                    </div>
                    <div className="flex items-center justify-between gap-3 px-2 py-3" role="none">
                      <span className="text-sm font-bold text-ink dark:text-white">Theme</span>
                      <ThemeToggle />
                    </div>
                    {role === 'admin' ? (
                      <button
                        type="button"
                        className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-ink hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                        role="menuitem"
                        onClick={() => {
                          setAccountOpen(false)
                          navigate('/admin')
                        }}
                      >
                        <Shield size={16} /> Admin Dashboard
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-coral hover:bg-coral/10"
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/auth" className={`hidden md:block pl-2 ${navLinkClass}`}>Login</Link>
          )}
          <button
            type="button"
            className="focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-ink hover:bg-black/5 dark:text-white dark:hover:bg-white/10 md:hidden ml-1"
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
                {user ? (
                  <>
                    <NavLink onClick={closeMenu} to="/dashboard" className={mobileLinkClass}>Dashboard</NavLink>
                    <a onClick={closeMenu} href="/dashboard#wishes" className={mobileLinkClass}>My Wishes</a>
                    <NavLink onClick={closeMenu} to="/browse" className={mobileLinkClass}>Templates</NavLink>
                  </>
                ) : (
                  <>
                    <NavLink onClick={closeMenu} to="/browse" className={mobileLinkClass}>Browse</NavLink>
                    <a onClick={closeMenu} href="/#how-it-works" className={mobileLinkClass}>How It Works</a>
                  </>
                )}
              </nav>

              <div className="mt-8 space-y-6">
                {/* Secondary Settings Section */}
                <div className="flex flex-col gap-4 border-t border-black/10 pt-6 dark:border-white/10">
                  {user ? (
                    <div className="flex items-center gap-3 rounded-2xl bg-white/70 p-3 dark:bg-white/5">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-sm font-black text-white">{accountInitial}</span>
                      <div className="min-w-0 text-left">
                        <p className="truncate text-sm font-black text-ink dark:text-white">{accountName}</p>
                        {user.email ? <p className="truncate text-xs font-semibold text-zinc-500">{user.email}</p> : null}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-ink dark:text-white">Theme</span>
                    <div className="scale-90 origin-right">
                      <ThemeToggle />
                    </div>
                  </div>
                </div>

                {/* CTAs Section */}
                <div className="flex flex-col gap-3">
                  {user ? (
                    <>
                      {role === 'admin' ? (
                        <Button variant="ghost" className="w-full justify-center py-3 text-base" onClick={() => { closeMenu(); navigate('/admin') }}>
                          <Shield size={18} /> Admin Dashboard
                        </Button>
                      ) : null}
                      <Button variant="ghost" className="w-full justify-center py-3 text-base text-coral" onClick={handleLogout}>
                        <LogOut size={18} /> Logout
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" className="w-full justify-center py-3 text-base font-bold text-ink dark:text-white border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10" onClick={() => { closeMenu(); navigate('/auth') }}>Login to Account</Button>
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
