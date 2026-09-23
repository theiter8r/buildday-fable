import type { NodeProps } from '@xyflow/react'
import type { ActionConfig } from '@/domain/types'
import type { FlowNode } from '../types'
import { NodeShell } from './NodeShell'
import { ACTION_KIND_LABEL, formatDurationMs } from './labels'

/** Action kind + target + duration; a coral "WILL FAIL" badge when `simulateFailure` is on. */
export function ActionNode({ id, data, selected }: NodeProps<FlowNode>) {
  const config = data.node.config as ActionConfig
  const summary = `${ACTION_KIND_LABEL[config.action]} · ${config.target || '—'}`
  const duration = `${formatDurationMs(config.durationMs)}`

  return (
    <NodeShell
      id={id}
      type="action"
      label={data.node.label}
      selected={selected}
      runState={data.runState}
      issues={data.issues}
      summaryLines={[summary, duration]}
      badges={
        config.simulateFailure ? (
          <span
            data-testid={`node-will-fail-${id}`}
            className="w-fit rounded-xs px-1.5 py-0.5 font-semibold tracking-wide uppercase"
            style={{
              fontSize: 'var(--text-micro)',
              backgroundColor: 'var(--color-state-failed)',
              color: 'var(--color-on-gold)',
            }}
          >
            Will fail
          </span>
        ) : undefined
      }
    />
  )
}
