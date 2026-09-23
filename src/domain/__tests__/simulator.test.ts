/**
 * `validation.ts`/`conditions.ts`/`graph.ts` are owned by another lane and
 * are still throwing stubs at the time this file was written. `simulate()`'s
 * contract is written against their documented signatures (ARCHITECTURE.md
 * §4, §5), so these two modules are mocked here with real, spec-conformant
 * implementations — not to bypass anything, just to unblock this lane's
 * tests until the other lane lands. Swap/remove these mocks once
 * `conditions.ts`/`graph.ts` are implemented; the tests below assert
 * `simulate()`'s own behaviour, not the mocks'.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDemoPayload } from '../demoPayload'
import { createDemoWorkflow } from '../demoWorkflow'
import { createEdge, createNode } from '../factories'
import type { ConditionConfig, IncidentPayload, WorkflowDocument } from '../types'

vi.mock('../conditions', () => {
  function getByPath(obj: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((acc, key) => {
      if (acc === null || acc === undefined) return undefined
      return (acc as Record<string, unknown>)[key]
    }, obj)
  }
  function toNumber(x: unknown): number {
    if (typeof x === 'number') return x
    if (typeof x === 'boolean') return x ? 1 : 0
    if (typeof x === 'string') return x.trim() === '' ? NaN : Number(x.trim())
    return NaN
  }
  function evaluateCondition(cfg: ConditionConfig, payload: IncidentPayload) {
    const left = getByPath(payload, cfg.field)
    const value = cfg.value
    let result: boolean
    switch (cfg.operator) {
      case 'equals':
        result = String(left ?? '').trim().toLowerCase() === value.trim().toLowerCase()
        break
      case 'not-equals':
        result = String(left ?? '').trim().toLowerCase() !== value.trim().toLowerCase()
        break
      case 'gt':
        result = toNumber(left) > toNumber(value)
        break
      case 'gte':
        result = toNumber(left) >= toNumber(value)
        break
      case 'lt':
        result = toNumber(left) < toNumber(value)
        break
      case 'lte':
        result = toNumber(left) <= toNumber(value)
        break
      case 'contains':
        result =
          typeof left === 'string'
            ? left.toLowerCase().includes(value.toLowerCase())
            : Array.isArray(left)
              ? left.some((v) => String(v).toLowerCase() === value.toLowerCase())
              : false
        break
      case 'in':
        result = value
          .split(',')
          .map((v) => v.trim().toLowerCase())
          .includes(String(left ?? '').trim().toLowerCase())
        break
      case 'exists':
        result = left !== undefined && left !== null && left !== ''
        break
      default:
        result = false
    }
    return { result, explanation: `${cfg.field} ${cfg.operator} ${cfg.value}` }
  }
  function describeCondition(cfg: ConditionConfig): string {
    return `${cfg.field} ${cfg.operator} ${cfg.value}`
  }
  return { getByPath, toNumber, evaluateCondition, describeCondition }
})

vi.mock('../graph', () => {
  function reachableFrom(doc: WorkflowDocument, nodeId: string): Set<string> {
    const seen = new Set<string>([nodeId])
    const queue = [nodeId]
    while (queue.length > 0) {
      const current = queue.shift()!
      for (const edge of doc.edges) {
        if (edge.source === current && !seen.has(edge.target)) {
          seen.add(edge.target)
          queue.push(edge.target)
        }
      }
    }
    return seen
  }
  return { reachableFrom }
})

const { simulate, applyEventToStates } = await import('../simulator')

function nodeIdsInOrder(events: ReturnType<typeof simulate>['events']): string[] {
  return events.filter((e) => e.kind === 'node-started').map((e) => e.nodeId)
}

describe('simulate — critical branch (auto-approve)', () => {
  const doc = createDemoWorkflow()
  const payload = createDemoPayload() // severity: 'critical'

  it('walks trigger -> condition -> page -> approval -> rollback -> resolved', () => {
    const result = simulate(doc, payload)
    expect(nodeIdsInOrder(result.events)).toEqual([
      'demo-trigger',
      'demo-condition',
      'demo-page-oncall',
      'demo-approval-rollback',
      'demo-rollback-deploy',
      'demo-resolution-resolved',
    ])
  })

  it('finishes completed with the resolved status as the summary', () => {
    const result = simulate(doc, payload)
    expect(result.status).toBe('completed')
    const last = result.events[result.events.length - 1]!
    expect(last).toMatchObject({ kind: 'run-finished', status: 'completed', summary: 'resolved' })
  })

  it('marks the false-branch nodes skipped and the true-branch nodes success', () => {
    const result = simulate(doc, payload)
    expect(result.finalNodeStates['demo-create-ticket']).toBe('skipped')
    expect(result.finalNodeStates['demo-post-slack']).toBe('skipped')
    expect(result.finalNodeStates['demo-resolution-mitigated']).toBe('skipped')
    expect(result.finalNodeStates['demo-page-oncall']).toBe('success')
    expect(result.finalNodeStates['demo-resolution-resolved']).toBe('success')
  })

  it('records a true branch-decided event on the condition', () => {
    const result = simulate(doc, payload)
    const decided = result.events.find((e) => e.kind === 'branch-decided')
    expect(decided).toMatchObject({ branch: 'true', result: true, nodeId: 'demo-condition' })
  })

  it('offsets are monotonic non-decreasing', () => {
    const result = simulate(doc, payload)
    const offsets = result.events.map((e) => e.at)
    for (let i = 1; i < offsets.length; i += 1) {
      expect(offsets[i]).toBeGreaterThanOrEqual(offsets[i - 1]!)
    }
  })

  it('totalDurationMs matches the last event offset', () => {
    const result = simulate(doc, payload)
    const last = result.events[result.events.length - 1]!
    expect(result.totalDurationMs).toBe(last.at)
  })
})

describe('simulate — non-critical branch', () => {
  const doc = createDemoWorkflow()
  const payload: IncidentPayload = { ...createDemoPayload(), severity: 'low' }

  it('walks trigger -> condition -> ticket -> slack -> mitigated', () => {
    const result = simulate(doc, payload)
    expect(nodeIdsInOrder(result.events)).toEqual([
      'demo-trigger',
      'demo-condition',
      'demo-create-ticket',
      'demo-post-slack',
      'demo-resolution-mitigated',
    ])
    expect(result.finalNodeStates['demo-page-oncall']).toBe('skipped')
    expect(result.finalNodeStates['demo-approval-rollback']).toBe('skipped')
    expect(result.finalNodeStates['demo-rollback-deploy']).toBe('skipped')
    expect(result.finalNodeStates['demo-resolution-resolved']).toBe('skipped')

    const last = result.events[result.events.length - 1]!
    expect(last).toMatchObject({ kind: 'run-finished', status: 'completed', summary: 'mitigated' })
  })

  it('records a false branch-decided event on the condition', () => {
    const result = simulate(doc, payload)
    const decided = result.events.find((e) => e.kind === 'branch-decided')
    expect(decided).toMatchObject({ branch: 'false', result: false })
  })
})

describe('simulate — trigger filter rejection', () => {
  it('stops immediately with a completed run when the trigger filters do not match', () => {
    const doc = createDemoWorkflow()
    const payload: IncidentPayload = { ...createDemoPayload(), service: 'billing-service' }
    const result = simulate(doc, payload)
    expect(result.events.some((e) => e.kind === 'trigger-filtered')).toBe(true)
    const last = result.events[result.events.length - 1]!
    expect(last).toMatchObject({ kind: 'run-finished', status: 'completed' })
    expect(result.finalNodeStates['demo-condition']).toBe('skipped')
  })
})

describe('simulate — action failure', () => {
  function buildFailingWorkflow(continueOnFailure: boolean): WorkflowDocument {
    const trigger = createNode('trigger', { x: 0, y: 0 })
    const action = createNode(
      'action',
      { x: 100, y: 0 },
      { config: { simulateFailure: true, continueOnFailure } },
    )
    const resolution = createNode('resolution', { x: 200, y: 0 })
    return {
      schemaVersion: 2,
      id: 'test-doc',
      name: 'Test',
      nodes: [trigger, action, resolution],
      edges: [createEdge(trigger.id, action.id), createEdge(action.id, resolution.id)],
      updatedAt: new Date().toISOString(),
    }
  }

  it('a failing action without continueOnFailure ends the run failed and skips downstream nodes', () => {
    const doc = buildFailingWorkflow(false)
    const payload = createDemoPayload()
    const result = simulate(doc, payload)
    expect(result.status).toBe('failed')
    const resolutionId = doc.nodes[2]!.id
    expect(result.finalNodeStates[resolutionId]).toBe('skipped')
    expect(result.finalNodeStates[doc.nodes[1]!.id]).toBe('failed')
  })

  it('continueOnFailure lets the run proceed past the failure to the resolution', () => {
    const doc = buildFailingWorkflow(true)
    const payload = createDemoPayload()
    const result = simulate(doc, payload)
    expect(result.status).toBe('completed')
    const resolutionId = doc.nodes[2]!.id
    expect(result.finalNodeStates[resolutionId]).toBe('success')
  })
})

describe('simulate — manual approval pause / resume', () => {
  function buildManualWorkflow(): WorkflowDocument {
    const trigger = createNode('trigger', { x: 0, y: 0 })
    const approval = createNode('approval', { x: 100, y: 0 }, { config: { policy: 'manual' } })
    const resolution = createNode('resolution', { x: 200, y: 0 })
    return {
      schemaVersion: 2,
      id: 'test-doc',
      name: 'Test',
      nodes: [trigger, approval, resolution],
      edges: [createEdge(trigger.id, approval.id), createEdge(approval.id, resolution.id)],
      updatedAt: new Date().toISOString(),
    }
  }

  it('pauses at the manual approval gate with status awaiting-approval', () => {
    const doc = buildManualWorkflow()
    const payload = createDemoPayload()
    const result = simulate(doc, payload)
    expect(result.status).toBe('awaiting-approval')
    expect(result.pendingApprovalNodeId).toBe(doc.nodes[1]!.id)
    expect(result.events.some((e) => e.kind === 'approval-requested')).toBe(true)
    expect(result.events.some((e) => e.kind === 'run-finished')).toBe(false)
  })

  it('approving resumes with an identical prefix, then completes', () => {
    const doc = buildManualWorkflow()
    const payload = createDemoPayload()
    const paused = simulate(doc, payload)
    const approvalId = doc.nodes[1]!.id

    const resumed = simulate(doc, payload, { approvalDecisions: { [approvalId]: 'approved' } })

    expect(resumed.events.slice(0, paused.events.length)).toEqual(paused.events)
    expect(resumed.status).toBe('completed')
    expect(resumed.finalNodeStates[doc.nodes[2]!.id]).toBe('success')
  })

  it('rejecting ends the run rejected and skips the resolution', () => {
    const doc = buildManualWorkflow()
    const payload = createDemoPayload()
    const approvalId = doc.nodes[1]!.id
    const result = simulate(doc, payload, { approvalDecisions: { [approvalId]: 'rejected' } })
    expect(result.status).toBe('rejected')
    expect(result.finalNodeStates[doc.nodes[2]!.id]).toBe('skipped')
  })
})

describe('simulate — determinism', () => {
  it('two calls with identical inputs produce deep-equal event lists', () => {
    const doc = createDemoWorkflow()
    const payload = createDemoPayload()
    const a = simulate(doc, payload)
    const b = simulate(doc, payload)
    expect(a.events).toEqual(b.events)
    expect(a).toEqual(b)
  })
})

describe('simulate — maxSteps guard', () => {
  it('stops with a failed run once the step limit is reached', () => {
    // A long straight chain of actions, longer than maxSteps.
    const trigger = createNode('trigger', { x: 0, y: 0 })
    const actions = Array.from({ length: 5 }, (_, i) =>
      createNode('action', { x: (i + 1) * 100, y: 0 }, { config: { durationMs: 1 } }),
    )
    const edges = [
      createEdge(trigger.id, actions[0]!.id),
      ...actions.slice(0, -1).map((a, i) => createEdge(a.id, actions[i + 1]!.id)),
    ]
    const doc: WorkflowDocument = {
      schemaVersion: 2,
      id: 'test-doc',
      name: 'Test',
      nodes: [trigger, ...actions],
      edges,
      updatedAt: new Date().toISOString(),
    }
    const result = simulate(doc, createDemoPayload(), { maxSteps: 2 })
    expect(result.status).toBe('failed')
    const last = result.events[result.events.length - 1]!
    expect(last).toMatchObject({ kind: 'run-finished', status: 'failed', summary: 'Step limit reached.' })
  })
})

describe('applyEventToStates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('is consistent with simulate()’s own finalNodeStates when replayed over every event', () => {
    const doc = createDemoWorkflow()
    const payload = createDemoPayload()
    const result = simulate(doc, payload)
    let states: Record<string, ReturnType<typeof simulate>['finalNodeStates'][string]> = {}
    for (const event of result.events) {
      states = applyEventToStates(states, event)
    }
    for (const node of doc.nodes) {
      expect(states[node.id] ?? 'idle').toBe(result.finalNodeStates[node.id])
    }
  })
})
