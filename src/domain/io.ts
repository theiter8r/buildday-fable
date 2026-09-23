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
 *
 * STUB — owned by Lane A (domain). Throws until implemented.
 */
import type { WorkflowDocument } from './types'

/** `{ filename, json }` ready to hand to a Blob download; see ARCHITECTURE.md §9 for the filename format. */
export function exportWorkflow(_doc: WorkflowDocument): { filename: string; json: string } {
  throw new Error('not implemented')
}

/** Builds `opsflow-${slug(doc.name)}-${yyyyMMdd-HHmm}.json` for `doc`. */
export function buildExportFilename(_doc: WorkflowDocument): string {
  throw new Error('not implemented')
}

/** Discriminated result of parsing pasted/uploaded workflow JSON text. */
export type ImportResult =
  | { ok: true; doc: WorkflowDocument; warnings: string[] }
  | { ok: false; kind: 'json'; message: string }
  | { ok: false; kind: 'schema'; issues: { path: string; message: string }[] }
  | { ok: false; kind: 'version'; message: string }

/** Parses, migrates and schema-validates `text` into a `WorkflowDocument`, or a readable failure. */
export function importWorkflow(_text: string): ImportResult {
  throw new Error('not implemented')
}

/** Flattens zod issues into `nodes[2].config.durationMs — Expected number, received string` style strings. */
export function formatZodIssues(_issues: readonly { path: PropertyKey[]; message: string }[]): {
  path: string
  message: string
}[] {
  throw new Error('not implemented')
}
