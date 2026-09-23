import { useRef, useState } from 'react'
import { importWorkflow } from '@/domain'
import { useOpsflowStore } from '@/store'
import { Dialog } from './Dialog'
import { Tabs } from './Tabs'
import { Button } from './Button'
import { Textarea } from './Textarea'
import { toast } from './toast'

export interface ImportDialogProps {
  open: boolean
  onClose: () => void
}

interface ImportIssue {
  path: string
  message: string
}

/** File picker + paste-JSON tabs, zod error list, per ARCHITECTURE.md §9. */
export function ImportDialog({ open, onClose }: ImportDialogProps) {
  const setDoc = useOpsflowStore((s) => s.setDoc)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pasteText, setPasteText] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [issues, setIssues] = useState<ImportIssue[]>([])

  function reset() {
    setPasteText('')
    setErrorMessage(null)
    setIssues([])
  }

  function handleClose() {
    reset()
    onClose()
  }

  function applyImport(text: string) {
    setErrorMessage(null)
    setIssues([])
    let result: ReturnType<typeof importWorkflow>
    try {
      result = importWorkflow(text)
    } catch {
      setErrorMessage("This isn't valid JSON — check for a missing comma or bracket.")
      return
    }
    if (!result.ok) {
      if (result.kind === 'json') {
        setErrorMessage("This isn't valid JSON — check for a missing comma or bracket.")
      } else if (result.kind === 'version') {
        setErrorMessage(result.message)
      } else {
        setErrorMessage("This file doesn't match the OpsFlow workflow format:")
        setIssues(result.issues)
      }
      return
    }
    setDoc(result.doc, 'import')
    toast.success('Workflow imported.')
    handleClose()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    file
      .text()
      .then(applyImport)
      .catch(() => setErrorMessage("This isn't valid JSON — check for a missing comma or bracket."))
    e.target.value = ''
  }

  const errorList = (
    <div role="alert" className="mt-3 rounded-[var(--radius-sm)] border border-[var(--color-state-error)] bg-navy-950 p-3">
      <p className="text-[length:var(--text-meta)] text-[var(--color-state-error)]">{errorMessage}</p>
      {issues.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {issues.map((issue, i) => (
            <li key={i} className="text-[length:var(--text-meta)] text-text-muted">
              <code className="font-[family-name:var(--font-mono)] text-cream-200">{issue.path}</code> —{' '}
              {issue.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <Dialog open={open} onClose={handleClose} title="Import workflow" testId="import-dialog">
      <Tabs
        label="Import workflow"
        testIdPrefix="import-tab"
        items={[
          {
            id: 'file',
            label: 'Upload file',
            panel: (
              <div className="relative flex flex-col gap-3">
                <p className="text-[length:var(--text-meta)] text-text-muted">
                  Choose a <code>.json</code> file exported from OpsFlow.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  data-testid="import-file-input"
                  aria-label="Workflow JSON file"
                  onChange={handleFileChange}
                  className="absolute h-px w-px overflow-hidden opacity-0"
                />
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  Choose file…
                </Button>
              </div>
            ),
          },
          {
            id: 'paste',
            label: 'Paste JSON',
            panel: (
              <div className="flex flex-col gap-3">
                <Textarea
                  aria-label="Workflow JSON"
                  data-testid="import-paste-textarea"
                  placeholder="Paste workflow JSON here…"
                  rows={10}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  className="font-[family-name:var(--font-mono)]"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    data-testid="import-submit"
                    onClick={() => applyImport(pasteText)}
                  >
                    Import
                  </Button>
                </div>
              </div>
            ),
          },
        ]}
      />
      {errorMessage && errorList}
    </Dialog>
  )
}
