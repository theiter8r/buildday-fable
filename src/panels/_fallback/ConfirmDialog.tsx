/**
 * Minimal typed local fallback for the shared `ConfirmDialog` primitive
 * (see docs/lane-notes/panels.md). Destructive-confirm dialog with the
 * canonical `confirm-dialog-confirm` / `confirm-dialog-cancel` testids
 * (docs/testing-conventions.md).
 */
import { Dialog } from './Dialog'
import { Button } from './Button'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} title={title}>
      <p className="mb-4 text-body text-cream-200">{body}</p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" data-testid="confirm-dialog-cancel" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant="danger" data-testid="confirm-dialog-confirm" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}
