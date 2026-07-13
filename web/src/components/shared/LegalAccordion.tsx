import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { LegalSection } from '../../data/legalContent'

interface LegalAccordionProps {
  sections: LegalSection[]
}

export function LegalAccordion({ sections }: LegalAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(sections[0]?.id || null)

  function toggle(id: string) {
    setOpenId(current => (current === id ? null : id))
  }

  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        const isOpen = openId === section.id
        return (
          <div 
            key={section.id} 
            className="rounded-2xl border border-black/5 dark:border-white/10 bg-zinc-50 dark:bg-white/5 overflow-hidden transition-colors hover:bg-zinc-100 dark:hover:bg-white/10"
          >
            <button
              onClick={() => toggle(section.id)}
              className="w-full flex items-center justify-between p-5 sm:p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 rounded-2xl"
              aria-expanded={isOpen}
              aria-controls={`accordion-content-${section.id}`}
            >
              <div className="flex items-center gap-4">
                <span className="text-brand/50 font-bold text-sm">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="font-bold text-ink dark:text-white text-base sm:text-lg">
                  {section.title}
                </span>
              </div>
              <ChevronDown 
                className={`text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand' : ''}`} 
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`accordion-content-${section.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-5 sm:p-6 pt-0 text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed border-t border-black/5 dark:border-white/5 mx-5 sm:mx-6 mt-1 pt-4">
                    {section.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
