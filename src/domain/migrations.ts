/**
 * Version ladder for `WorkflowDocument`. `migrate()` applies every migrator
 * from `raw.schemaVersion ?? 1` up to `SCHEMA_VERSION` in ascending order
 * (ARCHITECTURE.md §8). Kept separate from `schema.ts` so a migrator can
 * read a shape zod would otherwise reject.
 */
import { SCHEMA_VERSION } from './constants'
import type { ActionKind, WorkflowDocument } from './types'

/** A migrator moves a document forward exactly one schema version. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Migrator = (doc: any) => any

const KNOWN_ACTION_KINDS: readonly ActionKind[] = [
  'page-oncall',
  'post-slack',
  'create-ticket',
  'rollback-deploy',
  'scale-service',
  'run-runbook',
]

/**
 * v1 -> v2: v1 stored `action.kind` (a free string) instead of
 * `action.action` (a closed `ActionKind` enum), and had no
 * `continueOnFailure` flag on action config. This migrator renames the field,
 * maps any unrecognised legacy kind to `'run-runbook'`, and defaults
 * `continueOnFailure` to `false` (ARCHITECTURE.md §8).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const migrateV1ToV2: Migrator = (doc: any) => {
  const nodes = Array.isArray(doc?.nodes) ? doc.nodes : []
  return {
    ...doc,
    schemaVersion: 2,
    nodes: nodes.map((node: unknown) => {
      if (!node || typeof node !== 'object') return node
      const n = node as Record<string, unknown>
      if (n.type !== 'action') return n
      const config = (n.config ?? {}) as Record<string, unknown>
      if (!('kind' in config)) return n // already v2 shape, nothing to migrate
      const legacyKind = config.kind
      const action = KNOWN_ACTION_KINDS.includes(legacyKind as ActionKind)
        ? (legacyKind as ActionKind)
        : 'run-runbook'
      const rest = { ...config }
      delete rest.kind
      return {
        ...n,
        config: {
          ...rest,
          action,
          continueOnFailure: typeof rest.continueOnFailure === 'boolean' ? rest.continueOnFailure : false,
        },
      }
    }),
  }
}

/** Migrators keyed by the version they migrate *from*. */
export const migrators: Record<number, Migrator> = {
  1: migrateV1ToV2,
}

/** Failure result when `raw` cannot be migrated to the current schema. */
export interface MigrationFailure {
  ok: false
  reason: 'unknown-future-version' | 'invalid-shape'
  message: string
}

function isMigrationFailure(x: unknown): x is MigrationFailure {
  return typeof x === 'object' && x !== null && (x as { ok?: unknown }).ok === false
}

/**
 * Migrates an unknown parsed-JSON value up to `SCHEMA_VERSION`, or returns a
 * `MigrationFailure`. Does not itself run zod validation — callers should
 * follow a successful migration with `workflowDocumentSchema.safeParse`.
 */
export function migrate(raw: unknown): WorkflowDocument | MigrationFailure {
  if (raw === null || typeof raw !== 'object') {
    return { ok: false, reason: 'invalid-shape', message: 'The saved data is not a workflow object.' }
  }

  const version = (raw as { schemaVersion?: unknown }).schemaVersion
  const startVersion = typeof version === 'number' && Number.isFinite(version) ? version : 1

  if (startVersion > SCHEMA_VERSION) {
    return {
      ok: false,
      reason: 'unknown-future-version',
      message: `This workflow was saved by a newer version of OpsFlow (schema v${startVersion}); this build only understands up to v${SCHEMA_VERSION}.`,
    }
  }

  let current: unknown = raw
  for (let v = startVersion; v < SCHEMA_VERSION; v += 1) {
    const migrator = migrators[v]
    if (!migrator) {
      return {
        ok: false,
        reason: 'invalid-shape',
        message: `No migration path from schema v${v} to v${v + 1}.`,
      }
    }
    try {
      current = migrator(current)
    } catch {
      return {
        ok: false,
        reason: 'invalid-shape',
        message: `Migrating from schema v${v} to v${v + 1} failed — the saved data is corrupt.`,
      }
    }
    if (isMigrationFailure(current)) return current
  }

  return current as WorkflowDocument
}
