/**
 * Import/export of a `WorkflowDocument` as JSON (ARCHITECTURE.md §9).
 *
 * DECISION: the task brief names this module `transfer.ts` with
 * `exportWorkflowJson`/`buildExportFilename`/`importWorkflowJson`;
 * ARCHITECTURE.md §2 places the same responsibility in `io.ts` with
 * `exportWorkflow`/`importWorkflow`. Resolved in favour of ARCHITECTURE.md's
 * file name and shape (it is the document every lane was told is
 * authoritative for names/locations), and the two task-brief names that
 * don't already exist elsewhere — `buildExportFilename` — are kept as a
 * named export here too, since the filename-building logic is genuinely a
 * separable, testable unit.
 */
import { migrate } from './migrations'
import { workflowDocumentSchema } from './schema'
import type { WorkflowDocument } from './types'

function slug(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s || 'workflow'
}

function timestampSuffix(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = date.getFullYear()
  const MM = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const HH = pad(date.getHours())
  const mm = pad(date.getMinutes())
  return `${yyyy}${MM}${dd}-${HH}${mm}`
}

/** Builds `opsflow-${slug(doc.name)}-${yyyyMMdd-HHmm}.json` for `doc`. */
export function buildExportFilename(doc: WorkflowDocument): string {
  return `opsflow-${slug(doc.name)}-${timestampSuffix(new Date())}.json`
}

/** `{ filename, json }` ready to hand to a Blob download; see ARCHITECTURE.md §9 for the filename format. */
export function exportWorkflow(doc: WorkflowDocument): { filename: string; json: string } {
  return {
    filename: buildExportFilename(doc),
    json: JSON.stringify(doc, null, 2),
  }
}

/** Discriminated result of parsing pasted/uploaded workflow JSON text. */
export type ImportResult =
  | { ok: true; doc: WorkflowDocument; warnings: string[] }
  | { ok: false; kind: 'json'; message: string }
  | { ok: false; kind: 'schema'; issues: { path: string; message: string }[] }
  | { ok: false; kind: 'version'; message: string }

/** Flattens zod issues into `nodes[2].config.durationMs — Expected number, received string` style strings. */
export function formatZodIssues(
  issues: readonly { path: PropertyKey[]; message: string }[],
): { path: string; message: string }[] {
  return issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : '(root)',
    message: issue.message,
  }))
}

/** Parses, migrates and schema-validates `text` into a `WorkflowDocument`, or a readable failure. */
export function importWorkflow(text: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid JSON.'
    return { ok: false, kind: 'json', message }
  }

  const migrated = migrate(parsed)
  if (migrated !== null && typeof migrated === 'object' && (migrated as { ok?: unknown }).ok === false) {
    const failure = migrated as { reason: string; message: string }
    if (failure.reason === 'unknown-future-version') {
      return { ok: false, kind: 'version', message: failure.message }
    }
    return { ok: false, kind: 'schema', issues: [{ path: '(root)', message: failure.message }] }
  }

  const result = workflowDocumentSchema.safeParse(migrated)
  if (!result.success) {
    return { ok: false, kind: 'schema', issues: formatZodIssues(result.error.issues) }
  }

  return { ok: true, doc: result.data as WorkflowDocument, warnings: [] }
}
