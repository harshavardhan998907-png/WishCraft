import { useEffect } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap'

interface MobileDrawerProps {
  open: boolean
  title: string
  children: React.ReactNode
  onClose: () => void
}

export function MobileDrawer({ open, title, children, onClose }: MobileDrawerProps) {
  const focusTrapRef = useFocusTrap(open)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  return (
    <div className={`fixed inset-0 z-50 lg:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <button
        type="button"
        className={`absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        aria-label="Close navigation"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />
      <aside
        ref={focusTrapRef}
        className={`absolute left-0 top-0 h-full w-[min(82vw,320px)] overflow-y-auto border-r border-black/10 bg-cream p-4 shadow-premium transition-transform duration-200 dark:border-white/10 dark:bg-[#10101a] ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-ink dark:text-white">{title}</h2>
          <button type="button" className="focus-ring min-h-11 rounded-xl px-3 text-sm font-bold text-ink hover:bg-black/5 dark:text-white dark:hover:bg-white/10" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </aside>
    </div>
  )
}
