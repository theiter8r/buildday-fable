import { useState, type ReactNode } from 'react'
import { loadWorkflow, clearAll, type LoadWorkflowResult } from '@/domain'
import { useOpsflowStore } from '@/store'
import { ErrorState } from '@/components/ErrorState'
import { HeroWelcome } from '@/components/HeroWelcome'
import { Button } from '@/components/Button'
import { ImportDialog } from '@/components/ImportDialog'

interface BootGateProps {
  children: ReactNode
}

/**
 * Chooses hero / editor / error-state per ARCHITECTURE.md §8, from its own
 * `loadWorkflow()` read (synchronous — a `localStorage` read — so there is
 * no async loading phase to skeleton). This is a read for *display*
 * purposes only: `@/store`'s barrel already runs `bootWorkflowStore` as a
 * module side effect (see `store/boot.ts`) before this component ever
 * mounts, so the live document is already correct by the time `children`
 * renders — `BootGate` does not call `setDoc` itself, which would otherwise
 * push a redundant `replace-doc` onto the undo stack for every boot.
 */
export function BootGate({ children }: BootGateProps) {
  const [result] = useState<LoadWorkflowResult>(() => loadWorkflow())
  const [recovered, setRecovered] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const resetToDemo = useOpsflowStore((s) => s.resetToDemo)

  if (result.status === 'missing') {
    return (
      <>
        <HeroWelcome onImport={() => setImportOpen(true)} />
        <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
      </>
    )
  }

  if (result.status === 'corrupt' && !recovered) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-900 p-6">
        <ErrorState
          title="Something's off with your saved workflow"
          body="The workflow stored on this device couldn't be read. You can reset to the demo workflow, or export the raw data first in case it's recoverable."
          detail={result.errors.join('\n')}
          actions={
            <>
              <Button
                variant="gold"
                data-testid="reset-button"
                onClick={() => {
                  clearAll()
                  resetToDemo()
                  setRecovered(true)
                }}
              >
                Reset to demo
              </Button>
              <Button
                variant="secondary"
                data-testid="download-raw-data-button"
                onClick={() => {
                  const blob = new Blob([result.raw], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = window.document.createElement('a')
                  a.href = url
                  a.download = 'opsflow-raw-data.json'
                  a.click()
                  setTimeout(() => URL.revokeObjectURL(url), 0)
                }}
              >
                Export raw data
              </Button>
            </>
          }
        />
      </div>
    )
  }

  return <>{children}</>
}
