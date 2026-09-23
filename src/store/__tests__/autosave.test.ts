import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mocking `saveWorkflow`/`savePayload` (`src/domain/persistence.ts`) lets
// this file test the store's own debounce/flush/error-handling wiring
// (ARCHITECTURE.md §8) without touching real `localStorage`.
vi.mock('@/domain', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/domain')>()
  return {
    ...actual,
    saveWorkflow: vi.fn(() => ({ ok: true }) as const),
    savePayload: vi.fn(() => ({ ok: true }) as const),
  }
})

const { installAutosave } = await import('../autosave')
const { createWorkflowStore } = await import('../workflowStore')
const { saveWorkflow, savePayload } = await import('@/domain')

let store: ReturnType<typeof createWorkflowStore>
let stop: () => void

beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(saveWorkflow).mockReset().mockReturnValue({ ok: true })
  vi.mocked(savePayload).mockReset().mockReturnValue({ ok: true })
  store = createWorkflowStore()
})

afterEach(() => {
  stop?.()
  vi.useRealTimers()
})

describe('installAutosave', () => {
  it('marks saving immediately on a document change, then writes and marks saved after the debounce window', () => {
    stop = installAutosave(store)
    store.getState().renameDoc('Renamed workflow')

    expect(store.getState().persistenceStatus).toBe('saving')
    expect(saveWorkflow).not.toHaveBeenCalled()

    vi.advanceTimersByTime(599)
    expect(saveWorkflow).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(saveWorkflow).toHaveBeenCalledTimes(1)
    expect(savePayload).toHaveBeenCalledTimes(1)
    expect(store.getState().persistenceStatus).toBe('saved')
    expect(store.getState().lastSavedAt).not.toBeNull()
  })

  it('debounces a burst of changes into a single write', () => {
    stop = installAutosave(store)
    store.getState().renameDoc('A')
    vi.advanceTimersByTime(300)
    store.getState().renameDoc('B')
    vi.advanceTimersByTime(300)
    store.getState().renameDoc('C')
    vi.advanceTimersByTime(600)

    expect(saveWorkflow).toHaveBeenCalledTimes(1)
    expect(saveWorkflow).toHaveBeenCalledWith(expect.objectContaining({ name: 'C' }))
  })

  it('a payload-only change also schedules a write', () => {
    stop = installAutosave(store)
    store.getState().updatePayloadField('service', 'checkout')
    vi.advanceTimersByTime(600)
    expect(savePayload).toHaveBeenCalledWith(expect.objectContaining({ service: 'checkout' }))
  })

  it('sets persistenceStatus to error when a write reports failure (e.g. quota exceeded)', () => {
    vi.mocked(saveWorkflow).mockReturnValue({ ok: false, reason: 'quota' })
    stop = installAutosave(store)
    store.getState().renameDoc('Renamed')
    vi.advanceTimersByTime(600)
    expect(store.getState().persistenceStatus).toBe('error')
  })

  it('flushes immediately on pagehide instead of waiting for the debounce', () => {
    stop = installAutosave(store)
    store.getState().renameDoc('Renamed')
    window.dispatchEvent(new Event('pagehide'))
    expect(saveWorkflow).toHaveBeenCalledTimes(1)
  })
})
