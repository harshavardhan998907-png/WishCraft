import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { getShareableUrl } from '../lib/utils'
import type { OccasionType, Wish } from '../types'
import { Badge, StatusBadge } from '../components/ui/Badge'
import { useToastStore } from '../store/toastStore'
import {
  ArrowRight,
  CalendarHeart,
  Clock,
  Edit3,
  Eye,
  Gift,
  Heart,
  Image,
  PartyPopper,
  Share2,
  Sparkles,
} from 'lucide-react'

const quickActions: Array<{ title: string; occasion: OccasionType; description: string; icon: typeof Gift; tone: string }> = [
  {
    title: 'Create Birthday Wish',
    occasion: 'birthday',
    description: 'Build a joyful surprise with photos, music, and a warm message.',
    icon: Gift,
    tone: 'bg-coral/10 text-coral',
  },
  {
    title: 'Create Wedding Wish',
    occasion: 'wedding',
    description: 'Turn their love story into an elegant celebration page.',
    icon: Heart,
    tone: 'bg-brand/10 text-brand',
  },
  {
    title: 'Create Anniversary Wish',
    occasion: 'anniversary',
    description: 'Collect memories into a romantic keepsake they can revisit.',
    icon: CalendarHeart,
    tone: 'bg-sun/15 text-amber-700 dark:text-sun',
  },
]

