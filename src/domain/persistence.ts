/**
 * localStorage read/write for the document and payload (ARCHITECTURE.md
 * §8). Debouncing lives in the store's `autosave.ts`, not here — this
 * module is a thin, synchronous, testable wrapper around `localStorage` plus
 * the migrate-then-validate boot path.
 */
import { STORAGE_KEYS } from './constants'
import { migrate } from './migrations'
import { incidentPayloadSchema, workflowDocumentSchema } from './schema'
import type { IncidentPayload, WorkflowDocument } from './types'

/** Result of attempting to load the persisted document at boot. */
export type LoadWorkflowResult =
  | { status: 'missing' }
  | { status: 'ok'; doc: WorkflowDocument }
  | { status: 'corrupt'; raw: string; errors: string[] }
  | { status: 'unavailable' } // localStorage inaccessible (private mode / quota probe failed)

/** Probes whether `localStorage` is actually usable (private mode / quota can make it throw). */
function isStorageAvailable(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false
    const probeKey = '__opsflow_storage_probe__'
    localStorage.setItem(probeKey, '1')
    localStorage.removeItem(probeKey)
    return true
  } catch {
    return false
  }
}

/** Loads and migrates the persisted `WorkflowDocument`, if any. */
export function loadWorkflow(): LoadWorkflowResult {
  if (!isStorageAvailable()) return { status: 'unavailable' }

  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEYS.document)
  } catch {
    return { status: 'unavailable' }
  }
  if (raw === null) return { status: 'missing' }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { status: 'corrupt', raw, errors: ['The saved workflow is not valid JSON.'] }
  }

  const migrated = migrate(parsed)
  if (migrated !== null && typeof migrated === 'object' && (migrated as { ok?: unknown }).ok === false) {
    const failure = migrated as { message: string }
    return { status: 'corrupt', raw, errors: [failure.message] }
  }

  const result = workflowDocumentSchema.safeParse(migrated)
  if (!result.success) {
    return {
      status: 'corrupt',
      raw,
      errors: result.error.issues.map(
        (issue) => `${issue.path.length > 0 ? issue.path.join('.') : '(root)'} — ${issue.message}`,
      ),
    }
  }

  return { status: 'ok', doc: result.data as WorkflowDocument }
}

/** Typed outcome of a `localStorage` write, so callers can show a toast instead of throwing. */
export type SaveResult = { ok: true } | { ok: false; reason: 'unavailable' | 'quota' }

function writeStorage(key: string, value: string): SaveResult {
  try {
    if (typeof localStorage === 'undefined') return { ok: false, reason: 'unavailable' }
    localStorage.setItem(key, value)
    return { ok: true }
  } catch (err) {
    const isQuota =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    return { ok: false, reason: isQuota ? 'quota' : 'unavailable' }
  }
}

/**
 * Writes `doc` to localStorage under `STORAGE_KEYS.document`, stamping
 * `updatedAt`, and returns a typed result instead of throwing so the store's
 * autosave can show "Storage is full" / "won't be saved" chips per
 * ARCHITECTURE.md §8.
 */
export function saveWorkflow(doc: WorkflowDocument): SaveResult {
  const stamped: WorkflowDocument = { ...doc, updatedAt: new Date().toISOString() }
  return writeStorage(STORAGE_KEYS.document, JSON.stringify(stamped))
}

/** Loads the persisted `IncidentPayload`, or `null` if absent/invalid. */
export function loadPayload(): IncidentPayload | null {
  if (!isStorageAvailable()) return null
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEYS.payload)
  } catch {
    return null
  }
  if (raw === null) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  const result = incidentPayloadSchema.safeParse(parsed)
  return result.success ? (result.data as IncidentPayload) : null
}

/** Writes `payload` to localStorage under `STORAGE_KEYS.payload`, returning a typed result. */
export function savePayload(payload: IncidentPayload): SaveResult {
  return writeStorage(STORAGE_KEYS.payload, JSON.stringify(payload))
}

/** Clears every OpsFlow key from localStorage (used by "Reset to demo" and the corrupt-data error state). */
export function clearAll(): SaveResult {
  let ok = true
  for (const key of Object.values(STORAGE_KEYS)) {
    try {
      if (typeof localStorage === 'undefined') {
        ok = false
        continue
      }
      localStorage.removeItem(key)
    } catch {
      ok = false
    }
  }
  return ok ? { ok: true } : { ok: false, reason: 'unavailable' }
}
