/**
 * Version ladder for `WorkflowDocument`. `migrate()` applies every migrator
 * from `raw.schemaVersion ?? 1` up to `SCHEMA_VERSION` in ascending order
 * (ARCHITECTURE.md §8). Kept separate from `schema.ts` so a migrator can
 * read a shape zod would otherwise reject.
 *
 * STUB — owned by Lane A (domain). Throws until implemented.
 */
import type { WorkflowDocument } from './types'

/** A migrator moves a document forward exactly one schema version. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Migrator = (doc: any) => any

/** Migrators keyed by the version they migrate *from*. */
export const migrators: Record<number, Migrator> = {}

/** Failure result when `raw` cannot be migrated to the current schema. */
export interface MigrationFailure {
  ok: false
  reason: 'unknown-future-version' | 'invalid-shape'
  message: string
}

/**
 * Migrates an unknown parsed-JSON value up to `SCHEMA_VERSION`, or returns a
 * `MigrationFailure`. Does not itself run zod validation — callers should
 * follow a successful migration with `workflowDocumentSchema.safeParse`.
 */
export function migrate(_raw: unknown): WorkflowDocument | MigrationFailure {
  throw new Error('not implemented')
}
