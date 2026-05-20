export const breakpointPixels = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type Breakpoint = keyof typeof breakpointPixels

export function isAtLeast(width: number, breakpoint: Breakpoint) {
  return width >= breakpointPixels[breakpoint]
}

export function getBreakpoint(width: number): Breakpoint | 'base' {
  if (width >= breakpointPixels['2xl']) return '2xl'
  if (width >= breakpointPixels.xl) return 'xl'
  if (width >= breakpointPixels.lg) return 'lg'
  if (width >= breakpointPixels.md) return 'md'
  if (width >= breakpointPixels.sm) return 'sm'
  return 'base'
}

export function adaptiveSpacing(compact: boolean) {
  return compact ? 'gap-3 p-4' : 'gap-5 p-5'
}
