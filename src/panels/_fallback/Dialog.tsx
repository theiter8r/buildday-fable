/**
 * Minimal typed local fallback for the shared `Dialog` primitive (see
 * docs/lane-notes/panels.md). Focus-trapped modal built on the native
 * `<dialog>` element; Escape closes, focus returns to the trigger.
 */
import { useEffect, useId, useRef, type ReactNode } from 'react'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  labelledById?: string
}

export function Dialog({ open, onClose, title, children, labelledById }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const generatedTitleId = useId()
  const titleId = labelledById ?? generatedTitleId

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (open && !node.open) {
      node.showModal()
    } else if (!open && node.open) {
      node.close()
    }
  }, [open])

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const onCancel = (event: Event) => {
      event.preventDefault()
      onClose()
    }
    node.addEventListener('cancel', onCancel)
    return () => node.removeEventListener('cancel', onCancel)
  }, [onClose])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="max-w-[560px] rounded-lg border border-line bg-navy-850 p-0 text-cream-50 shadow-[var(--shadow-lg)] backdrop:bg-[rgb(5_7_15_/_0.72)] backdrop:backdrop-blur-sm"
    >
      <div className="p-5">
        <h2 id={titleId} className="mb-3 font-[family-name:var(--font-display)] text-display">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  )
}
