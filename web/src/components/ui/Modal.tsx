import { useEffect } from 'react'

export function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/45 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="w-full max-w-lg rounded-lg bg-white p-6 text-ink shadow-soft transition-colors dark:border dark:border-white/10 dark:bg-[#181824] dark:text-white" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button className="focus-ring rounded-md px-2 py-1 text-zinc-600 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  )
}
