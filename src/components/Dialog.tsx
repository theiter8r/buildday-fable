import { useEffect, useId, useRef, type ReactNode } from 'react'
import clsx from 'clsx'
import { IconButton } from './IconButton'
import { CloseIcon } from './icons'
import { useFocusTrap } from './useFocusTrap'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  testId?: string
  className?: string
}

/**
 * Focus-trapped modal on a native `<dialog>`, per ARCHITECTURE.md §2.
 * Restores focus to whatever triggered it on close, closes on Escape and on
 * backdrop click. `showModal`/`close` are feature-detected so this degrades
 * to a plain attribute toggle in environments without them (e.g. jsdom).
 */
export function Dialog({ open, onClose, title, children, footer, testId, className }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const trapKeyDown = useFocusTrap(dialogRef)

  useEffect(() => {
    if (!open) return undefined

    previouslyFocused.current = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    if (dialog) {
      if (typeof dialog.showModal === 'function') {
        if (!dialog.open) dialog.showModal()
      } else {
        dialog.setAttribute('open', '')
      }
      const autofocusTarget = dialog.querySelector<HTMLElement>('[data-autofocus]')
      ;(autofocusTarget ?? dialog).focus()
    }

    return () => {
      previouslyFocused.current?.focus()
    }
  }, [open])

  function handleKeyDown(e: React.KeyboardEvent<HTMLDialogElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    trapKeyDown(e)
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) onClose()
  }

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      data-testid={testId}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
      className={clsx(
        'z-dialog max-w-[560px] rounded-[var(--radius-lg)] border border-line bg-navy-850 p-0 text-cream-50 shadow-[var(--shadow-lg)]',
        'backdrop:bg-[rgb(5_7_15_/_0.72)] backdrop:backdrop-blur-[4px]',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 border-b border-line-soft px-5 py-4">
        <h2
          id={titleId}
          tabIndex={-1}
          data-autofocus
          className="font-[family-name:var(--font-display)] text-[length:var(--text-display)] text-cream-50 focus:outline-none"
        >
          {title}
        </h2>
        <IconButton label="Close dialog" icon={<CloseIcon size={18} />} onClick={onClose} />
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      {footer && <div className="flex justify-end gap-2 border-t border-line-soft px-5 py-4">{footer}</div>}
    </dialog>
  )
}
