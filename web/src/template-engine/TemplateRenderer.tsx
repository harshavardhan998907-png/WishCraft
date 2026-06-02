import { Suspense } from 'react'
import type { ReactNode } from 'react'
import { registerFounderTemplates } from '../templates/founder/registerFounderTemplates'
import { getTemplate, getTemplateByComponentKey } from './registry'
import { TemplateRenderErrorBoundary } from './TemplateRenderErrorBoundary'
import type { TemplateProps } from './types'

interface TemplateRendererProps {
  templateId?: string | null
  slug?: string | null
  componentKey?: string | null
  props: TemplateProps
  className?: string
  fallback?: ReactNode
  errorFallback?: ReactNode
}

export function TemplateRenderer({
  templateId,
  slug,
  componentKey,
  props,
  className,
  fallback,
  errorFallback,
}: TemplateRendererProps) {
  registerFounderTemplates()
  const entry = getTemplate(templateId) ?? getTemplate(slug) ?? getTemplateByComponentKey(componentKey)

  if (!entry) {
    return (
      <div className="grid min-h-[520px] place-items-center rounded-lg bg-zinc-100 px-5 text-center font-semibold text-zinc-500 dark:bg-white/10 dark:text-white/55">
        Template missing or not registered.
      </div>
    )
  }

  const Component = entry.component

  return (
    <TemplateRenderErrorBoundary fallback={errorFallback}>
      <div className={className}>
        <Suspense fallback={fallback ?? <div className="grid min-h-[520px] place-items-center bg-cream font-bold text-zinc-500 dark:bg-[#10101a] dark:text-white/60">Loading template...</div>}>
          <Component {...props} />
        </Suspense>
      </div>
    </TemplateRenderErrorBoundary>
  )
}
