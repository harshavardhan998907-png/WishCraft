export interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export interface CacheOptions {
  ttlMs: number
  group: string
}

const memoryCache = new Map<string, CacheEntry<unknown>>()

export function getCacheValue<T>(key: string): T | null {
  const entry = memoryCache.get(key)
  if (!entry) return null

  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(key)
    return null
  }

  return entry.value as T
}

export function setCacheValue<T>(key: string, value: T, options: CacheOptions) {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + options.ttlMs,
  })
}

export function invalidateCacheGroup(groupPrefix: string) {
  Array.from(memoryCache.keys())
    .filter((key) => key.startsWith(`${groupPrefix}:`))
    .forEach((key) => memoryCache.delete(key))
}

export async function cached<T>(key: string, options: CacheOptions, loader: () => Promise<T>) {
  const namespacedKey = `${options.group}:${key}`
  const existing = getCacheValue<T>(namespacedKey)
  if (existing !== null) return { value: existing, cacheHit: true }

  const value = await loader()
  setCacheValue(namespacedKey, value, options)
  return { value, cacheHit: false }
}
