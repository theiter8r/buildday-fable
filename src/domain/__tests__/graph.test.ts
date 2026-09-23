import { describe, expect, it } from 'vitest'
import { createDemoWorkflow } from '../demoWorkflow'
import {
  findCycles,
  findDisconnectedNodes,
  incomers,
  outgoers,
  outgoersByHandle,
  reachableFrom,
  reachableFromTrigger,
  topologicalOrder,
} from '../graph'
import type { WorkflowDocument, WorkflowEdge, WorkflowNode } from '../types'

function makeDoc(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowDocument {
  return {
    schemaVersion: 2,
    id: 'test-doc',
    name: 'Test',
    nodes,
    edges,
    updatedAt: new Date(0).toISOString(),
  }
}

function trigger(id: string, x = 0, y = 0): WorkflowNode {
  return {
    id,
    type: 'trigger',
    label: id,
    position: { x, y },
    config: { source: 'manual', filters: [], description: '' },
  }
}

function action(id: string, x = 0, y = 0): WorkflowNode {
  return {
    id,
    type: 'action',
    label: id,
    position: { x, y },
    config: {
      action: 'post-slack',
      target: '#incidents',
      durationMs: 100,
      simulateFailure: false,
      continueOnFailure: false,
    },
  }
}

function condition(id: string, x = 0, y = 0): WorkflowNode {
  return {
    id,
    type: 'condition',
    label: id,
    position: { x, y },
    config: { field: 'severity', operator: 'equals', value: 'critical' },
  }
}

function edge(
  id: string,
  source: string,
  target: string,
  sourceHandle: 'true' | 'false' | null = null,
): WorkflowEdge {
  return { id, source, target, sourceHandle }
}

describe('outgoers / incomers', () => {
  it('finds edges by source and target', () => {
    const doc = makeDoc(
      [trigger('a'), action('b'), action('c')],
      [edge('e1', 'a', 'b'), edge('e2', 'a', 'c')],
    )
    expect(outgoers(doc, 'a').map((e) => e.id)).toEqual(['e1', 'e2'])
    expect(incomers(doc, 'b').map((e) => e.id)).toEqual(['e1'])
    expect(outgoers(doc, 'b')).toEqual([])
  })
})

describe('outgoersByHandle', () => {
  it('filters by condition branch handle', () => {
    const doc = makeDoc(
      [condition('c1'), action('t'), action('f')],
      [edge('e1', 'c1', 't', 'true'), edge('e2', 'c1', 'f', 'false')],
    )
    expect(outgoersByHandle(doc, 'c1', 'true').map((e) => e.id)).toEqual(['e1'])
    expect(outgoersByHandle(doc, 'c1', 'false').map((e) => e.id)).toEqual(['e2'])
  })
})

describe('reachableFrom', () => {
  it('includes the start node and everything downstream', () => {
    const doc = makeDoc(
      [trigger('a'), action('b'), action('c'), action('d')],
      [edge('e1', 'a', 'b'), edge('e2', 'b', 'c')],
    )
    expect(reachableFrom(doc, 'a')).toEqual(new Set(['a', 'b', 'c']))
    expect(reachableFrom(doc, 'd')).toEqual(new Set(['d']))
  })

  it('does not loop forever on a cycle', () => {
    const doc = makeDoc(
      [action('a'), action('b')],
      [edge('e1', 'a', 'b'), edge('e2', 'b', 'a')],
    )
    expect(reachableFrom(doc, 'a')).toEqual(new Set(['a', 'b']))
  })
})

describe('reachableFromTrigger', () => {
  it('returns null when there is not exactly one trigger', () => {
    expect(reachableFromTrigger(makeDoc([], []))).toBeNull()
    expect(
      reachableFromTrigger(makeDoc([trigger('a'), trigger('b')], [])),
    ).toBeNull()
  })

  it('returns the reachable set from the single trigger', () => {
    const doc = makeDoc(
      [trigger('a'), action('b'), action('unreachable')],
      [edge('e1', 'a', 'b')],
    )
    expect(reachableFromTrigger(doc)).toEqual(new Set(['a', 'b']))
  })
})

describe('findCycles', () => {
  it('returns an empty array for an acyclic graph', () => {
    const doc = makeDoc([trigger('a'), action('b')], [edge('e1', 'a', 'b')])
    expect(findCycles(doc)).toEqual([])
  })

  it('detects a self-loop', () => {
    const doc = makeDoc([action('a')], [edge('e1', 'a', 'a')])
    expect(findCycles(doc)).toEqual([['a', 'a']])
  })

  it('detects a multi-node cycle', () => {
    const doc = makeDoc(
      [action('a'), action('b'), action('c')],
      [edge('e1', 'a', 'b'), edge('e2', 'b', 'c'), edge('e3', 'c', 'a')],
    )
    const cycles = findCycles(doc)
    expect(cycles).toHaveLength(1)
    expect(cycles[0][0]).toBe(cycles[0][cycles[0].length - 1])
    expect(new Set(cycles[0])).toEqual(new Set(['a', 'b', 'c']))
  })

  it('reports each disjoint cycle once', () => {
    const doc = makeDoc(
      [action('a'), action('b'), action('c'), action('d')],
      [edge('e1', 'a', 'b'), edge('e2', 'b', 'a'), edge('e3', 'c', 'd'), edge('e4', 'd', 'c')],
    )
    expect(findCycles(doc)).toHaveLength(2)
  })
})

describe('findDisconnectedNodes', () => {
  it('finds nodes with no incoming and no outgoing edges', () => {
    const doc = makeDoc(
      [trigger('a'), action('b'), action('isolated')],
      [edge('e1', 'a', 'b')],
    )
    expect(findDisconnectedNodes(doc).map((n) => n.id)).toEqual(['isolated'])
  })
})

describe('topologicalOrder', () => {
  it('orders nodes so every edge points forward', () => {
    const doc = makeDoc(
      [action('c'), trigger('a'), action('b')],
      [edge('e1', 'a', 'b'), edge('e2', 'b', 'c')],
    )
    const order = topologicalOrder(doc)
    expect(order).not.toBeNull()
    const ids = order!.map((n) => n.id)
    expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('b'))
    expect(ids.indexOf('b')).toBeLessThan(ids.indexOf('c'))
  })

  it('returns null when the graph has a cycle', () => {
    const doc = makeDoc(
      [action('a'), action('b')],
      [edge('e1', 'a', 'b'), edge('e2', 'b', 'a')],
    )
    expect(topologicalOrder(doc)).toBeNull()
  })
})

describe('against the demo workflow', () => {
  it('is fully reachable from the trigger and acyclic', () => {
    const doc = createDemoWorkflow()
    const reachable = reachableFromTrigger(doc)
    expect(reachable).not.toBeNull()
    expect(reachable!.size).toBe(doc.nodes.length)
    expect(findCycles(doc)).toEqual([])
    expect(findDisconnectedNodes(doc)).toEqual([])
  })
})
