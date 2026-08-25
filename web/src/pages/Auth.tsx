import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ArrowLeft, Check, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Loader } from '../components/ui/Loader'
import { supabase } from '../lib/supabase'
import { useToastStore } from '../store/toastStore'
import { recordRateLimitEvent } from '../modules/security/services/governanceService'

const passwordRules = [
  { id: 'length', text: '8+ characters', test: (v: string) => v.length >= 8 },
  { id: 'uppercase', text: 'Uppercase', test: (v: string) => /[A-Z]/.test(v) },
  { id: 'lowercase', text: 'Lowercase', test: (v: string) => /[a-z]/.test(v) },
  { id: 'number', text: 'Number', test: (v: string) => /\d/.test(v) },
  { id: 'special', text: 'Symbol', test: (v: string) => /[@$!%*?&^#()_\-+=]/.test(v) },
]

function getPasswordStrength(password: string) {
  if (!password) return { label: '', color: '', bgColor: '', score: 0 }
  const passedCount = passwordRules.filter(rule => rule.test(password)).length
  if (passedCount <= 2) return { label: 'Weak', color: 'text-rose-500', bgColor: 'bg-rose-500', score: 1 }
  if (passedCount <= 4) return { label: 'Medium', color: 'text-sun', bgColor: 'bg-sun', score: 2 }
  return { label: 'Strong', color: 'text-mint', bgColor: 'bg-mint', score: 3 }
}

export function Auth() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  
  const { user, role, signIn, signUp, signInWithGoogle, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const toast = useToastStore()
  const redirectTo = searchParams.get('redirect')

  useEffect(() => {
    if (!authLoading && user) {
      const destination = safeRedirect(redirectTo) ?? (role === 'admin' ? '/admin' : '/browse')
      navigate(destination, { replace: true })
    }
  }, [user, role, authLoading, navigate, redirectTo])

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

  async function handleGoogleSignIn() {
    setLoading(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch (err) {
      const message = err instanceof Error ? err.message : typeof err === 'object' && err && 'message' in err ? String(err.message) : 'Google authentication failed'
      setError(friendlyAuthError(message))
      setLoading(false)
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setFieldErrors({})

    const errors: Record<string, string> = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (mode === 'forgot_password') {
      if (!email.trim()) errors.email = 'Please enter your email.'
      else if (!emailRegex.test(email.trim())) errors.email = 'Please enter a valid email address.'
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        setLoading(false)
        return
      }

      try {
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
      } catch (err) {
        const message = err instanceof Error ? err.message : typeof err === 'object' && err && 'message' in err ? String(err.message) : 'Request failed'
        setError(friendlyAuthError(message))
      } finally {
        setLoading(false)
      }
      return
    } 
    
    if (mode === 'signup') {
      if (!fullName.trim()) errors.fullName = 'Please enter your full name.'
      if (!email.trim()) errors.email = 'Please enter your email.'
      else if (!emailRegex.test(email.trim())) errors.email = 'Please enter a valid email address.'
      
      const allRulesPassed = passwordRules.every(rule => rule.test(password))
      if (!password) errors.password = 'Please enter your password.'
      else if (!allRulesPassed) errors.password = 'Password does not meet all requirements.'
      
      if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.'
      else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.'

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        setLoading(false)
        return
      }

      try {
        const data = await signUp(email.trim(), password, fullName.trim())
        const role = data.user?.user_metadata?.role
        const destination = safeRedirect(redirectTo) ?? (role === 'admin' ? '/admin' : '/browse')
        navigate(destination, { replace: true })
      } catch (err) {
        const message = err instanceof Error ? err.message : typeof err === 'object' && err && 'message' in err ? String(err.message) : 'Authentication failed'
        setError(friendlyAuthError(message))
      } finally {
        setLoading(false)
      }
      return
    }

    if (mode === 'login') {
      if (!email.trim()) errors.email = 'Please enter your email.'
      else if (!emailRegex.test(email.trim())) errors.email = 'Please enter a valid email address.'
      
      if (!password) errors.password = 'Please enter your password.'
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        setLoading(false)
        return
      }

      try {
        const data = await signIn(email.trim(), password)
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
        const destination = safeRedirect(redirectTo) ?? (profile?.role === 'admin' ? '/admin' : '/browse')
        navigate(destination, { replace: true })
      } catch (err) {
        const message = err instanceof Error ? err.message : typeof err === 'object' && err && 'message' in err ? String(err.message) : 'Authentication failed'
        setError(friendlyAuthError(message))
      } finally {
        setLoading(false)
      }
    }
  }

  const passwordVisibilityToggle = (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        setShowPassword(!showPassword)
      }}
      className="text-zinc-400 hover:text-ink transition-colors dark:text-zinc-500 dark:hover:text-white"
      aria-label={showPassword ? "Hide password" : "Show password"}
    >
      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  )

  const passwordStrength = getPasswordStrength(password)
  const isSignupValid = mode === 'signup' 
    ? (fullName.trim() && email.trim() && passwordRules.every(r => r.test(password)) && password === confirmPassword) 
    : true

  return (
    <>
      {loading && <Loader variant="fullPage" />}
      <section className="grid min-h-[calc(100dvh-70px)] place-items-center overflow-x-hidden px-4 py-8 sm:px-6 sm:py-12">
        <form noValidate onSubmit={submit} className="w-full max-w-md rounded-2xl border border-black/5 bg-white/95 p-5 shadow-soft transition-colors dark:border-white/10 dark:bg-[#181824]/95 dark:text-white sm:p-7 overflow-hidden flex flex-col">
        <div className="flex-none mb-0">
          <button 
            type="button" 
            onClick={() => location.key !== 'default' ? navigate(-1) : navigate('/browse')}
            className="inline-flex items-center text-sm font-semibold text-zinc-500 transition-colors hover:text-ink dark:text-zinc-400 dark:hover:text-white"
          >
            <ArrowLeft size={16} className="mr-1.5" /> Back
          </button>
        </div>

        <div>
          <AnimatePresence mode="wait">
            {mode === 'forgot_password' ? (
              <motion.div 
                key="forgot_password"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="space-y-2 text-center">
                  <h1 className="text-2xl font-black text-ink dark:text-white">Reset Password</h1>
                  <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  Enter your email address below, and we'll send you a link to reset your password.
                  </p>
                </div>
                <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required error={fieldErrors.email} />
                {error ? <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">{error}</p> : null}
                <Button loading={loading} className="w-full shadow-premium mt-2">Send Reset Link</Button>
                <button type="button" onClick={() => setMode('login')} className="focus-ring min-h-11 w-full rounded-lg text-sm font-bold text-brand hover:bg-brand/5">Back to Login</button>
              </motion.div>
            ) : (
              <motion.div
                key="auth_main"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6 space-y-2 text-center">
                  <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-ink text-base font-black text-white shadow-soft dark:bg-white dark:text-ink">WC</span>
                  <h1 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</h1>
                  <p className="text-sm leading-6 text-zinc-500 dark:text-white/60">
                    {mode === 'signup' ? 'Start crafting polished wishes in a few seconds.' : 'Continue to your WishCraft workspace.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 rounded-xl bg-zinc-100 p-1 dark:bg-white/10 mb-5" role="tablist" aria-label="Authentication mode">
                  {(['login', 'signup'] as const).map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => {
                        setMode(item)
                        setError('')
                        setFieldErrors({})
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

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="focus-ring flex min-h-11 w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 font-bold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 hover:border-zinc-300 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 mb-5"
                >
                  <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative mb-5 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200 dark:border-white/10" />
                  </div>
                  <span className="relative bg-white px-3 text-xs font-semibold text-zinc-400 dark:bg-[#181824] dark:text-zinc-500">
                    OR
                  </span>
                </div>
                <div className="space-y-4">
                  {mode === 'signup' ? <Input label="Full Name" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" required error={fieldErrors.fullName} /> : null}
                  <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required error={fieldErrors.email} />
                  <Input 
                    label="Password" 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={(event) => setPassword(event.target.value)} 
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} 
                    required 
                    rightElement={passwordVisibilityToggle}
                    error={fieldErrors.password}
                  />
                  
                  {mode === 'signup' && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-zinc-500 dark:text-zinc-400">Password Strength</span>
                        <span className={passwordStrength.color}>{passwordStrength.label}</span>
                      </div>
                      <div className="flex gap-1 h-1.5 w-full rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${passwordStrength.score >= 1 ? passwordStrength.bgColor : 'bg-transparent'} w-1/3`} />
                        <div className={`h-full transition-all duration-300 ${passwordStrength.score >= 2 ? passwordStrength.bgColor : 'bg-transparent'} w-1/3`} />
                        <div className={`h-full transition-all duration-300 ${passwordStrength.score >= 3 ? passwordStrength.bgColor : 'bg-transparent'} w-1/3`} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-2 pt-2">
                        {passwordRules.map(rule => {
                          const passed = rule.test(password)
                          return (
                            <div key={rule.id} className="flex items-center text-[11px] sm:text-xs">
                              {passed ? (
                                <Check size={14} className="mr-1.5 text-mint flex-shrink-0" />
                              ) : (
                                <X size={14} className="mr-1.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                              )}
                              <span className={passed ? "text-ink dark:text-white transition-colors" : "text-zinc-500 dark:text-zinc-500 transition-colors"}>
                                {rule.text}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {mode === 'signup' ? <Input label="Confirm Password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required error={fieldErrors.confirmPassword} /> : null}
                </div>

                {mode === 'login' ? (
                  <div className="flex justify-end">
                    <button type="button" onClick={() => { setMode('forgot_password'); setFieldErrors({}); setError(''); }} className="focus-ring min-h-11 rounded-lg px-2 text-sm font-semibold text-brand hover:bg-brand/5">Forgot password?</button>
                  </div>
                ) : null}
                {error ? <p role="alert" className={`rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-200 ${mode === 'signup' ? 'mt-4' : 'mt-1'}`}>{error}</p> : null}
                <div className={mode === 'signup' ? 'mt-4' : 'mt-0'}>
                  <Button loading={loading} disabled={mode === 'signup' && !isSignupValid} className="w-full shadow-premium">{mode === 'signup' ? 'Create Account' : 'Login'}</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>
    </section>
    </>
  )
}
