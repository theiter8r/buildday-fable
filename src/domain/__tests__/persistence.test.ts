import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEYS } from '../constants'
import { createDemoPayload } from '../demoPayload'
import { createDemoWorkflow } from '../demoWorkflow'
import {
  clearAll,
  loadPayload,
  loadWorkflow,
  savePayload,
  saveWorkflow,
} from '../persistence'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('loadWorkflow', () => {
  it('reports missing when nothing is persisted', () => {
    expect(loadWorkflow()).toEqual({ status: 'missing' })
  })

  it('round-trips a saved document back through saveWorkflow -> loadWorkflow', () => {
    const doc = createDemoWorkflow()
    const result = saveWorkflow(doc)
    expect(result).toEqual({ ok: true })

    const loaded = loadWorkflow()
    expect(loaded.status).toBe('ok')
    if (loaded.status === 'ok') {
      expect(loaded.doc.id).toBe(doc.id)
      expect(loaded.doc.nodes).toEqual(doc.nodes)
      expect(loaded.doc.edges).toEqual(doc.edges)
    }
  })

  it('reports corrupt for unparsable JSON', () => {
    localStorage.setItem(STORAGE_KEYS.document, '{ not json')
    const result = loadWorkflow()
    expect(result.status).toBe('corrupt')
    if (result.status === 'corrupt') {
      expect(result.raw).toBe('{ not json')
      expect(result.errors.length).toBeGreaterThan(0)
    }
  })

  it('reports corrupt for well-formed JSON that fails schema validation', () => {
    localStorage.setItem(STORAGE_KEYS.document, JSON.stringify({ nodes: [], edges: [] }))
    const result = loadWorkflow()
    expect(result.status).toBe('corrupt')
  })

  it('reports unavailable when localStorage throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('nope', 'SecurityError')
    })
    const result = loadWorkflow()
    expect(result).toEqual({ status: 'unavailable' })
    spy.mockRestore()
  })
})

describe('saveWorkflow — quota handling', () => {
  it('returns a typed quota failure instead of throwing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    const result = saveWorkflow(createDemoWorkflow())
    expect(result).toEqual({ ok: false, reason: 'quota' })
  })
})

describe('payload persistence', () => {
  it('returns null when nothing is persisted', () => {
    expect(loadPayload()).toBeNull()
  })

  it('round-trips a saved payload', () => {
    const payload = createDemoPayload()
    expect(savePayload(payload)).toEqual({ ok: true })
    expect(loadPayload()).toEqual(payload)
  })

  it('returns null for an invalid persisted payload', () => {
    localStorage.setItem(STORAGE_KEYS.payload, JSON.stringify({ severity: 'apocalyptic' }))
    expect(loadPayload()).toBeNull()
  })
})

describe('clearAll', () => {
  it('removes every OpsFlow storage key', () => {
    saveWorkflow(createDemoWorkflow())
    savePayload(createDemoPayload())
    localStorage.setItem(STORAGE_KEYS.ui, JSON.stringify({ speed: 1 }))

    const result = clearAll()
    expect(result).toEqual({ ok: true })
    expect(localStorage.getItem(STORAGE_KEYS.document)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.payload)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.ui)).toBeNull()
  })
})
