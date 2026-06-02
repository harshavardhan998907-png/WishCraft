import { useEffect, useState } from 'react'
import { fetchAccountDeletionRequests, fetchActiveSessions, fetchConsentHistory, fetchDataExportRequests } from '../services/governanceService'
import type { AccountDeletionRequest, ActiveSessionSummary, ConsentRecord, DataExportRequest } from '../services/governanceService'

export function useSecurityOverview() {
  const [sessions, setSessions] = useState<ActiveSessionSummary[]>([])
  const [consents, setConsents] = useState<ConsentRecord[]>([])
  const [exports, setExports] = useState<DataExportRequest[]>([])
  const [deletions, setDeletions] = useState<AccountDeletionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetchActiveSessions(),
      fetchConsentHistory(),
      fetchDataExportRequests(),
      fetchAccountDeletionRequests(),
    ])
      .then(([nextSessions, nextConsents, nextExports, nextDeletions]) => {
        setSessions(nextSessions)
        setConsents(nextConsents)
        setExports(nextExports)
        setDeletions(nextDeletions)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return { sessions, consents, exports, deletions, loading, error, setExports, setDeletions }
}
