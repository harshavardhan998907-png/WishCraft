import { TemplateFrame } from './TemplateFrame'
import type { WishData } from '../../types'

export function WeddingElegant({ data }: { data: WishData }) {
  return <TemplateFrame data={data} title="A Beautiful Beginning" theme="bg-[linear-gradient(135deg,#fffdf6,#f6ead3_48%,#fff8ef)] text-[#3a3024] dark:bg-[linear-gradient(135deg,#16101a,#2a1730_50%,#3a2b20)] dark:text-[#fff4df]" accent="bg-[#c9a24d]/15 text-[#a77f2d] dark:bg-sun/15 dark:text-sun" motif="petals" />
}
