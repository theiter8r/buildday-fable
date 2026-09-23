/**
 * localStorage read/write for the document and payload (ARCHITECTURE.md
 * §8). Debouncing lives in the store's `autosave.ts`, not here — this
 * module is a thin, synchronous, testable wrapper around `localStorage` plus
 * the migrate-then-validate boot path.
 *
 * STUB — owned by Lane A (domain). Throws until implemented.
 */
import type { IncidentPayload, WorkflowDocument } from './types'

/** Result of attempting to load the persisted document at boot. */
export type LoadWorkflowResult =
  | { status: 'missing' }
  | { status: 'ok'; doc: WorkflowDocument }
  | { status: 'corrupt'; raw: string; errors: string[] }
  | { status: 'unavailable' } // localStorage inaccessible (private mode / quota probe failed)

/** Loads and migrates the persisted `WorkflowDocument`, if any. */
export function loadWorkflow(): LoadWorkflowResult {
  throw new Error('not implemented')
}

/** Writes `doc` to localStorage under `STORAGE_KEYS.document`, stamping `updatedAt`. */
export function saveWorkflow(_doc: WorkflowDocument): void {
  throw new Error('not implemented')
}

/** Loads the persisted `IncidentPayload`, or `null` if absent/invalid. */
export function loadPayload(): IncidentPayload | null {
  throw new Error('not implemented')
}

/** Writes `payload` to localStorage under `STORAGE_KEYS.payload`. */
export function savePayload(_payload: IncidentPayload): void {
  throw new Error('not implemented')
}

/** Clears every OpsFlow key from localStorage (used by "Reset to demo" and the corrupt-data error state). */
export function clearAll(): void {
  throw new Error('not implemented')
}
