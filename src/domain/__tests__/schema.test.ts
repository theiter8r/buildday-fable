import { describe, expect, it } from 'vitest'
import { createDemoPayload } from '../demoPayload'
import { createDemoWorkflow } from '../demoWorkflow'
import { parseIncidentPayload, parseWorkflowDocument } from '../schema'

describe('schema round-trips', () => {
  it('parses the demo workflow document produced by createDemoWorkflow()', () => {
    const doc = createDemoWorkflow()
    const result = parseWorkflowDocument(doc)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.doc).toEqual(doc)
    }
  })

  it('round-trips the demo workflow through JSON.stringify/parse', () => {
    const doc = createDemoWorkflow()
    const json = JSON.parse(JSON.stringify(doc)) as unknown
    const result = parseWorkflowDocument(json)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.doc).toEqual(doc)
    }
  })

  it('rejects a document missing required fields with readable errors', () => {
    const result = parseWorkflowDocument({ nodes: [], edges: [] })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some((e) => e.includes('schemaVersion'))).toBe(true)
    }
  })

  it('parses the demo payload produced by createDemoPayload()', () => {
    const payload = createDemoPayload()
    const result = parseIncidentPayload(payload)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.payload).toEqual(payload)
    }
  })

  it('rejects a payload with an invalid severity', () => {
    const payload = { ...createDemoPayload(), severity: 'apocalyptic' }
    const result = parseIncidentPayload(payload)
    expect(result.ok).toBe(false)
  })
})
