/**
 * The simulator: a pure, synchronous, deterministic walk of the workflow
 * graph against an incident payload (ARCHITECTURE.md §4 has the full walk
 * algorithm, the "re-simulation with an accumulating decision map" pause
 * strategy for manual approvals, and the player's replay contract).
 *
 * No `Math.random`, no `Date.now`, no `setTimeout` anywhere in this file —
 * `at` on every emitted event is a simulated offset in ms from run start.
 */
import { DEFAULT_MAX_STEPS, SIMULATED_STEP_MS } from './constants'
import { evaluateCondition } from './conditions'
import { reachableFrom } from './graph'
import type {
  ApprovalConfig,
  ConditionConfig,
  ExecutionEvent,
  IncidentPayload,
  NodeRunState,
  RunStatus,
  SimulateOptions,
  SimulationResult,
  WorkflowDocument,
  WorkflowEdge,
  WorkflowNode,
} from './types'

export type { SimulateOptions, SimulationResult }

/* ------------------------------------------------------------------------ */
/* small local helpers                                                       */
/* ------------------------------------------------------------------------ */

function outgoingEdges(doc: WorkflowDocument, nodeId: string): WorkflowEdge[] {
  return doc.edges.filter((e) => e.source === nodeId)
}

function formatPayloadSummary(payload: IncidentPayload): string {
  return `${payload.title} (${payload.severity})`
}

function describeApproval(cfg: ApprovalConfig): string {
  return `${cfg.approverRole} · ${cfg.policy}`
}

/**
 * Mutable accumulator threaded through the walk. Kept internal to this
 * module; `simulate()` reads out of it to build the final `SimulationResult`.
 */
interface WalkState {
  events: ExecutionEvent[]
  clock: number
  states: Map<string, NodeRunState>
  steps: number
}

function pushEvent(walk: WalkState, event: ExecutionEvent): void {
  walk.events.push(event)
}

function setState(walk: WalkState, nodeId: string, state: NodeRunState): void {
  walk.states.set(nodeId, state)
}

/**
 * Marks every node in `nodeIds` (already resolved to a concrete set) as
 * `skipped`, emitting one `node-skipped` event per node, in the stable order
 * the nodes appear in `doc.nodes` (determinism).
 */
function skipNodes(
  doc: WorkflowDocument,
  walk: WalkState,
  nodeIds: ReadonlySet<string>,
  reason: string,
): void {
  for (const node of doc.nodes) {
    if (!nodeIds.has(node.id)) continue
    if (walk.states.get(node.id) !== undefined) continue // already resolved, don't re-skip
    setState(walk, node.id, 'skipped')
    pushEvent(walk, { kind: 'node-skipped', at: walk.clock, nodeId: node.id, reason })
  }
}

function finishRun(
  walk: WalkState,
  status: Exclude<RunStatus, 'idle' | 'running' | 'paused' | 'awaiting-approval'>,
  summary: string,
): void {
  pushEvent(walk, { kind: 'run-finished', at: walk.clock, status, summary })
}

/**
 * Runs the full walk described in ARCHITECTURE.md §4 and returns a
 * `SimulationResult`. Calling this twice with identical arguments must
 * produce byte-identical `events` (determinism is asserted in
 * `simulator.test.ts` and relied on by the approval re-simulation flow).
 */
