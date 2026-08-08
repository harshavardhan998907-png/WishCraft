import { LegalDialogBase } from './LegalDialogBase'
import { TERMS_OF_SERVICE } from '../../data/legalContent'

interface TermsOfServiceDialogProps {
  open: boolean
  onClose: () => void
}

export function TermsOfServiceDialog({ open, onClose }: TermsOfServiceDialogProps) {
  return (
    <LegalDialogBase
      open={open}
      onClose={onClose}
      title="Terms of Service"
      subtitle="Understand the rules that keep WishCraft safe and enjoyable for everyone."
      sections={TERMS_OF_SERVICE}
      lastUpdated="October 2023"
    />
  )
}
