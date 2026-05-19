import { motion } from 'framer-motion'
import { TemplateFrame } from './TemplateFrame'
import type { WishData } from '../../types'

export function FestivalDiwali({ data }: { data: WishData }) {
  return (
    <TemplateFrame data={data} title="Festival Wishes" theme="bg-[radial-gradient(circle_at_top,#7b2f14,#24120b_55%,#0f0805)] text-[#fff1cc]" accent="bg-orange-400/15 text-orange-300" motif="sparks">
      <motion.div className="rounded-full border-4 border-orange-300 px-8 py-3 text-2xl font-black" animate={{ boxShadow: ['0 0 0px #ffbd4a', '0 0 34px #ffbd4a', '0 0 0px #ffbd4a'] }} transition={{ repeat: Infinity, duration: 2 }}>
        Shine bright
      </motion.div>
    </TemplateFrame>
  )
}
