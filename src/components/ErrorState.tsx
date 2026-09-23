import { useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { ErrorIcon, ChevronDownIcon, ChevronRightIcon } from './icons'

export interface ErrorStateProps {
  title: string
  body: string
  /** Technical detail, rendered in a collapsible mono block (DESIGN.md §5). */
  detail?: string
  actions?: ReactNode
  className?: string
}

/** Coral-hairline error card with at least one recovery action, per DESIGN.md/ARCHITECTURE.md §12. */
export function ErrorState({ title, body, detail, actions, className }: ErrorStateProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      data-testid="error-state"
      role="alert"
      className={clsx(
        'flex max-w-md flex-col items-center gap-3 rounded-[var(--radius-md)] border-t-2 border-[var(--color-state-error)] bg-navy-850 px-6 py-8 text-center',
        className,
      )}
    >
      <ErrorIcon size={28} className="text-[var(--color-state-error)]" />
      <p className="text-[length:var(--text-title)] text-cream-50">{title}</p>
      <p className="text-[length:var(--text-body)] text-text-muted">{body}</p>
      {detail && (
        <div className="w-full text-left">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="flex items-center gap-1 text-[length:var(--text-meta)] text-text-muted hover:text-cream-200 focus-visible:shadow-[var(--glow-focus)] focus-visible:outline-none"
          >
            {expanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
            Technical detail
          </button>
          {expanded && (
            <pre className="mt-2 max-h-40 overflow-auto rounded-[var(--radius-xs)] bg-navy-950 p-3 text-[length:var(--text-meta)] text-text-muted font-[family-name:var(--font-mono)] whitespace-pre-wrap break-words">
              {detail}
            </pre>
          )}
        </div>
      )}
      {actions && <div className="flex flex-wrap justify-center gap-2 pt-1">{actions}</div>}
    </div>
  )
}
