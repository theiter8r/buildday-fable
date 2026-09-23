/**
 * Small display-label lookups the node cards need but that don't have a
 * matching entry in docs/CONTENT.md (CONTENT.md's `inspector.trigger.source.*`
 * covers `pagerduty`/`datadog`/`manual`/`synthetic`, while the domain's
 * `TriggerConfig.source` union also allows `sentry`/`cloudwatch`/`webhook` —
 * see docs/lane-notes/canvas.md). Kept short and local rather than invented
 * as new CONTENT.md keys, since this lane doesn't own that file.
 */
import type { ActionKind, Operator } from '@/domain/types'

export const TRIGGER_SOURCE_LABEL: Record<string, string> = {
  pagerduty: 'PagerDuty',
  datadog: 'Datadog',
  sentry: 'Sentry',
  cloudwatch: 'CloudWatch',
  manual: 'Manual report',
  webhook: 'Webhook',
}

/** Mirrors docs/CONTENT.md `inspector.condition.operator.option.*`, condensed for the node card summary. */
export const OPERATOR_LABEL: Record<Operator, string> = {
  equals: 'equals',
  'not-equals': 'does not equal',
  gt: 'is greater than',
  gte: 'is at least',
  lt: 'is less than',
  lte: 'is at most',
  contains: 'contains',
  in: 'is one of',
  exists: 'exists',
}

/** Mirrors docs/CONTENT.md `inspector.action.type.option.*`. */
export const ACTION_KIND_LABEL: Record<ActionKind, string> = {
  'page-oncall': 'Page on-call',
  'post-slack': 'Post to Slack',
  'create-ticket': 'Create ticket',
  'rollback-deploy': 'Rollback deploy',
  'scale-service': 'Scale service',
  'run-runbook': 'Run runbook',
}

/** Mirrors docs/CONTENT.md `inspector.approval.approverRole.option.*` where the stored role matches a known key. */
export const APPROVER_ROLE_LABEL: Record<string, string> = {
  'incident-commander': 'Incident commander',
  'sre-lead': 'SRE lead',
  'eng-manager': 'Engineering manager',
  security: 'Security',
}

/** Mirrors docs/CONTENT.md `inspector.resolution.status.option.*`. */
export const RESOLUTION_STATUS_LABEL: Record<string, string> = {
  resolved: 'Resolved',
  mitigated: 'Mitigated',
  escalated: 'Escalated',
}

export function formatDurationMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const seconds = ms / 1000
  return `${seconds % 1 === 0 ? seconds.toFixed(0) : seconds.toFixed(1)}s`
}

export function formatTimeoutMs(ms: number): string {
  const minutes = Math.round(ms / 60000)
  return `${minutes} min`
}
