import type { NodeProps } from '@xyflow/react'
import type { ConditionConfig } from '@/domain/types'
import type { FlowNode } from '../types'
import { NodeShell } from './NodeShell'
import { OPERATOR_LABEL } from './labels'

/** `field op value` summary; two labelled source handles, bottom-left TRUE / bottom-right FALSE. */
export function ConditionNode({ id, data, selected }: NodeProps<FlowNode>) {
  const config = data.node.config as ConditionConfig
  const summary =
    config.operator === 'exists'
      ? `${config.field} exists`
      : `${config.field} ${OPERATOR_LABEL[config.operator]} ${config.value}`

  return (
    <NodeShell
      id={id}
      type="condition"
      label={data.node.label}
      selected={selected}
      runState={data.runState}
      issues={data.issues}
      summaryLines={[summary]}
      sourceHandles={[
        { id: 'true', label: 'TRUE', offset: 0.25 },
        { id: 'false', label: 'FALSE', offset: 0.75 },
      ]}
    />
  )
}
