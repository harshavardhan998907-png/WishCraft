import { useEffect, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useFocusTrap } from '../../hooks/useFocusTrap'

interface ResponsiveModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  subtitle?: string
  footer?: React.ReactNode
  customHeader?: React.ReactNode
  maxWidth?: string // default "max-w-lg"
  showCloseButton?: boolean
}

export function ResponsiveModal({
  open,
  onClose,
  children,
  title,
  subtitle,
  footer,
  customHeader,
  maxWidth = 'max-w-lg',
  showCloseButton = true
}: ResponsiveModalProps) {
  const titleId = useId()
  const focusTrapRef = useFocusTrap(open)

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

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center p-4 sm:p-6 md:p-8">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            ref={focusTrapRef}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={`relative w-full ${maxWidth} max-h-[92vh] sm:max-h-[90vh] rounded-[24px] sm:rounded-[28px] bg-white text-ink shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] dark:bg-[#12121a] dark:text-white dark:border dark:border-white/10 overflow-hidden flex flex-col`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {/* Close Button */}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/50 backdrop-blur-md border border-black/5 hover:bg-black/5 dark:bg-black/50 dark:border-white/10 dark:hover:bg-white/10 transition-colors focus-ring"
                aria-label="Close dialog"
              >
                <X size={20} className="text-zinc-600 dark:text-zinc-400" />
              </button>
            )}

            {/* Header (Fixed) */}
            {(title || customHeader) && (
              <div className="p-5 sm:p-6 border-b border-black/5 dark:border-white/5 shrink-0 z-10 flex flex-col gap-1.5 pr-14">
                {customHeader ? (
                  customHeader
                ) : (
                  <>
                    <h2 id={titleId} className="text-xl sm:text-2xl font-heading font-black tracking-tight text-ink dark:text-white">
                      {title}
                    </h2>
                    {subtitle && (
                      <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
                        {subtitle}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1.5 p-5 sm:p-8 md:p-10">
              {children}
            </div>

            {/* Footer (Fixed) */}
            {footer && (
              <div className="p-4 sm:p-6 border-t border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-white/[0.02] flex justify-end gap-3 shrink-0 z-10">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
