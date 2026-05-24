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
    void trackCacheEvent('cache_hit', group)
    return existing.value as T
  }

  void trackCacheEvent('cache_miss', group)
  const value = await loader()
  const expiresAt = Date.now() + ttlMs
  memoryCache.set(fullKey, { value, expiresAt })

  void supabase.rpc('register_cache_key', {
    target_cache_key: fullKey,
    target_cache_group: group,
    target_expires_at: new Date(expiresAt).toISOString(),
  }).then(({ error }) => {
    if (error) console.warn('[Cache] registry update failed', error)
  })

  return value
}

function trackCacheEvent(eventName: 'cache_hit' | 'cache_miss', group: string) {
  void supabase.from('analytics_events').insert({
    event_name: eventName,
    metadata: { cache_group: group },
  }).then(({ error }) => {
    if (error) console.warn('[Cache] analytics event failed', error)
  })
}

export function invalidateCachedGroup(group: string) {
  Array.from(memoryCache.keys())
    .filter((key) => key.startsWith(`${group}:`))
    .forEach((key) => memoryCache.delete(key))
}
