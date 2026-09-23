/**
 * OpsFlow domain types.
 *
 * This module is pure TypeScript: it must never import React, Zustand or
 * `@xyflow/react`. Every other lane (canvas/app/panels/store) depends on the
 * shapes declared here and nowhere else — do not duplicate these types.
 *
 * Zod mirrors of these types live in `./schema.ts`; the runtime values are
 * `z.infer`'d from those schemas so the static types and the runtime
 * validators can never drift apart (see schema.ts for the single source of
 * truth on shape + constraints).
 *
 * DECISION (ambiguity in ARCHITECTURE.md §3 vs. the task brief): the task
 * brief asks for `NODE_TYPES` and "per-type metadata (label, description,
 * accent token name, icon name)" to live in this file, while
 * ARCHITECTURE.md §2 assigns that responsibility to `nodeDefs.ts`. Resolved
 * as: `NODE_TYPES` (the ordered const array of node type ids) lives here,
 * next to the `NodeType` union it enumerates, because it is a type-level
 * fact. The richer per-type metadata record (`NODE_DEFS`) — which needs the
 * icon components from `src/components/icons` — lives in `nodeDefs.ts` so
 * this file stays free of any indirect UI-adjacent imports. `nodeDefs.ts`
 * re-exports `NODE_TYPES` for convenience.
 */

/* ---------------------------------------------------------------------- */
/* Incident payload                                                       */
/* ---------------------------------------------------------------------- */

/** Incident severity as reported by the trigger source. */
export type Severity = 'critical' | 'high' | 'medium' | 'low'

/** Ordered list of every severity, for selects and validation messages. */
export const SEVERITIES: readonly Severity[] = ['critical', 'high', 'medium', 'low']

/**
 * The incident that a workflow run is simulated against. Edited via the
 * payload editor (form + JSON) and addressable by dot-path in Condition and
 * Trigger-filter config (e.g. `metadata.cluster`, `tags.0`).
 */
export interface IncidentPayload {
  title: string
  severity: Severity
  service: string
  /** 0..1 fraction, e.g. 0.42 for 42%. */
  errorRate: number
  region: string
  affectedUsers: number
  source: string
  tags: string[]
  /** ISO 8601 timestamp, editable in the payload editor. */
  detectedAt: string
  /** Free-form, dot-path addressable extra fields. */
  metadata: Record<string, string | number | boolean>
}

/* ---------------------------------------------------------------------- */
/* Node types                                                              */
/* ---------------------------------------------------------------------- */

/** The five node kinds a workflow graph can be built from. */
export type NodeType = 'trigger' | 'condition' | 'action' | 'approval' | 'resolution'

/** Ordered list of every node type, driving the palette and iteration order. */
export const NODE_TYPES: readonly NodeType[] = [
  'trigger',
  'condition',
  'action',
  'approval',
  'resolution',
]

/** Comparison operators available to Condition config and Trigger filters. */
export type Operator =
  | 'equals'
  | 'not-equals'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'in'
  | 'exists'

/** Ordered list of every operator, for selects and the validation matrix. */
export const OPERATORS: readonly Operator[] = [
  'equals',
  'not-equals',
  'gt',
  'gte',
  'lt',
  'lte',
  'contains',
  'in',
  'exists',
]

/** One field/operator/value test inside a Trigger's filter list. */
export interface FilterRule {
  id: string
  field: string
  operator: Operator
  /** Always stored as a string; coercion happens per-operator (see conditions.ts). */
  value: string
}

/** Config for a Trigger node: incident source + filters, ALL of which must match. */
export interface TriggerConfig {
  source: 'pagerduty' | 'datadog' | 'sentry' | 'cloudwatch' | 'manual' | 'webhook'
  filters: FilterRule[]
  description: string
}

/** Config for a Condition node: a single field/operator/value test on the payload. */
export interface ConditionConfig {
  field: string
  operator: Operator
  value: string
}

/** The six simulated action kinds an Action node can perform. */
export type ActionKind =
  | 'page-oncall'
  | 'post-slack'
  | 'create-ticket'
  | 'rollback-deploy'
  | 'scale-service'
  | 'run-runbook'

