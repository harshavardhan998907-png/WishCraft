export function getDeviceType() {
  if (typeof window === 'undefined') return 'unknown'
  const width = window.innerWidth
  const touch = navigator.maxTouchPoints > 0
  if (width < 768) return 'mobile'
  if (width < 1024 || touch) return 'tablet'
  return 'desktop'
}

export function getReferrer() {
  if (typeof document === 'undefined') return null
  return document.referrer || null
}

export function getSessionId() {
  if (typeof window === 'undefined') return null
  const key = 'template_hub_analytics_session'
  const existing = window.localStorage.getItem(key)
  if (existing) return existing
  const value = crypto.randomUUID()
  window.localStorage.setItem(key, value)
  return value
}
