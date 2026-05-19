import { supabase } from '../../../lib/supabase'
import type { AdminOrder } from '../types'

export async function fetchAdminOrders(search = ''): Promise<AdminOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, profile:profiles(email, full_name), wish:wishes(slug, recipient_name), template:templates(name, slug)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(error.message)

  const orders = (data ?? []) as AdminOrder[]
  const term = search.trim().toLowerCase()
  if (!term) return orders

  return orders.filter((order) => (
    order.razorpay_order_id?.toLowerCase().includes(term)
    || order.razorpay_payment_id?.toLowerCase().includes(term)
    || order.profile?.email?.toLowerCase().includes(term)
    || order.wish?.recipient_name?.toLowerCase().includes(term)
    || order.template?.name?.toLowerCase().includes(term)
  ))
}
