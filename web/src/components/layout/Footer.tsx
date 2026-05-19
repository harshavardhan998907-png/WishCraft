import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-black/10 bg-white px-4 py-10 transition-colors dark:border-white/10 dark:bg-[#10101a]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-zinc-600 md:flex-row md:items-center md:justify-between dark:text-white/60">
        <p className="font-semibold text-ink dark:text-white">Template Hub</p>
        <p>Beautiful wishes, live for 7 days.</p>
        <Link to="/browse" className="font-semibold text-brand">Browse templates</Link>
      </div>
    </footer>
  )
}
