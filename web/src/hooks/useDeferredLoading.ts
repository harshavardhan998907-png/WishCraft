import { useState, useEffect } from 'react'

/**
 * Delays the showing of a loading state to prevent UI flicker for fast requests.
 * @param isLoading The raw loading state from the operation.
 * @param delay The delay in milliseconds before showing the loader (default: 200ms).
 * @returns A deferred boolean that only becomes true if isLoading is true for longer than the delay.
 */
export function useDeferredLoading(isLoading: boolean, delay: number = 200) {
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    if (isLoading) {
      timeoutId = setTimeout(() => {
        setShowLoading(true)
      }, delay)
    } else {
      setShowLoading(false)
    }

    return () => {
      clearTimeout(timeoutId)
    }
  }, [isLoading, delay])

  return showLoading
}
