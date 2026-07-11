import { FormEvent, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Eye, EyeOff, ArrowLeft, Check, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
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
  
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
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
        const destination = safeRedirect(redirectTo) ?? (role === 'admin' ? '/admin' : '/dashboard')
        navigate(destination)
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
        const destination = safeRedirect(redirectTo) ?? (profile?.role === 'admin' ? '/admin' : '/dashboard')
        navigate(destination)
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
    <section className="grid min-h-[calc(100vh-70px)] place-items-center overflow-x-hidden px-4 py-8 sm:px-6 sm:py-12">
      <form noValidate onSubmit={submit} className="w-full max-w-md min-h-[550px] sm:min-h-[580px] rounded-2xl border border-black/5 bg-white/95 p-5 shadow-soft transition-colors dark:border-white/10 dark:bg-[#181824]/95 dark:text-white sm:p-7 overflow-hidden flex flex-col">
        <div className="flex-none mb-6">
          <button 
            type="button" 
            onClick={() => location.key !== 'default' ? navigate(-1) : navigate('/browse')}
            className="inline-flex items-center text-sm font-semibold text-zinc-500 transition-colors hover:text-ink dark:text-zinc-400 dark:hover:text-white"
          >
            <ArrowLeft size={16} className="mr-1.5" /> Back
          </button>
        </div>

        <div className="flex-1">
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
                  <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-brand text-white shadow-soft">
                    <CheckCircle2 size={22} aria-hidden="true" />
                  </div>
                  <h1 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</h1>
                  <p className="text-sm leading-6 text-zinc-500 dark:text-white/60">
                    {mode === 'signup' ? 'Start crafting polished wishes in a few seconds.' : 'Continue to your WishCraft workspace.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 rounded-xl bg-zinc-100 p-1 dark:bg-white/10 mb-6" role="tablist" aria-label="Authentication mode">
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
                  {mode === 'login' ? (
                    <div className="flex justify-end pt-1">
                      <button type="button" onClick={() => { setMode('forgot_password'); setFieldErrors({}); setError(''); }} className="focus-ring min-h-11 rounded-lg px-2 text-sm font-semibold text-brand hover:bg-brand/5">Forgot password?</button>
                    </div>
                  ) : null}
                  {error ? <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">{error}</p> : null}
                  <div className="pt-2">
                    <Button loading={loading} disabled={mode === 'signup' && !isSignupValid} className="w-full shadow-premium">{mode === 'signup' ? 'Create Account' : 'Login'}</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </form>
    </section>
  )
}
