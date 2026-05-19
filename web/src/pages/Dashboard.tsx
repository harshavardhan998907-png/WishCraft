import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { getShareableUrl, getTimeRemaining } from '../lib/utils'
import type { Wish } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import { useToastStore } from '../store/toastStore'

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
    const { error } = await supabase.from('wishes').update({ status: 'deleted' }).eq('id', id)
    if (error) {
      console.warn('[Dashboard] soft delete failed', { id, error })
      toast.push('error', error.message)
    }
    else setWishes((items) => items.map((wish) => wish.id === id ? { ...wish, status: 'deleted' } : wish))
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-4xl font-black">Dashboard</h1>
        <Link to="/browse"><Button>Create wish</Button></Link>
      </div>
      {wishes.length === 0 ? (
        <Card className="mt-8 text-center"><h2 className="text-2xl font-black">Create your first wish</h2><Link to="/browse" className="mt-4 inline-block"><Button>Browse templates</Button></Link></Card>
      ) : (
        <div className="mt-8 grid gap-4">
          {wishes.map((wish) => (
            <Card key={wish.id} className="grid gap-4 md:grid-cols-[120px_1fr_auto]">
              <img src={wish.template?.thumbnail_url ?? ''} alt="" className="h-24 w-full rounded-md object-cover" />
              <div>
                <h2 className="text-xl font-black">{wish.recipient_name}</h2>
                <div className="mt-2 flex flex-wrap gap-2"><StatusBadge status={wish.status} /><span className="text-sm font-semibold">{wish.expires_at ? getTimeRemaining(wish.expires_at) : 'Draft'}</span></div>
                <p className="mt-2 break-all text-sm text-zinc-600">{getShareableUrl(wish.slug)}</p>
              </div>
              <div className="flex gap-2 md:flex-col">
                <Button variant="secondary" onClick={() => navigator.clipboard.writeText(getShareableUrl(wish.slug)).then(() => toast.push('success', 'Copied'))}>Copy</Button>
                <Button variant="danger" onClick={() => softDelete(wish.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
