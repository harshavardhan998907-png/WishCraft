import { create } from 'zustand'

export interface Section {
  id: string
  label: string
}

interface NavigationState {
  activeSection: string
  registeredSections: Section[]
  isManualScrolling: boolean
  
  setActiveSection: (id: string) => void
  setRegisteredSections: (sections: Section[]) => void
  setIsManualScrolling: (isScrolling: boolean) => void
  scrollToSection: (id: string, offset?: number) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeSection: '',
  registeredSections: [],
  isManualScrolling: false,
  
  setActiveSection: (id) => set({ activeSection: id }),
  setRegisteredSections: (sections) => set((state) => {
    if (JSON.stringify(state.registeredSections) === JSON.stringify(sections)) {
      return state // Prevent unnecessary updates and infinite loops
    }
    return { registeredSections: sections }
  }),
  setIsManualScrolling: (isScrolling) => set({ isManualScrolling: isScrolling }),
  
  scrollToSection: (id, offset = 100) => {
    const element = document.getElementById(id)
    if (element) {
      set({ isManualScrolling: true, activeSection: id })
      
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - offset
      
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      
      window.scrollTo({
        top: offsetPosition,
        behavior: prefersReducedMotion ? 'instant' : 'smooth'
      })
      
      // Update hash without triggering a jump
      if (window.history.replaceState) {
        window.history.replaceState(null, '', `#${id}`)
      }
      
      // Release manual scrolling lock after animation duration
      setTimeout(() => {
        set({ isManualScrolling: false })
      }, 1000)
    }
  }
}))
