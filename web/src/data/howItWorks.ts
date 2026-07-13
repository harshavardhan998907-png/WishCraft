import { Heart, Layout, Link as LinkIcon, Play, LucideIcon } from 'lucide-react'

export interface HowItWorksStep {
  num: string
  title: string
  desc: string
  icon: LucideIcon
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  { num: '01', title: 'Choose Template', desc: 'Select from our gallery of premium, cinematic canvases.', icon: Layout },
  { num: '02', title: 'Personalize', desc: 'Add their name, a heartfelt message, and your favorite photos.', icon: Heart },
  { num: '03', title: 'Preview Experience', desc: 'See exactly how they will experience the surprise in real-time.', icon: Play },
  { num: '04', title: 'Share', desc: 'Send them a magical link that opens an unforgettable journey.', icon: LinkIcon },
]
