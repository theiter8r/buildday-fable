/**
 * Store <-> React Flow adapter (ARCHITECTURE.md §7). The Zustand store
 * remains the source of truth; this hook derives `nodes`/`edges` from it
 * and turns RF's change callbacks back into store actions/commands.
 *
 * Deletion is wired through `onNodesDelete`/`onEdgesDelete` (the task
 * brief's explicit wiring) rather than the `remove` case of
 * `onNodesChange` that ARCHITECTURE.md §7 sketches — both fire once per
 * user delete gesture and `removeNode`/`removeEdge` are idempotent no-ops
 * on an already-missing id, so there is no functional difference and this
 * keeps deletion in React Flow's dedicated delete callbacks.
 */
import { useCallback, useMemo } from 'react'
import type {
  Connection,
  Edge,
  IsValidConnection,
  Node,
  OnConnect,
  OnEdgesChange,
  OnEdgesDelete,
  OnNodesChange,
  OnNodesDelete,
} from '@xyflow/react'
import type { ExecutionEvent, NodeRunState, ValidationIssue, WorkflowDocument } from '@/domain/types'
import { useOpsflowStore } from '@/store'
import type { FlowNode, FlowNodeData } from './types'
import type { FlowEdgeData } from './edges/FlowEdge'
import { canConnect, CONNECTION_REJECTION_MESSAGE, checkConnection } from './canConnect'

type FlowEdgeInstance = Edge<FlowEdgeData, 'flow'>

function toFlowNodes(
  document: WorkflowDocument,
  nodeStates: Record<string, NodeRunState>,
  issues: ValidationIssue[],
  selectedNodeId: string | null,
): FlowNode[] {
  return document.nodes.map((node) => {
    const data: FlowNodeData = {
      node,
      runState: nodeStates[node.id] ?? 'idle',
      issues: issues.filter((issue) => issue.nodeId === node.id),
      isSelected: node.id === selectedNodeId,
    }
    return {
      id: node.id,
      type: node.type,
      position: node.position,
      data,
      selected: node.id === selectedNodeId,
    } satisfies FlowNode
  })
}

function toFlowEdges(
  document: WorkflowDocument,
  nodeStates: Record<string, NodeRunState>,
  selectedEdgeId: string | null,
): FlowEdgeInstance[] {
  return document.edges.map((edge) => {
    const sourceNode = document.nodes.find((n) => n.id === edge.source)
    const targetState = nodeStates[edge.target] ?? 'idle'
    const sourceState = nodeStates[edge.source] ?? 'idle'
    const branch = sourceNode?.type === 'condition' ? (edge.sourceHandle ?? undefined) : undefined

    const reachedStates: NodeRunState[] = ['running', 'success', 'failed', 'awaiting-approval']
    const sourceReached = reachedStates.includes(sourceState)
    const targetReached = reachedStates.includes(targetState)

    let status: FlowEdgeData['status'] = 'idle'
    if (targetState === 'skipped') {
      status = 'skipped'
    } else if (sourceState === 'failed' && !targetReached) {
      status = 'failed'
    } else if (sourceReached && targetReached) {
      status = 'traversed'
    }

    const isActiveTraversal = sourceState === 'success' && targetState === 'running'

    const conditionDecided = branch !== undefined && sourceState !== 'idle' && sourceState !== 'pending'
    const branchTaken = conditionDecided && targetState !== 'skipped'

    const data: FlowEdgeData = {
      branch: branch ?? undefined,
      status,
      isActiveTraversal,
      branchDecided: conditionDecided,
      branchTaken,
    }

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle ?? undefined,
      type: 'flow',
      selected: edge.id === selectedEdgeId,
      data,
    } satisfies FlowEdgeInstance
  })
}

export interface UseFlowSyncResult {
  nodes: FlowNode[]
  edges: FlowEdgeInstance[]
  onNodesChange: OnNodesChange<FlowNode>
  onEdgesChange: OnEdgesChange<FlowEdgeInstance>
  onConnect: OnConnect
  onNodesDelete: OnNodesDelete<FlowNode>
  onEdgesDelete: OnEdgesDelete<FlowEdgeInstance>
  onNodeDragStop: (event: unknown, node: Node) => void
  isValidConnection: IsValidConnection<FlowEdgeInstance>
}

