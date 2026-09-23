/**
 * Shared card chrome for every node type (DESIGN.md §5 "Node cards"):
 * accent bar, header (icon + label + state glyph), body config-summary
 * lines, an optional badge row (e.g. "WILL FAIL"), a footer state strip
 * during a run, target/source handles, selected/focus/error/skipped
 * treatments, and the testids + aria-label every node needs
 * (testing-conventions.md, ARCHITECTURE.md §12).
 */
import { Handle, Position } from '@xyflow/react'
import type { ReactNode } from 'react'
import type { NodeRunState, NodeType, ValidationIssue } from '@/domain/types'
import { NodeTypeIcon } from '@/components/icons'
import { NodeIssueBadge } from './NodeIssueBadge'
import { STATUS_META } from './statusMeta'

const ACCENT_TOKEN: Record<NodeType, string> = {
  trigger: 'var(--color-node-trigger)',
  condition: 'var(--color-node-condition)',
  action: 'var(--color-node-action)',
  approval: 'var(--color-node-approval)',
  resolution: 'var(--color-node-resolution)',
}

export interface SourceHandleSpec {
  id?: string
  label?: string
  /** Fraction across the bottom edge, 0..1. */
  offset?: number
}

export interface NodeShellProps {
  id: string
  type: NodeType
  label: string
  selected?: boolean
  runState: NodeRunState
  issues: ValidationIssue[]
  /** 2-3 short config lines rendered in the body. */
  summaryLines: string[]
  /** Extra badges under the summary, e.g. "WILL FAIL", "PM". */
  badges?: ReactNode
  /** Extra content rendered below badges, e.g. inline Approve/Reject buttons. */
  extra?: ReactNode
  /** Simulated offset shown in the footer while a run has reached this node. */
  runOffsetLabel?: string
  hasTargetHandle?: boolean
  sourceHandles?: SourceHandleSpec[]
}

function handlePosition(offset: number): React.CSSProperties {
  return { left: `${offset * 100}%` }
}

export function NodeShell({
  id,
  type,
  label,
  selected,
  runState,
  issues,
  summaryLines,
  badges,
  extra,
  runOffsetLabel,
  hasTargetHandle = true,
  sourceHandles = [{ }],
}: NodeShellProps) {
  const status = STATUS_META[runState]
  const hasError = issues.some((i) => i.severity === 'error')
  const isSkipped = runState === 'skipped'
  const isRunning = runState === 'running'
  const isAwaiting = runState === 'awaiting-approval'

  const ariaLabelParts = [
    `${capitalize(type)} node: ${label}`,
    status.label,
    hasError ? `${issues.length} issue${issues.length === 1 ? '' : 's'}` : null,
  ].filter(Boolean)

  return (
    <div
      data-testid={`node-${id}`}
      role="button"
      tabIndex={0}
      aria-label={ariaLabelParts.join(', ')}
      aria-describedby={issues.length > 0 ? `${id}-issues` : undefined}
      className={[
        'relative w-[220px] rounded-md border text-left transition-shadow',
        isSkipped ? 'opacity-55' : '',
        isRunning ? 'opsflow-node-running' : '',
        isAwaiting ? 'opsflow-node-awaiting' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        backgroundColor: 'var(--color-navy-800)',
        borderColor: hasError
          ? 'var(--color-state-error)'
          : selected
            ? 'var(--color-cobalt-400)'
            : 'var(--color-line)',
        borderWidth: selected || hasError ? 2 : 1,
        borderStyle: isSkipped ? 'dashed' : 'solid',
        boxShadow: selected ? 'var(--shadow-lg)' : 'var(--shadow-md)',
      }}
    >
      {hasTargetHandle ? (
        <Handle
          type="target"
          position={Position.Top}
          data-testid={`node-handle-target-${id}`}
          className="opsflow-handle"
        />
      ) : null}

      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px] rounded-l-md"
        style={{ backgroundColor: ACCENT_TOKEN[type] }}
      />

      <div data-testid={`node-card-${type}`} className="flex flex-col gap-1.5 px-3 py-2.5 pl-4">
        <div className="flex items-center gap-2">
          <NodeTypeIcon type={type} size={16} className={isSkipped ? 'grayscale' : ''} />
          <span
            className="flex-1 truncate"
            style={{
              fontSize: 'var(--text-label)',
              color: 'var(--color-cream-100)',
              fontWeight: 500,
            }}
          >
            {label}
          </span>
          <span aria-hidden style={{ color: status.color }}>
            {status.glyph}
          </span>
        </div>

        {summaryLines.length > 0 ? (
          <div
            className="flex flex-col gap-0.5"
            style={{ fontSize: 'var(--text-meta)', color: 'var(--color-text-muted)' }}
          >
            {summaryLines.map((line, i) => (
              <div key={i} className="truncate" style={{ color: 'var(--color-cream-200)' }}>
                {line}
              </div>
            ))}
          </div>
        ) : null}

        {badges}
        {extra}

        {runOffsetLabel && runState !== 'idle' ? (
          <div
            data-testid={`node-run-footer-${id}`}
            className="flex items-center justify-between border-t pt-1"
            style={{
              borderColor: 'var(--color-line-soft)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-meta)',
              color: status.color,
            }}
          >
            <span>{status.label}</span>
            <span>{runOffsetLabel}</span>
          </div>
        ) : null}
      </div>

      {issues.length > 0 ? (
        <span id={`${id}-issues`} className="sr-only">
          {issues.map((i) => i.message).join('. ')}
        </span>
      ) : null}

      <NodeIssueBadge issues={issues} />

      {sourceHandles.map((h, i) => (
        <Handle
          key={h.id ?? i}
          id={h.id}
          type="source"
          position={Position.Bottom}
          data-testid={`node-handle-source-${id}${h.id ? `-${h.id}` : ''}`}
          className="opsflow-handle"
          style={h.offset !== undefined ? handlePosition(h.offset) : undefined}
        >
          {h.label ? (
            <span
              aria-hidden
              className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 whitespace-nowrap"
              style={{
                fontSize: 'var(--text-micro)',
                letterSpacing: '0.08em',
                color: 'var(--color-text-muted)',
              }}
            >
              {h.label}
            </span>
          ) : null}
        </Handle>
      ))}
    </div>
  )
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
