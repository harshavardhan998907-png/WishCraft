import { useEffect, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import { Button } from '../ui/Button'
import { useFocusTrap } from '../../hooks/useFocusTrap'

interface ValidationDialogProps {
  open: boolean
  missingFields: { id: string; label: string }[]
  onClose: () => void
  onGoToFields: () => void
}

export function ValidationDialog({ open, missingFields, onClose, onGoToFields }: ValidationDialogProps) {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            onMouseDown={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={focusTrapRef}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative z-50 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-premium dark:bg-ink dark:border dark:border-white/10"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-rose-100 p-3 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                  <AlertTriangle size={32} />
                </div>
                <h2 id={titleId} className="mb-2 text-xl font-heading font-bold text-ink dark:text-white">
                  Incomplete Information
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Before continuing, please complete the required information below.
                </p>
              </div>

              <div className="mb-8 space-y-2">
                {missingFields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50/50 p-3 px-4 text-sm font-medium text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/5 dark:text-rose-200"
                  >
                    <AlertCircle size={16} className="text-rose-500" />
                    <span>{field.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row-reverse">
                <Button onClick={onGoToFields} className="w-full shadow-soft sm:w-auto">
                  Go to Required Fields
                </Button>
                <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
