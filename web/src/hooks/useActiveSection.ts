import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export function useActiveSection(sectionIds: string[], offsetRootMargin: string = '-50% 0px -50% 0px') {
  const [activeSection, setActiveSection] = useState<string>(sectionIds[0] || '')
  const location = useLocation()
  const navigate = useNavigate()
  
  // Track manual navigation to avoid observer overriding immediately after a click
  const isManualScroll = useRef(false)
  const manualScrollTimeout = useRef<number | null>(null)

  useEffect(() => {
    // If the hash matches one of our sections, set it active and scroll
    const hash = location.hash.replace('#', '')
    if (hash && sectionIds.includes(hash)) {
      setActiveSection(hash)
      const element = document.getElementById(hash)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        
        // Prevent intersection observer from firing while smoothly scrolling
        isManualScroll.current = true
        if (manualScrollTimeout.current) window.clearTimeout(manualScrollTimeout.current)
        manualScrollTimeout.current = window.setTimeout(() => {
          isManualScroll.current = false
        }, 1000)
      }
    }
  }, [location.hash, sectionIds])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isManualScroll.current) return
        
        // Find the first intersecting entry
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
            // Replace state so we don't spam the history stack while scrolling
            navigate(`${location.pathname}#${entry.target.id}`, { replace: true })
          }
        })
      },
      { rootMargin: offsetRootMargin, threshold: 0 }
    )

    // Observe elements
    const elements = sectionIds.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    elements.forEach((element) => observer.observe(element))

    return () => {
      elements.forEach((element) => observer.unobserve(element))
      observer.disconnect()
    }
  }, [sectionIds, offsetRootMargin, navigate, location.pathname])

  return activeSection
}
