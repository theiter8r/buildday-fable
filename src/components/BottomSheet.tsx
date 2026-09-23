import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { IconButton } from './IconButton'
import { CloseIcon } from './icons'
import { useFocusTrap } from './useFocusTrap'
import { useReducedMotion } from '@/app/useReducedMotion'

export interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  testId?: string
  /** Fraction of viewport height, per DESIGN.md snap points (0.4 / 0.6 / 0.92). */
  heightFraction?: 0.4 | 0.6 | 0.92
}

/** Mobile bottom sheet: drag handle, focus trap, Escape/backdrop dismiss, safe-area bottom padding. */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  testId,
  heightFraction = 0.6,
}: BottomSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const trapKeyDown = useFocusTrap(containerRef)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (!open) return undefined
    previouslyFocused.current = document.activeElement as HTMLElement | null
    containerRef.current?.focus()
    return () => previouslyFocused.current?.focus()
  }, [open])

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    trapKeyDown(e)
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-sheet flex items-end" onKeyDown={handleKeyDown}>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={clsx(
          'absolute inset-0 bg-[rgb(5_7_15_/_0.72)]',
          !reducedMotion && 'transition-opacity duration-[var(--dur)]',
        )}
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid={testId}
        style={{ maxHeight: `${heightFraction * 100}dvh` }}
        className={clsx(
          'relative z-10 flex w-full flex-col rounded-t-[var(--radius-lg)] border-t border-line bg-navy-850',
          'shadow-[var(--shadow-sheet)] pb-[env(safe-area-inset-bottom)] focus:outline-none',
          !reducedMotion && 'animate-[sheet-in_var(--dur-slow)_var(--ease-out)]',
        )}
      >
        <div className="flex justify-center pt-2">
          <span className="h-1 w-9 rounded-full bg-navy-600" aria-hidden="true" />
        </div>
        <div className="flex items-center justify-between px-4 pb-2 pt-1">
          <h2 id={titleId} className="text-[length:var(--text-micro)] uppercase tracking-[0.08em] text-text-muted">
            {title}
          </h2>
          <IconButton label="Close" icon={<CloseIcon size={16} />} onClick={onClose} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
