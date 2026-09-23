import type { NodeProps } from '@xyflow/react'
import type { ResolutionConfig } from '@/domain/types'
import type { FlowNode } from '../types'
import { NodeShell } from './NodeShell'
import { RESOLUTION_STATUS_LABEL } from './labels'

/** Status chip + optional "PM" postmortem badge; target handle only — a run always ends here. */
export function ResolutionNode({ id, data, selected }: NodeProps<FlowNode>) {
  const config = data.node.config as ResolutionConfig
  const statusLabel = RESOLUTION_STATUS_LABEL[config.status] ?? config.status

  return (
    <NodeShell
      id={id}
      type="resolution"
      label={data.node.label}
      selected={selected}
      runState={data.runState}
      issues={data.issues}
      summaryLines={[statusLabel]}
      sourceHandles={[]}
      badges={
        config.postmortemRequired ? (
          <span
            data-testid={`node-postmortem-${id}`}
            className="w-fit rounded-xs px-1.5 py-0.5 font-semibold tracking-wide uppercase"
            style={{
              fontSize: 'var(--text-micro)',
              backgroundColor: 'var(--color-navy-700)',
              color: 'var(--color-gold-300)',
            }}
          >
            PM
          </span>
        ) : undefined
      }
    />
  )
}
