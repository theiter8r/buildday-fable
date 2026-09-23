/**
 * Autosave: subscribes to `document`/`payload` and debounces a write to
 * localStorage (ARCHITECTURE.md §8). Kept as a standalone installer
 * (`installAutosave`), not baked into `workflowStore.ts`'s initializer,
 * so tests can install it against a throwaway `createWorkflowStore()`
 * instance with fake timers instead of fighting the module-level singleton.
 */
import { AUTOSAVE_DEBOUNCE_MS } from '@/domain/constants'
import { savePayload, saveWorkflow } from '@/domain'
import type { WorkflowStoreApi } from './workflowStore'

/** Stops the subscription and any pending debounce/listeners; call on teardown (mainly for tests). */
export type StopAutosave = () => void

/**
 * Installs the debounced autosave writer on `store`. Immediately reflects
 * `persistenceStatus: 'saving'` on every document/payload change, then
 * writes (and flips to `'saved'`/`'error'`) after `AUTOSAVE_DEBOUNCE_MS` of
 * quiet, or immediately on `pagehide`/tab-hidden so a closed tab never loses
 * the last edit.
 */
export function installAutosave(store: WorkflowStoreApi): StopAutosave {
  let timer: ReturnType<typeof setTimeout> | null = null

  function clearTimer(): void {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function flush(): void {
    clearTimer()
    const { document, payload } = store.getState()
    try {
      const docResult = saveWorkflow(document)
      const payloadResult = savePayload(payload)
      if (docResult.ok && payloadResult.ok) {
        store.setState({ persistenceStatus: 'saved', lastSavedAt: Date.now() })
      } else {
        // Quota exceeded or storage unavailable (`SaveResult.reason`) — the
        // top bar's "Storage is full" / "won't be saved" chip reads this
        // same `persistenceStatus`, per ARCHITECTURE.md §8.
        store.setState({ persistenceStatus: 'error' })
      }
    } catch {
      // Defensive only: `saveWorkflow`/`savePayload` are documented to
      // return a typed `SaveResult` rather than throw.
      store.setState({ persistenceStatus: 'error' })
    }
  }

  const unsubscribe = store.subscribe((state, previous) => {
    if (state.document === previous.document && state.payload === previous.payload) return
    store.setState({ persistenceStatus: 'saving' })
    clearTimer()
    timer = setTimeout(flush, AUTOSAVE_DEBOUNCE_MS)
  })

  const onHide = (): void => flush()
  let stopVisibility: StopAutosave = () => {}
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', onHide)
    const onVisibilityChange = (): void => {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    stopVisibility = () => {
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }

  return () => {
    clearTimer()
    unsubscribe()
    stopVisibility()
  }
}
