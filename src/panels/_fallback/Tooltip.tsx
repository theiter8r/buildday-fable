/**
 * Minimal typed local fallback for the shared `Tooltip` primitive (see
 * docs/lane-notes/panels.md). Hover/focus only, `Escape` dismisses.
 */
import { useId, useState, type ReactElement } from 'react'
import { cloneElement } from 'react'

export interface TooltipProps {
  content: string
  children: ReactElement<{
    'aria-describedby'?: string
    onFocus?: () => void
    onBlur?: () => void
  }>
}

export function Tooltip({ content, children }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false)
      }}
    >
      {cloneElement(children, {
        'aria-describedby': id,
        onFocus: () => setOpen(true),
        onBlur: () => setOpen(false),
      })}
      {open ? (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-10 mb-1.5 w-max max-w-56 -translate-x-1/2 rounded-xs bg-navy-700 px-2 py-1 text-meta text-cream-100 shadow-[var(--shadow-sm)]"
        >
          {content}
        </span>
      ) : null}
    </span>
  )
}
