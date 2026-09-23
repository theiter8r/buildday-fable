import { useState } from 'react'
import { useOpsflowStore } from '@/store'
import { exportWorkflow } from '@/domain'
import { Button } from '@/components/Button'
import { IconButton } from '@/components/IconButton'
import { Chip, ChipButton } from '@/components/Chip'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { toast } from '@/components/toast'
import {
  UndoIcon,
  RedoIcon,
  DownloadIcon,
  UploadIcon,
  PlayIcon,
  ResetIcon,
  WarningIcon,
  MenuIcon,
} from '@/components/icons'
import { useIsMobile } from './useMediaQuery'

export interface TopBarProps {
  onOpenImport: () => void
  onOpenMobileMenu?: () => void
}

/** Name field, Run/Stop, validation chip, undo/redo, import/export, reset (ARCHITECTURE.md §2, §10). */
export function TopBar({ onOpenImport, onOpenMobileMenu }: TopBarProps) {
  const isMobile = useIsMobile()
  const name = useOpsflowStore((s) => s.document.name)
  const document = useOpsflowStore((s) => s.document)
  const renameDoc = useOpsflowStore((s) => s.renameDoc)
  const canUndo = useOpsflowStore((s) => s.canUndo)
  const canRedo = useOpsflowStore((s) => s.canRedo)
  const undo = useOpsflowStore((s) => s.undo)
  const redo = useOpsflowStore((s) => s.redo)
  const issues = useOpsflowStore((s) => s.issues)
  const runDisabledReason = useOpsflowStore((s) => s.runDisabledReason)
  const status = useOpsflowStore((s) => s.status)
  const start = useOpsflowStore((s) => s.start)
  const reset = useOpsflowStore((s) => s.reset)
  const resetToDemo = useOpsflowStore((s) => s.resetToDemo)
  const persistenceStatus = useOpsflowStore((s) => s.persistenceStatus)
  const lastSavedAt = useOpsflowStore((s) => s.lastSavedAt)

  const [nameDraft, setNameDraft] = useState(name)
  const [syncedName, setSyncedName] = useState(name)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const isRunning = status === 'running' || status === 'awaiting-approval' || status === 'paused'

  // Resync the draft when the store's name changes from elsewhere (undo,
  // import, reset) without touching it while the user is actively typing —
  // the "adjust state during render" pattern, not an effect, so it never
  // fires a second render pass after commit (react-hooks/set-state-in-effect).
  if (name !== syncedName) {
    setSyncedName(name)
    setNameDraft(name)
  }

  const errorCount = issues.filter((i) => i.severity === 'error').length
  const warningCount = issues.filter((i) => i.severity === 'warning').length

  function commitName() {
    const trimmed = nameDraft.trim()
    if (trimmed && trimmed !== name) renameDoc(trimmed)
    else setNameDraft(name)
  }

  function handleExport() {
    const { filename, json } = exportWorkflow(document)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 0)
    toast.success('Workflow exported')
  }

  const saveStatusText =
    persistenceStatus === 'error'
      ? "Couldn't save — storage unavailable"
      : persistenceStatus === 'saving'
        ? 'Saving…'
        : lastSavedAt
          ? `Saved · ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : 'Saved locally'

  return (
    <header
      data-testid="topbar"
      className="z-topbar flex h-13 items-center gap-3 border-b border-line-soft bg-navy-900 px-4"
    >
      {isMobile && onOpenMobileMenu && (
        <IconButton label="Menu" icon={<MenuIcon size={18} />} onClick={onOpenMobileMenu} />
      )}

      <label htmlFor="workflow-name-input" className="sr-only">
        Workflow name
      </label>
      <input
        id="workflow-name-input"
        data-testid="workflow-name-input"
        value={nameDraft}
        onChange={(e) => setNameDraft(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
        className="min-w-0 flex-1 truncate bg-transparent text-[length:var(--text-title)] text-cream-50 focus-visible:shadow-[var(--glow-focus)] focus-visible:outline-none sm:max-w-xs"
      />

      {!isMobile && (
        <Chip
          data-testid="save-status"
          tone={persistenceStatus === 'error' ? 'error' : 'neutral'}
        >
          {saveStatusText}
        </Chip>
      )}

      {issues.length > 0 && (
        <ChipButton
          tone={errorCount > 0 ? 'error' : 'warning'}
          icon={<WarningIcon size={12} />}
          data-testid="validation-chip"
        >
          {errorCount > 0 ? `${errorCount} issue${errorCount === 1 ? '' : 's'}` : `${warningCount} warning${warningCount === 1 ? '' : 's'}`}
        </ChipButton>
      )}

      <div className="flex items-center gap-1">
        <IconButton
          label="Undo"
          icon={<UndoIcon size={16} />}
          data-testid="undo-button"
          disabled={!canUndo}
          onClick={undo}
        />
        <IconButton
          label="Redo"
          icon={<RedoIcon size={16} />}
          data-testid="redo-button"
          disabled={!canRedo}
          onClick={redo}
        />
      </div>

      {!isMobile && (
        <>
          <IconButton
            label="Export JSON"
            icon={<DownloadIcon size={16} />}
            data-testid="export-button"
            onClick={handleExport}
          />
          <IconButton
            label="Import JSON"
            icon={<UploadIcon size={16} />}
            data-testid="import-button"
            onClick={onOpenImport}
          />
          <IconButton
            label="Reset to demo"
            icon={<ResetIcon size={16} />}
            data-testid="reset-button"
            onClick={() => setResetConfirmOpen(true)}
          />
        </>
      )}

      <span aria-live="polite" className="sr-only" data-testid="run-live-region">
        {runDisabledReason ? `Can't run: ${runDisabledReason}` : ''}
      </span>

      <Button
        id="run-button"
        data-testid="run-button"
        variant={isRunning ? 'danger' : 'primary'}
        leadingIcon={<PlayIcon size={16} />}
        disabled={!isRunning && Boolean(runDisabledReason)}
        disabledReason={runDisabledReason ?? undefined}
        onClick={isRunning ? reset : start}
      >
        {isRunning ? 'Stop' : 'Run'}
      </Button>

      <ConfirmDialog
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={() => {
          resetToDemo()
          toast.success('Workflow reset to demo')
        }}
        title="Reset to demo workflow?"
        body="This replaces your current canvas with the built-in Critical API Incident demo. Your current workflow will be lost unless you've exported it."
        confirmLabel="Reset to demo"
        cancelLabel="Cancel"
      />
    </header>
  )
}