export function simulate(
  doc: WorkflowDocument,
  payload: IncidentPayload,
  options?: SimulateOptions,
): SimulationResult {
  const decisions = options?.approvalDecisions ?? {}
  const maxSteps = options?.maxSteps ?? DEFAULT_MAX_STEPS

  const walk: WalkState = {
    events: [],
    clock: 0,
    states: new Map(),
    steps: 0,
  }

  const trigger = doc.nodes.find((n) => n.type === 'trigger')

  pushEvent(walk, { kind: 'run-started', at: walk.clock, payloadSummary: formatPayloadSummary(payload) })

  if (!trigger) {
    finishRun(walk, 'failed', 'No Trigger node found.')
    return buildResult(doc, walk)
  }

  // --- trigger: node-started, filter check, then either trigger-filtered or
  // node-finished + clock += SIMULATED_STEP_MS.trigger ----------------------
  setState(walk, trigger.id, 'running')
  pushEvent(walk, {
    kind: 'node-started',
    at: walk.clock,
    nodeId: trigger.id,
    nodeType: 'trigger',
    label: trigger.label,
  })

  const failedFilter = trigger.config.filters.find(
    (filter) =>
      !evaluateCondition(
        { field: filter.field, operator: filter.operator, value: filter.value },
        payload,
      ).result,
  )

  if (failedFilter) {
    setState(walk, trigger.id, 'success')
    pushEvent(walk, {
      kind: 'trigger-filtered',
      at: walk.clock,
      nodeId: trigger.id,
      reason: `Filter "${failedFilter.field} ${failedFilter.operator} ${failedFilter.value}" did not match.`,
    })
    const skip = new Set(doc.nodes.map((n) => n.id).filter((id) => id !== trigger.id))
    skipNodes(doc, walk, skip, 'The trigger did not match this incident.')
    finishRun(walk, 'completed', 'No node matched the incident.')
    return buildResult(doc, walk)
  }

  walk.clock += SIMULATED_STEP_MS.trigger
  setState(walk, trigger.id, 'success')
  pushEvent(walk, {
    kind: 'node-finished',
    at: walk.clock,
    nodeId: trigger.id,
    outcome: 'success',
    detail: 'Trigger matched the incident.',
  })

  let currentId: string | undefined = firstTargetOf(doc, trigger.id)
  const visited = new Set<string>([trigger.id])

  while (currentId) {
    walk.steps += 1
    if (walk.steps > maxSteps) {
      finishRun(walk, 'failed', 'Step limit reached.')
      return buildResult(doc, walk)
    }

    if (visited.has(currentId)) {
      pushEvent(walk, {
        kind: 'node-skipped',
        at: walk.clock,
        nodeId: currentId,
        reason: 'Cycle guard',
      })
      setState(walk, currentId, 'skipped')
      finishRun(walk, 'failed', 'Cycle detected — run stopped.')
      return buildResult(doc, walk)
    }
    visited.add(currentId)

    const node = doc.nodes.find((n) => n.id === currentId)
    if (!node) {
      finishRun(walk, 'failed', 'Run referenced a missing node.')
      return buildResult(doc, walk)
    }

    const outcome = stepNode(doc, payload, walk, node, decisions)
    if (outcome.terminal) {
      return buildResult(doc, walk, outcome.pendingApprovalNodeId)
    }
    currentId = outcome.nextId
  }

  // fell off the end: the last node had no outgoing edge and wasn't terminal
  finishRun(walk, 'completed', 'Path ended without a resolution.')
  return buildResult(doc, walk)
}

function firstTargetOf(doc: WorkflowDocument, nodeId: string): string | undefined {
  return outgoingEdges(doc, nodeId)[0]?.target
}

interface StepOutcome {
  terminal: boolean
  nextId?: string
  pendingApprovalNodeId?: string
}

