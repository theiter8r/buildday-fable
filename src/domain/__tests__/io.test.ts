import { describe, expect, it } from 'vitest'
import { createDemoWorkflow } from '../demoWorkflow'
import { buildExportFilename, exportWorkflow, importWorkflow } from '../io'

describe('exportWorkflow', () => {
  it('produces a filename matching the opsflow-*.json pattern', () => {
    const doc = createDemoWorkflow()
    const { filename } = exportWorkflow(doc)
    expect(filename).toMatch(/^opsflow-.*\.json$/)
  })

  it('slugs the workflow name into the filename', () => {
    const doc = { ...createDemoWorkflow(), name: 'Critical API Incident' }
    const filename = buildExportFilename(doc)
    expect(filename).toContain('critical-api-incident')
  })

  it('produces pretty-printed JSON that round-trips back to an equal document', () => {
    const doc = createDemoWorkflow()
    const { json } = exportWorkflow(doc)
    expect(JSON.parse(json)).toEqual(doc)
  })
})

describe('importWorkflow — round trip', () => {
  it('imports a document exported by exportWorkflow back to an equal document', () => {
    const doc = createDemoWorkflow()
    const { json } = exportWorkflow(doc)
    const result = importWorkflow(json)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.doc).toEqual(doc)
      expect(result.warnings).toEqual([])
    }
  })
})

describe('importWorkflow — malformed input', () => {
  it('reports a readable message for invalid JSON', () => {
    const result = importWorkflow('{ this is not json')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.kind).toBe('json')
      if (result.kind === 'json') expect(result.message.length).toBeGreaterThan(0)
    }
  })

  it('reports schema issues with a path for a wrong-shape document', () => {
    // No `schemaVersion` is treated as v1 and migrated forward (a real
    // legacy save would have one); what's still wrong after migration is the
    // missing `id`/`name`/`updatedAt` fields, so assert on those paths.
    const result = importWorkflow(JSON.stringify({ nodes: [], edges: [] }))
    expect(result.ok).toBe(false)
    if (!result.ok && result.kind === 'schema') {
      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.issues.some((i) => i.path === 'id')).toBe(true)
    } else {
      throw new Error(`expected a schema failure, got ${JSON.stringify(result)}`)
    }
  })

  it('reports a version failure for a document from a future schema version', () => {
    const doc = { ...createDemoWorkflow(), schemaVersion: 99 }
    const result = importWorkflow(JSON.stringify(doc))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.kind).toBe('version')
  })

  it('rejects a node with an invalid config field with a path referencing it', () => {
    const doc = createDemoWorkflow()
    const broken = {
      ...doc,
      nodes: doc.nodes.map((n) =>
        n.type === 'action' ? { ...n, config: { ...n.config, durationMs: 'soon' } } : n,
      ),
    }
    const result = importWorkflow(JSON.stringify(broken))
    expect(result.ok).toBe(false)
    if (!result.ok && result.kind === 'schema') {
      expect(result.issues.some((i) => i.path.includes('durationMs'))).toBe(true)
    } else {
      throw new Error(`expected a schema failure, got ${JSON.stringify(result)}`)
    }
  })
})
