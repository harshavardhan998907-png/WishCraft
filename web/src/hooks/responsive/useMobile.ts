import { useEffect, useState } from 'react'
import { breakpointPixels } from '../../utils/responsive'

export function useMobile(maxWidth = breakpointPixels.md - 1) {
  const [mobile, setMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= maxWidth
  })

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${maxWidth}px)`)
    const update = () => setMobile(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [maxWidth])

  return mobile
}
