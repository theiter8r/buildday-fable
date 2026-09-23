/**
 * Error/warning dot badge shown on a node card's top-right corner
 * (DESIGN.md §5 "Node cards" — "1px error border + 8px dot badge"). Carries
 * its own minimal hover/focus tooltip rather than depending on
 * `src/components/Tooltip.tsx` (components lane, not guaranteed to exist
 * yet — see docs/lane-notes/canvas.md) so this node stays self-contained.
 */
import { useId, useState } from 'react'
import type { ValidationIssue } from '@/domain/types'
import { WarningIcon, ErrorIcon } from '@/components/icons'

export interface NodeIssueBadgeProps {
  issues: ValidationIssue[]
}

export function NodeIssueBadge({ issues }: NodeIssueBadgeProps) {
  const tooltipId = useId()
  const [open, setOpen] = useState(false)

  if (issues.length === 0) return null

  const hasError = issues.some((issue) => issue.severity === 'error')
  const label = issues.map((issue) => issue.message).join(' ')
  const Icon = hasError ? ErrorIcon : WarningIcon

  return (
    <span className="pointer-events-auto absolute -top-2 -right-2 z-10">
      <button
        type="button"
        data-testid="node-issue-badge"
        className="nodrag flex h-4 w-4 items-center justify-center rounded-full border border-navy-900"
        style={{
          backgroundColor: hasError ? 'var(--color-state-error)' : 'var(--color-state-warning)',
          color: 'var(--color-on-gold)',
        }}
        aria-describedby={tooltipId}
        aria-label={`${hasError ? 'Errors' : 'Warnings'}: ${label}`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <Icon size={10} />
      </button>
      <span
        role="tooltip"
        id={tooltipId}
        className="absolute top-5 right-0 z-20 w-56 rounded-md border p-2 text-meta"
        style={{
          display: open ? 'block' : 'none',
          backgroundColor: 'var(--color-navy-850)',
          borderColor: 'var(--color-line)',
          color: 'var(--color-cream-200)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <ul className="flex flex-col gap-1">
          {issues.map((issue) => (
            <li key={issue.id}>{issue.message}</li>
          ))}
        </ul>
      </span>
    </span>
  )
}
