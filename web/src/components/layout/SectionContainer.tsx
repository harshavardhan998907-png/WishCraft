import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useNavigationStore } from '../../store/navigationStore'

interface SectionContainerProps {
  id: string
  className?: string
  children: ReactNode
}

export function SectionContainer({ id, className = '', children }: SectionContainerProps) {
  const activeSection = useNavigationStore(state => state.activeSection)
  const isActive = activeSection === id

  return (
    <motion.section
      id={id}
      aria-current={isActive ? 'location' : undefined}
      className={`scroll-mt-20 flex-shrink-0 ${className}`}
      initial={{ opacity: 0.95, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  )
}
