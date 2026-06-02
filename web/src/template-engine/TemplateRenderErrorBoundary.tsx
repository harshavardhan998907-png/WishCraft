import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class TemplateRenderErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[TemplateRenderer] render failed', { error, info })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="grid min-h-[520px] place-items-center rounded-lg bg-rose-50 px-5 text-center font-semibold text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">
          This template could not be rendered.
        </div>
      )
    }

    return this.props.children
  }
}
