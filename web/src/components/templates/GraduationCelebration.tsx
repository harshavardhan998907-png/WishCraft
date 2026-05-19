import { TemplateFrame } from './TemplateFrame'
import type { WishData } from '../../types'

export function GraduationCelebration({ data }: { data: WishData }) {
  return <TemplateFrame data={data} title="Congratulations Graduate" theme="bg-[radial-gradient(circle_at_top,#e7fbff,#eaf7ff_50%,#fff8ec)] text-[#102033] dark:bg-[radial-gradient(circle_at_top,#183a52,#101827_54%,#080812)] dark:text-[#effbff]" accent="bg-mint/15 text-mint dark:bg-mint/15 dark:text-mint" motif="stars" />
}
