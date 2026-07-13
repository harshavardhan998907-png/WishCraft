import { nanoid } from 'nanoid'
import type { Wish } from '../types'

export function generateWishSlug(): string {
  return nanoid(10)
}

export function formatPrice(paise: number): string {
  if (paise === 0) return 'Free'
  return `Rs ${(paise / 100).toFixed(0)}`
}

export function getTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days}d ${hours}h remaining`
  return `${hours}h remaining`
}

export function isWishExpired(wish: Wish): boolean {
  if (wish.status === 'expired') return true
  if (!wish.expires_at) return false
  return new Date(wish.expires_at) < new Date()
}

export function getShareableUrl(slug: string): string {
  return `${window.location.origin}/w/${slug}`
}

export function addDays(date: Date, days: number): string {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next.toISOString()
}

export function addHours(date: Date, hours: number): string {
  const next = new Date(date)
  next.setHours(next.getHours() + hours)
  return next.toISOString()
}