function stepNode(
  doc: WorkflowDocument,
  payload: IncidentPayload,
  walk: WalkState,
  node: WorkflowNode,
  decisions: Record<string, 'approved' | 'rejected'>,
): StepOutcome {
  switch (node.type) {
    case 'condition':
      return stepCondition(doc, payload, walk, node.id, node.label, node.config)
    case 'action': {
      setState(walk, node.id, 'running')
      pushEvent(walk, {
        kind: 'node-started',
        at: walk.clock,
        nodeId: node.id,
        nodeType: 'action',
        label: node.label,
      })
      walk.clock += node.config.durationMs
      const failed = node.config.simulateFailure
      setState(walk, node.id, failed ? 'failed' : 'success')
      pushEvent(walk, {
        kind: 'node-finished',
        at: walk.clock,
        nodeId: node.id,
        outcome: failed ? 'failed' : 'success',
        detail: failed
          ? `${node.config.action} on ${node.config.target} failed.`
          : `${node.config.action} on ${node.config.target} succeeded.`,
      })
      if (failed && !node.config.continueOnFailure) {
        const next = firstTargetOf(doc, node.id)
        if (next) skipNodes(doc, walk, reachableFrom(doc, next), 'Run failed before reaching this node.')
        finishRun(walk, 'failed', `${node.label} failed.`)
        return { terminal: true }
      }
      const nextId = firstTargetOf(doc, node.id)
      if (!nextId) {
        finishRun(walk, 'completed', 'Path ended without a resolution.')
        return { terminal: true }
      }
      return { terminal: false, nextId }
    }
    case 'approval':
      return stepApproval(doc, walk, node.id, node.label, node.config, decisions)
    case 'resolution': {
      setState(walk, node.id, 'running')
      pushEvent(walk, {
        kind: 'node-started',
        at: walk.clock,
        nodeId: node.id,
        nodeType: 'resolution',
        label: node.label,
      })
      walk.clock += SIMULATED_STEP_MS.resolution
      setState(walk, node.id, 'success')
      pushEvent(walk, {
        kind: 'node-finished',
        at: walk.clock,
        nodeId: node.id,
        outcome: 'success',
        detail: node.config.summary || `Resolution: ${node.config.status}.`,
      })
      finishRun(walk, 'completed', node.config.status)
      return { terminal: true }
    }
    case 'trigger':
      // A trigger can never be reached mid-walk (validation forbids incoming
      // edges into a trigger); defensively treat it as a dead end.
      finishRun(walk, 'failed', 'Encountered an unexpected second Trigger node.')
      return { terminal: true }
    default: {
      const exhaustive: never = node
      throw new Error(`Unhandled node type: ${String(exhaustive)}`)
    }
  }
}

function stepCondition(
  doc: WorkflowDocument,
  payload: IncidentPayload,
  walk: WalkState,
  nodeId: string,
  label: string,
  config: ConditionConfig,
): StepOutcome {
  setState(walk, nodeId, 'running')
  pushEvent(walk, { kind: 'node-started', at: walk.clock, nodeId, nodeType: 'condition', label })
  walk.clock += SIMULATED_STEP_MS.condition

  const { result, explanation } = evaluateCondition(config, payload)
  const branch = result ? 'true' : 'false'
  const edges = outgoingEdges(doc, nodeId)
  const takenEdge = edges.find((e) => e.sourceHandle === branch)
  const otherEdge = edges.find((e) => e.sourceHandle === (branch === 'true' ? 'false' : 'true'))

  if (takenEdge) {
    pushEvent(walk, {
      kind: 'branch-decided',
      at: walk.clock,
      nodeId,
      edgeId: takenEdge.id,
      branch,
      expression: explanation,
      result,
    })
  }

  setState(walk, nodeId, 'success')
  pushEvent(walk, {
    kind: 'node-finished',
    at: walk.clock,
    nodeId,
    outcome: 'success',
    detail: `${explanation} -> ${branch}`,
  })

  if (otherEdge) {
    const takenReachable = takenEdge ? reachableFrom(doc, takenEdge.target) : new Set<string>()
    const otherReachable = reachableFrom(doc, otherEdge.target)
    const exclusive = new Set([...otherReachable].filter((id) => !takenReachable.has(id)))
    skipNodes(doc, walk, exclusive, 'Not on the taken branch.')
  }

  if (!takenEdge) {
    finishRun(walk, 'completed', 'Path ended without a resolution.')
    return { terminal: true }
  }

  return { terminal: false, nextId: takenEdge.target }
}

