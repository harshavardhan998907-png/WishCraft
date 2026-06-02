export interface RateLimitRule {
  windowMs: number
  maxEvents: number
  blockThreshold?: number
}

export interface RateLimitResult {
  allowed: boolean
  count: number
  retryAfterMs: number
  suspicious: boolean
}

interface RateLimitBucket {
  count: number
  blockedCount: number
  expiresAt: number
}

const buckets = new Map<string, RateLimitBucket>()

function bucketId(key: string, action: string) {
  return `${action}:${key}`
}

export function checkRateLimit(key: string, action: string, rule: RateLimitRule): RateLimitResult {
  const now = Date.now()
  const id = bucketId(key, action)
  const existing = buckets.get(id)
  const bucket = existing && existing.expiresAt > now
    ? existing
    : { count: 0, blockedCount: 0, expiresAt: now + rule.windowMs }

  bucket.count += 1
  const allowed = bucket.count <= rule.maxEvents
  if (!allowed) bucket.blockedCount += 1
  buckets.set(id, bucket)

  const retryAfterMs = Math.max(0, bucket.expiresAt - now)
  const suspicious = bucket.blockedCount >= (rule.blockThreshold ?? 2)
  return { allowed, count: bucket.count, retryAfterMs, suspicious }
}

export function clearExpiredRateLimitBuckets(now = Date.now()) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.expiresAt <= now) buckets.delete(key)
  }
}
