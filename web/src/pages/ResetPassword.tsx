import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Check, X, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Loader } from '../components/ui/Loader'
import { supabase } from '../lib/supabase'

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

export function ResetPassword() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const navigate = useNavigate()
  const passwordStrength = getPasswordStrength(newPassword)

  const passwordVisibilityToggle = (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        setShowPassword(!showPassword)
      }}
      className="text-zinc-400 hover:text-ink transition-colors dark:text-zinc-500 dark:hover:text-white"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  )

  const confirmVisibilityToggle = (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        setShowConfirm(!showConfirm)
      }}
      className="text-zinc-400 hover:text-ink transition-colors dark:text-zinc-500 dark:hover:text-white"
      aria-label={showConfirm ? 'Hide password' : 'Show password'}
    >
      {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  )

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setFieldErrors({})

    const errors: Record<string, string> = {}

    if (!newPassword) {
      errors.newPassword = 'Please enter a new password.'
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters.'
    } else if (!passwordRules.every(rule => rule.test(newPassword))) {
      errors.newPassword = 'Password does not meet all requirements.'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.'
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 2000)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Failed to update password. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const isFormValid =
    passwordRules.every(r => r.test(newPassword)) && newPassword === confirmPassword

  return (
    <>
      {loading && <Loader variant="fullPage" />}
      <section className="grid min-h-[calc(100dvh-70px)] place-items-center overflow-x-hidden px-4 py-8 sm:px-6 sm:py-12">
        <motion.form
          noValidate
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md rounded-2xl border border-black/5 bg-white/95 p-5 shadow-soft transition-colors dark:border-white/10 dark:bg-[#181824]/95 dark:text-white sm:p-7 overflow-hidden flex flex-col gap-5"
        >
          {/* Header */}
          <div className="space-y-2 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-ink text-base font-black text-white shadow-soft dark:bg-white dark:text-ink">
              WC
            </span>
            <h1 className="text-2xl font-black text-ink dark:text-white sm:text-3xl">
              Set New Password
            </h1>
            <p className="text-sm leading-6 text-zinc-500 dark:text-white/60">
              Choose a strong password for your WishCraft account.
            </p>
          </div>

          {/* Success state */}
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 rounded-xl bg-mint/10 px-4 py-6 text-center"
            >
              <CheckCircle2 size={36} className="text-mint" />
              <p className="font-bold text-ink dark:text-white">Password updated successfully!</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Redirecting you to your dashboard…
              </p>
            </motion.div>
          ) : (
            <>
              {/* New Password */}
              <div className="space-y-1.5">
                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  rightElement={passwordVisibilityToggle}
                  error={fieldErrors.newPassword}
                />

                {/* Strength meter */}
                {newPassword && (
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
                        const passed = rule.test(newPassword)
                        return (
                          <div key={rule.id} className="flex items-center text-[11px] sm:text-xs">
                            {passed ? (
                              <Check size={14} className="mr-1.5 text-mint flex-shrink-0" />
                            ) : (
                              <X size={14} className="mr-1.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                            )}
                            <span className={passed ? 'text-ink dark:text-white transition-colors' : 'text-zinc-500 dark:text-zinc-500 transition-colors'}>
                              {rule.text}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <Input
                label="Confirm Password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                rightElement={confirmVisibilityToggle}
                error={fieldErrors.confirmPassword}
              />

              {/* Error */}
              {error ? (
                <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                </p>
              ) : null}

              <Button
                loading={loading}
                disabled={!isFormValid}
                className="w-full shadow-premium"
              >
                Update Password
              </Button>
            </>
          )}
        </motion.form>
      </section>
    </>
  )
}
