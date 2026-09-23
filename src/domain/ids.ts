/**
 * Id generation. Every id in OpsFlow is a prefixed UUID (`node-<uuid>`,
 * `edge-<uuid>`, `filter-<uuid>`, ...) so that reading an id in a debugger or
 * a test failure tells you what kind of thing it names.
 *
 * DECISION: the task brief calls for a single `newId()` helper; this file
 * instead exports `createId(prefix)` per ARCHITECTURE.md §2, plus a `newId`
 * alias (defaulting to the `id` prefix) so both call shapes work. Lane A can
 * drop the alias once every lane has migrated to `createId`.
 */

/**
 * Returns `${prefix}-${uuid}` using `crypto.randomUUID()`. Falls back to a
 * counter-based id when `crypto.randomUUID` is unavailable (older test
 * environments), which keeps ids readable and still unique per process.
 */
export function createId(prefix: string): string {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : fallbackUuid()
  return `${prefix}-${uuid}`
}

let fallbackCounter = 0

function fallbackUuid(): string {
  fallbackCounter += 1
  return `fallback-${Date.now().toString(36)}-${fallbackCounter}`
}

/** Alias of `createId`, matching the task brief's `newId()` naming. */
export function newId(prefix = 'id'): string {
  return createId(prefix)
}
