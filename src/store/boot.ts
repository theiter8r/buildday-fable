/**
 * Boot-time load: restore the persisted document/payload, or fall back to
 * the demo workflow on a first-ever boot (ARCHITECTURE.md §8). Kept as a
 * standalone function (`bootWorkflowStore`), not baked into
 * `workflowStore.ts`'s initializer, so it stays independently unit-testable
 * against a throwaway store with `@/domain`'s persistence mocked.
 *
 * DECISION: ARCHITECTURE.md §8 has a missing-key boot show an interactive
 * `HeroWelcome` ("Load the demo incident" / "Start blank") rather than
 * auto-loading anything. The store lane's task brief instead specifies
 * "first-ever boot loads the demo workflow" outright. Resolved in favour of
 * the task brief for this lane's boundary: `bootWorkflowStore` loads the demo
 * workflow itself on a missing key (the store already defaults to it before
 * boot even runs, so this is a no-op in the common case) — the UI lane
 * remains free to layer a `HeroWelcome`-style first-run affordance on top
 * (e.g. by calling `resetToDemo()`/`setDoc(EMPTY_WORKFLOW())` from a button)
 * without the store forcing a blank document no one asked for.
 */
import { createDemoPayload, createDemoWorkflow, loadPayload, loadWorkflow } from '@/domain'
import type { WorkflowStoreApi } from './workflowStore'

/** Outcome of one `bootWorkflowStore` call, for the caller to log/report — the store itself is already updated either way. */
export type BootStatus = 'first-boot' | 'restored' | 'corrupt' | 'unavailable'

export interface BootResult {
  status: BootStatus
  /** Only set when `status === 'corrupt'`: the unparsable raw string and the readable failure reasons. */
  corrupt?: { raw: string; errors: string[] }
}

/** Best-effort `loadPayload()` — persistence's payload key is independent of the document's, and never blocks boot. */
function safeLoadPayload() {
  try {
    return loadPayload()
  } catch {
    return null
  }
}

/**
 * Runs once at app startup against the live `store`. Never throws: any
 * failure (including `localStorage` being unavailable, or — while the
 * domain lane's `persistence.ts` is still a stub — a thrown "not
 * implemented") degrades to the demo workflow already sitting in the store's
 * initial state, with `persistenceStatus: 'error'` so the UI can show the
 * "changes won't be saved" warning chip (ARCHITECTURE.md §8).
 */
export function bootWorkflowStore(store: WorkflowStoreApi): BootResult {
  try {
    const loaded = loadWorkflow()
    switch (loaded.status) {
      case 'missing': {
        store.setState({ document: createDemoWorkflow(), payload: safeLoadPayload() ?? createDemoPayload() })
        return { status: 'first-boot' }
      }
      case 'ok': {
        store.setState({ document: loaded.doc, payload: safeLoadPayload() ?? createDemoPayload() })
        return { status: 'restored' }
      }
      case 'corrupt': {
        store.setState({ persistenceStatus: 'error' })
        return { status: 'corrupt', corrupt: { raw: loaded.raw, errors: loaded.errors } }
      }
      case 'unavailable': {
        store.setState({ persistenceStatus: 'error' })
        return { status: 'unavailable' }
      }
      default: {
        const exhaustive: never = loaded
        throw new Error(`Unknown loadWorkflow() status: ${JSON.stringify(exhaustive)}`)
      }
    }
  } catch {
    store.setState({ persistenceStatus: 'error' })
    return { status: 'unavailable' }
  }
}
