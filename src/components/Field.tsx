import { useId, type ReactElement, type ReactNode, cloneElement } from 'react'
import clsx from 'clsx'

export interface FieldProps {
  label: string
  helper?: string
  error?: string
  testId?: string
  /** A single form control; receives `id`, `aria-describedby` and `aria-invalid` wired up. */
  children: ReactElement<Record<string, unknown>>
  className?: string
  actions?: ReactNode
}

/**
 * Wires a `<label>`, helper text and error text to a single form control by
 * id, per DESIGN.md §5 "Inspector forms" and ARCHITECTURE.md §12.
 */
export function Field({ label, helper, error, testId, children, className, actions }: FieldProps) {
  const inputId = useId()
  const helperId = useId()
  const errorId = useId()
  const describedBy = [helper && helperId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={clsx('flex flex-col gap-1.5', className)} data-testid={testId}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={inputId}
          className="text-[length:var(--text-label)] tracking-[0.01em] text-cream-200"
        >
          {label}
        </label>
        {actions}
      </div>
      {cloneElement(children, {
        id: inputId,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}
      {helper && !error && (
        <p id={helperId} className="text-[length:var(--text-meta)] text-text-muted">
          {helper}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          className="text-[length:var(--text-meta)] text-[var(--color-state-error)]"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}
