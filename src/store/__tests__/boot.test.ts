import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LoadWorkflowResult } from '@/domain/persistence'

// `loadWorkflow`/`loadPayload` are domain-lane stubs (`src/domain/persistence.ts`)
// that currently throw "not implemented". Mocking them tests the store's own
// boot decision table (ARCHITECTURE.md §8: missing -> demo, ok -> restored,
// corrupt -> error state with the raw value preserved, unavailable -> error
// state) against the documented `LoadWorkflowResult` contract.
vi.mock('@/domain', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/domain')>()
  return { ...actual, loadWorkflow: vi.fn(), loadPayload: vi.fn() }
})

const { bootWorkflowStore } = await import('../boot')
const { createWorkflowStore } = await import('../workflowStore')
const { loadWorkflow, loadPayload } = await import('@/domain')
const { createDemoWorkflow, createDemoPayload } = await import('@/domain')

let store: ReturnType<typeof createWorkflowStore>

beforeEach(() => {
  vi.mocked(loadWorkflow).mockReset()
  vi.mocked(loadPayload).mockReset().mockReturnValue(null)
  store = createWorkflowStore()
})

describe('bootWorkflowStore', () => {
  it('first-ever boot (missing key): loads the demo workflow', () => {
    vi.mocked(loadWorkflow).mockReturnValue({ status: 'missing' } satisfies LoadWorkflowResult)
    const result = bootWorkflowStore(store)
    expect(result.status).toBe('first-boot')
    expect(store.getState().document.id).toBe(createDemoWorkflow().id)
    expect(store.getState().persistenceStatus).not.toBe('error')
  })

  it('restores a valid persisted document', () => {
    const persisted = { ...createDemoWorkflow(), name: 'My persisted workflow' }
    vi.mocked(loadWorkflow).mockReturnValue({ status: 'ok', doc: persisted } satisfies LoadWorkflowResult)
    const result = bootWorkflowStore(store)
    expect(result.status).toBe('restored')
    expect(store.getState().document.name).toBe('My persisted workflow')
  })

  it('restores the persisted payload alongside a persisted document', () => {
    const persisted = createDemoWorkflow()
    const payload = { ...createDemoPayload(), service: 'checkout' }
    vi.mocked(loadWorkflow).mockReturnValue({ status: 'ok', doc: persisted } satisfies LoadWorkflowResult)
    vi.mocked(loadPayload).mockReturnValue(payload)
    bootWorkflowStore(store)
    expect(store.getState().payload.service).toBe('checkout')
  })

  it('corrupt storage: sets an error persistence status and surfaces the raw value + reasons, without touching the in-memory document', () => {
    const before = store.getState().document
    vi.mocked(loadWorkflow).mockReturnValue({
      status: 'corrupt',
      raw: '{not json',
      errors: ['Unexpected token'],
    } satisfies LoadWorkflowResult)
    const result = bootWorkflowStore(store)
    expect(result.status).toBe('corrupt')
    expect(result.corrupt).toEqual({ raw: '{not json', errors: ['Unexpected token'] })
    expect(store.getState().persistenceStatus).toBe('error')
    expect(store.getState().document).toBe(before)
  })

  it('storage unavailable: sets an error persistence status without crashing', () => {
    vi.mocked(loadWorkflow).mockReturnValue({ status: 'unavailable' } satisfies LoadWorkflowResult)
    const result = bootWorkflowStore(store)
    expect(result.status).toBe('unavailable')
    expect(store.getState().persistenceStatus).toBe('error')
  })

  it('degrades to unavailable (never throws) if loadWorkflow itself throws — e.g. the domain lane stub', () => {
    vi.mocked(loadWorkflow).mockImplementation(() => {
      throw new Error('not implemented')
    })
    expect(() => bootWorkflowStore(store)).not.toThrow()
    expect(store.getState().persistenceStatus).toBe('error')
  })
})
