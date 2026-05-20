import { ResponsiveModal } from '../responsive/ResponsiveModal'

export function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  return <ResponsiveModal open={open} title={title} onClose={onClose}>{children}</ResponsiveModal>
}
