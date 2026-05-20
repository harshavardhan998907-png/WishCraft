import { useEffect } from 'react'

interface ResponsiveModalProps {
  open: boolean
  title: string
  children: React.ReactNode
  onClose: () => void
}

export function ResponsiveModal({ open, title, children, onClose }: ResponsiveModalProps) {
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    const handler = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handler)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-black/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-4" onMouseDown={onClose}>
      <div
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-lg bg-white p-4 text-ink shadow-soft transition-colors dark:border dark:border-white/10 dark:bg-[#181824] dark:text-white sm:max-w-lg sm:rounded-lg sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="responsive-modal-title"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="responsive-modal-title" className="text-lg font-black sm:text-xl">{title}</h2>
          <button className="focus-ring min-h-11 rounded-md px-3 py-2 text-sm font-bold text-zinc-600 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  )
}
