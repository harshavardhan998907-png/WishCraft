import { useEffect } from 'react'
import { useNavigationStore, Section } from '../store/navigationStore'

export function useSectionObserver(sections: Section[], offsetRootMargin: string = '-20% 0px -60% 0px') {
  const setActiveSection = useNavigationStore(state => state.setActiveSection)
  const setRegisteredSections = useNavigationStore(state => state.setRegisteredSections)
  
  // Register sections on mount
  useEffect(() => {
    setRegisteredSections(sections)
    return () => setRegisteredSections([])
  }, [sections, setRegisteredSections])

  useEffect(() => {
    if (!sections || sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Skip observer updates if user clicked a nav link (manual scrolling)
        if (useNavigationStore.getState().isManualScrolling) return
        
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
            
            // Replace state to sync URL silently without causing full re-renders
            const currentHash = window.location.hash
            const newHash = `#${entry.target.id}`
            if (currentHash !== newHash && window.history.replaceState) {
              window.history.replaceState(null, '', newHash)
            }
          }
        })
      },
      { rootMargin: offsetRootMargin, threshold: 0 }
    )

    const elements = sections.map(s => document.getElementById(s.id)).filter(Boolean) as HTMLElement[]
    elements.forEach((element) => observer.observe(element))

    return () => {
      elements.forEach((element) => observer.unobserve(element))
      observer.disconnect()
    }
  }, [sections, offsetRootMargin, setActiveSection])
}
