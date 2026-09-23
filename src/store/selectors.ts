/**
 * Read-only selectors derived from other slices (`DerivedSlice`,
 * ARCHITECTURE.md §6). Kept as plain functions over a `WorkflowDocument`/a
 * narrow slice of `OpsflowStore` — rather than store actions — so they are
 * trivially unit-testable and so `workflowStore.ts` can call them both to
 * seed `issues`/`runDisabledReason` and to gate `start()`.
 */
import { validateWorkflow } from '@/domain'
import type { RunStatus, ValidationIssue, WorkflowDocument } from '@/domain/types'

/**
 * Memoizes `validateWorkflow` on the last `WorkflowDocument` reference seen —
 * `document` is only ever replaced (never mutated) by this store, so
 * reference equality is a correct cache key. This is the "validation cache
 * selector" the store's `issues` field is kept in sync with (see
 * `workflowStore.ts`'s `syncDerived`), and it also backs
 * `selectRunDisabledReason` without re-running validation twice per commit.
 */
export function selectValidationIssues(doc: WorkflowDocument): ValidationIssue[] {
  if (cache && cache.doc === doc) return cache.issues
  let issues: ValidationIssue[]
  try {
    issues = validateWorkflow(doc)
  } catch (error) {
    // Defensive only: `validateWorkflow` (domain lane) is documented to
    // never throw. This guard exists so a bug there degrades to "no known
    // issues" (Run stays enabled) instead of crashing every store
    // subscriber — surfaced loudly in dev via console.error rather than
    // silently swallowed.
    if (import.meta.env.DEV) console.error('validateWorkflow threw; treating as no issues', error)
    issues = []
  }
  cache = { doc, issues }
  return issues
}

let cache: { doc: WorkflowDocument; issues: ValidationIssue[] } | null = null

/** The narrow slice `selectRunDisabledReason` needs — deliberately not the whole `OpsflowStore`. */
export interface RunDisabledInput {
  document: WorkflowDocument
  status: RunStatus
}

/**
 * `null` when Run is enabled; otherwise the human reason shown on the
 * disabled Run button and read by its `aria-describedby` live region
 * (ARCHITECTURE.md §6: `"Can't run: 3 issues to fix"`).
 */
export function selectRunDisabledReason(state: RunDisabledInput): string | null {
  if (state.status === 'running') return 'A run is already in progress.'
  if (state.status === 'awaiting-approval') return 'Resolve the pending approval to continue.'
  const errorCount = selectValidationIssues(state.document).filter(
    (issue) => issue.severity === 'error',
  ).length
  if (errorCount === 0) return null
  return `Can't run: ${errorCount} issue${errorCount === 1 ? '' : 's'} to fix`
}
