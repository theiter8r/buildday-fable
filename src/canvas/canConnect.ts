/**
 * Connection legality shared by `isValidConnection` (live, during a drag)
 * and `onConnect` (final commit). Mirrors the rules already enforced inside
 * `workflowStore#addEdge` (self-loops, trigger-as-target, resolution-as-source,
 * same-source-handle replace) plus the two extra checks the canvas needs to
 * grey out handles live: exact duplicate edges, and "resolution has no
 * source handle" / "trigger has no target handle" phrased as handle-type
 * checks rather than node-type checks so `isValidConnection` can reject
 * before `onConnect` ever runs.
 *
 * NOTE (lane-notes/canvas.md): `workflowStore#addEdge` re-implements a
 * subset of this logic internally rather than importing it (the store lane
 * owns that file). Kept in sync by hand for now; a follow-up could export
 * this predicate from the store so there is exactly one implementation.
 */
import type { Connection } from '@xyflow/react'
import type { BranchHandle, WorkflowDocument, WorkflowNode } from '@/domain/types'

export type ConnectionRejectionReason =
  | 'self-loop'
  | 'missing-node'
  | 'trigger-has-input'
  | 'resolution-has-output'
  | 'duplicate-edge'

export interface ConnectionCheck {
  valid: boolean
  reason?: ConnectionRejectionReason
}

function findNode(doc: WorkflowDocument, id: string | null | undefined): WorkflowNode | undefined {
  if (!id) return undefined
  return doc.nodes.find((n) => n.id === id)
}

/**
 * Validates a prospective connection against the document. Duplicate
 * same-source-handle edges are *not* rejected here — the store treats those
 * as a replace, which is legal — but an exact duplicate (same source,
 * target and handle) is rejected since it would be a visible no-op edge.
 */
export function checkConnection(doc: WorkflowDocument, connection: Connection): ConnectionCheck {
  const { source, target, sourceHandle } = connection
  if (!source || !target) return { valid: false, reason: 'missing-node' }
  if (source === target) return { valid: false, reason: 'self-loop' }

  const sourceNode = findNode(doc, source)
  const targetNode = findNode(doc, target)
  if (!sourceNode || !targetNode) return { valid: false, reason: 'missing-node' }

  if (targetNode.type === 'trigger') return { valid: false, reason: 'trigger-has-input' }
  if (sourceNode.type === 'resolution') return { valid: false, reason: 'resolution-has-output' }

  const handle = (sourceNode.type === 'condition' ? (sourceHandle as BranchHandle | null) : null) ?? null
  const exactDuplicate = doc.edges.some(
    (e) => e.source === source && e.target === target && (e.sourceHandle ?? null) === handle,
  )
  if (exactDuplicate) return { valid: false, reason: 'duplicate-edge' }

  return { valid: true }
}

export function canConnect(doc: WorkflowDocument, connection: Connection): boolean {
  return checkConnection(doc, connection).valid
}

/** Human-readable toast copy for a rejected connection, keyed by reason. */
export const CONNECTION_REJECTION_MESSAGE: Record<ConnectionRejectionReason, string> = {
  'self-loop': "A node can't connect to itself.",
  'missing-node': "That connection isn't valid.",
  'trigger-has-input': "A Trigger can't have an incoming connection.",
  'resolution-has-output': "A Resolution can't have an outgoing connection.",
  'duplicate-edge': 'These two nodes are already connected this way.',
}
