import { TemplateFrame } from './TemplateFrame'
import type { WishData } from '../../types'

export function BirthdayClassic({ data }: { data: WishData }) {
  return <TemplateFrame data={data} title="Happy Birthday" theme="bg-[radial-gradient(circle_at_top,#fff7d7,#ffe3e6_48%,#e9fbff)] text-ink dark:bg-[radial-gradient(circle_at_top,#4d2f8f,#171127_55%,#08060f)] dark:text-white" accent="bg-coral/20 text-coral dark:bg-sun/15 dark:text-sun" motif="confetti" />
}