function stepApproval(
  doc: WorkflowDocument,
  walk: WalkState,
  nodeId: string,
  label: string,
  config: ApprovalConfig,
  decisions: Record<string, 'approved' | 'rejected'>,
): StepOutcome {
  setState(walk, nodeId, 'running')
  pushEvent(walk, { kind: 'node-started', at: walk.clock, nodeId, nodeType: 'approval', label })

  if (config.policy === 'auto-approve' || config.policy === 'auto-reject') {
    walk.clock += SIMULATED_STEP_MS.approvalAuto
    const decision = config.policy === 'auto-approve' ? 'approved' : 'rejected'
    pushEvent(walk, {
      kind: 'approval-resolved',
      at: walk.clock,
      nodeId,
      decision,
      via: config.policy,
    })
    return finishApprovalStep(doc, walk, nodeId, label, decision)
  }

  // manual — always emits `approval-requested` first (whether or not a
  // decision is already known) so that re-simulating after a decision is
  // recorded produces an event list whose prefix is byte-identical to the
  // paused run's (ARCHITECTURE.md §4's re-simulation invariant).
  pushEvent(walk, {
    kind: 'approval-requested',
    at: walk.clock,
    nodeId,
    approverRole: config.approverRole,
    prompt: config.prompt || describeApproval(config),
  })

  const decided = decisions[nodeId]
  if (!decided) {
    setState(walk, nodeId, 'awaiting-approval')
    return { terminal: true, pendingApprovalNodeId: nodeId }
  }

  walk.clock += SIMULATED_STEP_MS.approvalManualDecided
  pushEvent(walk, {
    kind: 'approval-resolved',
    at: walk.clock,
    nodeId,
    decision: decided,
    via: 'manual',
  })
  return finishApprovalStep(doc, walk, nodeId, label, decided)
}

function finishApprovalStep(
  doc: WorkflowDocument,
  walk: WalkState,
  nodeId: string,
  label: string,
  decision: 'approved' | 'rejected',
): StepOutcome {
  const approved = decision === 'approved'
  setState(walk, nodeId, approved ? 'success' : 'failed')
  pushEvent(walk, {
    kind: 'node-finished',
    at: walk.clock,
    nodeId,
    outcome: approved ? 'success' : 'failed',
    detail: approved ? 'Approved.' : 'Rejected.',
  })

  if (!approved) {
    const next = firstTargetOf(doc, nodeId)
    if (next) skipNodes(doc, walk, reachableFrom(doc, next), 'Run rejected before reaching this node.')
    finishRun(walk, 'rejected', `${label} was rejected.`)
    return { terminal: true }
  }

  const nextId = firstTargetOf(doc, nodeId)
  if (!nextId) {
    finishRun(walk, 'completed', 'Path ended without a resolution.')
    return { terminal: true }
  }
  return { terminal: false, nextId }
}

function buildResult(
  doc: WorkflowDocument,
  walk: WalkState,
  pendingApprovalNodeId?: string,
): SimulationResult {
  const finalNodeStates: Record<string, NodeRunState> = {}
  for (const node of doc.nodes) {
    finalNodeStates[node.id] = walk.states.get(node.id) ?? 'idle'
  }

  const last = walk.events[walk.events.length - 1]
  const status: RunStatus =
    last?.kind === 'run-finished'
      ? last.status
      : pendingApprovalNodeId
        ? 'awaiting-approval'
        : 'running'

  return {
    events: walk.events,
    status,
    pendingApprovalNodeId,
    finalNodeStates,
    totalDurationMs: walk.clock,
  }
}

/**
 * Pure reducer: applies one `ExecutionEvent` to a `nodeStates` map, returning
 * a new map. Shared between `simulate()` (to build `finalNodeStates`) and
 * the run store's player (to derive live state as events are replayed), so
 * the UI and the domain can never disagree about what a state transition
 * means.
 */
export function applyEventToStates(
  states: Record<string, NodeRunState>,
  event: SimulationResult['events'][number],
): Record<string, NodeRunState> {
  switch (event.kind) {
    case 'run-started':
    case 'branch-decided':
    case 'approval-resolved':
      return states
    case 'node-started':
      return { ...states, [event.nodeId]: 'running' }
    case 'node-finished':
      return { ...states, [event.nodeId]: event.outcome === 'success' ? 'success' : 'failed' }
    case 'node-skipped':
      return { ...states, [event.nodeId]: 'skipped' }
    case 'approval-requested':
      return { ...states, [event.nodeId]: 'awaiting-approval' }
    case 'trigger-filtered':
      return { ...states, [event.nodeId]: 'success' }
    case 'run-finished':
      return states
    default: {
      const exhaustive: never = event
      throw new Error(`Unhandled event kind: ${String((exhaustive as { kind: string }).kind)}`)
    }
  }
}
