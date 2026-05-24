import { supabase } from '../../../lib/supabase'
import { trackEvent } from '../../analytics/services/analyticsService'

type Severity = 'info' | 'warning' | 'error' | 'critical'

interface LogErrorInput {
  serviceName: string
  errorType: string
  error: unknown
  severity?: Severity
}

interface RetryOptions {
  attempts?: number
  delayMs?: number
  serviceName: string
  operationName: string
}

interface CircuitState {
  failures: number
  openedUntil: number
}

const circuitStates = new Map<string, CircuitState>()

function sanitize(value: string, maxLength = 1000) {
  return value
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[redacted-email]')
    .replace(/(sk_live_[A-Za-z0-9_]+|sk_test_[A-Za-z0-9_]+|Bearer\s+[A-Za-z0-9._-]+)/g, '[redacted-secret]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown production error'
}

function sleep(delayMs: number) {
  return new Promise((resolve) => window.setTimeout(resolve, delayMs))
}

export async function logProductionError(input: LogErrorInput) {
  const error = input.error instanceof Error ? input.error : null
  console.warn('[Production]', input.serviceName, input.errorType, input.error)

  await supabase.rpc('log_production_error', {
    target_service_name: sanitize(input.serviceName, 120),
    target_error_type: sanitize(input.errorType, 120),
    target_error_message: sanitize(errorMessage(input.error), 1000),
    target_stack_trace: error?.stack ? sanitize(error.stack, 2000) : null,
    target_severity: input.severity ?? 'error',
  }).then(({ error: rpcError }) => {
    if (rpcError) console.warn('[Production] error log failed', rpcError)
  })

  void trackEvent({
    eventName: 'production_error_logged',
    metadata: { service_name: input.serviceName, error_type: input.errorType, severity: input.severity ?? 'error' },
  })
}

export async function recordPerformanceMetric(input: { metricName: string; value: number; unit: string; metadata?: Record<string, unknown> }) {
  await supabase.rpc('record_performance_metric', {
    target_metric_name: sanitize(input.metricName, 120),
    target_metric_value: input.value,
    target_metric_unit: sanitize(input.unit, 40),
    target_metadata: input.metadata ?? {},
  }).then(({ error }) => {
    if (error) console.warn('[Production] metric log failed', error)
  })
}

export async function logSystemHealth(input: { serviceName: string; status: 'healthy' | 'degraded' | 'unhealthy'; responseTimeMs?: number; metadata?: Record<string, unknown> }) {
  await supabase.rpc('log_system_health', {
    target_service_name: sanitize(input.serviceName, 120),
    target_health_status: input.status,
    target_response_time_ms: input.responseTimeMs ?? null,
    target_metadata: input.metadata ?? {},
  }).then(({ error }) => {
    if (error) console.warn('[Production] health log failed', error)
  })
}

export async function withRetry<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T> {
  const attempts = options.attempts ?? 2
  const delayMs = options.delayMs ?? 400
  let lastError: unknown

  for (let index = 0; index < attempts; index += 1) {
    const started = performance.now()
    try {
      const result = await operation()
      void recordPerformanceMetric({
        metricName: `${options.serviceName}.${options.operationName}.latency`,
        value: Math.round(performance.now() - started),
        unit: 'ms',
      })
      return result
    } catch (error) {
      lastError = error
      if (index < attempts - 1) await sleep(delayMs * (index + 1))
    }
  }

  await logProductionError({
    serviceName: options.serviceName,
    errorType: `${options.operationName}_failed`,
    error: lastError,
    severity: 'error',
  })
  throw lastError instanceof Error ? lastError : new Error('Operation failed')
}

export async function withCircuitBreaker<T>(key: string, operation: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
  const state = circuitStates.get(key)
  if (state && state.openedUntil > Date.now()) {
    void trackEvent({ eventName: 'worker_failure', metadata: { circuit: key, state: 'open' } })
    return fallback()
  }

  try {
    const result = await operation()
    if (state?.failures) {
      circuitStates.delete(key)
      void trackEvent({ eventName: 'worker_recovered', metadata: { circuit: key } })
    }
    return result
  } catch (error) {
    const failures = (state?.failures ?? 0) + 1
    circuitStates.set(key, {
      failures,
      openedUntil: failures >= 3 ? Date.now() + 60_000 : 0,
    })
    throw error
  }
}
