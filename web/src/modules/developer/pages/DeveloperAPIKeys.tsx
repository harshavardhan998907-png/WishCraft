import { FormEvent, useEffect, useState } from 'react'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useToastStore } from '../../../store/toastStore'
import { useDeferredLoading } from '../../../hooks/useDeferredLoading'
import { createDeveloperApiKey, fetchDeveloperApiKeys, fetchDeveloperApiUsage, revokeDeveloperApiKey } from '../services/ecosystemService'
import type { ApiScope, EcosystemApiKey, EcosystemApiUsageEvent } from '../services/ecosystemService'

const scopes: ApiScope[] = ['templates:read', 'analytics:read', 'webhooks:write']

export function DeveloperAPIKeys() {
  const [keys, setKeys] = useState<EcosystemApiKey[]>([])
  const [usage, setUsage] = useState<EcosystemApiUsageEvent[]>([])
  const [keyName, setKeyName] = useState('Template Hub integration')
  const [selectedScopes, setSelectedScopes] = useState<ApiScope[]>(['templates:read'])
  const [newKey, setNewKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const deferredLoading = useDeferredLoading(loading)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToastStore()

  async function load() {
    const [nextKeys, nextUsage] = await Promise.all([fetchDeveloperApiKeys(), fetchDeveloperApiUsage()])
    setKeys(nextKeys)
    setUsage(nextUsage)
  }

  useEffect(() => {
    load()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function toggleScope(scope: ApiScope) {
    setSelectedScopes((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope])
  }

  async function createKey(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      const created = await createDeveloperApiKey({ keyName, scopes: selectedScopes })
      setNewKey(created.rawKey)
      await load()
      toast.push('success', 'API key generated')
    } catch (err) {
      toast.push('error', err instanceof Error ? err.message : 'Could not create API key')
    } finally {
      setSaving(false)
    }
  }

  async function revokeKey(keyId: string) {
    await revokeDeveloperApiKey(keyId)
    await load()
    toast.push('success', 'API key revoked')
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader 
        title="Developer API keys" 
        subtitle="Create scoped ecosystem keys, revoke access, and monitor integration usage."
        backTo="/dashboard"
      />

      {error ? <Card className="mb-6 border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</Card> : null}
      {deferredLoading ? (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr] animate-in fade-in duration-500">
          <Card>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div>
                <Skeleton className="h-5 w-16 mb-2" />
                <div className="grid gap-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
              <Skeleton className="h-10 w-full rounded-full" />
            </div>
          </Card>
          <div className="space-y-6">
            <Card>
              <Skeleton className="h-7 w-16 mb-4" />
              <div className="grid gap-3">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            </Card>
            <Card>
              <Skeleton className="h-7 w-20 mb-4" />
              <div className="grid gap-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {!deferredLoading && (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <Card>
          <form className="space-y-4" onSubmit={createKey}>
            <Input label="Key name" value={keyName} onChange={(event) => setKeyName(event.target.value)} />
            <div>
              <p className="text-sm font-black text-ink dark:text-white">Scopes</p>
              <div className="mt-2 grid gap-2">
                {scopes.map((scope) => (
                  <label key={scope} className="flex items-center justify-between rounded-md bg-zinc-100 p-3 text-sm font-semibold dark:bg-white/10">
                    {scope}
                    <input type="checkbox" checked={selectedScopes.includes(scope)} onChange={() => toggleScope(scope)} />
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" loading={saving}>Create API key</Button>
          </form>
          {newKey ? (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-300/20 dark:bg-amber-300/10">
              <p className="font-black text-amber-900 dark:text-amber-100">Copy this key now. It is shown once.</p>
              <p className="mt-2 break-all font-mono text-xs text-amber-900 dark:text-amber-100">{newKey}</p>
            </div>
          ) : null}
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-black">Keys</h2>
            <div className="mt-4 grid gap-3">
              {keys.map((key) => (
                <div key={key.id} className="rounded-md border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-black">{key.key_name}</p>
                      <p className="mt-1 break-all font-mono text-xs text-zinc-500">{key.id}</p>
                    </div>
                    <Badge tone={key.is_active ? 'green' : 'red'}>{key.is_active ? 'active' : 'revoked'}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {key.access_scope.map((scope) => <Badge key={scope} tone="blue">{scope}</Badge>)}
                  </div>
                  {key.is_active ? <Button className="mt-3" size="sm" variant="danger" type="button" onClick={() => revokeKey(key.id)}>Revoke</Button> : null}
                </div>
              ))}
              {!deferredLoading && keys.length === 0 ? <p className="text-sm text-zinc-500">No API keys yet.</p> : null}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-black">Usage</h2>
            <div className="mt-4 grid gap-3">
              {usage.map((event) => (
                <div key={event.id} className="rounded-md bg-zinc-100 p-3 dark:bg-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-black">{event.endpoint}</p>
                    <Badge tone={event.request_status === 'accepted' ? 'green' : 'yellow'}>{event.request_status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{new Date(event.created_at).toLocaleString()}</p>
                </div>
              ))}
              {usage.length === 0 ? <p className="text-sm text-zinc-500">No integration usage yet.</p> : null}
            </div>
          </Card>
        </div>
      </div>
      )}
    </section>
  )
}
