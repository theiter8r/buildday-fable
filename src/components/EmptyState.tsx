import type { ReactNode } from 'react'
import clsx from 'clsx'

export interface EmptyStateProps {
  title: string
  body?: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
}

/** Generic empty-state surface (ARCHITECTURE.md §12: never a bare blank screen). */
export function EmptyState({ title, body, action, icon, className }: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className={clsx('flex flex-col items-center gap-3 px-6 py-10 text-center', className)}
    >
      {icon && <div className="text-text-subtle">{icon}</div>}
      <p className="text-[length:var(--text-body)] text-cream-100">{title}</p>
      {body && <p className="max-w-xs text-[length:var(--text-meta)] text-text-muted">{body}</p>}
      {action}
    </div>
  )
}
