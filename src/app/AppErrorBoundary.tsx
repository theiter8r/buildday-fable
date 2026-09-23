import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/Button'
import { workflowStore } from '@/store'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/** Render-crash fallback with Reset to demo + copy-error (ARCHITECTURE.md §2). */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('OpsFlow crashed:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-900 p-6">
        <ErrorState
          title="Something went wrong"
          body="OpsFlow hit an unexpected error while rendering. Your saved workflow is untouched."
          detail={`${error.name}: ${error.message}\n${error.stack ?? ''}`}
          actions={
            <>
              <Button
                variant="gold"
                onClick={() => {
                  workflowStore.getState().resetToDemo()
                  this.setState({ error: null })
                }}
              >
                Reset to demo
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  void navigator.clipboard?.writeText(`${error.name}: ${error.message}\n${error.stack ?? ''}`)
                }}
              >
                Copy error
              </Button>
            </>
          }
        />
      </div>
    )
  }
}
