import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Lightbulb, Bug, MessageSquare, CheckCircle, AlertTriangle, Upload } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Select } from '../ui/Select'
import { ResponsiveModal } from '../responsive/ResponsiveModal'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import {
  trackFeedbackDialogOpened,
  trackReviewSubmitted,
  trackFeatureRequestSubmitted,
  trackBugReported
} from '../../modules/analytics/services/analyticsService'

interface FeedbackDialogProps {
  open: boolean
  onClose: () => void
}

const CATEGORY_OPTIONS = [
  'Templates',
  'Editor',
  'Preview',
  'Dashboard',
  'Sharing',
  'Animations',
  'Music',
  'Performance',
  'AI',
  'Other'
] as const

const PAGE_OPTIONS = [
  'Dashboard',
  'Explore',
  'Editor',
  'Preview',
  'Share Page',
  'Authentication',
  'Footer',
  'Other'
] as const

export function FeedbackDialog({ open, onClose }: FeedbackDialogProps) {
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<'review' | 'feature' | 'bug'>('review')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Tab 1: Review State
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [starError, setStarError] = useState('')

  // Tab 2: Feature Request State
  const [featureTitle, setFeatureTitle] = useState('')
  const [featureCategory, setFeatureCategory] = useState<typeof CATEGORY_OPTIONS[number]>('Templates')
  const [featureDescription, setFeatureDescription] = useState('')
  const [featurePriority, setFeaturePriority] = useState<'Low' | 'Medium' | 'High'>('Medium')

  // Tab 3: Bug Report State
  const [bugTitle, setBugTitle] = useState('')
  const [bugDescription, setBugDescription] = useState('')
  const [bugPage, setBugPage] = useState<typeof PAGE_OPTIONS[number]>('Dashboard')
  const [bugSeverity, setBugSeverity] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium')
  const [bugExpected, setBugExpected] = useState('')
  const [bugActual, setBugActual] = useState('')

  // Validation error states
  const [featureErrors, setFeatureErrors] = useState<{ title?: string; description?: string }>({})
  const [bugErrors, setBugErrors] = useState<{
    title?: string
    description?: string
    expected?: string
    actual?: string
  }>({})

  // Trigger analytics when opened
  useEffect(() => {
    if (open) {
      trackFeedbackDialogOpened()
    }
  }, [open])

  // Prevent background scrolling, setup ESC listener
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    const handler = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handler)
    }
  }, [open, onClose])

  // Clear success states when changing tabs
  const handleTabChange = (tab: 'review' | 'feature' | 'bug') => {
    setActiveTab(tab)
    setError(null)
    setSuccess(false)
    setFeatureErrors({})
    setBugErrors({})
    setStarError('')
  }

  // Clear form helpers
  const resetReviewForm = () => {
    setRating(0)
    setHoverRating(0)
    setReviewTitle('')
    setReviewText('')
    setStarError('')
  }

  const resetFeatureForm = () => {
    setFeatureTitle('')
    setFeatureCategory('Templates')
    setFeatureDescription('')
    setFeaturePriority('Medium')
    setFeatureErrors({})
  }

  const resetBugForm = () => {
    setBugTitle('')
    setBugDescription('')
    setBugPage('Dashboard')
    setBugSeverity('Medium')
    setBugExpected('')
    setBugActual('')
    setBugErrors({})
  }

  // Live input validation handlers
  const handleFeatureTitleChange = (val: string) => {
    setFeatureTitle(val)
    if (!val.trim()) {
      setFeatureErrors(prev => ({ ...prev, title: 'This field is required.' }))
    } else {
      setFeatureErrors(prev => ({ ...prev, title: undefined }))
    }
  }

  const handleFeatureDescriptionChange = (val: string) => {
    setFeatureDescription(val)
    if (!val.trim()) {
      setFeatureErrors(prev => ({ ...prev, description: 'This field is required.' }))
    } else {
      setFeatureErrors(prev => ({ ...prev, description: undefined }))
    }
  }

  const handleBugTitleChange = (val: string) => {
    setBugTitle(val)
    if (!val.trim()) {
      setBugErrors(prev => ({ ...prev, title: 'This field is required.' }))
    } else {
      setBugErrors(prev => ({ ...prev, title: undefined }))
    }
  }

  const handleBugDescriptionChange = (val: string) => {
    setBugDescription(val)
    if (!val.trim()) {
      setBugErrors(prev => ({ ...prev, description: 'This field is required.' }))
    } else {
      setBugErrors(prev => ({ ...prev, description: undefined }))
    }
  }

  const handleBugExpectedChange = (val: string) => {
    setBugExpected(val)
    if (!val.trim()) {
      setBugErrors(prev => ({ ...prev, expected: 'This field is required.' }))
    } else {
      setBugErrors(prev => ({ ...prev, expected: undefined }))
    }
  }

  const handleBugActualChange = (val: string) => {
    setBugActual(val)
    if (!val.trim()) {
      setBugErrors(prev => ({ ...prev, actual: 'This field is required.' }))
    } else {
      setBugErrors(prev => ({ ...prev, actual: undefined }))
    }
  }

  // Submissions
  const handleReviewSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setStarError('')
    setError(null)

    if (rating === 0) {
      setStarError('Please select a rating.')
      return
    }

    setLoading(true)
    try {
      const { error: dbError } = await supabase.from('reviews').insert({
        user_id: user?.id ?? null,
        rating,
        review: reviewText.trim() || null,
        title: reviewTitle.trim() || null,
        platform: 'web',
        app_version: '0.1.0'
      })

      if (dbError) throw dbError

      trackReviewSubmitted(rating)
      setSuccessMessage('Thank you for your feedback!')
      setSuccess(true)
      resetReviewForm()
    } catch (err: any) {
      console.error('[FeedbackCenter] Review submit failed', err)
      setError(err?.message || 'Failed to submit review. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFeatureSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    const errors: typeof featureErrors = {}
    if (!featureTitle.trim()) {
      errors.title = 'This field is required.'
    }
    if (!featureDescription.trim()) {
      errors.description = 'This field is required.'
    }

    if (Object.keys(errors).length > 0) {
      setFeatureErrors(errors)
      return
    }

    setLoading(true)
    try {
      const { error: dbError } = await supabase.from('feature_requests').insert({
        user_id: user?.id ?? null,
        title: featureTitle.trim(),
        description: featureDescription.trim(),
        category: featureCategory,
        priority: featurePriority,
        status: 'Open'
      })

      if (dbError) throw dbError

      trackFeatureRequestSubmitted(featureCategory, featurePriority)
      setSuccessMessage('Feature request submitted.')
      setSuccess(true)
      resetFeatureForm()
    } catch (err: any) {
      console.error('[FeedbackCenter] Feature request submit failed', err)
      setError(err?.message || 'Failed to submit feature request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBugSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)

    const errors: typeof bugErrors = {}
    if (!bugTitle.trim()) {
      errors.title = 'This field is required.'
    }
    if (!bugDescription.trim()) {
      errors.description = 'This field is required.'
    }
    if (!bugExpected.trim()) {
      errors.expected = 'This field is required.'
    }
    if (!bugActual.trim()) {
      errors.actual = 'This field is required.'
    }

    if (Object.keys(errors).length > 0) {
      setBugErrors(errors)
      return
    }

    setLoading(true)
    try {
      const { error: dbError } = await supabase.from('bug_reports').insert({
        user_id: user?.id ?? null,
        title: bugTitle.trim(),
        description: bugDescription.trim(),
        page: bugPage,
        severity: bugSeverity,
        expected_behavior: bugExpected.trim(),
        actual_behavior: bugActual.trim(),
        screenshot_url: null,
        status: 'Open'
      })

      if (dbError) throw dbError

      trackBugReported(bugPage, bugSeverity)
      setSuccessMessage('Bug report received.')
      setSuccess(true)
      resetBugForm()
    } catch (err: any) {
      console.error('[FeedbackCenter] Bug report submit failed', err)
      setError(err?.message || 'Failed to submit bug report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-close success message after delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [success, onClose])

  const tabs = [
    { id: 'review', label: '⭐ Review', icon: MessageSquare },
    { id: 'feature', label: '💡 Feature Request', icon: Lightbulb },
    { id: 'bug', label: '🐞 Report Bug', icon: Bug }
  ] as const

  const customHeader = (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-3 pt-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/20 text-brand shadow-inner">
          {activeTab === 'review' && <MessageSquare size={26} />}
          {activeTab === 'feature' && <Lightbulb size={26} />}
          {activeTab === 'bug' && <Bug size={26} />}
        </div>
        <h2 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-ink dark:text-white">
          Feedback Center
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-md mx-auto">
          Help us make WishCraft even better.
        </p>
      </div>

      {/* Tabs list (Horizontal scrollable on mobile) */}
      <div className="w-full border-b border-black/5 dark:border-white/5 pb-1">
        <div
          className="flex gap-2 overflow-x-auto hidden-scrollbar"
          role="tablist"
          aria-label="Feedback categories"
        >
          {tabs.map((tab) => {
            const TabIcon = tab.icon
            const isSelected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`focus-ring relative flex items-center gap-1.5 min-h-10 rounded-xl px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'text-white'
                    : 'text-zinc-500 hover:text-ink dark:text-zinc-400 dark:hover:text-white'
                }`}
                role="tab"
                aria-selected={isSelected}
              >
                {isSelected ? (
                  <motion.span
                    layoutId="active-feedback-tab"
                    className="absolute inset-0 rounded-xl bg-brand shadow-soft"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                ) : null}
                <TabIcon size={16} className="relative z-10 shrink-0" />
                <span className="relative z-10">{tab.label.split(' ').slice(1).join(' ')}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      maxWidth="max-w-[650px]"
      customHeader={customHeader}
    >
      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center space-y-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="text-emerald-500"
          >
            <CheckCircle size={64} className="fill-emerald-100 dark:fill-emerald-500/10" />
          </motion.div>
          <h3 className="text-xl font-bold text-ink dark:text-white">
            {successMessage}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
            Your contribution directly helps us improve the WishCraft experience for everyone.
          </p>
          <Button variant="secondary" onClick={() => setSuccess(false)}>
            Submit Another Response
          </Button>
        </motion.div>
      ) : (
        /* Tab Content Forms */
        <div className="space-y-4 pt-2">
          {/* Error Notification */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-200 dark:border-rose-500/20"
            >
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'review') void handleReviewSubmit()
                    else if (activeTab === 'feature') void handleFeatureSubmit()
                    else if (activeTab === 'bug') void handleBugSubmit()
                  }}
                  className="text-xs underline hover:opacity-85 font-bold"
                >
                  Retry submission
                </button>
              </div>
            </div>
          )}

          {/* Tab 1: ⭐ Leave a Review */}
          {activeTab === 'review' && (
            <form onSubmit={handleReviewSubmit} noValidate className="space-y-5">
              <div className="space-y-2">
                <span className="block text-sm font-semibold text-ink dark:text-white/90">
                  Rating <span className="text-rose-500">*</span>
                </span>
                <div
                  className="flex items-center gap-2"
                  role="radiogroup"
                  aria-label="Star rating out of 5"
                >
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isFilled = hoverRating ? starValue <= hoverRating : starValue <= rating
                    return (
                      <button
                        key={starValue}
                        type="button"
                        role="radio"
                        aria-checked={rating === starValue}
                        aria-label={`${starValue} Star${starValue > 1 ? 's' : ''}`}
                        onClick={() => {
                          setRating(starValue)
                          setStarError('')
                        }}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus-ring rounded-xl p-1 text-zinc-300 dark:text-zinc-700 transition hover:scale-115 active:scale-95 duration-100"
                      >
                        <Star
                          size={36}
                          className={`${
                            isFilled
                              ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_0_6px_rgba(251,191,36,0.45)]'
                              : 'text-zinc-300 dark:text-zinc-600'
                          } transition-all`}
                        />
                      </button>
                    )
                  })}
                </div>
                {starError && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-rose-600 dark:text-rose-400">
                    <AlertTriangle size={14} />
                    {starError}
                  </span>
                )}
              </div>

              <Input
                label="Review Title"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="E.g., Wonderful templates! (Optional)"
                disabled={loading}
              />

              <Textarea
                label="Review Text"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Tell us what you loved about WishCraft..."
                maxLength={1000}
                disabled={loading}
              />

              <div className="pt-2 flex justify-end gap-3 border-t border-black/5 dark:border-white/5">
                <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" loading={loading}>
                  Submit Review
                </Button>
              </div>
            </form>
          )}

          {/* Tab 2: 💡 Feature Request */}
          {activeTab === 'feature' && (
            <form onSubmit={handleFeatureSubmit} noValidate className="space-y-5">
              <Input
                label="Feature Title"
                value={featureTitle}
                onChange={(e) => handleFeatureTitleChange(e.target.value)}
                placeholder="E.g., Collaborative editing support"
                required
                disabled={loading}
                error={featureErrors.title}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Category"
                  value={featureCategory}
                  onChange={(val) => setFeatureCategory(val as typeof CATEGORY_OPTIONS[number])}
                  options={CATEGORY_OPTIONS}
                  disabled={loading}
                  required
                />

                <Select
                  label="Priority"
                  value={featurePriority}
                  onChange={(val) => setFeaturePriority(val as 'Low' | 'Medium' | 'High')}
                  options={['Low', 'Medium', 'High']}
                  disabled={loading}
                  required
                />
              </div>

              <Textarea
                label="Feature Description"
                value={featureDescription}
                onChange={(e) => handleFeatureDescriptionChange(e.target.value)}
                placeholder="Describe the feature you'd like to see..."
                required
                maxLength={1500}
                disabled={loading}
                error={featureErrors.description}
              />

              <div className="pt-2 flex justify-end gap-3 border-t border-black/5 dark:border-white/5">
                <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" loading={loading}>
                  Submit Feature Request
                </Button>
              </div>
            </form>
          )}

          {/* Tab 3: 🐞 Report Bug */}
          {activeTab === 'bug' && (
            <form onSubmit={handleBugSubmit} noValidate className="space-y-5">
              <Input
                label="Bug Title"
                value={bugTitle}
                onChange={(e) => handleBugTitleChange(e.target.value)}
                placeholder="E.g., Constellation page clips on Safari mobile"
                required
                disabled={loading}
                error={bugErrors.title}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Where did it happen?"
                  value={bugPage}
                  onChange={(val) => setBugPage(val as typeof PAGE_OPTIONS[number])}
                  options={PAGE_OPTIONS}
                  disabled={loading}
                  required
                />

                <Select
                  label="Severity"
                  value={bugSeverity}
                  onChange={(val) => setBugSeverity(val as 'Low' | 'Medium' | 'High' | 'Critical')}
                  options={['Low', 'Medium', 'High', 'Critical']}
                  disabled={loading}
                  required
                />
              </div>

              <Textarea
                label="Description"
                value={bugDescription}
                onChange={(e) => handleBugDescriptionChange(e.target.value)}
                placeholder="Describe the bug details..."
                required
                maxLength={1500}
                disabled={loading}
                error={bugErrors.description}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Textarea
                  label="Expected Behavior"
                  value={bugExpected}
                  onChange={(e) => handleBugExpectedChange(e.target.value)}
                  placeholder="What did you expect to happen?"
                  required
                  maxLength={800}
                  disabled={loading}
                  error={bugErrors.expected}
                />
                <Textarea
                  label="Actual Behavior"
                  value={bugActual}
                  onChange={(e) => handleBugActualChange(e.target.value)}
                  placeholder="What actually happened?"
                  required
                  maxLength={800}
                  disabled={loading}
                  error={bugErrors.actual}
                />
              </div>

              {/* Screenshot placeholder (UI only) */}
              <div className="space-y-1.5">
                <span className="block text-sm font-semibold text-ink dark:text-white/90">
                  Upload Screenshot (Optional)
                </span>
                <div className="border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center text-zinc-400 dark:text-zinc-500 select-none">
                  <Upload size={24} className="mb-2" />
                  <p className="text-sm font-semibold">Screenshot uploads are disabled</p>
                  <p className="text-xs mt-1">Backend file handler is not currently available.</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-black/5 dark:border-white/5">
                <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" loading={loading}>
                  Submit Bug Report
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </ResponsiveModal>
  )
}
