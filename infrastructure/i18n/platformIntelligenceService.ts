export interface IntelligenceSignal {
  metricName: string
  metricValue: number
  metricCategory: 'growth' | 'creator' | 'engagement' | 'ai' | 'revenue' | 'retention' | 'ecosystem'
  generatedAt: string
}

export function detectTrend(current: number, previous: number) {
  if (previous === 0 && current > 0) return 'new_growth'
  if (previous === 0) return 'flat'
  const change = ((current - previous) / previous) * 100
  if (change >= 10) return 'accelerating'
  if (change <= -10) return 'declining'
  return 'stable'
}

export function aggregateStrategicMetrics(signals: IntelligenceSignal[]) {
  return signals.reduce<Record<string, number>>((summary, signal) => {
    summary[signal.metricCategory] = (summary[signal.metricCategory] ?? 0) + signal.metricValue
    return summary
  }, {})
}