function formatDate(value?: string | null) {
  if (!value) return 'Not updated yet'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function displayTitle(wish: Wish) {
  return wish.template?.name ? `${wish.template.name} for ${wish.recipient_name}` : `Wish for ${wish.recipient_name}`
}

export function Dashboard() {
  const { user, profile } = useAuth()
  const [wishes, setWishes] = useState<Wish[]>([])
  const toast = useToastStore()
  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  useEffect(() => {
    if (!user) return
    supabase.from('wishes').select('*, template:templates(*)').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) {
        console.warn('[Dashboard] wish list query failed', { userId: user.id, error })
        toast.push('error', error.message)
        return
      }
      console.info('[Dashboard] loaded wishes', { count: data?.length ?? 0 })
      setWishes((data as Wish[]) ?? [])
    })
  }, [toast, user])

  async function softDelete(id: string) {
    const confirmDelete = window.confirm('Are you sure you want to delete this wish experience? This will deactivate the link permanently.')
    if (!confirmDelete) return

    const { error } = await supabase.from('wishes').update({ status: 'deleted' }).eq('id', id)
    if (error) {
      console.warn('[Dashboard] soft delete failed', { id, error })
      toast.push('error', error.message)
    } else {
      setWishes((items) => items.map((wish) => wish.id === id ? { ...wish, status: 'deleted' } : wish))
      toast.push('success', 'Wish experience successfully deleted.')
    }
  }

  const handleShare = (slug: string) => {
    navigator.clipboard.writeText(getShareableUrl(slug)).then(() => toast.push('success', 'Wish link copied. Ready to share.'))
  }

  const visibleWishes = useMemo(() => wishes.filter((wish) => wish.status !== 'deleted'), [wishes])
  const draftWishes = useMemo(() => visibleWishes.filter((wish) => wish.status === 'draft').slice(0, 3), [visibleWishes])
  const recentWishes = useMemo(() => visibleWishes.slice(0, 6), [visibleWishes])
  const recentlyShared = useMemo(() => visibleWishes.filter((wish) => wish.status === 'active').slice(0, 3), [visibleWishes])
  const activeWishes = useMemo(() => visibleWishes.filter((wish) => wish.status === 'active'), [visibleWishes])
  const draftWishCount = useMemo(() => visibleWishes.filter((wish) => wish.status === 'draft').length, [visibleWishes])

  return (
    <div className="min-h-screen overflow-x-hidden bg-soft-cream pb-24 dark:bg-deep-navy">
      <header className="border-b border-black/5 bg-white/70 px-4 py-8 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:px-6 lg:py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge tone="yellow">Celebration workspace</Badge>
            <h1 className="mt-4 text-3xl font-black tracking-normal text-ink dark:text-white sm:text-4xl lg:text-5xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-zinc-600 dark:text-white/70">
              Create, edit, and share heartfelt wish websites from one calm little studio.
            </p>
          </div>
          <Link
            to="/browse"
            className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 font-black text-white shadow-premium shadow-brand/20 transition hover:bg-[#5244c4] sm:w-auto"
          >
            <Sparkles size={18} /> Create Wish
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:py-10">
        {draftWishes.length > 0 ? (
          <section aria-labelledby="continue-editing-title" className="rounded-2xl border border-brand/15 bg-brand/5 p-5 dark:bg-brand/10 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white">
                <Edit3 size={18} />
              </span>
              <div>
                <h2 id="continue-editing-title" className="text-2xl font-black text-ink dark:text-white">Continue Editing</h2>
                <p className="text-sm font-semibold text-zinc-500">Unfinished wishes waiting for their final sparkle.</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {draftWishes.map((wish) => (
                <Link key={wish.id} to={wish.template?.slug ? `/editor/${wish.template.slug}` : '/browse'} className="focus-ring flex min-h-24 items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-soft dark:bg-[#181824]">
                  <span className="min-w-0">
                    <span className="block truncate font-black text-ink dark:text-white">{displayTitle(wish)}</span>
                    <span className="mt-1 flex items-center gap-1 text-xs font-bold text-zinc-500"><Clock size={13} /> Updated {formatDate(wish.created_at)}</span>
                  </span>
                  <ArrowRight size={18} className="shrink-0 text-brand" />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="quick-actions-title">
          <div className="mb-4 flex flex-col gap-1">
            <h2 id="quick-actions-title" className="text-2xl font-black text-ink dark:text-white">Quick Actions</h2>
            <p className="text-sm font-semibold text-zinc-500">Start with the moments people remember most.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to="/browse"
                    className="focus-ring group flex h-full min-h-[12rem] flex-col justify-between rounded-2xl border border-black/10 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-premium dark:border-white/10 dark:bg-[#181824]"
                    aria-label={`${action.title}. Browse ${action.occasion} templates.`}
                  >
                    <span className={`grid h-12 w-12 place-items-center rounded-xl ${action.tone}`}>
                      <Icon size={22} />
                    </span>
                    <span>
                      <span className="block text-xl font-black text-ink dark:text-white">{action.title}</span>
                      <span className="mt-2 block text-sm font-medium leading-6 text-zinc-600 dark:text-white/68">{action.description}</span>
                    </span>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-brand">
                      Choose template <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                    </span>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </section>

        <section id="wishes" aria-labelledby="my-wishes-title" className="scroll-mt-24">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="my-wishes-title" className="text-2xl font-black text-ink dark:text-white">My Wishes</h2>
              <p className="text-sm font-semibold text-zinc-500">Your latest celebration websites, ready to preview, edit, and share.</p>
            </div>
            <Link to="/browse" className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-black text-ink transition hover:bg-black/5 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
              <Sparkles size={16} /> New Wish
            </Link>
          </div>

          {visibleWishes.length === 0 ? (
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-[#181824] sm:p-8">
              <div className="grid gap-6 md:grid-cols-[1fr_16rem] md:items-center">
                <div>
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
                    <PartyPopper size={26} />
                  </div>
                  <h3 className="mt-5 text-2xl font-black text-ink dark:text-white">Your first wish starts here</h3>
                  <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-zinc-600 dark:text-white/68">
                    Pick a template, add your message and memories, then share a private celebration link.
                  </p>
                </div>
                <Link to="/browse" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 font-black text-white transition hover:bg-black dark:bg-white dark:text-ink dark:hover:bg-white/85">
                  Start Creating <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {recentWishes.map((wish, index) => (
                <motion.article
                  key={wish.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-soft dark:border-white/10 dark:bg-[#181824]"
                >
                  <div className="relative aspect-[16/10] bg-zinc-100 dark:bg-white/5">
                    {wish.template?.thumbnail_url ? (
                      <img src={wish.template.thumbnail_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-brand">
                        <Image size={38} aria-hidden="true" />
                      </div>
                    )}
                    <div className="absolute left-3 top-3">
                      <StatusBadge status={wish.status} />
                    </div>
                  </div>
                  <div className="space-y-4 p-4">
                    <div>
                      <h3 className="line-clamp-2 text-lg font-black text-ink dark:text-white">{displayTitle(wish)}</h3>
                      <p className="mt-1 text-sm font-semibold text-zinc-500">Last updated {formatDate(wish.activated_at ?? wish.created_at)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-zinc-500">
                      {wish.template?.occasion ? <span className="rounded-full bg-brand/10 px-2.5 py-1 capitalize text-brand">{wish.template.occasion.replace('_', ' ')}</span> : null}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Link to={`/w/${wish.slug}`} className="focus-ring inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-zinc-100 px-2 text-sm font-black text-ink transition hover:bg-zinc-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
                        <Eye size={15} /> Preview
                      </Link>
                      <Link to={wish.template?.slug ? `/editor/${wish.template.slug}` : '/browse'} className="focus-ring inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-zinc-100 px-2 text-sm font-black text-ink transition hover:bg-zinc-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
                        <Edit3 size={15} /> Edit
                      </Link>
                      <button
                        type="button"
                        className="focus-ring inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-brand px-2 text-sm font-black text-white transition hover:bg-[#5244c4]"
                        onClick={() => handleShare(wish.slug)}
                      >
                        <Share2 size={15} /> Share
                      </button>
                    </div>
                    {wish.status === 'deleted' ? null : (
                      <button type="button" className="text-xs font-bold text-zinc-400 underline-offset-4 hover:text-coral hover:underline" onClick={() => softDelete(wish.id)}>
                        Deactivate wish
                      </button>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="activity-title" className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-[#181824]">
            <h2 id="activity-title" className="text-xl font-black text-ink dark:text-white">Recent Activity</h2>
            <div className="mt-4 space-y-3">
              {recentWishes.slice(0, 4).map((wish) => (
                <div key={wish.id} className="flex items-start gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-white/5">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sun/15 text-amber-700 dark:text-sun">
                    <Clock size={15} />
                  </span>
                  <p className="min-w-0 text-sm font-semibold leading-6 text-zinc-600 dark:text-white/68">
                    Recently edited <span className="font-black text-ink dark:text-white">{displayTitle(wish)}</span>
                  </p>
                </div>
              ))}
              {recentWishes.length === 0 ? <p className="text-sm font-semibold text-zinc-500">No recent edits yet.</p> : null}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-[#181824]">
            <h2 className="text-xl font-black text-ink dark:text-white">Recently Shared Wishes</h2>
            <div className="mt-4 space-y-3">
              {recentlyShared.map((wish) => (
                <button
                  key={wish.id}
                  type="button"
                  className="focus-ring flex w-full items-center justify-between gap-3 rounded-xl bg-zinc-50 p-3 text-left transition hover:bg-zinc-100 dark:bg-white/5 dark:hover:bg-white/10"
                  onClick={() => handleShare(wish.slug)}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-ink dark:text-white">{displayTitle(wish)}</span>
                    <span className="text-xs font-bold text-zinc-500">Copy share link</span>
                  </span>
                  <Share2 size={16} className="shrink-0 text-brand" />
                </button>
              ))}
              {recentlyShared.length === 0 ? <p className="text-sm font-semibold text-zinc-500">Share an active wish and it will appear here.</p> : null}
            </div>
          </div>
        </section>

        <section aria-labelledby="stats-title" className="opacity-80">
          <h2 id="stats-title" className="mb-4 text-base font-black text-zinc-500 dark:text-white/60">Studio Snapshot</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['Total Wishes', visibleWishes.length],
              ['Active Wishes', activeWishes.length],
              ['Drafts', draftWishCount],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-black/5 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-black uppercase tracking-wide text-zinc-400">{label}</p>
                <p className="mt-1 text-2xl font-black text-ink dark:text-white">{value}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
