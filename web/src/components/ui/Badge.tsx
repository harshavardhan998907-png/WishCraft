import type { OccasionType, TemplateTier, WishStatus } from '../../types'

export function Badge({ children, tone = 'gray' }: { children: React.ReactNode; tone?: 'purple' | 'blue' | 'gray' | 'green' | 'yellow' | 'red' }) {
  const tones = {
    purple: 'bg-brand/10 text-brand dark:bg-brand/20 dark:text-[#c8c3ff]',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-200',
    gray: 'bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-white/75',
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200',
    yellow: 'bg-amber-100 text-amber-800 dark:bg-amber-300/15 dark:text-amber-200',
    red: 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200',
  }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${tones[tone]}`}>{children}</span>
}

export function TierBadge({ tier }: { tier: TemplateTier }) {
  return <Badge tone={tier === 'premium' ? 'purple' : tier === 'standard' ? 'blue' : 'gray'}>{tier}</Badge>
}

export function OccasionBadge({ occasion }: { occasion: OccasionType }) {
  return <Badge tone="yellow">{occasion.replace('_', ' ')}</Badge>
}

export function StatusBadge({ status }: { status: WishStatus }) {
  const tone = status === 'active' ? 'green' : status === 'expired' ? 'red' : status === 'draft' ? 'yellow' : 'gray'
  return <Badge tone={tone}>{status}</Badge>
}
