import { supabase } from '../../../lib/supabase'

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const memoryCache = new Map<string, CacheEntry<unknown>>()

function cacheKey(group: string, key: string) {
  return `${group}:${key}`
}

export async function getCached<T>(group: string, key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const fullKey = cacheKey(group, key)
  const existing = memoryCache.get(fullKey)

  if (existing && existing.expiresAt > Date.now()) {
    return existing.value as T
  }

  const value = await loader()
  const expiresAt = Date.now() + ttlMs
  memoryCache.set(fullKey, { value, expiresAt })
  return value
}

export function invalidateCachedGroup(group: string) {
  Array.from(memoryCache.keys())
    .filter((key) => key.startsWith(`${group}:`))
    .forEach((key) => memoryCache.delete(key))
}
