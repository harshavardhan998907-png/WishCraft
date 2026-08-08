import { LegalDialogBase } from './LegalDialogBase'
import { PRIVACY_POLICY } from '../../data/legalContent'

interface PrivacyPolicyDialogProps {
  open: boolean
  onClose: () => void
}

export function PrivacyPolicyDialog({ open, onClose }: PrivacyPolicyDialogProps) {
  return (
    <LegalDialogBase
      open={open}
      onClose={onClose}
      title="Privacy Policy"
      subtitle="Your privacy matters to us."
      sections={PRIVACY_POLICY}
      lastUpdated="October 2023"
    />
  )
}
