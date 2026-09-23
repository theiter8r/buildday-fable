/**
 * Per-node-type metadata: everything the palette, node cards and inspector
 * need to describe a node type without hard-coding strings in every UI
 * component. Pure data — no React imports — so this stays in the domain
 * lane; `icon` is a *name* (matching an export in `src/components/icons`),
 * not a component, keeping this file JSX-free.
 */
import type {
  ActionConfig,
  ActionKind,
  ApprovalConfig,
  ConditionConfig,
  NodeType,
  ResolutionConfig,
  TriggerConfig,
} from './types'

// `NODE_TYPES` itself lives in `./types` (see the DECISION note above) and
// is already re-exported by `domain/index.ts`; it is not re-exported again
// here to avoid a duplicate-export collision in the barrel.

/** Name of an icon exported from `src/components/icons/index.tsx`. */
export type IconName =
  | 'TriggerIcon'
  | 'ConditionIcon'
  | 'ActionIcon'
  | 'ApprovalIcon'
  | 'ResolutionIcon'

/** CSS custom-property name (without the `var()` wrapper) for a type's accent color. */
export type AccentToken =
  | '--color-node-trigger'
  | '--color-node-condition'
  | '--color-node-action'
  | '--color-node-approval'
  | '--color-node-resolution'

/** Static description of one node type, independent of any particular node instance. */
export interface NodeTypeMeta {
  type: NodeType
  label: string
  description: string
  accent: AccentToken
  icon: IconName
}

/** Metadata for every node type, keyed by `NodeType`, in palette display order. */
export const NODE_DEFS: Record<NodeType, NodeTypeMeta> = {
  trigger: {
    type: 'trigger',
    label: 'Trigger',
    description: 'Where an incident enters the workflow, with optional filters.',
    accent: '--color-node-trigger',
    icon: 'TriggerIcon',
  },
  condition: {
    type: 'condition',
    label: 'Condition',
    description: 'Branches the run true/false based on a field in the incident payload.',
    accent: '--color-node-condition',
    icon: 'ConditionIcon',
  },
  action: {
    type: 'action',
    label: 'Action',
    description: 'Performs a simulated operational action, e.g. paging on-call.',
    accent: '--color-node-action',
    icon: 'ActionIcon',
  },
  approval: {
    type: 'approval',
    label: 'Approval',
    description: 'Pauses for a human decision, or resolves automatically per policy.',
    accent: '--color-node-approval',
    icon: 'ApprovalIcon',
  },
  resolution: {
    type: 'resolution',
    label: 'Resolution',
    description: 'Ends the run with a status and an optional postmortem requirement.',
    accent: '--color-node-resolution',
    icon: 'ResolutionIcon',
  },
}

/** Human label + icon per `ActionKind`, for the Action inspector and node card. */
export const ACTION_KIND_META: Record<ActionKind, { label: string; icon: string }> = {
  'page-oncall': { label: 'Page on-call', icon: 'pager' },
  'post-slack': { label: 'Post to Slack', icon: 'slack' },
  'create-ticket': { label: 'Create ticket', icon: 'ticket' },
  'rollback-deploy': { label: 'Rollback deploy', icon: 'rollback' },
  'scale-service': { label: 'Scale service', icon: 'scale' },
  'run-runbook': { label: 'Run runbook', icon: 'runbook' },
}

/** Sensible default config for a freshly-created node of a given type. */
export const DEFAULT_CONFIG: {
  trigger: TriggerConfig
  condition: ConditionConfig
  action: ActionConfig
  approval: ApprovalConfig
  resolution: ResolutionConfig
} = {
  trigger: {
    source: 'pagerduty',
    filters: [],
    description: 'Any incident from PagerDuty.',
  },
  condition: {
    field: 'severity',
    operator: 'equals',
    value: 'critical',
  },
  action: {
    action: 'page-oncall',
    target: 'sre-primary',
    durationMs: 1200,
    simulateFailure: false,
    continueOnFailure: false,
  },
  approval: {
    approverRole: 'incident-commander',
    timeoutMs: 300000,
    policy: 'manual',
    prompt: 'Approve the rollback?',
  },
  resolution: {
    status: 'resolved',
    postmortemRequired: false,
    summary: '',
  },
}
