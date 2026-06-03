import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { getShareableUrl, getTimeRemaining } from '../lib/utils'
import type { Wish } from '../types'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import { useToastStore } from '../store/toastStore'
import { NotificationCenter } from '../modules/notifications/components/NotificationCenter'
import { Sparkles, Copy, Trash2, Eye, Share2, Plus, Settings, CreditCard, Clock, Activity } from 'lucide-react'

export function Dashboard() {
  const { user } = useAuth()
  const [wishes, setWishes] = useState<Wish[]>([])
  const toast = useToastStore()

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
  }, [user])

  async function softDelete(id: string) {
    const confirmDelete = window.confirm("Are you sure you want to delete this wish experience? This will deactivate the link permanently.")
    if (!confirmDelete) return

    const { error } = await supabase.from('wishes').update({ status: 'deleted' }).eq('id', id)
    if (error) {
      console.warn('[Dashboard] soft delete failed', { id, error })
      toast.push('error', error.message)
    }
    else {
      setWishes((items) => items.map((wish) => wish.id === id ? { ...wish, status: 'deleted' } : wish))
      toast.push('success', 'Wish experience successfully deleted.')
    }
  }

  const handleCopy = (slug: string) => {
    navigator.clipboard.writeText(getShareableUrl(slug)).then(() => toast.push('success', 'Link copied to clipboard!'))
  }

  // Calculate Mock Analytics
  const activeWishes = useMemo(() => wishes.filter(w => w.status === 'active' && (!w.expires_at || new Date(w.expires_at) > new Date())), [wishes])
  const totalViews = useMemo(() => wishes.reduce((acc, curr) => acc + Math.floor(Math.random() * 100), 0), [wishes]) // Mock views
  
  return (
    <div className="min-h-screen bg-soft-cream dark:bg-deep-navy pb-24">
      {/* Dashboard Header */}
      <header className="bg-ink dark:bg-rich-purple-black text-white px-6 py-12 relative overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,.1),transparent_40rem)]" />
         <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
           <div>
             <h1 className="text-3xl md:text-5xl font-heading font-black">Your Studio</h1>
             <p className="text-white/60 mt-2 font-medium">Manage your magical moments and track their impact.</p>
           </div>
           <div className="flex flex-wrap items-center gap-3">
             <Link to="/notifications/preferences">
               <button className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors" title="Settings"><Settings size={20}/></button>
             </Link>
             <Link to="/payments">
               <button className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors" title="Payments"><CreditCard size={20}/></button>
             </Link>
             <Link to="/browse">
               <Button className="px-6 py-3 rounded-xl shadow-premium shadow-brand/20 flex items-center gap-2">
                 <Plus size={20} /> Create New
               </Button>
             </Link>
           </div>
         </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 -mt-8 relative z-20 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-2xl p-6 shadow-soft bg-gradient-to-br from-white to-soft-cream dark:from-ink dark:to-rich-purple-black border border-white/40 dark:border-white/10">
            <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-4 shadow-inner"><Sparkles size={22}/></div>
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Wishes Created</p>
            <p className="text-4xl font-black mt-1 text-ink dark:text-white">{wishes.length}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-2xl p-6 shadow-soft bg-gradient-to-br from-white to-soft-cream dark:from-ink dark:to-rich-purple-black border border-white/40 dark:border-white/10">
            <div className="w-12 h-12 rounded-xl bg-mint/10 text-mint flex items-center justify-center mb-4 shadow-inner"><Activity size={22}/></div>
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Active Celebrations</p>
            <p className="text-4xl font-black mt-1 text-ink dark:text-white">{activeWishes.length}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel rounded-2xl p-6 shadow-soft bg-gradient-to-br from-white to-soft-cream dark:from-ink dark:to-rich-purple-black border border-white/40 dark:border-white/10">
            <div className="w-12 h-12 rounded-xl bg-sun/10 text-sun flex items-center justify-center mb-4 shadow-inner"><Eye size={22}/></div>
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Total Views</p>
            <p className="text-4xl font-black mt-1 text-ink dark:text-white">{totalViews}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel rounded-2xl p-6 shadow-soft bg-gradient-to-br from-white to-soft-cream dark:from-ink dark:to-rich-purple-black border border-white/40 dark:border-white/10">
            <div className="w-12 h-12 rounded-xl bg-coral/10 text-coral flex items-center justify-center mb-4 shadow-inner"><Share2 size={22}/></div>
            <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Views Shared</p>
            <p className="text-4xl font-black mt-1 text-ink dark:text-white">{Math.floor(totalViews * 0.4)}</p>
          </motion.div>
        </div>

        <div className="mt-8">
           <NotificationCenter />
        </div>

        {/* Recent Wishes */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-black flex items-center gap-2 text-ink dark:text-white">
              Recent Celebrations
            </h2>
          </div>

          {wishes.length === 0 ? (
            <div className="glass-panel rounded-3xl p-8 md:p-12 bg-white/60 dark:bg-ink/60 border border-zinc-200 dark:border-white/10 shadow-premium overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 text-center md:text-left">
                  <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-6 shadow-inner mx-auto md:mx-0"><Sparkles size={28}/></div>
                  <h3 className="text-3xl font-heading font-black text-ink dark:text-white mb-3">Welcome to your studio</h3>
                  <p className="text-zinc-500 max-w-md mx-auto md:mx-0 mb-8 text-lg">Your dashboard is waiting for its first moment of magic. Ready to make someone's day?</p>
                  <Link to="/browse">
                    <Button size="lg" className="rounded-xl px-8 shadow-premium shadow-brand/30 w-full md:w-auto">Start Creating</Button>
                  </Link>
                </div>
                <div className="flex-1 w-full space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/80 dark:bg-white/5 border border-white/20 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center shrink-0 font-bold">1</div>
                    <div>
                      <h4 className="font-bold text-ink dark:text-white">Choose a template</h4>
                      <p className="text-sm text-zinc-500">Pick from our premium collection of animated experiences.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/80 dark:bg-white/5 border border-white/20 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center shrink-0 font-bold">2</div>
                    <div>
                      <h4 className="font-bold text-ink dark:text-white">Personalize it</h4>
                      <p className="text-sm text-zinc-500">Add photos, music, and a heartfelt message.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/80 dark:bg-white/5 border border-white/20 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-brand/20 text-brand flex items-center justify-center shrink-0 font-bold">3</div>
                    <div>
                      <h4 className="font-bold text-ink dark:text-white">Share the magic</h4>
                      <p className="text-sm text-zinc-500">Send the private link and watch them smile.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishes.map((wish, index) => (
                <motion.div 
                  key={wish.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="group glass-panel rounded-2xl overflow-hidden shadow-soft hover:shadow-premium bg-white dark:bg-ink transition-all flex flex-col"
                >
                  {/* Thumbnail Area */}
                  <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                    <img src={wish.template?.thumbnail_url ?? ''} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent opacity-60" />
                    <div className="absolute top-3 left-3">
                      <StatusBadge status={wish.status} />
                    </div>
                    {wish.status !== 'deleted' && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-10">
                         <button 
                           onClick={() => handleCopy(wish.slug)}
                           className="w-10 h-10 rounded-full bg-white text-ink flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                           title="Copy Link"
                         ><Copy size={18} /></button>
                         <button 
                           onClick={() => softDelete(wish.id)}
                           className="w-10 h-10 rounded-full bg-white text-coral flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                           title="Delete"
                         ><Trash2 size={18} /></button>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                       <h3 className="text-xl font-heading font-black truncate drop-shadow-md">For {wish.recipient_name}</h3>
                    </div>
                  </div>
                  
                  {/* Details Area */}
                  <div className="p-4 flex flex-col flex-1 bg-white dark:bg-ink">
                     <p className="text-xs text-zinc-500 flex items-center gap-1.5 font-medium mb-3">
                       <Clock size={14} /> {wish.expires_at ? getTimeRemaining(wish.expires_at) : 'Draft'}
                     </p>
                     <div className="mt-auto">
                        <Button 
                          variant="secondary" 
                          className="w-full justify-center bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs py-2"
                          onClick={() => handleCopy(wish.slug)}
                          disabled={wish.status === 'deleted'}
                        >
                          <Copy size={14} className="mr-1.5" /> Copy Wish Link
                        </Button>
                     </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
