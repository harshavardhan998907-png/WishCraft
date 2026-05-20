import { useEffect, useState } from 'react'
import { getBreakpoint, type Breakpoint } from '../../utils/responsive'

export function useBreakpoint(): Breakpoint | 'base' {
  const [breakpoint, setBreakpoint] = useState<Breakpoint | 'base'>(() => {
    if (typeof window === 'undefined') return 'base'
    return getBreakpoint(window.innerWidth)
  })

  useEffect(() => {
    const update = () => setBreakpoint(getBreakpoint(window.innerWidth))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return breakpoint
}
