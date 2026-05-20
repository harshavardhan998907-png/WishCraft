import { FormEvent, useEffect, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Textarea } from '../../../components/ui/Textarea'
import { useAuth } from '../../../hooks/useAuth'
import { useToastStore } from '../../../store/toastStore'
import { ensureCreatorProfile, updateCreatorProfile } from '../services/creatorProfile'
import { marketplaceSchemaMessage } from '../services/marketplaceSchema'
import type { CreatorProfile } from '../types'

export function CreatorSettings() {
  const { user, profile } = useAuth()
  const toast = useToastStore()
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [website, setWebsite] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    ensureCreatorProfile({
      userId: user.id,
      displayName: profile?.full_name || profile?.email || user.email || 'Creator',
      avatarUrl: profile?.avatar_url,
    }).then((nextProfile) => {
      if (!nextProfile) {
        setCreatorProfile(null)
        setDisplayName(profile?.full_name || profile?.email || user.email || 'Creator')
        return
      }
      setCreatorProfile(nextProfile)
      setDisplayName(nextProfile.display_name)
      setBio(nextProfile.bio ?? '')
      setAvatarUrl(nextProfile.avatar_url ?? '')
      setWebsite(typeof nextProfile.social_links.website === 'string' ? nextProfile.social_links.website : '')
    }).catch((err: Error) => toast.push('error', err.message))
  }, [profile, toast, user])

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!creatorProfile) return
    setSaving(true)
    try {
      const nextProfile = await updateCreatorProfile(creatorProfile.id, {
        display_name: displayName,
        bio,
        avatar_url: avatarUrl,
        social_links: { website },
      })
      setCreatorProfile(nextProfile)
      toast.push('success', 'Creator profile updated')
    } catch (err) {
      toast.push('error', err instanceof Error ? err.message : 'Could not update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">Settings</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-white/70">Creator profile foundation used by marketplace templates.</p>
      </div>
      <Card>
        {!creatorProfile ? <p className="mb-4 text-sm leading-6 text-zinc-600 dark:text-white/70">{marketplaceSchemaMessage()}</p> : null}
        <form className="grid gap-4" onSubmit={saveSettings}>
          <Input label="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
          <Textarea label="Bio" value={bio} onChange={(event) => setBio(event.target.value)} maxLength={280} />
          <Input label="Avatar URL" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} />
          <Input label="Website" value={website} onChange={(event) => setWebsite(event.target.value)} />
          <Button type="submit" loading={saving} disabled={!creatorProfile}>Save settings</Button>
        </form>
      </Card>
    </div>
  )
}
