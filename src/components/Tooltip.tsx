import { useId, useState, type ReactElement } from 'react'
import { cloneElement } from 'react'
import clsx from 'clsx'

export interface TooltipProps {
  content: string
  children: ReactElement<Record<string, unknown>>
  side?: 'top' | 'bottom'
}

/** Hover/focus tooltip; closes on Escape. Wraps a single focusable child and merges its aria-describedby. */
export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const id = useId()

  const show = () => setOpen(true)
  const hide = () => setOpen(false)

  const child = children
  const childProps = child.props as {
    onMouseEnter?: () => void
    onMouseLeave?: () => void
    onFocus?: () => void
    onBlur?: () => void
    onKeyDown?: (e: React.KeyboardEvent) => void
    'aria-describedby'?: string
  }

  return (
    <span className="relative inline-flex">
      {cloneElement(child, {
        onMouseEnter: () => {
          childProps.onMouseEnter?.()
          show()
        },
        onMouseLeave: () => {
          childProps.onMouseLeave?.()
          hide()
        },
        onFocus: () => {
          childProps.onFocus?.()
          show()
        },
        onBlur: () => {
          childProps.onBlur?.()
          hide()
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          childProps.onKeyDown?.(e)
          if (e.key === 'Escape') hide()
        },
        'aria-describedby': [childProps['aria-describedby'], id].filter(Boolean).join(' '),
      })}
      {open && (
        <span
          role="tooltip"
          id={id}
          className={clsx(
            'pointer-events-none absolute left-1/2 z-tooltip -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-xs)]',
            'bg-navy-950 px-2 py-1 text-[length:var(--text-meta)] text-cream-100 shadow-[var(--shadow-sm)]',
            side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
          )}
        >
          {content}
        </span>
      )}
    </span>
  )
}
