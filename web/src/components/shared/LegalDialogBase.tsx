import { useEffect, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { Button } from '../ui/Button'
import { LegalSection } from '../../data/legalContent'
import { LegalAccordion } from './LegalAccordion'

export interface LegalDialogBaseProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle: string
  sections: LegalSection[]
  lastUpdated: string
}

export function LegalDialogBase({ open, onClose, title, subtitle, sections, lastUpdated }: LegalDialogBaseProps) {
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
            transition={{ duration: 0.25, ease: "easeInOut" }}
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
            transition={{ duration: 0.25, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-[800px] max-h-[92vh] sm:max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-[24px] sm:rounded-[28px] bg-white text-ink shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] dark:bg-[#12121a] dark:text-white dark:border dark:border-white/10"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 p-2 rounded-full bg-white/50 backdrop-blur-md border border-black/5 hover:bg-black/5 dark:bg-black/50 dark:border-white/10 dark:hover:bg-white/10 transition-colors"
              aria-label="Close dialog"
            >
              <X size={24} className="text-zinc-600 dark:text-zinc-400" />
            </button>

            <div className="p-5 sm:p-8 md:p-10 space-y-10 sm:space-y-12">
              
              {/* Header */}
              <header className="text-center space-y-4 pt-4 sm:pt-6">
                <h2 id={titleId} className="text-3xl sm:text-4xl font-heading font-black tracking-tight">
                  {title}
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
                  {subtitle}
                </p>
              </header>

              {/* Accordion Content */}
              <div className="w-full">
                <LegalAccordion sections={sections} />
              </div>

              {/* Footer Actions */}
              <div className="pt-8 sm:pt-10 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row sm:justify-end gap-4">
                <Button variant="secondary" className="w-full sm:w-auto" onClick={onClose}>
                  Close
                </Button>
              </div>

              {/* Attribution */}
              <footer className="pt-6 text-center space-y-2 pb-4">
                <p className="text-xs text-zinc-500">Last Updated: {lastUpdated}</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-600">Version 1.0</p>
              </footer>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
