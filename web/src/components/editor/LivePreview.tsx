import type { Template, WishData } from '../../types'
import { motion } from 'framer-motion'
import { TemplateRenderer, wishDataToTemplateProps } from '../../template-engine'

export function LivePreview({ template, data }: { template: Template | null; data: WishData }) {
  if (!template) {
    return <div className="grid min-h-[520px] place-items-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-white/55">Choose a template to preview</div>
  }
  return (
    <motion.div className="h-full w-full overflow-y-auto overflow-x-hidden rounded-xl border border-white/70 bg-white shadow-premium dark:border-white/10 dark:bg-[#10101a] scrollbar-thin" animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity }}>
      <TemplateRenderer
        templateId={template.slug}
        componentKey={template.component_key ?? template.component_name}
        slug={template.slug}
        props={wishDataToTemplateProps(data, true)}
      />
    </motion.div>
  )
}
