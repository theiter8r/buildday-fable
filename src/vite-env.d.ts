/// <reference types="vite/client" />

import type { WorkflowDocument, IncidentPayload, ExecutionEvent, RunStatus, NodeType } from '@/domain/types'

/**
 * The e2e test-only store handle (ARCHITECTURE.md §11, `docs/testing-conventions.md`).
 * Installed on `window` by `src/store/testHandle.ts` when the `e2e` flag is
 * active. Every method calls the same store action the UI calls — it is not
 * a second code path, so it can't mask a broken button.
 */
interface OpsflowTestHandle {
  /** Current workflow document. */
  getDocument: () => WorkflowDocument
  /** Current run status + event log. */
  getRun: () => { status: RunStatus; events: ExecutionEvent[] }
  /** Replaces `source`/`target`/`sourceHandle` -> a real `addEdge` call. */
  connect: (source: string, target: string, sourceHandle?: 'true' | 'false' | null) => boolean
  /** Replaces the whole payload the next run will simulate against. */
  setPayload: (payload: IncidentPayload) => void
  /** Reloads the demo workflow via the real `resetToDemo` action. */
  reset: () => void
  /** Clears `localStorage` (both document and payload keys, and everything else). */
  clearStorage: () => void
  /** Returns the full zustand state snapshot. */
  getState: () => unknown
  /** Merges `partial` into the zustand state (test-only escape hatch). */
  setState: (partial: Record<string, unknown>) => void
  /** Undo/redo via the real store actions. */
  undo: () => void
  redo: () => void
  /** Adds a node of `type` via the real `addNode` action, returns its id. */
  addNode: (type: NodeType) => string
  /** Selects a node (or clears selection with `null`) via the real action. */
  selectNode: (id: string | null) => void
  /** Runs the workflow to completion synchronously (`speed: 'instant'`). */
  runInstant: () => void
  /** Approves the current pending approval, if any. */
  approve: () => void
  /** Rejects the current pending approval, if any. */
  reject: () => void
  /** Imports a workflow from raw JSON text via the real import path. */
  importJson: (text: string) => boolean
  /** Exports the current workflow document as JSON text. */
  exportJson: () => string
}

declare global {
  interface Window {
    __opsflow?: OpsflowTestHandle
  }
}

export {}
