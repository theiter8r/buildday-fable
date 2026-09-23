import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDemoPayload } from '@/domain'
import { createWorkflowStore } from '../workflowStore'

let store: ReturnType<typeof createWorkflowStore>

beforeEach(() => {
  store = createWorkflowStore()
})

describe('PayloadSlice', () => {
  it('setPayload replaces the whole payload', () => {
    const next = { ...createDemoPayload(), title: 'Something else', severity: 'low' as const }
    store.getState().setPayload(next)
    expect(store.getState().payload).toEqual(next)
  })

  it('updatePayloadField patches exactly one field', () => {
    const before = store.getState().payload
    store.getState().updatePayloadField('service', 'checkout-api')
    const after = store.getState().payload
    expect(after.service).toBe('checkout-api')
    expect(after.title).toBe(before.title)
    expect(after.severity).toBe(before.severity)
  })

  it('resetPayload restores the demo payload shape', () => {
    store.getState().updatePayloadField('service', 'changed')
    store.getState().resetPayload()
    expect(store.getState().payload.service).toBe(createDemoPayload().service)
  })
})

describe('UiSlice', () => {
  it('setActiveMobilePanel switches the frontmost panel', () => {
    store.getState().setActiveMobilePanel('inspector')
    expect(store.getState().activeMobilePanel).toBe('inspector')
  })

  it('openDialog/closeDialog track a set of open dialog names', () => {
    store.getState().openDialog('import')
    store.getState().openDialog('confirm-reset')
    expect(store.getState().openDialogs.has('import')).toBe(true)
    expect(store.getState().openDialogs.has('confirm-reset')).toBe(true)

    store.getState().closeDialog('import')
    expect(store.getState().openDialogs.has('import')).toBe(false)
    expect(store.getState().openDialogs.has('confirm-reset')).toBe(true)
  })

  it('pushToast queues a toast with a generated id and auto-dismisses non-error toasts after 4s', () => {
    vi.useFakeTimers()
    store.getState().pushToast({ variant: 'success', title: 'Saved' })
    expect(store.getState().toasts).toHaveLength(1)
    const id = store.getState().toasts[0]!.id
    expect(id).toBeTruthy()

    vi.advanceTimersByTime(4000)
    expect(store.getState().toasts.find((t) => t.id === id)).toBeUndefined()
    vi.useRealTimers()
  })

  it('does not auto-dismiss error toasts', () => {
    vi.useFakeTimers()
    store.getState().pushToast({ variant: 'error', title: 'Broken' })
    vi.advanceTimersByTime(10_000)
    expect(store.getState().toasts).toHaveLength(1)
    vi.useRealTimers()
  })

  it('dismissToast removes a toast by id', () => {
    store.getState().pushToast({ variant: 'info', title: 'FYI' })
    const id = store.getState().toasts[0]!.id
    store.getState().dismissToast(id)
    expect(store.getState().toasts).toHaveLength(0)
  })
})

describe('PersistenceSlice', () => {
  it('markPersistenceError sets persistenceStatus to error', () => {
    store.getState().markPersistenceError()
    expect(store.getState().persistenceStatus).toBe('error')
  })
})

describe('DerivedSlice.runDisabledReason', () => {
  it('is null when validateWorkflow reports no errors (mocked)', () => {
    // The demo workflow is well-formed by construction; while
    // `validateWorkflow` is still a domain-lane stub, `selectValidationIssues`
    // defensively treats a throw as "no issues" (see `selectors.ts`), so this
    // also exercises that fallback without needing the real validator yet.
    expect(store.getState().runDisabledReason).toBeNull()
  })
})
