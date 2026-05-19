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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
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
    return message
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'signup') await signUp(email, password, fullName)
      else await signIn(email, password)
      navigate('/dashboard')
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
          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
          <Button loading={loading} className="w-full">{mode === 'signup' ? 'Create account' : 'Login'}</Button>
        </div>
      </form>
    </section>
  )
}
