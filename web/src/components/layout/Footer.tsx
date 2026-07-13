import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { HowItWorksDialog } from '../shared/HowItWorksDialog'
import { AboutDialog } from '../shared/AboutDialog'
import { PrivacyPolicyDialog } from '../shared/PrivacyPolicyDialog'
import { TermsOfServiceDialog } from '../shared/TermsOfServiceDialog'
import { FeedbackDialog } from '../shared/FeedbackDialog'
import { trackInstagramClicked } from '../../modules/analytics/services/analyticsService'

const Instagram = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)

export function Footer() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [howItWorksOpen, setHowItWorksOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  function handleAboutClick(e: React.MouseEvent) {
    e.preventDefault()
    setAboutOpen(true)
  }

  function handlePrivacyClick(e: React.MouseEvent) {
    e.preventDefault()
    setPrivacyOpen(true)
  }

  function handleTermsClick(e: React.MouseEvent) {
    e.preventDefault()
    setTermsOpen(true)
  }

  function handleHowItWorksClick(e: React.MouseEvent) {
    if (user) {
      e.preventDefault()
      setHowItWorksOpen(true)
    }
  }

  function handleCreateWish(e: React.MouseEvent) {
    if (user && location.pathname === '/browse') {
      e.preventDefault()
      const el = document.getElementById('templates-gallery')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        el.classList.add('ring-4', 'ring-brand/50', 'rounded-3xl', 'transition-all', 'duration-500')
        setTimeout(() => el.classList.remove('ring-4', 'ring-brand/50'), 1000)
      }
    } else if (user) {
      e.preventDefault()
      navigate('/browse#templates-gallery')
    }
  }

  return (
    <footer className="border-t border-black/10 bg-white px-6 py-12 md:py-16 transition-colors dark:border-white/10 dark:bg-[#10101a]">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2 text-xl font-black tracking-normal text-ink transition-colors dark:text-white">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-ink text-sm text-white shadow-soft dark:bg-white dark:text-ink">WC</span>
              WishCraft
            </Link>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
              Bespoke animated celebration sites. Turn simple greetings into cinematic memories that last forever.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="https://www.instagram.com/ctrlcreate.works?igsh=eWtucnMzdHR0NHkx"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackInstagramClicked()}
                className="focus-ring inline-flex items-center gap-2 rounded-xl border border-black/5 bg-zinc-50 px-3.5 py-2 text-sm font-bold text-zinc-500 transition hover:bg-zinc-100 hover:text-brand dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-brand"
                title="Follow WishCraft on Instagram"
                aria-label="Follow WishCraft on Instagram"
              >
                <Instagram size={18} className="shrink-0" />
                <span className="hidden sm:inline">Instagram</span>
              </a>

              {user && (
                <button
                  type="button"
                  onClick={() => setFeedbackOpen(true)}
                  className="focus-ring inline-flex items-center gap-2 rounded-xl border border-black/5 bg-zinc-50 px-3.5 py-2 text-sm font-bold text-zinc-500 transition hover:bg-zinc-100 hover:text-brand dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-brand"
                  title="Open Feedback Center"
                  aria-label="Open Feedback Center"
                >
                  <MessageSquare size={18} className="shrink-0" />
                  <span className="hidden sm:inline">Feedback Center</span>
                </button>
              )}
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-ink dark:text-white">Product</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/browse" className="text-zinc-500 hover:text-brand dark:text-zinc-400 dark:hover:text-brand transition-colors">Browse Templates</Link></li>
              <li>
                <Link 
                  to={user ? "/browse#templates-gallery" : "/auth?redirect=/browse#templates-gallery"}
                  onClick={handleCreateWish}
                  className="text-zinc-500 hover:text-brand dark:text-zinc-400 dark:hover:text-brand transition-colors"
                >
                  Create Wish
                </Link>
              </li>
              <li>
                <a 
                  href="/#how-it-works" 
                  onClick={handleHowItWorksClick}
                  className="text-zinc-500 hover:text-brand dark:text-zinc-400 dark:hover:text-brand transition-colors"
                >
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-ink dark:text-white">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a 
                  href="#" 
                  onClick={handleAboutClick}
                  className="text-zinc-500 hover:text-brand dark:text-zinc-400 dark:hover:text-brand transition-colors"
                >
                  About
                </a>
              </li>
              <li><a href="#" className="text-zinc-500 hover:text-brand dark:text-zinc-400 dark:hover:text-brand transition-colors">Contact</a></li>
              <li><a href="#" className="text-zinc-500 hover:text-brand dark:text-zinc-400 dark:hover:text-brand transition-colors">Support</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-ink dark:text-white">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a 
                  href="#" 
                  onClick={handlePrivacyClick}
                  className="text-zinc-500 hover:text-brand dark:text-zinc-400 dark:hover:text-brand transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  onClick={handleTermsClick}
                  className="text-zinc-500 hover:text-brand dark:text-zinc-400 dark:hover:text-brand transition-colors"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-black/10 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-400 dark:text-zinc-500">
          <p>© {new Date().getFullYear()} WishCraft. All rights reserved.</p>
          <p>Beautiful wishes, live for 24 hours.</p>
        </div>
      </div>

      <HowItWorksDialog open={howItWorksOpen} onClose={() => setHowItWorksOpen(false)} />
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <PrivacyPolicyDialog open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      <TermsOfServiceDialog open={termsOpen} onClose={() => setTermsOpen(false)} />
      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </footer>
  )
}
