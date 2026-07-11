import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useNavigationStore } from '../../store/navigationStore'

export function ScrollRestoration() {
  const location = useLocation()
  const scrollToSection = useNavigationStore(state => state.scrollToSection)

  const hasRestored = useRef(false)

  // Handle route change / direct access with a hash
  useEffect(() => {
    const hash = location.hash.replace('#', '')
    if (hash && !hasRestored.current) {
      hasRestored.current = true
      
      const tryScroll = () => {
        const el = document.getElementById(hash)
        if (el) {
          scrollToSection(hash)
        } else {
          // Retry once after a larger timeout in case it's a lazy loaded section
          setTimeout(() => {
            const retryEl = document.getElementById(hash)
            if (retryEl) scrollToSection(hash)
          }, 300)
        }
      }

      if (document.readyState === 'complete') {
        setTimeout(tryScroll, 50)
      } else {
        window.addEventListener('load', tryScroll)
        return () => window.removeEventListener('load', tryScroll)
      }
    }
  }, [location.pathname, location.hash, scrollToSection])

  useEffect(() => {
    // Reset restoration flag on path change so we can restore again if needed
    hasRestored.current = false
  }, [location.pathname])

  // Handle browser back/forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash) {
        setTimeout(() => {
          scrollToSection(hash)
        }, 50)
      } else {
        // If no hash, scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [scrollToSection])

  return null
}
