/**
 * `validateWorkflow` runs on every document change and produces the single
 * source of issues rendered by the Issue panel, node badges and the Run
 * button's disabled reason (ARCHITECTURE.md §6 has the full code table and
 * message copy — implement against that table exactly, including the
 * `id` stability contract below).
 *
 * STUB — owned by Lane A (domain). Throws until implemented.
 */
import type { ValidationIssue, WorkflowDocument } from './types'

/**
 * Returns every validation issue for `doc`. Errors (see `IssueSeverity`)
 * block Run; warnings do not. Each issue's `id` must be stable across calls
 * for an unchanged underlying problem
 * (`${code}:${nodeId ?? edgeId ?? 'graph'}:${field ?? ''}`) so the panel and
 * any animation keyed on it doesn't thrash.
 */
export function validateWorkflow(_doc: WorkflowDocument): ValidationIssue[] {
  throw new Error('not implemented')
}
