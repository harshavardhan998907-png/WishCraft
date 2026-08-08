import { ResponsiveModal } from '../responsive/ResponsiveModal'
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
  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxWidth="max-w-[800px]"
      footer={
        <Button variant="secondary" className="w-full sm:w-auto" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-10 pt-2">
        {/* Accordion Content */}
        <div className="w-full">
          <LegalAccordion sections={sections} />
        </div>

        {/* Attribution */}
        <footer className="pt-6 text-center space-y-2 pb-4 border-t border-black/5 dark:border-white/5">
          <p className="text-xs text-zinc-500">Last Updated: {lastUpdated}</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600">Version 1.0</p>
        </footer>
      </div>
    </ResponsiveModal>
  )
}
