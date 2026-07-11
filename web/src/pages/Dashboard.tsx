import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { Badge } from '../components/ui/Badge'
import { Sparkles, ArrowRight, LayoutTemplate, Activity, TrendingUp, AlertCircle, FileText, CheckCircle2 } from 'lucide-react'
import { useSectionObserver } from '../hooks/useSectionObserver'
import { SectionContainer } from '../components/layout/SectionContainer'
import { Button } from '../components/ui/Button'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTemplates } from '../hooks/useTemplates'
import { useUserWishes } from '../hooks/useUserWishes'
import { Skeleton } from '../components/ui/Skeleton'
import { WishCard } from '../components/wishes/WishCard'

const DASHBOARD_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'wishes', label: 'My Wishes' },
  { id: 'templates', label: 'Templates' }
]

export function Dashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const { templates, loading: templatesLoading, error: templatesError } = useTemplates()
  const { wishes, loading: wishesLoading, error: wishesError } = useUserWishes()
  
  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'
  
  useSectionObserver(DASHBOARD_SECTIONS)

  const activeTab = searchParams.get('tab') === 'published' ? 'published' : 'drafts'
  
  const draftWishes = wishes.filter(w => w.status === 'draft')
  const publishedWishes = wishes.filter(w => w.status === 'active' || w.status === 'expired')
  
  const displayedWishes = activeTab === 'drafts' ? draftWishes : publishedWishes
  
  const handleTabChange = (tab: 'drafts' | 'published') => {
    // Preserve existing hash
    const hash = window.location.hash
    setSearchParams({ tab })
    if (hash && window.history.replaceState) {
      setTimeout(() => {
        window.history.replaceState(null, '', `?tab=${tab}${hash}`)
      }, 0)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-soft-cream dark:bg-deep-navy flex flex-col">
      {/* SECTION 1: Overview */}
      <SectionContainer id="overview" className="pt-8 pb-16 lg:py-16 bg-soft-cream dark:bg-deep-navy">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10">
            <Badge tone="yellow">OVERVIEW</Badge>
            <h1 className="mt-4 text-3xl font-black tracking-normal text-ink dark:text-white sm:text-4xl lg:text-5xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-zinc-600 dark:text-white/70">
              Your quick stats and recent activity. Let's create something beautiful today.
            </p>
          </div>
          
          {/* Quick Stats Scaffold */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Total Wishes', value: '0', icon: <Sparkles size={20} className="text-brand" /> },
              { label: 'Total Views', value: '0', icon: <TrendingUp size={20} className="text-brand" /> },
              { label: 'Active Drafts', value: '0', icon: <Activity size={20} className="text-brand" /> },
            ].map((stat, i) => (
              <div key={i} className="rounded-2xl border border-black/5 bg-white p-6 shadow-soft dark:border-white/5 dark:bg-ink">
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand/10 dark:bg-brand/20">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">{stat.label}</p>
                    <p className="text-3xl font-black text-ink dark:text-white">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionContainer>

      {/* SECTION 2: My Wishes */}
      <SectionContainer id="wishes" className="bg-white py-16 dark:bg-ink">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-center justify-between border-b border-black/5 pb-6 dark:border-white/10 sticky top-16 z-20 bg-white/90 backdrop-blur-md py-4 dark:bg-ink/90">
            <div>
              <h2 className="text-2xl font-black text-ink dark:text-white">My Wishes</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Manage your created wishes</p>
            </div>
            <div className="flex gap-2" role="tablist">
              <button 
                role="tab"
                aria-selected={activeTab === 'drafts'}
                tabIndex={0}
                onClick={() => handleTabChange('drafts')}
                className={`px-4 py-2 text-sm font-bold rounded-full transition focus-ring ${activeTab === 'drafts' ? 'bg-zinc-100 text-ink dark:bg-white/10 dark:text-white' : 'text-zinc-500 hover:text-ink dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
              >
                Drafts <span className="ml-1 opacity-60 text-xs">({wishesLoading ? '-' : draftWishes.length})</span>
              </button>
              <button 
                role="tab"
                aria-selected={activeTab === 'published'}
                tabIndex={0}
                onClick={() => handleTabChange('published')}
                className={`px-4 py-2 text-sm font-bold rounded-full transition focus-ring ${activeTab === 'published' ? 'bg-zinc-100 text-ink dark:bg-white/10 dark:text-white' : 'text-zinc-500 hover:text-ink dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
              >
                Published <span className="ml-1 opacity-60 text-xs">({wishesLoading ? '-' : publishedWishes.length})</span>
              </button>
            </div>
          </div>
          
          {wishesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-[240px] w-full rounded-3xl" />)}
            </div>
          ) : wishesError ? (
            <div className="rounded-2xl bg-red-50 p-6 text-red-600 border border-red-100 flex items-center justify-center gap-2 dark:bg-red-950/20 dark:border-red-900/50 my-8">
              <AlertCircle size={20} /> Failed to load wishes. <Button variant="secondary" size="sm" className="ml-4" onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : displayedWishes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
              {displayedWishes.map(wish => (
                <WishCard key={wish.id} wish={wish} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-16 text-center dark:border-white/10 dark:bg-white/5 my-8 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,.05),transparent_60%)] pointer-events-none" />
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner relative z-10 ${activeTab === 'drafts' ? 'bg-zinc-200/50 text-zinc-500 dark:bg-white/10 dark:text-zinc-400' : 'bg-brand/10 text-brand'}`}>
                {activeTab === 'drafts' ? <FileText size={32} /> : <CheckCircle2 size={32} />}
              </div>
              <h3 className="text-2xl font-black text-ink dark:text-white mb-2 relative z-10">
                {activeTab === 'drafts' ? 'No draft wishes yet' : 'No published wishes yet'}
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto text-base font-medium leading-relaxed mb-8 relative z-10">
                {activeTab === 'drafts' 
                  ? 'Start building your personalized memory. It will be saved here as a draft.' 
                  : 'Publish a wish to make it available for sharing.'}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                {activeTab === 'drafts' ? (
                  <>
                    <Button onClick={() => navigate('/browse#templates-gallery')} size="lg" className="rounded-full shadow-premium">
                      Create Wish
                    </Button>
                    <Button variant="secondary" onClick={() => navigate('/browse')} size="lg" className="rounded-full">
                      Browse Templates
                    </Button>
                  </>
                ) : (
                  <>
                    {draftWishes.length > 0 ? (
                      <Button onClick={() => handleTabChange('drafts')} size="lg" className="rounded-full shadow-premium">
                        Publish a Draft
                      </Button>
                    ) : (
                      <Button onClick={() => navigate('/browse#templates-gallery')} size="lg" className="rounded-full shadow-premium">
                        Create Wish
                      </Button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </SectionContainer>

      {/* SECTION 3: Templates */}
      <SectionContainer id="templates" className="bg-zinc-50 py-16 dark:bg-[#151522]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-ink dark:text-white">Featured Templates</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Discover handpicked designs</p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/browse')} className="text-brand">
              View All <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
          
          {templatesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-[280px] w-full rounded-3xl" />)}
            </div>
          ) : templatesError ? (
            <div className="rounded-2xl bg-red-50 p-6 text-red-600 border border-red-100 flex items-center justify-center gap-2 dark:bg-red-950/20 dark:border-red-900/50">
              <AlertCircle size={20} /> Failed to load templates. <Button variant="secondary" size="sm" className="ml-4">Retry</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.slice(0, 3).map((template) => (
                <div key={template.id} onClick={() => navigate(`/editor/${template.slug}`)} className="group cursor-pointer relative flex flex-col rounded-3xl border border-black/5 bg-white shadow-soft overflow-hidden dark:border-white/5 dark:bg-ink hover:-translate-y-1 hover:shadow-premium transition-all duration-300">
                  <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-white/5 overflow-hidden">
                    <img
                      src={template.thumbnail_url || undefined}
                      alt={template.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-black text-ink dark:text-white group-hover:text-brand transition-colors">{template.name}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{template.description || 'Create a premium customized page.'}</p>
                  </div>
                </div>
              ))}
              
              {templates.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-zinc-200 p-12 text-center text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                  <LayoutTemplate size={32} className="mx-auto mb-4 opacity-50" />
                  <p>No featured templates available.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </SectionContainer>
    </div>
  )
}
