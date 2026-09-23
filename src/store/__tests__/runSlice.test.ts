import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApprovalDecision, ExecutionEvent, NodeRunState, SimulationResult } from '@/domain/types'

// `simulate`/`applyEventToStates`/`validateWorkflow` are domain-lane stubs
// (`src/domain/simulator.ts`, `src/domain/validation.ts`) that currently
// throw "not implemented". Mocking them here tests the store's own player
// logic (scheduling, cursor bookkeeping, the approval re-simulation flow)
// against the *contract* those functions are documented to have
// (ARCHITECTURE.md §4), independent of whether the domain lane has landed
// yet. `createDemoWorkflow`/`createDemoPayload`/etc. pass through untouched.
vi.mock('@/domain', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/domain')>()
  return {
    ...actual,
    simulate: vi.fn(),
    applyEventToStates: vi.fn((states: Record<string, NodeRunState>, event: ExecutionEvent) => {
      if ('nodeId' in event && event.nodeId) {
        return { ...states, [event.nodeId]: nodeRunStateFor(event) }
      }
      return states
    }),
    validateWorkflow: vi.fn(() => []),
  }
})

function nodeRunStateFor(event: ExecutionEvent): NodeRunState {
  switch (event.kind) {
    case 'node-started':
      return 'running'
    case 'node-finished':
      return event.outcome
    case 'node-skipped':
      return 'skipped'
    case 'approval-requested':
      return 'awaiting-approval'
    default:
      return 'success'
  }
}

// Imported after the mock so the store module picks up the mocked `@/domain`.
const { createWorkflowStore } = await import('../workflowStore')
const { simulate } = await import('@/domain')

function ev<E extends ExecutionEvent>(e: E): E {
  return e
}

/** A short run with no branch/approval: run-started -> node-started -> node-finished -> run-finished. */
function linearRun(status: 'completed' | 'failed' = 'completed'): SimulationResult {
  const events: ExecutionEvent[] = [
    ev({ kind: 'run-started', at: 0, payloadSummary: 'demo' }),
    ev({ kind: 'node-started', at: 0, nodeId: 'n1', nodeType: 'action', label: 'Do thing' }),
    ev({ kind: 'node-finished', at: 100, nodeId: 'n1', outcome: 'success', detail: 'ok' }),
    ev({ kind: 'run-finished', at: 100, status, summary: 'done' }),
  ]
  return { events, status, finalNodeStates: { n1: 'success' }, totalDurationMs: 100 }
}

/** Like `linearRun`, but with widely-spaced `at` offsets so real-speed (non-instant) scheduling delays are unambiguous in fake-timer assertions. */
function linearRunSpacedOut(status: 'completed' | 'failed' = 'completed'): SimulationResult {
  const events: ExecutionEvent[] = [
    ev({ kind: 'run-started', at: 0, payloadSummary: 'demo' }),
    ev({ kind: 'node-started', at: 1000, nodeId: 'n1', nodeType: 'action', label: 'Do thing' }),
    ev({ kind: 'node-finished', at: 2000, nodeId: 'n1', outcome: 'success', detail: 'ok' }),
    ev({ kind: 'run-finished', at: 3000, status, summary: 'done' }),
  ]
  return { events, status, finalNodeStates: { n1: 'success' }, totalDurationMs: 3000 }
}

/** A run that pauses at a manual approval gate unless `decisions` already resolves it. */
function runWithApproval(decisions: Record<string, ApprovalDecision> = {}): SimulationResult {
  const decision = decisions.approve1
  const events: ExecutionEvent[] = [
    ev({ kind: 'run-started', at: 0, payloadSummary: 'demo' }),
    ev({ kind: 'node-started', at: 0, nodeId: 'n1', nodeType: 'approval', label: 'Approve' }),
  ]
  if (!decision) {
    events.push(ev({ kind: 'approval-requested', at: 50, nodeId: 'approve1', approverRole: 'ic', prompt: 'ok?' }))
    return { events, status: 'awaiting-approval', pendingApprovalNodeId: 'approve1', finalNodeStates: {}, totalDurationMs: 50 }
  }
  const via = decision === 'approved' ? 'manual' : 'manual'
  events.push(ev({ kind: 'approval-resolved', at: 50, nodeId: 'approve1', decision, via }))
  const status = decision === 'approved' ? 'completed' : 'rejected'
  events.push(ev({ kind: 'run-finished', at: 60, status, summary: decision }))
  return { events, status, finalNodeStates: { n1: 'success' }, totalDurationMs: 60 }
}

let store: ReturnType<typeof createWorkflowStore>

beforeEach(() => {
  vi.mocked(simulate).mockReset()
  store = createWorkflowStore()
})

