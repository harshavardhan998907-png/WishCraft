import type { ReactNode } from 'react'
import type { Template, Wish } from '../types'
import { TemplateRenderer } from './TemplateRenderer'
import { formDataToTemplateProps, wishToFormData } from './schema'

interface WishRendererProps {
  wish: Wish
  template?: Template | null
  previewMode?: boolean
  fallback?: ReactNode
}

export function TemplateNotFound({ templateId }: { templateId?: string | null }) {
  return (
    <div className="grid min-h-screen place-items-center bg-ink px-5 text-center text-white">
      <div className="max-w-md space-y-3">
        <h1 className="text-3xl font-heading font-black">Template unavailable</h1>
        <p className="text-white/65">
          This wish was created with a template that is not registered in this build.
        </p>
        {templateId ? <p className="text-xs font-semibold text-white/35">Template: {templateId}</p> : null}
      </div>
    </div>
  )
}

export function WishRenderer({ wish, template, previewMode = false, fallback }: WishRendererProps) {
  const templateSlug = wish.template_slug ?? template?.slug
  const componentKey = template?.component_key ?? template?.component_name
  const formData = wishToFormData(wish)

  return (
    <TemplateRenderer
      templateId={templateSlug}
      slug={templateSlug}
      componentKey={componentKey}
      bundleUrl={template?.bundle_url}
      isExternal={template?.is_external}
      props={formDataToTemplateProps(formData, previewMode)}
      fallback={fallback}
      errorFallback={<TemplateNotFound templateId={templateSlug ?? wish.template_id} />}
    />
  )
}

