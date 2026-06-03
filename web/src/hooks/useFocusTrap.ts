import { useEffect, useRef } from 'react'

/**
 * Lightweight focus-trap hook for dialogs and drawers.
 * Traps Tab / Shift+Tab focus cycling within the container.
 * Restores focus to the previously-focused element on close.
 */
export function useFocusTrap(open: boolean) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    // Save the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement | null

    const container = containerRef.current
    if (!container) return

    // Focus the first focusable element inside
    const focusableSelector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

    const moveFocusInside = () => {
      const firstFocusable = container.querySelector<HTMLElement>(focusableSelector)
      firstFocusable?.focus()
    }

    // Small delay so the DOM can paint
    const raf = requestAnimationFrame(moveFocusInside)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusableElements = Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelector)
      )
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelAnimationFrame(raf)
      container.removeEventListener('keydown', handleKeyDown)
      // Restore focus
      previousFocusRef.current?.focus()
    }
  }, [open])

  return containerRef
}
