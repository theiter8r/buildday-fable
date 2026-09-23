import { describe, expect, it } from 'vitest'
import { createDemoWorkflow } from '../demoWorkflow'

describe('createDemoWorkflow', () => {
  const doc = createDemoWorkflow()

  it('has exactly one trigger node', () => {
    const triggers = doc.nodes.filter((n) => n.type === 'trigger')
    expect(triggers).toHaveLength(1)
  })

  it('has exactly one condition node, wired with both a true and a false outgoing branch', () => {
    const conditions = doc.nodes.filter((n) => n.type === 'condition')
    expect(conditions).toHaveLength(1)
    const conditionId = conditions[0]!.id

    const outgoing = doc.edges.filter((e) => e.source === conditionId)
    expect(outgoing.some((e) => e.sourceHandle === 'true')).toBe(true)
    expect(outgoing.some((e) => e.sourceHandle === 'false')).toBe(true)
  })

  it('has at least two resolution nodes', () => {
    const resolutions = doc.nodes.filter((n) => n.type === 'resolution')
    expect(resolutions.length).toBeGreaterThanOrEqual(2)
  })

  it('has all-unique node ids', () => {
    const ids = doc.nodes.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has all-unique edge ids', () => {
    const ids = doc.edges.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every edge references node ids that actually exist', () => {
    const nodeIds = new Set(doc.nodes.map((n) => n.id))
    for (const edge of doc.edges) {
      expect(nodeIds.has(edge.source)).toBe(true)
      expect(nodeIds.has(edge.target)).toBe(true)
    }
  })
})
