/**
 * Renders one row per `ExecutionEvent` using the CONTENT.md §6 templates.
 * Timestamp = wall-clock run start + offset, formatted via
 * `formatClock`/`formatOffset`; clicking a row selects that event's node
 * (ARCHITECTURE.md §2).
 */
import { useEffect, useRef } from 'react'
import { formatClock, formatOffset } from '@/domain/format'
import type { ExecutionEvent } from '@/domain/types'
import { useOpsflowStore } from '@/store'
import { RUN_CONTENT } from './content'

function describeEvent(event: ExecutionEvent): string {
  switch (event.kind) {
    case 'run-started':
      return event.payloadSummary
    case 'node-started':
      return event.nodeType === 'trigger'
        ? RUN_CONTENT.timeline.triggerFired(event.label)
        : RUN_CONTENT.timeline.actionStarted(event.label)
    case 'node-finished':
      return event.outcome === 'failed'
        ? RUN_CONTENT.timeline.actionFailed(event.nodeId, event.detail)
        : RUN_CONTENT.timeline.actionFinished(event.nodeId, event.detail)
    case 'node-skipped':
      return event.reason
    case 'branch-decided':
      return RUN_CONTENT.timeline.conditionEvaluated(
        event.expression,
        '',
        '',
        event.result ? 'true' : 'false',
      )
    case 'approval-requested':
      return RUN_CONTENT.timeline.approvalRequested(event.nodeId, event.approverRole)
    case 'approval-resolved':
      return event.decision === 'approved'
        ? RUN_CONTENT.timeline.approvalApproved(event.nodeId)
        : RUN_CONTENT.timeline.approvalRejected(event.nodeId)
    case 'trigger-filtered':
      return event.reason
    case 'run-finished':
      return RUN_CONTENT.timeline.runFinished(event.status)
    default: {
      const exhaustive: never = event
      return String(exhaustive)
    }
  }
}

export function TimelineLog() {
  const events = useOpsflowStore((s) => s.events)
  const currentIndex = useOpsflowStore((s) => s.currentIndex)
  const selectNode = useOpsflowStore((s) => s.selectNode)
  const runStartedAtWallClock = useOpsflowStore((s) => s.runStartedAtWallClock)
  const listRef = useRef<HTMLDivElement>(null)
  const userScrolledUpRef = useRef(false)

  useEffect(() => {
    const node = listRef.current
    if (!node || userScrolledUpRef.current) return
    node.scrollTop = node.scrollHeight
  }, [events.length])

  function onScroll() {
    const node = listRef.current
    if (!node) return
    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight
    userScrolledUpRef.current = distanceFromBottom > 24
  }

  const visible = events.slice(0, currentIndex + 1)

  return (
    <div
      ref={listRef}
      onScroll={onScroll}
      data-testid="timeline"
      className="flex h-full flex-col gap-0 overflow-y-auto"
      aria-label="Run timeline"
    >
      {visible.length === 0 ? (
        <p className="p-4 text-body text-text-muted">{RUN_CONTENT.timeline.empty}</p>
      ) : (
        visible.map((event, index) => (
          <button
            key={index}
            type="button"
            data-testid={`timeline-row-${index}`}
            onClick={() => {
              if ('nodeId' in event && event.nodeId) selectNode(event.nodeId)
            }}
            className="grid grid-cols-[64px_1fr] items-baseline gap-3 border-b border-line-soft px-3 py-2 text-left hover:bg-navy-800 focus-visible:outline-none focus-visible:shadow-[var(--glow-focus)]"
          >
            <span
              className="font-[family-name:var(--font-mono)] text-meta text-text-muted tabular-nums"
              title={runStartedAtWallClock ? formatClock(runStartedAtWallClock, event.at) : undefined}
            >
              {formatOffset(event.at)}
            </span>
            <span className="text-body text-cream-200">{describeEvent(event)}</span>
          </button>
        ))
      )}
    </div>
  )
}
