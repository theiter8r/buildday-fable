import { describe, expect, it } from 'vitest'
import { createEmptyWorkflow, createNode, createEdge } from '@/domain'
import type { WorkflowDocument } from '@/domain/types'
import { canConnect, checkConnection } from '../canConnect'

function buildDoc(): WorkflowDocument {
  const doc = createEmptyWorkflow('Test')
  const trigger = createNode('trigger', { x: 0, y: 0 })
  const condition = createNode('condition', { x: 100, y: 0 })
  const actionA = createNode('action', { x: 200, y: -50 })
  const actionB = createNode('action', { x: 200, y: 50 })
  const approval = createNode('approval', { x: 300, y: 0 })
  const resolution = createNode('resolution', { x: 400, y: 0 })
  return {
    ...doc,
    nodes: [trigger, condition, actionA, actionB, approval, resolution],
    edges: [
      createEdge(trigger.id, condition.id),
      createEdge(condition.id, actionA.id, 'true'),
    ],
  }
}

describe('canConnect / checkConnection — isValidConnection matrix', () => {
  const doc = buildDoc()
  const [trigger, condition, actionA, actionB, approval, resolution] = doc.nodes

  it('rejects a self loop', () => {
    expect(canConnect(doc, { source: actionA.id, target: actionA.id, sourceHandle: null, targetHandle: null })).toBe(
      false,
    )
  })

  it('rejects connecting into a Trigger (no target handle)', () => {
    const result = checkConnection(doc, {
      source: actionA.id,
      target: trigger.id,
      sourceHandle: null,
      targetHandle: null,
    })
    expect(result).toEqual({ valid: false, reason: 'trigger-has-input' })
  })

  it('rejects connecting out of a Resolution (no source handle)', () => {
    const result = checkConnection(doc, {
      source: resolution.id,
      target: approval.id,
      sourceHandle: null,
      targetHandle: null,
    })
    expect(result).toEqual({ valid: false, reason: 'resolution-has-output' })
  })

  it('rejects an exact duplicate edge (same source, target and handle)', () => {
    const result = checkConnection(doc, {
      source: condition.id,
      target: actionA.id,
      sourceHandle: 'true',
      targetHandle: null,
    })
    expect(result).toEqual({ valid: false, reason: 'duplicate-edge' })
  })

  it('allows replacing a condition branch handle with a new target (not a duplicate)', () => {
    const result = checkConnection(doc, {
      source: condition.id,
      target: actionB.id,
      sourceHandle: 'true',
      targetHandle: null,
    })
    expect(result).toEqual({ valid: true })
  })

  it('allows the false branch to a fresh target', () => {
    expect(
      canConnect(doc, { source: condition.id, target: actionB.id, sourceHandle: 'false', targetHandle: null }),
    ).toBe(true)
  })

  it('allows a plain valid connection between non-special nodes', () => {
    expect(
      canConnect(doc, { source: actionA.id, target: approval.id, sourceHandle: null, targetHandle: null }),
    ).toBe(true)
  })

  it('rejects a connection referencing a node not in the document', () => {
    const result = checkConnection(doc, {
      source: actionA.id,
      target: 'not-a-real-id',
      sourceHandle: null,
      targetHandle: null,
    })
    expect(result).toEqual({ valid: false, reason: 'missing-node' })
  })
})
