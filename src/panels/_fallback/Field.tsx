/**
 * Minimal typed local fallback for the shared `Field` primitive (see
 * `docs/lane-notes/panels.md`). Wraps a labelled form control with helper
 * and error text, wired up with `aria-describedby`/`aria-invalid`.
 */
import type { ReactNode } from 'react'

export interface FieldProps {
  id: string
  label: string
  helper?: string
  error?: string
  children: ReactNode
  className?: string
}

export function Field({ id, label, helper, error, children, className = '' }: FieldProps) {
  const helperId = helper ? `${id}-helper` : undefined
  const errorId = error ? `${id}-error` : undefined
  return (
    <div className={`flex flex-col gap-1.5 ${className}`.trim()}>
      <label htmlFor={id} className="text-label font-medium text-cream-200">
        {label}
      </label>
      {children}
      {helper ? (
        <p id={helperId} className="text-meta text-text-muted">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-meta text-[var(--color-state-error)]">
          {error}
        </p>
      ) : null}
    </div>
  )
}
