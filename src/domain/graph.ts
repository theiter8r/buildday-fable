/**
 * Graph utilities over a `WorkflowDocument`: adjacency, reachability and
 * cycle detection. Used by `validation.ts` (UNREACHABLE_NODE,
 * NO_REACHABLE_RESOLUTION, CYCLE_DETECTED) and by `simulator.ts` (computing
 * the exclusive-subtree "skipped" set for the branch not taken).
 *
 * STUB — owned by Lane A (domain). Every export below throws until
 * implemented; the signatures are load-bearing (validation.ts and
 * simulator.ts are written against them) and must not change without
 * updating those call sites.
 */
import type { WorkflowDocument, WorkflowEdge, WorkflowNode } from './types'

/** nodeId -> the edges whose `source` is that node. */
export function outgoers(_doc: WorkflowDocument, _nodeId: string): WorkflowEdge[] {
  throw new Error('not implemented')
}

/** nodeId -> the edges whose `target` is that node. */
export function incomers(_doc: WorkflowDocument, _nodeId: string): WorkflowEdge[] {
  throw new Error('not implemented')
}

/** Every node reachable from `nodeId` by following edges forward, `nodeId` included. */
export function reachableFrom(_doc: WorkflowDocument, _nodeId: string): Set<string> {
  throw new Error('not implemented')
}

/** Every node reachable from the document's Trigger node(s), or `null` if there isn't exactly one. */
export function reachableFromTrigger(_doc: WorkflowDocument): Set<string> | null {
  throw new Error('not implemented')
}

/** One representative cycle (ordered node ids) per strongly-connected loop, empty if acyclic. */
export function findCycles(_doc: WorkflowDocument): string[][] {
  throw new Error('not implemented')
}

/** Nodes with no incoming and no outgoing edge. */
export function findDisconnectedNodes(_doc: WorkflowDocument): WorkflowNode[] {
  throw new Error('not implemented')
}

/** A topological ordering of the nodes, or `null` when the graph has a cycle. */
export function topologicalOrder(_doc: WorkflowDocument): WorkflowNode[] | null {
  throw new Error('not implemented')
}
