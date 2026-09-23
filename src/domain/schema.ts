/**
 * Zod schemas mirroring `types.ts`. This is the single source of truth for
 * runtime shape validation — every static type in `types.ts` should be
 * structurally assignable from `z.infer<typeof theMatchingSchema>`.
 *
 * Used by: `io.ts` (import), `persistence.ts` (boot-time load),
 * `migrations.ts` (post-migration final check), and the payload editor's
 * JSON mode (live "Valid payload" / error status line).
 */
import { z } from 'zod'
import type { WorkflowDocument, IncidentPayload } from './types'

// `SCHEMA_VERSION` lives in `./constants` and is re-exported by
// `domain/index.ts`; not re-exported here to avoid a duplicate-export
// collision in the barrel (see the note in `nodeDefs.ts`).

export const severitySchema = z.enum(['critical', 'high', 'medium', 'low'])

export const operatorSchema = z.enum([
  'equals',
  'not-equals',
  'gt',
  'gte',
  'lt',
  'lte',
  'contains',
  'in',
  'exists',
])

export const filterRuleSchema = z.object({
  id: z.string().min(1),
  field: z.string(),
  operator: operatorSchema,
  value: z.string(),
})

export const triggerConfigSchema = z.object({
  source: z.enum(['pagerduty', 'datadog', 'sentry', 'cloudwatch', 'manual', 'webhook']),
  filters: z.array(filterRuleSchema),
  description: z.string(),
})

export const conditionConfigSchema = z.object({
  field: z.string(),
  operator: operatorSchema,
  value: z.string(),
})

export const actionKindSchema = z.enum([
  'page-oncall',
  'post-slack',
  'create-ticket',
  'rollback-deploy',
  'scale-service',
  'run-runbook',
])

export const actionConfigSchema = z.object({
  action: actionKindSchema,
  target: z.string(),
  durationMs: z.number().min(0).max(60000),
  simulateFailure: z.boolean(),
  continueOnFailure: z.boolean(),
})

export const approvalPolicySchema = z.enum(['manual', 'auto-approve', 'auto-reject'])

export const approvalConfigSchema = z.object({
  approverRole: z.string(),
  timeoutMs: z.number().min(0),
  policy: approvalPolicySchema,
  prompt: z.string(),
})

export const resolutionStatusSchema = z.enum(['resolved', 'mitigated', 'escalated'])

export const resolutionConfigSchema = z.object({
  status: resolutionStatusSchema,
  postmortemRequired: z.boolean(),
  summary: z.string(),
})

export const xySchema = z.object({ x: z.number(), y: z.number() })

const nodeBase = {
  id: z.string().min(1),
  label: z.string(),
  notes: z.string().optional(),
  position: xySchema,
}

export const triggerNodeSchema = z.object({
  ...nodeBase,
  type: z.literal('trigger'),
  config: triggerConfigSchema,
})

export const conditionNodeSchema = z.object({
  ...nodeBase,
  type: z.literal('condition'),
  config: conditionConfigSchema,
})

export const actionNodeSchema = z.object({
  ...nodeBase,
  type: z.literal('action'),
  config: actionConfigSchema,
})

export const approvalNodeSchema = z.object({
  ...nodeBase,
  type: z.literal('approval'),
  config: approvalConfigSchema,
})

export const resolutionNodeSchema = z.object({
  ...nodeBase,
  type: z.literal('resolution'),
  config: resolutionConfigSchema,
})

export const workflowNodeSchema = z.discriminatedUnion('type', [
  triggerNodeSchema,
  conditionNodeSchema,
  actionNodeSchema,
  approvalNodeSchema,
  resolutionNodeSchema,
])

export const branchHandleSchema = z.enum(['true', 'false'])

export const workflowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: branchHandleSchema.nullable().optional(),
  label: z.string().optional(),
})

export const workflowDocumentSchema = z.object({
  schemaVersion: z.number(),
  id: z.string().min(1),
  name: z.string(),
  nodes: z.array(workflowNodeSchema),
  edges: z.array(workflowEdgeSchema),
  updatedAt: z.string(),
})

export const incidentPayloadSchema = z.object({
  title: z.string(),
  severity: severitySchema,
  service: z.string(),
  errorRate: z.number().min(0).max(1),
  region: z.string(),
  affectedUsers: z.number().min(0),
  source: z.string(),
  tags: z.array(z.string()),
  detectedAt: z.string(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
})

/** The result of parsing an unknown value into a `WorkflowDocument`. */
export type ParseWorkflowResult =
  | { ok: true; doc: WorkflowDocument }
  | { ok: false; errors: string[] }

/**
 * Parses and validates an unknown value as a `WorkflowDocument`, formatting
 * any zod issues into readable `path — message` strings (see
 * `formatZodIssues` in `io.ts` for the richer, dialog-facing variant used on
 * import).
 */
export function parseWorkflowDocument(json: unknown): ParseWorkflowResult {
  const result = workflowDocumentSchema.safeParse(json)
  if (result.success) {
    return { ok: true, doc: result.data as WorkflowDocument }
  }
  return { ok: false, errors: formatIssues(result.error.issues) }
}

/** The result of parsing an unknown value into an `IncidentPayload`. */
export type ParsePayloadResult =
  | { ok: true; payload: IncidentPayload }
  | { ok: false; errors: string[] }

/** Parses and validates an unknown value as an `IncidentPayload`. */
export function parseIncidentPayload(json: unknown): ParsePayloadResult {
  const result = incidentPayloadSchema.safeParse(json)
  if (result.success) {
    return { ok: true, payload: result.data as IncidentPayload }
  }
  return { ok: false, errors: formatIssues(result.error.issues) }
}

function formatIssues(issues: readonly { path: PropertyKey[]; message: string }[]): string[] {
  return issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)'
    return `${path} — ${issue.message}`
  })
}
