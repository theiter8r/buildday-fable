/** Minimal typed local fallback for the shared `Badge` primitive (see docs/lane-notes/panels.md). */
import type { ReactNode } from 'react'

export interface BadgeProps {
  children: ReactNode
  className?: string
}

export function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-xs bg-navy-700 px-1.5 py-0.5 text-micro font-semibold uppercase tracking-[0.08em] text-cream-100 ${className}`.trim()}
    >
      {children}
    </span>
  )
}
