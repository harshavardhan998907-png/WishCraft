import { motion } from 'framer-motion'
import { useTheme } from '../../theme/ThemeProvider'

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 7 7 0 1 0 20.5 14.5Z" />
    </svg>
  )
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const dark = theme === 'dark'

  return (
    <button
      type="button"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={dark}
      onClick={toggleTheme}
      className="focus-ring relative inline-flex h-10 w-20 items-center rounded-full border border-black/10 bg-white/80 p-1 text-ink shadow-sm transition dark:border-white/10 dark:bg-white/10 dark:text-white"
    >
      <span className="absolute left-3 text-sun"><SunIcon /></span>
      <span className="absolute right-3 text-brand dark:text-white/80"><MoonIcon /></span>
      <motion.span
        className="relative z-10 grid h-8 w-8 place-items-center rounded-full bg-ink text-white shadow-soft dark:bg-sun dark:text-ink"
        animate={{ x: dark ? 38 : 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      >
        {dark ? <MoonIcon /> : <SunIcon />}
      </motion.span>
    </button>
  )
}
