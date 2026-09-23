import { describe, expect, it } from 'vitest'
import { SCHEMA_VERSION } from '../constants'
import { migrate } from '../migrations'
import { workflowDocumentSchema } from '../schema'

function v1ActionNode(overrides: Record<string, unknown> = {}) {
  return {
    id: 'node-action-1',
    type: 'action',
    label: 'Legacy action',
    position: { x: 0, y: 0 },
    config: {
      kind: 'page-oncall',
      target: 'sre-primary',
      durationMs: 900,
      simulateFailure: false,
      ...overrides,
    },
  }
}

describe('migrate — v1 to current', () => {
  it('renames config.kind to config.action and defaults continueOnFailure', () => {
    const v1Doc = {
      schemaVersion: 1,
      id: 'doc-1',
      name: 'Legacy workflow',
      nodes: [v1ActionNode()],
      edges: [],
      updatedAt: '2024-01-01T00:00:00.000Z',
    }
    const migrated = migrate(v1Doc)
    expect('ok' in migrated && migrated.ok === false).toBe(false)
    const doc = migrated as unknown as Record<string, unknown>
    expect(doc.schemaVersion).toBe(SCHEMA_VERSION)
    const node = (doc.nodes as Record<string, unknown>[])[0]!
    const config = node.config as Record<string, unknown>
    expect(config.kind).toBeUndefined()
    expect(config.action).toBe('page-oncall')
    expect(config.continueOnFailure).toBe(false)

    // final shape must pass the real schema
    const parsed = workflowDocumentSchema.safeParse(migrated)
    expect(parsed.success).toBe(true)
  })

  it('maps an unrecognised legacy action kind to run-runbook', () => {
    const v1Doc = {
      schemaVersion: 1,
      id: 'doc-1',
      name: 'Legacy workflow',
      nodes: [v1ActionNode({ kind: 'send-carrier-pigeon' })],
      edges: [],
      updatedAt: '2024-01-01T00:00:00.000Z',
    }
    const migrated = migrate(v1Doc) as unknown as Record<string, unknown>
    const node = (migrated.nodes as Record<string, unknown>[])[0]!
    const config = node.config as Record<string, unknown>
    expect(config.action).toBe('run-runbook')
  })

  it('treats a document with no schemaVersion as v1', () => {
    const noVersionDoc = {
      id: 'doc-1',
      name: 'Legacy workflow',
      nodes: [v1ActionNode()],
      edges: [],
      updatedAt: '2024-01-01T00:00:00.000Z',
    }
    const migrated = migrate(noVersionDoc) as unknown as Record<string, unknown>
    expect(migrated.schemaVersion).toBe(SCHEMA_VERSION)
  })

  it('is a no-op for a document already on the current schema version', () => {
    const currentDoc = {
      schemaVersion: SCHEMA_VERSION,
      id: 'doc-1',
      name: 'Current workflow',
      nodes: [],
      edges: [],
      updatedAt: '2024-01-01T00:00:00.000Z',
    }
    const migrated = migrate(currentDoc)
    expect(migrated).toEqual(currentDoc)
  })
})

describe('migrate — failure paths', () => {
  it('refuses a document from an unknown future schema version', () => {
    const futureDoc = { schemaVersion: SCHEMA_VERSION + 1, id: 'x', name: 'x', nodes: [], edges: [] }
    const result = migrate(futureDoc)
    expect('ok' in result && result.ok === false).toBe(true)
    if ('ok' in result && !result.ok) {
      expect(result.reason).toBe('unknown-future-version')
    }
  })

  it('fails cleanly on corrupt (non-object) input', () => {
    const result = migrate('not a document')
    expect('ok' in result && result.ok === false).toBe(true)
    if ('ok' in result && !result.ok) {
      expect(result.reason).toBe('invalid-shape')
    }
  })

  it('fails cleanly on null input', () => {
    const result = migrate(null)
    expect('ok' in result && result.ok === false).toBe(true)
  })
})
