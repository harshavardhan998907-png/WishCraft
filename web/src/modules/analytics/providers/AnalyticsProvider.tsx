import { createContext } from 'react'

export const AnalyticsContext = createContext({ initialized: true })

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return <AnalyticsContext.Provider value={{ initialized: true }}>{children}</AnalyticsContext.Provider>
}
