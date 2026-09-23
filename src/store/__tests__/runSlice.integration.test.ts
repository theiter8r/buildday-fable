import { beforeEach, describe, expect, it } from 'vitest'
import { createDemoPayload } from '@/domain'
import { createWorkflowStore } from '../workflowStore'

/**
 * Same contract as `runSlice.test.ts`, but against the real `@/domain`
 * (`simulate`, `applyEventToStates`, `validateWorkflow`) now that the domain
 * lane has landed them — an end-to-end sanity check that the store's player
 * and the domain's simulator actually agree, not just each side's mocks.
 */
let store: ReturnType<typeof createWorkflowStore>

beforeEach(() => {
  store = createWorkflowStore()
  store.getState().setSpeed('instant')
})

describe('RunSlice against the real simulator (demo workflow)', () => {
  it('runs the critical (true) branch to a resolved rollback', () => {
    store.getState().setPayload({ ...createDemoPayload(), severity: 'critical' })
    store.getState().start()

    const state = store.getState()
    expect(state.status).toBe('completed')
    expect(state.nodeStates['demo-resolution-resolved']).toBe('success')
    expect(state.nodeStates['demo-create-ticket']).toBe('skipped')
    expect(state.events.some((e) => e.kind === 'branch-decided' && e.result === true)).toBe(true)
  })

  it('runs the non-critical (false) branch to a mitigated ticket/Slack path', () => {
    store.getState().setPayload({ ...createDemoPayload(), severity: 'low' })
    store.getState().start()

    const state = store.getState()
    expect(state.status).toBe('completed')
    expect(state.nodeStates['demo-resolution-mitigated']).toBe('success')
    expect(state.nodeStates['demo-rollback-deploy']).toBe('skipped')
  })

  it('pauses for a manual approval, then approve() continues to completion', () => {
    const approvalNode = store.getState().document.nodes.find((n) => n.id === 'demo-approval-rollback')!
    store.getState().updateNodeConfig('demo-approval-rollback', 'policy', 'manual')
    expect(approvalNode).toBeDefined()

    store.getState().setPayload({ ...createDemoPayload(), severity: 'critical' })
    store.getState().start()
    expect(store.getState().status).toBe('awaiting-approval')
    expect(store.getState().pendingApprovalNodeId).toBe('demo-approval-rollback')

    store.getState().approve('demo-approval-rollback')
    expect(store.getState().status).toBe('completed')
    expect(store.getState().nodeStates['demo-resolution-resolved']).toBe('success')
  })

  it('a manual reject ends the run rejected', () => {
    store.getState().updateNodeConfig('demo-approval-rollback', 'policy', 'manual')
    store.getState().setPayload({ ...createDemoPayload(), severity: 'critical' })
    store.getState().start()

    store.getState().reject('demo-approval-rollback')
    expect(store.getState().status).toBe('rejected')
  })

  it('start() refuses to run once the Trigger is removed, and shows why', () => {
    store.getState().removeNode('demo-trigger')
    store.getState().start()
    expect(store.getState().status).toBe('idle')
    expect(store.getState().runDisabledReason).not.toBeNull()
    expect(store.getState().toasts.some((t) => t.variant === 'error')).toBe(true)
  })
})