/** Ordered list of every action kind, for selects. */
export const ACTION_KINDS: readonly ActionKind[] = [
  'page-oncall',
  'post-slack',
  'create-ticket',
  'rollback-deploy',
  'scale-service',
  'run-runbook',
]

/** Config for an Action node. */
export interface ActionConfig {
  action: ActionKind
  /** Channel, rota or service name, e.g. `#incidents`, `sre-primary`. */
  target: string
  /** Simulated duration in milliseconds, 0..60000. */
  durationMs: number
  /** Forces this node to finish `failed` in the simulation. */
  simulateFailure: boolean
  /** When true, a failure does not stop the run. */
  continueOnFailure: boolean
}

/** Simulation policy for an Approval node's gate. */
export type ApprovalPolicy = 'manual' | 'auto-approve' | 'auto-reject'

/** Ordered list of every approval policy, for the inspector's radio group. */
export const APPROVAL_POLICIES: readonly ApprovalPolicy[] = [
  'manual',
  'auto-approve',
  'auto-reject',
]

/** Config for an Approval node: who approves, how long, and how the sim resolves it. */
export interface ApprovalConfig {
  approverRole: string
  /** Simulated wait budget in milliseconds. */
  timeoutMs: number
  policy: ApprovalPolicy
  prompt: string
}

/** Terminal status recorded by a Resolution node. */
export type ResolutionStatus = 'resolved' | 'mitigated' | 'escalated'

/** Ordered list of every resolution status, for the inspector select. */
export const RESOLUTION_STATUSES: readonly ResolutionStatus[] = [
  'resolved',
  'mitigated',
  'escalated',
]

/** Config for a Resolution node: how the incident ended. */
export interface ResolutionConfig {
  status: ResolutionStatus
  postmortemRequired: boolean
  summary: string
}

/** 2D canvas position. */
export interface XY {
  x: number
  y: number
}

interface NodeBase<T extends NodeType, C> {
  id: string
  type: T
  label: string
  notes?: string
  position: XY
  config: C
}

/** The discriminated union of every node that can appear on the canvas. */
export type WorkflowNode =
  | NodeBase<'trigger', TriggerConfig>
  | NodeBase<'condition', ConditionConfig>
  | NodeBase<'action', ActionConfig>
  | NodeBase<'approval', ApprovalConfig>
  | NodeBase<'resolution', ResolutionConfig>

/** Narrows `WorkflowNode` to a single type, e.g. `NodeOfType<'action'>`. */
export type NodeOfType<T extends NodeType> = Extract<WorkflowNode, { type: T }>
/** The config shape belonging to a given node type. */
export type ConfigOfType<T extends NodeType> = NodeOfType<T>['config']

/* ---------------------------------------------------------------------- */
/* Edges / document                                                        */
/* ---------------------------------------------------------------------- */

/** The two labelled output handles a Condition node exposes. */
export type BranchHandle = 'true' | 'false'

/** A directed connection between two nodes. */
export interface WorkflowEdge {
  id: string
  source: string
  target: string
  /** Non-null only when `source` is a Condition node. */
  sourceHandle?: BranchHandle | null
  label?: string
}

/** The full persisted/undoable unit of a workflow. */
export interface WorkflowDocument {
  /** Equal to `SCHEMA_VERSION` (see constants.ts) whenever held in memory. */
  schemaVersion: number
  id: string
  name: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  /** ISO 8601 timestamp of the last mutation. */
  updatedAt: string
}

/* ---------------------------------------------------------------------- */
/* Validation                                                              */
/* ---------------------------------------------------------------------- */

/** Whether a validation issue blocks Run (`error`) or merely warns. */
export type IssueSeverity = 'error' | 'warning'

