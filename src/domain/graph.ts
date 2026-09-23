/**
 * Graph utilities over a `WorkflowDocument`: adjacency, reachability and
 * cycle detection. Used by `validation.ts` (UNREACHABLE_NODE,
 * NO_REACHABLE_RESOLUTION, CYCLE_DETECTED) and by `simulator.ts` (computing
 * the exclusive-subtree "skipped" set for the branch not taken).
 */
import type { BranchHandle, WorkflowDocument, WorkflowEdge, WorkflowNode } from './types'

/** nodeId -> the edges whose `source` is that node. */
export function outgoers(doc: WorkflowDocument, nodeId: string): WorkflowEdge[] {
  return doc.edges.filter((edge) => edge.source === nodeId)
}

/** nodeId -> the edges whose `target` is that node. */
export function incomers(doc: WorkflowDocument, nodeId: string): WorkflowEdge[] {
  return doc.edges.filter((edge) => edge.target === nodeId)
}

/**
 * `outgoers` filtered to a single Condition branch handle. Used by the
 * simulator to follow the taken branch and by validation to detect a
 * missing/duplicate branch.
 */
export function outgoersByHandle(
  doc: WorkflowDocument,
  nodeId: string,
  handle: BranchHandle,
): WorkflowEdge[] {
  return outgoers(doc, nodeId).filter((edge) => edge.sourceHandle === handle)
}

/** Every node reachable from `nodeId` by following edges forward, `nodeId` included. */
export function reachableFrom(doc: WorkflowDocument, nodeId: string): Set<string> {
  const visited = new Set<string>()
  const stack = [nodeId]
  while (stack.length > 0) {
    // Non-null: `stack.length > 0` guarantees `pop()` returns a value.
    const current = stack.pop()!
    if (visited.has(current)) continue
    visited.add(current)
    for (const edge of outgoers(doc, current)) {
      if (!visited.has(edge.target)) stack.push(edge.target)
    }
  }
  return visited
}

/** Every node reachable from the document's Trigger node(s), or `null` if there isn't exactly one. */
export function reachableFromTrigger(doc: WorkflowDocument): Set<string> | null {
  const triggers = doc.nodes.filter((node) => node.type === 'trigger')
  if (triggers.length !== 1) return null
  return reachableFrom(doc, triggers[0].id)
}

/**
 * One representative cycle (ordered node ids, first id repeated at the end)
 * per strongly-connected loop, empty if acyclic. A self-loop (`A -> A`)
 * reports as `['A', 'A']`.
 */
export function findCycles(doc: WorkflowDocument): string[][] {
  const cycles: string[][] = []
  const seenCycleKeys = new Set<string>()

  const state = new Map<string, 'visiting' | 'done'>()
  const pathStack: string[] = []

  function visit(nodeId: string): void {
    state.set(nodeId, 'visiting')
    pathStack.push(nodeId)

    for (const edge of outgoers(doc, nodeId)) {
      const target = edge.target
      const targetState = state.get(target)
      if (targetState === 'visiting') {
        const startIndex = pathStack.indexOf(target)
        const cyclePath = pathStack.slice(startIndex).concat(target)
        const key = normalizeCycleKey(cyclePath)
        if (!seenCycleKeys.has(key)) {
          seenCycleKeys.add(key)
          cycles.push(cyclePath)
        }
      } else if (targetState !== 'done') {
        visit(target)
      }
    }

    pathStack.pop()
    state.set(nodeId, 'done')
  }

  for (const node of doc.nodes) {
    if (!state.has(node.id)) visit(node.id)
  }

  return cycles
}

/** A stable dedupe key for a cycle path regardless of which node it was discovered from. */
function normalizeCycleKey(cyclePath: string[]): string {
  const ring = cyclePath.slice(0, -1)
  if (ring.length === 0) return ''
  let minIndex = 0
  for (let i = 1; i < ring.length; i++) {
    if (ring[i] < ring[minIndex]) minIndex = i
  }
  const rotated = [...ring.slice(minIndex), ...ring.slice(0, minIndex)]
  return rotated.join('>')
}

/** Nodes with no incoming and no outgoing edge. */
export function findDisconnectedNodes(doc: WorkflowDocument): WorkflowNode[] {
  return doc.nodes.filter(
    (node) => incomers(doc, node.id).length === 0 && outgoers(doc, node.id).length === 0,
  )
}

/** A topological ordering of the nodes, or `null` when the graph has a cycle. */
export function topologicalOrder(doc: WorkflowDocument): WorkflowNode[] | null {
  const inDegree = new Map<string, number>()
  for (const node of doc.nodes) inDegree.set(node.id, 0)
  for (const edge of doc.edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
  }

  const queue: string[] = []
  for (const node of doc.nodes) {
    if (inDegree.get(node.id) === 0) queue.push(node.id)
  }

  const orderedIds: string[] = []
  const nodesById = new Map(doc.nodes.map((node) => [node.id, node]))

  while (queue.length > 0) {
    // Non-null: `queue.length > 0` guarantees `shift()` returns a value.
    const current = queue.shift()!
    orderedIds.push(current)
    for (const edge of outgoers(doc, current)) {
      const remaining = (inDegree.get(edge.target) ?? 0) - 1
      inDegree.set(edge.target, remaining)
      if (remaining === 0) queue.push(edge.target)
    }
  }

  if (orderedIds.length !== doc.nodes.length) return null

  return orderedIds.map((id) => {
    const node = nodesById.get(id)
    if (!node) throw new Error(`topologicalOrder: unknown node id ${id}`)
    return node
  })
}
