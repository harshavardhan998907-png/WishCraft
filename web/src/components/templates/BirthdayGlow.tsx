import { motion } from 'framer-motion'
import { TemplateFrame } from './TemplateFrame'
import type { WishData } from '../../types'

export function BirthdayGlow({ data }: { data: WishData }) {
  return (
    <TemplateFrame data={data} title="Birthday Glow" theme="bg-[radial-gradient(circle_at_top,#4d2f8f,#171127_55%,#08060f)] text-white" accent="bg-sun/15 text-sun" motif="glow">
      <motion.div className="h-24 w-24 rounded-full bg-sun blur-xl" animate={{ opacity: [0.45, 1, 0.45], scale: [0.9, 1.2, 0.9] }} transition={{ repeat: Infinity, duration: 2 }} />
    </TemplateFrame>
  )
}