describe('RunSlice.start', () => {
  it('refuses to start (and shows an error toast) while a run is already in progress', () => {
    store.setState({ status: 'running' })
    store.getState().start()
    expect(simulate).not.toHaveBeenCalled()
    expect(store.getState().toasts).toHaveLength(1)
    expect(store.getState().toasts[0]?.variant).toBe('error')
  })

  it('runs a linear workflow to completion at instant speed, applying every event', () => {
    vi.mocked(simulate).mockReturnValue(linearRun('completed'))
    store.getState().setSpeed('instant')
    store.getState().start()

    const state = store.getState()
    expect(state.status).toBe('completed')
    expect(state.currentIndex).toBe(3)
    expect(state.nodeStates.n1).toBe('success')
    expect(state.runStartedAtWallClock).not.toBeNull()
  })

  it('runs a failing branch to completion at instant speed', () => {
    vi.mocked(simulate).mockReturnValue(linearRun('failed'))
    store.getState().setSpeed('instant')
    store.getState().start()
    expect(store.getState().status).toBe('failed')
  })
})

describe('RunSlice playback at real speed', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('pause stops the timer chain and resume continues it from the same cursor', () => {
    vi.mocked(simulate).mockReturnValue(linearRunSpacedOut('completed'))
    store.getState().setSpeed(1)
    store.getState().start()
    expect(store.getState().status).toBe('running')
    expect(store.getState().currentIndex).toBe(-1)

    // Only the first (16ms-clamped) step should have fired: the next timer
    // is scheduled ~1000ms out, well past this window.
    vi.advanceTimersByTime(16)
    expect(store.getState().currentIndex).toBe(0)

    store.getState().pause()
    expect(store.getState().status).toBe('paused')
    vi.advanceTimersByTime(10_000)
    expect(store.getState().currentIndex).toBe(0) // nothing applied while paused

    store.getState().resume()
    expect(store.getState().status).toBe('running')
    vi.advanceTimersByTime(10_000)
    expect(store.getState().status).toBe('completed')
    expect(store.getState().currentIndex).toBe(3)
  })

  it('step applies exactly one event regardless of status', () => {
    vi.mocked(simulate).mockReturnValue(linearRunSpacedOut('completed'))
    store.getState().setSpeed(1)
    store.getState().start()
    store.getState().pause()
    const before = store.getState().currentIndex
    store.getState().step()
    expect(store.getState().currentIndex).toBe(before + 1)
  })
})

describe('RunSlice approval flow', () => {
  it('pauses at a manual approval gate, then approve() re-simulates and continues to completion', () => {
    vi.mocked(simulate).mockImplementation((_doc, _payload, options) =>
      runWithApproval(options?.approvalDecisions),
    )
    store.getState().setSpeed('instant')
    store.getState().start()

    expect(store.getState().status).toBe('awaiting-approval')
    expect(store.getState().pendingApprovalNodeId).toBe('approve1')

    store.getState().approve('approve1')
    expect(store.getState().approvalDecisions).toEqual({ approve1: 'approved' })
    expect(store.getState().status).toBe('completed')
    expect(store.getState().pendingApprovalNodeId).toBeNull()
  })

  it('reject() re-simulates and ends the run rejected', () => {
    vi.mocked(simulate).mockImplementation((_doc, _payload, options) =>
      runWithApproval(options?.approvalDecisions),
    )
    store.getState().setSpeed('instant')
    store.getState().start()
    store.getState().reject('approve1')
    expect(store.getState().approvalDecisions).toEqual({ approve1: 'rejected' })
    expect(store.getState().status).toBe('rejected')
  })

  it('ignores approve()/reject() for a node that is not the pending one', () => {
    vi.mocked(simulate).mockImplementation((_doc, _payload, options) =>
      runWithApproval(options?.approvalDecisions),
    )
    store.getState().setSpeed('instant')
    store.getState().start()
    store.getState().approve('someone-else')
    expect(store.getState().status).toBe('awaiting-approval')
  })
})

describe('RunSlice.reset', () => {
  it('clears events/decisions/cursor/nodeStates back to idle', () => {
    vi.mocked(simulate).mockReturnValue(linearRun('completed'))
    store.getState().setSpeed('instant')
    store.getState().start()
    store.getState().reset()

    const state = store.getState()
    expect(state.status).toBe('idle')
    expect(state.events).toEqual([])
    expect(state.currentIndex).toBe(-1)
    expect(state.nodeStates).toEqual({})
    expect(state.approvalDecisions).toEqual({})
    expect(state.pendingApprovalNodeId).toBeNull()
    expect(state.runStartedAtWallClock).toBeNull()
  })
})
