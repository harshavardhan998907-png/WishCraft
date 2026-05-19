import { TemplateFrame } from './TemplateFrame'
import type { WishData } from '../../types'

export function AnniversaryRomantic({ data }: { data: WishData }) {
  return <TemplateFrame data={data} title="Happy Anniversary" theme="bg-[radial-gradient(circle_at_top,#ffe6ef,#fff1f5_48%,#fffafc)] text-[#3b1724] dark:bg-[radial-gradient(circle_at_top,#5b163c,#21101b_56%,#0d0710)] dark:text-[#ffe8f0]" accent="bg-rose-400/15 text-rose-500 dark:bg-rose-300/15 dark:text-rose-200" motif="hearts" />
}
