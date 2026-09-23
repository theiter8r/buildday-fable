import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { IconButton } from './IconButton'
import { CloseIcon } from './icons'
import { useFocusTrap } from './useFocusTrap'
import { useReducedMotion } from '@/app/useReducedMotion'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  testId?: string
  side?: 'left' | 'right'
}

/** Mobile left drawer (palette), per ARCHITECTURE.md §10 mobile responsive strategy. */
export function Drawer({ open, onClose, title, children, testId, side = 'left' }: DrawerProps) {
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
    <div className="fixed inset-0 z-drawer flex" onKeyDown={handleKeyDown}>
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-[rgb(5_7_15_/_0.72)]" />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid={testId}
        className={clsx(
          'relative z-10 flex h-full w-[280px] max-w-[85vw] flex-col border-line bg-navy-850 shadow-[var(--shadow-lg)]',
          'pt-[env(safe-area-inset-top)] focus:outline-none',
          side === 'left' ? 'border-r' : 'ml-auto border-l',
          !reducedMotion && 'animate-[drawer-in_var(--dur-slow)_var(--ease-out)]',
        )}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <h2 id={titleId} className="text-[length:var(--text-micro)] uppercase tracking-[0.08em] text-text-muted">
            {title}
          </h2>
          <IconButton label="Close" icon={<CloseIcon size={16} />} onClick={onClose} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
