import { breakpointPixels } from '../../utils/responsive'
import { useBreakpoint } from './useBreakpoint'
import { useMobile } from './useMobile'

export function useResponsive() {
  const breakpoint = useBreakpoint()
  const isMobile = useMobile()
  const isTablet = useMobile(breakpointPixels.lg - 1) && !isMobile

  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    isTouch: isMobile || isTablet,
  }
}
