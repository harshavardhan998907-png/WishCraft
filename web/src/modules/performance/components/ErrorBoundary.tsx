import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '../../../components/ui/Button'
import { logProductionError } from '../services/loggerService'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    void logProductionError({
      serviceName: 'react-render',
      errorType: 'render_crash',
      error,
      severity: 'critical',
    })
    console.warn('[Production] component stack', info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-cream px-4 text-center dark:bg-[#0f0f18]">
          <div className="max-w-md">
            <h1 className="text-3xl font-black text-ink dark:text-white">Something went wrong</h1>
            <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">The page is isolated safely. Refresh to try again.</p>
            <Button className="mt-6" onClick={() => window.location.reload()}>Refresh</Button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
