import { getTemplateComponent } from '../templates/registry'
import type { Template, WishData } from '../../types'
import { Suspense } from 'react'
import { motion } from 'framer-motion'

export function LivePreview({ template, data }: { template: Template | null; data: WishData }) {
  const Component = template ? getTemplateComponent(template.component_name) : null
  if (!Component) {
    return <div className="grid min-h-[520px] place-items-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-white/55">Choose a template to preview</div>
  }
  return (
    <motion.div className="overflow-hidden rounded-xl border border-white/70 bg-white shadow-premium dark:border-white/10 dark:bg-[#10101a]" animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity }}>
      <Suspense fallback={<div className="grid min-h-[520px] place-items-center bg-cream font-bold text-zinc-500 dark:bg-[#10101a] dark:text-white/60">Loading template...</div>}>
        <Component data={data} />
      </Suspense>
    </motion.div>
  )
}
