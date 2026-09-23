/**
 * React Flow node/edge type aliases for the canvas lane. `data` on every RF
 * node carries the whole domain node plus everything its card needs to
 * render without reaching into the store itself (ARCHITECTURE.md §7
 * `useFlowSync`): `{ node, runState, issues, isSelected }`. Keeping domain
 * data on the RF node (rather than re-deriving it inside each node
 * component from a store selector) is what makes node components trivially
 * unit-testable in isolation.
 */
import type { Node } from '@xyflow/react'
import type { NodeRunState, NodeType, ValidationIssue, WorkflowNode } from '@/domain/types'

export interface FlowNodeData extends Record<string, unknown> {
  node: WorkflowNode
  runState: NodeRunState
  issues: ValidationIssue[]
  isSelected: boolean
}

export type FlowNode = Node<FlowNodeData, NodeType>