export function useFlowSync(): UseFlowSyncResult {
  const document = useOpsflowStore((s) => s.document)
  const nodeStates = useOpsflowStore((s) => s.nodeStates)
  const issues = useOpsflowStore((s) => s.issues)
  const selectedNodeId = useOpsflowStore((s) => s.selectedNodeId)
  const selectedEdgeId = useOpsflowStore((s) => s.selectedEdgeId)

  const selectNode = useOpsflowStore((s) => s.selectNode)
  const selectEdge = useOpsflowStore((s) => s.selectEdge)
  const moveNode = useOpsflowStore((s) => s.moveNode)
  const removeNode = useOpsflowStore((s) => s.removeNode)
  const removeEdge = useOpsflowStore((s) => s.removeEdge)
  const addEdgeAction = useOpsflowStore((s) => s.addEdge)
  const pushToast = useOpsflowStore((s) => s.pushToast)

  const nodes = useMemo(
    () => toFlowNodes(document, nodeStates, issues, selectedNodeId),
    [document, nodeStates, issues, selectedNodeId],
  )
  const edges = useMemo(
    () => toFlowEdges(document, nodeStates, selectedEdgeId),
    [document, nodeStates, selectedEdgeId],
  )

  const onNodesChange: OnNodesChange<FlowNode> = useCallback(
    (changes) => {
      // `nodes` is re-derived from the store every render (see `useMemo`
      // above), so we only need to react to the changes that carry real
      // intent — `dimensions` and RF's own internal bookkeeping are safely
      // ignored, nothing else consumes the (uncomputed) applied array.
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          moveNode(change.id, change.position, change.dragging === false)
        } else if (change.type === 'select') {
          if (change.selected) selectNode(change.id)
          else if (selectedNodeId === change.id) selectNode(null)
        }
      }
    },
    [moveNode, selectNode, selectedNodeId],
  )

  const onEdgesChange: OnEdgesChange<FlowEdgeInstance> = useCallback(
    (changes) => {
      for (const change of changes) {
        if (change.type === 'select') {
          if (change.selected) selectEdge(change.id)
          else if (selectedEdgeId === change.id) selectEdge(null)
        }
      }
    },
    [selectEdge, selectedEdgeId],
  )

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const check = checkConnection(document, connection)
      if (!check.valid) {
        pushToast({
          variant: 'error',
          title: "Can't connect these nodes",
          description: check.reason ? CONNECTION_REJECTION_MESSAGE[check.reason] : undefined,
        })
        return
      }
      addEdgeAction(connection.source, connection.target, connection.sourceHandle as 'true' | 'false' | null)
    },
    [document, addEdgeAction, pushToast],
  )

  const isValidConnection: IsValidConnection<FlowEdgeInstance> = useCallback(
    (connection) => canConnect(document, connection as Connection),
    [document],
  )

  const onNodesDelete: OnNodesDelete<FlowNode> = useCallback(
    (deleted) => {
      for (const node of deleted) removeNode(node.id)
    },
    [removeNode],
  )

  const onEdgesDelete: OnEdgesDelete<FlowEdgeInstance> = useCallback(
    (deleted) => {
      for (const edge of deleted) removeEdge(edge.id)
    },
    [removeEdge],
  )

  // Kept as a no-op passthrough: position commits already happen inside
  // `onNodesChange` when a change arrives with `dragging: false` (the exact
  // moment `onNodeDragStop` would otherwise fire), so this only exists to
  // satisfy callers that wire both per the React Flow spike's documented
  // pattern.
  const onNodeDragStop = useCallback((_event: unknown, _node: Node) => {}, [])

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodesDelete,
    onEdgesDelete,
    onNodeDragStop,
    isValidConnection,
  }
}

/** Re-exported so tests can assert on the pure event union without excluding domain events. */
export type { ExecutionEvent }
