import { supabase } from '../../../lib/supabase'
import type { ActivityItem, AdminActivityLog, AdminMetrics } from '../types'

const emptyMetrics: AdminMetrics = {
  total_users: 0,
  total_wishes: 0,
  active_wishes: 0,
  expired_wishes: 0,
  total_orders: 0,
  paid_orders: 0,
  total_revenue_paise: 0,
  total_templates: 0,
  active_templates: 0,
  storage_objects: 0,
  storage_bytes: 0,
}

interface RecentOrderRow {
  id: string
  amount_paise: number
  status: string
  created_at: string
  template?: { name: string; slug: string } | Array<{ name: string; slug: string }> | null
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null
}

export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  const { data, error } = await supabase.from('admin_platform_metrics').select('*').maybeSingle()
  if (error) throw new Error(error.message)
  return { ...emptyMetrics, ...(data as Partial<AdminMetrics> | null) }
}

export async function fetchRecentActivity(): Promise<ActivityItem[]> {
  const [wishesResult, ordersResult, logsResult] = await Promise.all([
    supabase.from('wishes').select('id, recipient_name, sender_name, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('orders').select('id, amount_paise, status, created_at, wish:wishes(slug, recipient_name), template:templates(name, slug)').order('created_at', { ascending: false }).limit(5),
    supabase.from('admin_activity_logs').select('*').order('created_at', { ascending: false }).limit(5),
  ])

  if (wishesResult.error) throw new Error(wishesResult.error.message)
  if (ordersResult.error) throw new Error(ordersResult.error.message)
  if (logsResult.error) throw new Error(logsResult.error.message)

  const wishes = (wishesResult.data ?? []).map((wish) => ({
    id: `wish-${wish.id}`,
    label: 'Wish created',
    detail: `${wish.recipient_name} from ${wish.sender_name}`,
    created_at: wish.created_at,
    tone: 'blue' as const,
  }))

  const orders = ((ordersResult.data ?? []) as unknown as RecentOrderRow[]).map((order) => {
    const template = firstRelation(order.template)
    return {
      id: `order-${order.id}`,
      label: order.status === 'paid' ? 'Payment received' : 'Order created',
      detail: `${template?.name ?? 'Template'} - Rs ${(order.amount_paise / 100).toFixed(0)}`,
      created_at: order.created_at,
      tone: order.status === 'paid' ? 'green' as const : 'gray' as const,
    }
  })

  const logs = ((logsResult.data ?? []) as AdminActivityLog[]).map((log) => ({
    id: `log-${log.id}`,
    label: log.action.replace(/_/g, ' '),
    detail: [log.target_type, log.target_id].filter(Boolean).join(' - ') || 'Admin action',
    created_at: log.created_at,
    tone: 'purple' as const,
  }))

  return [...wishes, ...orders, ...logs]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
}
