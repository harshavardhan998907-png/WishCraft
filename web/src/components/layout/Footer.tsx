import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { MessageSquare, Info, Mail, LayoutGrid, Sparkles, Play, ShieldCheck, FileText } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const InstagramIcon = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
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

import { HowItWorksDialog } from '../shared/HowItWorksDialog'
import { AboutDialog } from '../shared/AboutDialog'
import { PrivacyPolicyDialog } from '../shared/PrivacyPolicyDialog'
import { TermsOfServiceDialog } from '../shared/TermsOfServiceDialog'
import { FeedbackDialog } from '../shared/FeedbackDialog'

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

  function handleBrowseTemplatesClick(e: React.MouseEvent) {
    if (location.pathname === '/browse') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
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
            {user && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setFeedbackOpen(true)}
                  className="group focus-ring flex w-full max-w-[220px] items-center gap-3 rounded-xl border border-black/5 bg-white p-2.5 text-sm transition-all duration-200 hover:scale-[1.01] hover:border-black/10 hover:bg-zinc-50 hover:shadow-sm dark:border-white/5 dark:bg-white/5 dark:hover:border-white/10 dark:hover:bg-white/10"
                  title="Open Feedback Center"
                  aria-label="Open Feedback Center"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-600 transition-all duration-200 group-hover:scale-105 group-hover:bg-brand/10 group-hover:text-brand dark:bg-white/5 dark:text-zinc-400 dark:group-hover:bg-brand/20 dark:group-hover:text-brand">
                    <MessageSquare size={18} className="shrink-0" />
                  </div>
                  <span className="font-semibold text-ink transition-colors duration-200 group-hover:text-brand group-hover:underline dark:text-white leading-tight">
                    Feedback Center
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-ink dark:text-white">Product</h4>
            <ul className="space-y-2.5">
              <li>
                <Link 
                  to={user ? "/browse" : "/auth?redirect=/browse"}
                  onClick={handleBrowseTemplatesClick}
                  className="group focus-ring flex items-center gap-3 rounded-xl border border-black/5 bg-white p-2.5 text-sm transition-all duration-200 hover:scale-[1.01] hover:border-black/10 hover:bg-zinc-50 hover:shadow-sm dark:border-white/5 dark:bg-white/5 dark:hover:border-white/10 dark:hover:bg-white/10"
                  title="Browse Templates"
                  aria-label="Browse Templates"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-600 transition-all duration-200 group-hover:scale-105 group-hover:bg-brand/10 group-hover:text-brand dark:bg-white/5 dark:text-zinc-400 dark:group-hover:bg-brand/20 dark:group-hover:text-brand">
                    <LayoutGrid size={18} className="shrink-0" />
                  </div>
                  <span className="font-semibold text-ink transition-colors duration-200 group-hover:text-brand group-hover:underline dark:text-white leading-tight">
                    Browse Templates
                  </span>
                </Link>
              </li>
              <li>
                <Link 
                  to={user ? "/browse#templates-gallery" : "/auth?redirect=/browse#templates-gallery"}
                  onClick={handleCreateWish}
                  className="group focus-ring flex items-center gap-3 rounded-xl border border-black/5 bg-white p-2.5 text-sm transition-all duration-200 hover:scale-[1.01] hover:border-black/10 hover:bg-zinc-50 hover:shadow-sm dark:border-white/5 dark:bg-white/5 dark:hover:border-white/10 dark:hover:bg-white/10"
                  title="Create Wish"
                  aria-label="Create Wish"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-600 transition-all duration-200 group-hover:scale-105 group-hover:bg-brand/10 group-hover:text-brand dark:bg-white/5 dark:text-zinc-400 dark:group-hover:bg-brand/20 dark:group-hover:text-brand">
                    <Sparkles size={18} className="shrink-0" />
                  </div>
                  <span className="font-semibold text-ink transition-colors duration-200 group-hover:text-brand group-hover:underline dark:text-white leading-tight">
                    Create Wish
                  </span>
                </Link>
              </li>
              <li>
                <a 
                  href="/#how-it-works" 
                  onClick={handleHowItWorksClick}
                  className="group focus-ring flex items-center gap-3 rounded-xl border border-black/5 bg-white p-2.5 text-sm transition-all duration-200 hover:scale-[1.01] hover:border-black/10 hover:bg-zinc-50 hover:shadow-sm dark:border-white/5 dark:bg-white/5 dark:hover:border-white/10 dark:hover:bg-white/10"
                  title="How It Works"
                  aria-label="How It Works"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-600 transition-all duration-200 group-hover:scale-105 group-hover:bg-brand/10 group-hover:text-brand dark:bg-white/5 dark:text-zinc-400 dark:group-hover:bg-brand/20 dark:group-hover:text-brand">
                    <Play size={18} className="shrink-0" />
                  </div>
                  <span className="font-semibold text-ink transition-colors duration-200 group-hover:text-brand group-hover:underline dark:text-white leading-tight">
                    How It Works
                  </span>
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-ink dark:text-white">Connect</h4>
            <ul className="space-y-2.5">
              <li>
                <a 
                  href="#" 
                  onClick={handleAboutClick}
                  className="group focus-ring flex items-center gap-3 rounded-xl border border-black/5 bg-white p-2.5 text-sm transition-all duration-200 hover:scale-[1.01] hover:border-black/10 hover:bg-zinc-50 hover:shadow-sm dark:border-white/5 dark:bg-white/5 dark:hover:border-white/10 dark:hover:bg-white/10"
                  title="About WishCraft"
                  aria-label="About WishCraft"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-600 transition-all duration-200 group-hover:scale-105 group-hover:bg-brand/10 group-hover:text-brand dark:bg-white/5 dark:text-zinc-400 dark:group-hover:bg-brand/20 dark:group-hover:text-brand">
                    <Info size={18} className="shrink-0" />
                  </div>
                  <span className="font-semibold text-ink transition-colors duration-200 group-hover:text-brand group-hover:underline dark:text-white leading-tight">
                    About WishCraft
                  </span>
                </a>
              </li>
              <li>
                <a 
                  href="https://www.instagram.com/ctrlcreate.works?igsh=eWtucnMzdHR0NHkx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group focus-ring flex items-center gap-3 rounded-xl border border-black/5 bg-white p-2.5 text-sm transition-all duration-200 hover:scale-[1.01] hover:border-black/10 hover:bg-zinc-50 hover:shadow-sm dark:border-white/5 dark:bg-white/5 dark:hover:border-white/10 dark:hover:bg-white/10"
                  title="Follow WishCraft on Instagram"
                  aria-label="Follow WishCraft on Instagram"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-600 transition-all duration-200 group-hover:scale-105 group-hover:bg-brand/10 group-hover:text-brand dark:bg-white/5 dark:text-zinc-400 dark:group-hover:bg-brand/20 dark:group-hover:text-brand">
                    <InstagramIcon size={18} className="shrink-0" />
                  </div>
                  <span className="font-semibold text-ink transition-colors duration-200 group-hover:text-brand group-hover:underline dark:text-white leading-tight">
                    Instagram
                  </span>
                </a>
              </li>
              <li>
                <a 
                  href="mailto:ctrlandcreate26@gmail.com"
                  className="group focus-ring flex items-center gap-3 rounded-xl border border-black/5 bg-white p-2.5 text-sm transition-all duration-200 hover:scale-[1.01] hover:border-black/10 hover:bg-zinc-50 hover:shadow-sm dark:border-white/5 dark:bg-white/5 dark:hover:border-white/10 dark:hover:bg-white/10"
                  title="Email the WishCraft Team"
                  aria-label="Email the WishCraft Team"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-600 transition-all duration-200 group-hover:scale-105 group-hover:bg-brand/10 group-hover:text-brand dark:bg-white/5 dark:text-zinc-400 dark:group-hover:bg-brand/20 dark:group-hover:text-brand">
                    <Mail size={18} className="shrink-0" />
                  </div>
                  <span className="font-semibold text-ink transition-colors duration-200 group-hover:text-brand group-hover:underline dark:text-white leading-tight">
                    Support
                  </span>
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-ink dark:text-white">Legal</h4>
            <ul className="space-y-2.5">
              <li>
                <a 
                  href="#" 
                  onClick={handlePrivacyClick}
                  className="group focus-ring flex items-center gap-3 rounded-xl border border-black/5 bg-white p-2.5 text-sm transition-all duration-200 hover:scale-[1.01] hover:border-black/10 hover:bg-zinc-50 hover:shadow-sm dark:border-white/5 dark:bg-white/5 dark:hover:border-white/10 dark:hover:bg-white/10"
                  title="Privacy Policy"
                  aria-label="Privacy Policy"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-600 transition-all duration-200 group-hover:scale-105 group-hover:bg-brand/10 group-hover:text-brand dark:bg-white/5 dark:text-zinc-400 dark:group-hover:bg-brand/20 dark:group-hover:text-brand">
                    <ShieldCheck size={18} className="shrink-0" />
                  </div>
                  <span className="font-semibold text-ink transition-colors duration-200 group-hover:text-brand group-hover:underline dark:text-white leading-tight">
                    Privacy Policy
                  </span>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  onClick={handleTermsClick}
                  className="group focus-ring flex items-center gap-3 rounded-xl border border-black/5 bg-white p-2.5 text-sm transition-all duration-200 hover:scale-[1.01] hover:border-black/10 hover:bg-zinc-50 hover:shadow-sm dark:border-white/5 dark:bg-white/5 dark:hover:border-white/10 dark:hover:bg-white/10"
                  title="Terms of Service"
                  aria-label="Terms of Service"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-600 transition-all duration-200 group-hover:scale-105 group-hover:bg-brand/10 group-hover:text-brand dark:bg-white/5 dark:text-zinc-400 dark:group-hover:bg-brand/20 dark:group-hover:text-brand">
                    <FileText size={18} className="shrink-0" />
                  </div>
                  <span className="font-semibold text-ink transition-colors duration-200 group-hover:text-brand group-hover:underline dark:text-white leading-tight">
                    Terms of Service
                  </span>
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
