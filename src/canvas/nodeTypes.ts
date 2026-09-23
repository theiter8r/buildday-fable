/**
 * Module-level node type map — must be a stable reference (ARCHITECTURE.md
 * §2 / the React Flow spike's gotcha #1). Every `NodeType` maps to exactly
 * one component here; `nodeTypes.test.ts` asserts all five are present.
 */
import type { NodeTypes } from '@xyflow/react'
import { TriggerNode } from './nodes/TriggerNode'
import { ConditionNode } from './nodes/ConditionNode'
import { ActionNode } from './nodes/ActionNode'
import { ApprovalNode } from './nodes/ApprovalNode'
import { ResolutionNode } from './nodes/ResolutionNode'

export const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
  approval: ApprovalNode,
  resolution: ResolutionNode,
} satisfies NodeTypes
