import { FormEvent, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { supabase } from '../lib/supabase'
import { useToastStore } from '../store/toastStore'
import { recordRateLimitEvent } from '../modules/security/services/governanceService'

export function Auth() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const toast = useToastStore()
  const redirectTo = searchParams.get('redirect')

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

  function safeRedirect(target: string | null) {
    return target && target.startsWith('/') && !target.startsWith('//') ? target : null
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        throw new Error('Please enter a valid email address (e.g., name@example.com).')
      }
      if (mode === 'forgot_password') {
        const lastRequest = localStorage.getItem('last_password_reset_request')
        const now = Date.now()
        if (lastRequest && now - Number(lastRequest) < 60000) {
          const waitTime = Math.ceil((60000 - (now - Number(lastRequest))) / 1000)
          void recordRateLimitEvent({
            key: `reset_pwd:${email}`,
            action: 'password_reset_attempt',
            blocked: true,
            metadata: { email },
          }).catch(() => {})
          throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before requesting again.`)
        }
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        })
        if (resetErr) throw resetErr
        localStorage.setItem('last_password_reset_request', String(now))
        void recordRateLimitEvent({
          key: `reset_pwd:${email}`,
          action: 'password_reset_attempt',
          blocked: false,
          metadata: { email },
        }).catch(() => {})
        toast.push('success', 'Password reset email sent!')
        setMode('login')
        return
      }
      if (mode === 'signup') {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.')
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.')
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.')
        }
        const data = await signUp(email.trim(), password, fullName.trim())
        const role = data.user?.user_metadata?.role
        const destination = safeRedirect(redirectTo) ?? (role === 'admin' ? '/admin' : '/dashboard')
        navigate(destination)
      }
      else {
        const data = await signIn(email.trim(), password)
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
        const destination = safeRedirect(redirectTo) ?? (profile?.role === 'admin' ? '/admin' : '/dashboard')
        navigate(destination)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : typeof err === 'object' && err && 'message' in err ? String(err.message) : 'Authentication failed'
      setError(friendlyAuthError(message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="grid min-h-[calc(100vh-70px)] place-items-center overflow-x-hidden px-4 py-8 sm:px-6 sm:py-12">
      <form onSubmit={submit} className="w-full max-w-[min(100%,28rem)] rounded-2xl border border-black/5 bg-white/95 p-5 shadow-soft transition-colors dark:border-white/10 dark:bg-[#181824]/95 dark:text-white sm:p-7">
        {mode === 'forgot_password' ? (
          <div className="space-y-5">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-black text-ink dark:text-white">Reset Password</h1>
              <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Enter your email address below, and we'll send you a link to reset your password.
              </p>
            </div>
            <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            {error ? <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">{error}</p> : null}
            <Button loading={loading} className="w-full shadow-premium">Send Reset Link</Button>
            <button type="button" onClick={() => setMode('login')} className="focus-ring min-h-11 w-full rounded-lg text-sm font-bold text-brand hover:bg-brand/5">Back to Login</button>
          </div>
        ) : (
          <>
            <div className="mb-6 space-y-2 text-center">
              <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-brand text-white shadow-soft">
                <CheckCircle2 size={22} aria-hidden="true" />
              </div>
              <h1 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</h1>
              <p className="text-sm leading-6 text-zinc-500 dark:text-white/60">
                {mode === 'signup' ? 'Start crafting polished wishes in a few seconds.' : 'Continue to your Template Hub workspace.'}
              </p>
            </div>
            <div className="grid grid-cols-2 rounded-xl bg-zinc-100 p-1 dark:bg-white/10" role="tablist" aria-label="Authentication mode">
              {(['login', 'signup'] as const).map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => {
                    setMode(item)
                    setError('')
                  }}
                  className={`focus-ring relative min-h-11 rounded-lg px-3 py-2 font-bold ${mode === item ? 'text-white' : 'text-zinc-600 hover:text-ink dark:text-white/60 dark:hover:text-white'}`}
                  role="tab"
                  aria-selected={mode === item}
                >
                  {mode === item ? <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-lg bg-brand" /> : null}
                  <span className="relative">{item === 'signup' ? 'Signup' : 'Login'}</span>
                </button>
              ))}
            </div>
            <div className="mt-6 space-y-4">
              {mode === 'signup' ? <Input label="Full Name" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" required /> : null}
              <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
              <Input label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required />
              {mode === 'signup' ? <Input label="Confirm Password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required /> : null}
              {mode === 'login' ? (
                <div className="flex justify-end">
                  <button type="button" onClick={() => setMode('forgot_password')} className="focus-ring min-h-11 rounded-lg px-2 text-sm font-semibold text-brand hover:bg-brand/5">Forgot password?</button>
                </div>
              ) : null}
              {error ? <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">{error}</p> : null}
              <Button loading={loading} className="w-full shadow-premium">{mode === 'signup' ? 'Create Account' : 'Login'}</Button>
            </div>
          </>
        )}
      </form>
    </section>
  )
}
