import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { logProductionError } from '../services/loggerService'

export interface ProductionMetrics {
  average_response_time: number
  failed_jobs: number
  payment_success_rate: number
  ai_failure_rate: number
  queue_health: Record<string, number>
  cache_hit_ratio: number
}

export interface SystemHealthLog {
  id: string
  service_name: string
  health_status: 'healthy' | 'degraded' | 'unhealthy'
  response_time_ms: number | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface ErrorTrackingLog {
  id: string
  service_name: string
  error_type: string
  error_message: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  created_at: string
}

export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<ProductionMetrics | null>(null)
  const [healthLogs, setHealthLogs] = useState<SystemHealthLog[]>([])
  const [errorLogs, setErrorLogs] = useState<ErrorTrackingLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const [metricsResult, healthResult, errorResult] = await Promise.all([
        supabase.from('production_metrics').select('*').single(),
        supabase.from('system_health_logs').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('error_tracking_logs').select('*').order('created_at', { ascending: false }).limit(20),
      ])

      if (metricsResult.error) throw new Error(metricsResult.error.message)
      if (healthResult.error) throw new Error(healthResult.error.message)
      if (errorResult.error) throw new Error(errorResult.error.message)

      setMetrics(metricsResult.data as ProductionMetrics)
      setHealthLogs((healthResult.data ?? []) as SystemHealthLog[])
      setErrorLogs((errorResult.data ?? []) as ErrorTrackingLog[])
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load production metrics'
      setError(message)
      void logProductionError({
        serviceName: 'admin-production-dashboard',
        errorType: 'metrics_load_failed',
        error: loadError,
        severity: 'warning',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return { metrics, healthLogs, errorLogs, loading, error, reload: load }
}
