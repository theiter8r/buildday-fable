import type { NodeProps } from '@xyflow/react'
import type { TriggerConfig } from '@/domain/types'
import type { FlowNode } from '../types'
import { NodeShell } from './NodeShell'
import { TRIGGER_SOURCE_LABEL } from './labels'

/** Source + filter-count summary; a Trigger has no target handle (it's the run's entry point). */
export function TriggerNode({ id, data, selected }: NodeProps<FlowNode>) {
  const config = data.node.config as TriggerConfig
  const sourceLabel = TRIGGER_SOURCE_LABEL[config.source] ?? config.source
  const filterCount = config.filters.length
  const summary = `${sourceLabel} · ${filterCount} filter${filterCount === 1 ? '' : 's'}`

  return (
    <NodeShell
      id={id}
      type="trigger"
      label={data.node.label}
      selected={selected}
      runState={data.runState}
      issues={data.issues}
      summaryLines={[summary]}
      hasTargetHandle={false}
      sourceHandles={[{}]}
    />
  )
}
