/**
 * Installs `window.__opsflow`, the e2e test-only store handle
 * (ARCHITECTURE.md §11, `docs/testing-conventions.md`). Every method below
 * calls the same store action the UI calls — this is deliberately not a
 * second code path, so a Playwright test using it can't mask a broken
 * button.
 *
 * Enabled when either:
 * - the URL has an `e2e` search param (`/?e2e=1`), or
 * - `import.meta.env.DEV` is true (so it's also available during local dev
 *   without having to remember the query string).
 *
 * When enabled, `document.documentElement.dataset.e2e` is set to `'1'` so
 * CSS (see `styles/tokens.css`) can kill animation/transition durations for
 * deterministic screenshots and `expect.poll` assertions.
 */
import { createNode, exportWorkflow, importWorkflow } from '@/domain'
import { STORAGE_KEYS } from '@/domain/constants'
import type { NodeType } from '@/domain/types'
import { isE2eEnabled } from './e2e'
import { workflowStore } from './workflowStore'
import type { OpsflowStore } from './types'

export { isE2eEnabled }

/**
 * `OpsflowTestHandle` (declared in `src/vite-env.d.ts`, a shared contract
 * this lane doesn't own) plus a handful of higher-level convenience helpers
 * the store lane's task brief calls for. Declared locally rather than by
 * editing `vite-env.d.ts` — see `docs/lane-notes/store.md` for the exact
 * change requested there. Assigning a *variable* of this type to
 * `window.__opsflow` (instead of an object literal) sidesteps TypeScript's
 * excess-property check against the narrower global type, so both the
 * documented contract and these extras type-check without touching the
 * shared file.
 */
export interface OpsflowTestHandleExtended {
  getDocument: () => OpsflowStore['document']
  getRun: () => { status: OpsflowStore['status']; events: OpsflowStore['events'] }
  connect: OpsflowStore['addEdge']
  setPayload: OpsflowStore['setPayload']
  reset: () => void
  clearStorage: () => void
  getState: () => OpsflowStore
  setState: (partial: Partial<OpsflowStore>) => void
  undo: () => void
  redo: () => void
  /** Adds a node of `type` at a deterministic, ever-advancing position (palette-click equivalent). Returns its id. */
  addNode: (type: NodeType) => string
  /** Selects a node by id (or clears selection with `null`). */
  selectNode: (id: string | null) => void
  /** Sets speed to `'instant'` and starts a run in one call. */
  runInstant: () => void
  /** Approves the currently pending approval node, if any; no-op otherwise. */
  approve: () => void
  /** Rejects the currently pending approval node, if any; no-op otherwise. */
  reject: () => void
  /** Parses/migrates/validates `text` and, if valid, replaces the document via the real `setDoc` (undoable). Returns whether it applied. */
  importJson: (text: string) => boolean
  /** The current document as exported JSON text (`exportWorkflow(document).json`). */
  exportJson: () => string
}

/** Idempotent: calling this more than once just reinstalls the same handle. */
export function installTestHandle(): void {
  if (!isE2eEnabled()) return

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.e2e = '1'
  }

  const handle: OpsflowTestHandleExtended = {
    getDocument: () => workflowStore.getState().document,
    getRun: () => {
      const state = workflowStore.getState()
      return { status: state.status, events: state.events }
    },
    connect: (source, target, sourceHandle = null) =>
      workflowStore.getState().addEdge(source, target, sourceHandle),
    setPayload: (payload) => workflowStore.getState().setPayload(payload),
    reset: () => workflowStore.getState().resetToDemo(),
    clearStorage: () => {
      Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key))
    },
    getState: () => workflowStore.getState(),
    setState: (partial) => workflowStore.setState(partial as Partial<OpsflowStore>),
    undo: () => workflowStore.getState().undo(),
    redo: () => workflowStore.getState().redo(),

    addNode: (type) => {
      const doc = workflowStore.getState().document
      const node = createNode(type, { x: 120 + doc.nodes.length * 24, y: 120 + doc.nodes.length * 24 })
      workflowStore.getState().addNode(node)
      return node.id
    },
    selectNode: (id) => workflowStore.getState().selectNode(id),
    runInstant: () => {
      workflowStore.getState().setSpeed('instant')
      workflowStore.getState().start()
    },
    approve: () => {
      const nodeId = workflowStore.getState().pendingApprovalNodeId
      if (nodeId) workflowStore.getState().approve(nodeId)
    },
    reject: () => {
      const nodeId = workflowStore.getState().pendingApprovalNodeId
      if (nodeId) workflowStore.getState().reject(nodeId)
    },
    importJson: (text) => {
      const result = importWorkflow(text)
      if (!result.ok) return false
      workflowStore.getState().setDoc(result.doc, 'import')
      return true
    },
    exportJson: () => exportWorkflow(workflowStore.getState().document).json,
  }

  window.__opsflow = handle
}

// Side-effecting on import, matching ARCHITECTURE.md §11's inline example:
// any lane just needs `import '@/store/testHandle'` (or `import '@/store'`,
// which re-exports this module) once, near the app's entry point.
installTestHandle()
