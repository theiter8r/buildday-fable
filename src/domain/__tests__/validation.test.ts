import { describe, expect, it } from 'vitest'
import { createDemoWorkflow } from '../demoWorkflow'
import { validateWorkflow } from '../validation'
import type {
  ActionConfig,
  ApprovalConfig,
  ConditionConfig,
  ResolutionConfig,
  TriggerConfig,
  ValidationCode,
  WorkflowDocument,
  WorkflowEdge,
  WorkflowNode,
} from '../types'

function makeDoc(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowDocument {
  return {
    schemaVersion: 2,
    id: 'test-doc',
    name: 'Test',
    nodes,
    edges,
    updatedAt: new Date(0).toISOString(),
  }
}

function triggerNode(id: string, config: Partial<TriggerConfig> = {}, x = 0): WorkflowNode {
  return {
    id,
    type: 'trigger',
    label: `Trigger ${id}`,
    position: { x, y: 0 },
    config: { source: 'manual', filters: [], description: '', ...config },
  }
}

function conditionNode(id: string, config: Partial<ConditionConfig> = {}, x = 100): WorkflowNode {
  return {
    id,
    type: 'condition',
    label: `Condition ${id}`,
    position: { x, y: 0 },
    config: { field: 'severity', operator: 'equals', value: 'critical', ...config },
  }
}

function actionNode(id: string, config: Partial<ActionConfig> = {}, x = 200): WorkflowNode {
  return {
    id,
    type: 'action',
    label: `Action ${id}`,
    position: { x, y: 0 },
    config: {
      action: 'post-slack',
      target: '#incidents',
      durationMs: 100,
      simulateFailure: false,
      continueOnFailure: false,
      ...config,
    },
  }
}

function approvalNode(id: string, config: Partial<ApprovalConfig> = {}, x = 300): WorkflowNode {
  return {
    id,
    type: 'approval',
    label: `Approval ${id}`,
    position: { x, y: 0 },
    config: {
      approverRole: 'incident-commander',
      timeoutMs: 60_000,
      policy: 'manual',
      prompt: '',
      ...config,
    },
  }
}

function resolutionNode(id: string, config: Partial<ResolutionConfig> = {}, x = 400): WorkflowNode {
  return {
    id,
    type: 'resolution',
    label: `Resolution ${id}`,
    position: { x, y: 0 },
    config: { status: 'resolved', postmortemRequired: false, summary: 'All clear.', ...config },
  }
}

function edge(
  id: string,
  source: string,
  target: string,
  sourceHandle: 'true' | 'false' | null = null,
): WorkflowEdge {
  return { id, source, target, sourceHandle }
}

/** A minimal, otherwise-clean trigger -> resolution workflow to isolate one issue at a time. */
function baseline(): { trigger: WorkflowNode; resolution: WorkflowNode } {
  return { trigger: triggerNode('t1'), resolution: resolutionNode('r1') }
}

function codesOf(doc: WorkflowDocument, filterCode?: ValidationCode) {
  const issues = validateWorkflow(doc)
  return filterCode ? issues.filter((i) => i.code === filterCode) : issues
}

describe('validateWorkflow', () => {
  it('EMPTY_WORKFLOW: an empty document produces exactly one issue', () => {
    const issues = validateWorkflow(makeDoc([], []))
    expect(issues).toHaveLength(1)
    expect(issues[0].code).toBe('EMPTY_WORKFLOW')
    expect(issues[0].severity).toBe('error')
  })

  it('NO_TRIGGER: a document with nodes but no trigger is flagged', () => {
    const { resolution } = baseline()
    const doc = makeDoc([resolution], [])
    expect(codesOf(doc, 'NO_TRIGGER')).toHaveLength(1)
  })

  it('MULTIPLE_TRIGGERS: every trigger past the first is flagged', () => {
    const t1 = triggerNode('t1')
    const t2 = triggerNode('t2')
    const doc = makeDoc([t1, t2], [])
    const issues = codesOf(doc, 'MULTIPLE_TRIGGERS')
    expect(issues).toHaveLength(1)
    expect(issues[0].nodeId).toBe('t2')
  })

  it('TRIGGER_HAS_INPUT: an edge into a trigger is flagged', () => {
    const t1 = triggerNode('t1')
    const a = actionNode('a1')
    const doc = makeDoc([t1, a], [edge('e1', 'a1', 't1')])
    const issues = codesOf(doc, 'TRIGGER_HAS_INPUT')
    expect(issues).toHaveLength(1)
    expect(issues[0].edgeId).toBe('e1')
  })

  it('NO_RESOLUTION: a document with no Resolution node is flagged', () => {
    const t1 = triggerNode('t1')
    const doc = makeDoc([t1], [])
    expect(codesOf(doc, 'NO_RESOLUTION')).toHaveLength(1)
  })

  it('NO_REACHABLE_RESOLUTION: a Resolution exists but is unreachable from the Trigger', () => {
    const { trigger } = baseline()
    const a = actionNode('a1')
    const r = resolutionNode('r1')
    const doc = makeDoc([trigger, a, r], [edge('e1', 't1', 'a1')])
    expect(codesOf(doc, 'NO_REACHABLE_RESOLUTION')).toHaveLength(1)
  })

  it('DISCONNECTED_NODE: a node with no edges at all is flagged', () => {
    const { trigger, resolution } = baseline()
    const isolated = actionNode('isolated')
    const doc = makeDoc(
      [trigger, resolution, isolated],
      [edge('e1', 't1', 'r1')],
    )
    const issues = codesOf(doc, 'DISCONNECTED_NODE')
    expect(issues).toHaveLength(1)
    expect(issues[0].nodeId).toBe('isolated')
  })

  it('UNREACHABLE_NODE: a node connected only downstream of nothing reachable is flagged', () => {
    const { trigger, resolution } = baseline()
    const a = actionNode('a1')
    const b = actionNode('b1', {}, 500)
    // a1 -> b1 forms its own little island, never reachable from the trigger.
    const doc = makeDoc(
      [trigger, resolution, a, b],
      [edge('e1', 't1', 'r1'), edge('e2', 'a1', 'b1')],
    )
    const issues = codesOf(doc, 'UNREACHABLE_NODE')
    expect(issues.map((i) => i.nodeId).sort()).toEqual(['a1', 'b1'])
  })

  it('DEAD_END_NODE: a non-Resolution node with no outgoing edge warns', () => {
    const { trigger } = baseline()
    const a = actionNode('a1')
    const r = resolutionNode('r1')
    const doc = makeDoc([trigger, a, r], [edge('e1', 't1', 'a1'), edge('e2', 't1', 'r1')])
    const issues = codesOf(doc, 'DEAD_END_NODE')
    expect(issues).toHaveLength(1)
    expect(issues[0].nodeId).toBe('a1')
    expect(issues[0].severity).toBe('warning')
  })

  it('CONDITION_MISSING_BRANCH: a Condition missing a branch is flagged per missing handle', () => {
    const { trigger } = baseline()
    const c = conditionNode('c1')
    const t = actionNode('true-branch')
    const r = resolutionNode('r1')
    const doc = makeDoc(
      [trigger, c, t, r],
      [edge('e1', 't1', 'c1'), edge('e2', 'c1', 'true-branch', 'true'), edge('e3', 'true-branch', 'r1')],
    )
    const issues = codesOf(doc, 'CONDITION_MISSING_BRANCH')
    expect(issues).toHaveLength(1)
    expect(issues[0].nodeId).toBe('c1')
    expect(issues[0].field).toBe('false')
  })

  it('CONDITION_DUPLICATE_BRANCH: two edges on the same handle flag the extra edge', () => {
    const { trigger } = baseline()
    const c = conditionNode('c1')
    const t1 = actionNode('t1-branch')
    const t2 = actionNode('t2-branch', {}, 250)
    const f = actionNode('f-branch', {}, 260)
    const doc = makeDoc(
      [trigger, c, t1, t2, f],
      [
        edge('e1', 't1', 'c1'),
        edge('e2', 'c1', 't1-branch', 'true'),
        edge('e3', 'c1', 't2-branch', 'true'),
        edge('e4', 'c1', 'f-branch', 'false'),
      ],
    )
    const issues = codesOf(doc, 'CONDITION_DUPLICATE_BRANCH')
    expect(issues).toHaveLength(1)
    expect(issues[0].edgeId).toBe('e3')
  })

  it('CONDITION_MISSING_FIELD: an empty field on a Condition is flagged', () => {
    const { trigger, resolution } = baseline()
    const c = conditionNode('c1', { field: '' })
    const t = actionNode('t-branch')
    const doc = makeDoc(
      [trigger, c, t, resolution],
      [
        edge('e1', 't1', 'c1'),
        edge('e2', 'c1', 't-branch', 'true'),
        edge('e3', 'c1', 'r1', 'false'),
        edge('e4', 't-branch', 'r1'),
      ],
    )
    const issues = codesOf(doc, 'CONDITION_MISSING_FIELD')
    expect(issues).toHaveLength(1)
    expect(issues[0].nodeId).toBe('c1')
    expect(issues[0].field).toBe('field')
  })

  it('ACTION_MISSING_TARGET: an empty target on an Action is flagged', () => {
    const { trigger, resolution } = baseline()
    const a = actionNode('a1', { target: '' })
    const doc = makeDoc([trigger, a, resolution], [edge('e1', 't1', 'a1'), edge('e2', 'a1', 'r1')])
    const issues = codesOf(doc, 'ACTION_MISSING_TARGET')
    expect(issues).toHaveLength(1)
    expect(issues[0].field).toBe('target')
  })

  it('ACTION_INVALID_DURATION: an out-of-range duration is flagged', () => {
    const { trigger, resolution } = baseline()
    const a = actionNode('a1', { durationMs: 70_000 })
    const doc = makeDoc([trigger, a, resolution], [edge('e1', 't1', 'a1'), edge('e2', 'a1', 'r1')])
    const issues = codesOf(doc, 'ACTION_INVALID_DURATION')
    expect(issues).toHaveLength(1)
    expect(issues[0].field).toBe('durationMs')
  })

  it('APPROVAL_MISSING_ROLE: an empty approver role is flagged', () => {
    const { trigger, resolution } = baseline()
    const ap = approvalNode('ap1', { approverRole: '' })
    const doc = makeDoc([trigger, ap, resolution], [edge('e1', 't1', 'ap1'), edge('e2', 'ap1', 'r1')])
    const issues = codesOf(doc, 'APPROVAL_MISSING_ROLE')
    expect(issues).toHaveLength(1)
    expect(issues[0].field).toBe('approverRole')
  })

  it('APPROVAL_INVALID_TIMEOUT: a non-positive timeout is flagged', () => {
    const { trigger, resolution } = baseline()
    const ap = approvalNode('ap1', { timeoutMs: 0 })
    const doc = makeDoc([trigger, ap, resolution], [edge('e1', 't1', 'ap1'), edge('e2', 'ap1', 'r1')])
    const issues = codesOf(doc, 'APPROVAL_INVALID_TIMEOUT')
    expect(issues).toHaveLength(1)
    expect(issues[0].field).toBe('timeoutMs')
  })

  it('RESOLUTION_MISSING_SUMMARY: an empty summary warns, does not error', () => {
    const { trigger } = baseline()
    const r = resolutionNode('r1', { summary: '' })
    const doc = makeDoc([trigger, r], [edge('e1', 't1', 'r1')])
    const issues = codesOf(doc, 'RESOLUTION_MISSING_SUMMARY')
    expect(issues).toHaveLength(1)
    expect(issues[0].severity).toBe('warning')
  })

  it('TRIGGER_FILTER_INCOMPLETE: a filter missing a field or value is flagged', () => {
    const t = triggerNode('t1', {
      filters: [{ id: 'f1', field: '', operator: 'equals', value: 'x' }],
    })
    const r = resolutionNode('r1')
    const doc = makeDoc([t, r], [edge('e1', 't1', 'r1')])
    const issues = codesOf(doc, 'TRIGGER_FILTER_INCOMPLETE')
    expect(issues).toHaveLength(1)
    expect(issues[0].nodeId).toBe('t1')
  })

  it('does not flag a filter using "exists" with an empty value', () => {
    const t = triggerNode('t1', {
      filters: [{ id: 'f1', field: 'service', operator: 'exists', value: '' }],
    })
    const r = resolutionNode('r1')
    const doc = makeDoc([t, r], [edge('e1', 't1', 'r1')])
    expect(codesOf(doc, 'TRIGGER_FILTER_INCOMPLETE')).toHaveLength(0)
  })

  it('CYCLE_DETECTED: a multi-node loop is flagged once', () => {
    const { trigger } = baseline()
    const a = actionNode('a1')
    const b = actionNode('b1', {}, 250)
    const doc = makeDoc(
      [trigger, a, b],
      [edge('e1', 't1', 'a1'), edge('e2', 'a1', 'b1'), edge('e3', 'b1', 'a1')],
    )
    const issues = codesOf(doc, 'CYCLE_DETECTED')
    expect(issues).toHaveLength(1)
  })

  it('SELF_LOOP: an edge from a node to itself is flagged, not double-counted as a cycle', () => {
    const { trigger, resolution } = baseline()
    const a = actionNode('a1')
    const doc = makeDoc(
      [trigger, a, resolution],
      [edge('e1', 't1', 'a1'), edge('e2', 'a1', 'a1'), edge('e3', 'a1', 'r1')],
    )
    const issues = validateWorkflow(doc)
    expect(issues.filter((i) => i.code === 'SELF_LOOP')).toHaveLength(1)
    expect(issues.filter((i) => i.code === 'CYCLE_DETECTED')).toHaveLength(0)
  })

  it('MULTIPLE_OUTPUTS: a non-Condition node with more than one outgoing edge is flagged', () => {
    const { trigger } = baseline()
    const a = actionNode('a1')
    const r1 = resolutionNode('r1')
    const r2 = resolutionNode('r2', {}, 500)
    const doc = makeDoc(
      [trigger, a, r1, r2],
      [edge('e1', 't1', 'a1'), edge('e2', 'a1', 'r1'), edge('e3', 'a1', 'r2')],
    )
    const issues = codesOf(doc, 'MULTIPLE_OUTPUTS')
    expect(issues).toHaveLength(1)
    expect(issues[0].nodeId).toBe('a1')
  })

  it('orders issues errors-first, then by node position', () => {
    const t1 = triggerNode('t1')
    const t2 = triggerNode('t2', {}, 50) // MULTIPLE_TRIGGERS error at x=50
    const r = resolutionNode('r1', { summary: '' }, 10) // warning at x=10
    const doc = makeDoc([t1, t2, r], [edge('e1', 't1', 'r1')])
    const issues = validateWorkflow(doc)
    const severities = issues.map((i) => i.severity)
    const firstWarningIndex = severities.indexOf('warning')
    const lastErrorIndex = severities.lastIndexOf('error')
    expect(firstWarningIndex).toBeGreaterThan(lastErrorIndex)
  })

  it('produces stable ids across repeated calls for the same document', () => {
    const doc = makeDoc([], [])
    const first = validateWorkflow(doc).map((i) => i.id)
    const second = validateWorkflow(doc).map((i) => i.id)
    expect(first).toEqual(second)
  })

  it('demo workflow -> no errors', () => {
    const doc = createDemoWorkflow()
    const issues = validateWorkflow(doc)
    const errors = issues.filter((i) => i.severity === 'error')
    expect(errors).toEqual([])
  })

  it('demo workflow -> no issues at all', () => {
    const doc = createDemoWorkflow()
    expect(validateWorkflow(doc)).toEqual([])
  })
})
