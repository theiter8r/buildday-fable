import { Dialog } from './Dialog'
import { Button } from './Button'

export interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  body: string
  confirmLabel: string
  cancelLabel: string
}

/** Generic destructive-confirm dialog (reset, delete-all) — testing-conventions.md `confirm-dialog-*`. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  cancelLabel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      testId="confirm-dialog"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} data-testid="confirm-dialog-cancel">
            {cancelLabel}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            data-testid="confirm-dialog-confirm"
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-[length:var(--text-body)] text-cream-200">{body}</p>
    </Dialog>
  )
}