/** Every validation issue code the validator can produce. */
export type ValidationCode =
  | 'NO_TRIGGER'
  | 'MULTIPLE_TRIGGERS'
  | 'TRIGGER_HAS_INPUT'
  | 'NO_RESOLUTION'
  | 'NO_REACHABLE_RESOLUTION'
  | 'DISCONNECTED_NODE'
  | 'UNREACHABLE_NODE'
  | 'DEAD_END_NODE'
  | 'CONDITION_MISSING_BRANCH'
  | 'CONDITION_DUPLICATE_BRANCH'
  | 'CONDITION_MISSING_FIELD'
  | 'ACTION_MISSING_TARGET'
  | 'ACTION_INVALID_DURATION'
  | 'APPROVAL_MISSING_ROLE'
  | 'APPROVAL_INVALID_TIMEOUT'
  | 'RESOLUTION_MISSING_SUMMARY'
  | 'TRIGGER_FILTER_INCOMPLETE'
  | 'CYCLE_DETECTED'
  | 'MULTIPLE_OUTPUTS'
  | 'SELF_LOOP'
  | 'EMPTY_WORKFLOW'

/** One row in the validation panel, keyed stably so re-runs don't thrash the list. */
export interface ValidationIssue {
  /** Stable: `${code}:${nodeId ?? edgeId ?? 'graph'}:${field ?? ''}`. */
  id: string
  severity: IssueSeverity
  code: ValidationCode
  /** Human, imperative, e.g. "Condition needs a field to test." */
  message: string
  nodeId?: string
  edgeId?: string
  /** Inspector field name to focus when the issue row is clicked. */
  field?: string
}

/* ---------------------------------------------------------------------- */
/* Execution                                                               */
/* ---------------------------------------------------------------------- */

/** The visual/simulated state of a node during a run. */
export type NodeRunState =
  | 'idle'
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'skipped'
  | 'awaiting-approval'

/** The overall status of a simulated run. */
export type RunStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'awaiting-approval'
  | 'completed'
  | 'failed'
  | 'rejected'
  | 'cancelled'

/**
 * One entry in a run's replay log. `at` is always a simulated offset in
 * milliseconds from run start — never a wall-clock timestamp. The UI renders
 * `new Date(runStartedAtWallClock + event.at)` for display.
 */
export type ExecutionEvent =
  | { kind: 'run-started'; at: number; nodeId?: never; payloadSummary: string }
  | { kind: 'node-started'; at: number; nodeId: string; nodeType: NodeType; label: string }
  | {
      kind: 'node-finished'
      at: number
      nodeId: string
      outcome: 'success' | 'failed'
      detail: string
    }
  | { kind: 'node-skipped'; at: number; nodeId: string; reason: string }
  | {
      kind: 'branch-decided'
      at: number
      nodeId: string
      edgeId: string
      branch: BranchHandle
      expression: string
      result: boolean
    }
  | { kind: 'approval-requested'; at: number; nodeId: string; approverRole: string; prompt: string }
  | {
      kind: 'approval-resolved'
      at: number
      nodeId: string
      decision: 'approved' | 'rejected'
      via: 'manual' | 'auto-approve' | 'auto-reject' | 'timeout'
    }
  | { kind: 'trigger-filtered'; at: number; nodeId: string; reason: string }
  | {
      kind: 'run-finished'
      at: number
      status: Exclude<RunStatus, 'idle' | 'running' | 'paused' | 'awaiting-approval'>
      summary: string
    }

/** Union of every `ExecutionEvent`'s `kind` discriminant. */
export type ExecutionEventKind = ExecutionEvent['kind']

/** A user's Approve/Reject click on a manual Approval gate. */
export type ApprovalDecision = 'approved' | 'rejected'

/** Options accepted by `simulate()`. */
export interface SimulateOptions {
  /** nodeId -> decision, accumulated across re-simulations after each approval. */
  approvalDecisions?: Record<string, ApprovalDecision>
  /** Hard stop against pathological/cyclic graphs. Default 500. */
  maxSteps?: number
}

/** The full, pure result of one `simulate()` call. */
export interface SimulationResult {
  events: ExecutionEvent[]
  /** `'awaiting-approval'` when the walk stopped at a manual gate. */
  status: RunStatus
  pendingApprovalNodeId?: string
  finalNodeStates: Record<string, NodeRunState>
  totalDurationMs: number
}

/**
 * A single point-in-time view of a run, used by the player to drive the
 * canvas and timeline off `events[0..cursor]` without re-deriving state.
 */
export interface RunSnapshot {
  status: RunStatus
  cursor: number
  events: ExecutionEvent[]
  nodeStates: Record<string, NodeRunState>
  pendingApprovalNodeId?: string
}
