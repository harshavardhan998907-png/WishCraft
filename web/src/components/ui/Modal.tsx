import { ResponsiveModal } from '../responsive/ResponsiveModal'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  subtitle?: string
  footer?: React.ReactNode
  customHeader?: React.ReactNode
  maxWidth?: string
  showCloseButton?: boolean
}

export function Modal({
  open,
  onClose,
  children,
  title,
  subtitle,
  footer,
  customHeader,
  maxWidth,
  showCloseButton
}: ModalProps) {
  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      footer={footer}
      customHeader={customHeader}
      maxWidth={maxWidth}
      showCloseButton={showCloseButton}
    >
      {children}
    </ResponsiveModal>
  )
}
