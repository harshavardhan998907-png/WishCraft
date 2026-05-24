export type LogSeverity = 'info' | 'warning' | 'error' | 'critical'

export interface StructuredLogInput {
  serviceName: string
  message: string
  severity?: LogSeverity
  context?: Record<string, unknown>
  error?: unknown
}

function sanitize(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[redacted-email]')
      .replace(/(sk_live_[A-Za-z0-9_]+|sk_test_[A-Za-z0-9_]+|Bearer\s+[A-Za-z0-9._-]+)/g, '[redacted-secret]')
      .slice(0, 2000)
  }

  if (Array.isArray(value)) return value.map(sanitize)

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key.toLowerCase().includes('secret') || key.toLowerCase().includes('token') ? 'redacted_key' : key,
        sanitize(entry),
      ]),
    )
  }

  return value
}

export function createStructuredLog(input: StructuredLogInput) {
  const error = input.error instanceof Error ? input.error : null
  return {
    service_name: sanitize(input.serviceName),
    severity: input.severity ?? 'info',
    message: sanitize(input.message),
    error_type: error?.name ?? 'OperationalLog',
    error_message: sanitize(error?.message ?? input.message),
    stack_trace: sanitize(error?.stack ?? null),
    context: sanitize(input.context ?? {}),
    created_at: new Date().toISOString(),
  }
}

export function logStructured(input: StructuredLogInput) {
  const entry = createStructuredLog(input)
  if (entry.severity === 'error' || entry.severity === 'critical') {
    console.error('[Production]', entry)
  } else if (entry.severity === 'warning') {
    console.warn('[Production]', entry)
  } else if (process.env.NODE_ENV !== 'production') {
    console.info('[Production]', entry)
  }
  return entry
}
