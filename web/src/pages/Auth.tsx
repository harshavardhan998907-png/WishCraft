import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adminAccess, setAdminAccess] = useState(false)
  const [adminInviteCode, setAdminInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, claimAdminRole } = useAuth()
  const navigate = useNavigate()

  function friendlyAuthError(message: string) {
    const normalized = message.toLowerCase()
    if (normalized.includes('rate limit')) {
      return 'Too many signup attempts. Please wait a few minutes, then try again.'
    }
    if (normalized.includes('could not find the table') || normalized.includes('schema cache') || normalized.includes('404')) {
      return 'Supabase database tables are not created yet. Run the SQL migrations, then try signup again.'
    }
    if (normalized.includes('already registered') || normalized.includes('already been registered')) {
      return 'This email is already registered. Switch to Login.'
    }
    if (normalized.includes('invalid login credentials')) {
      return 'Incorrect email or password.'
    }
    if (normalized.includes('claim_admin_role') || normalized.includes('could not find the function')) {
      return 'Admin invite setup is missing. Run the admin invite SQL in Supabase, then try again.'
    }
    if (normalized.includes('invalid admin invite code')) {
      return 'Invalid admin invite code.'
    }
    if (normalized.includes('admin invite requires an authenticated user')) {
      return 'Please confirm your email or log in, then request admin access again.'
    }
    return message
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'signup') {
        if (adminAccess && !adminInviteCode.trim()) {
          throw new Error('Enter the admin invite code to create an admin account.')
        }
        await signUp(email, password, fullName, { adminInviteCode: adminAccess ? adminInviteCode.trim() : undefined })
      }
      else {
        await signIn(email, password)
        if (adminAccess) {
          if (!adminInviteCode.trim()) throw new Error('Enter the admin invite code to claim admin access.')
          await claimAdminRole(adminInviteCode.trim())
        }
      }
      navigate(adminAccess ? '/admin' : '/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : typeof err === 'object' && err && 'message' in err ? String(err.message) : 'Authentication failed'
      setError(friendlyAuthError(message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="grid min-h-[calc(100vh-70px)] place-items-center px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg bg-white p-6 shadow-soft transition-colors dark:border dark:border-white/10 dark:bg-[#181824] dark:text-white">
        <div className="grid grid-cols-2 rounded-md bg-zinc-100 p-1 dark:bg-white/10">
          {(['login', 'signup'] as const).map((item) => <button type="button" key={item} onClick={() => setMode(item)} className={`relative rounded-md px-3 py-2 font-bold ${mode === item ? 'text-white' : 'text-zinc-600 dark:text-white/60'}`}>{mode === item ? <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-md bg-brand" /> : null}<span className="relative capitalize">{item}</span></button>)}
        </div>
        <div className="mt-6 space-y-4">
          {mode === 'signup' ? <Input label="Full Name" value={fullName} onChange={(event) => setFullName(event.target.value)} required /> : null}
          <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <div className="rounded-md border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="focus-ring mt-1 h-4 w-4 rounded border-black/20 text-brand"
                checked={adminAccess}
                onChange={(event) => setAdminAccess(event.target.checked)}
              />
              <span>
                <span className="block text-sm font-bold text-ink dark:text-white">{mode === 'signup' ? 'Create admin account' : 'Login as admin'}</span>
                <span className="mt-1 block text-sm leading-5 text-zinc-500 dark:text-white/60">Requires a private admin invite code.</span>
              </span>
            </label>
            {adminAccess ? (
              <div className="mt-3">
                <Input
                  label="Admin Invite Code"
                  type="password"
                  value={adminInviteCode}
                  onChange={(event) => setAdminInviteCode(event.target.value)}
                  required={adminAccess}
                  autoComplete="one-time-code"
                />
              </div>
            ) : null}
          </div>
          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
          <Button loading={loading} className="w-full">{mode === 'signup' ? 'Create account' : 'Login'}</Button>
        </div>
      </form>
    </section>
  )
}
