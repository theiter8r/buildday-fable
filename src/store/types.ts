/**
 * The Zustand store's public interface. This file is the contract every
 * other lane builds against — `store/index.ts` implements the
 * document/selection/history slice now; the run/payload/ui/persistence
 * slices are typed here in full but wired as no-ops until their owning
 * lane fills them in (see the `// TODO(lane)` markers in `store/index.ts`).
 *
 * Every action below is documented with its exact semantics so a caller
 * never has to read the implementation to know what it does.
 */
import type {
  ApprovalDecision,
  BranchHandle,
  IncidentPayload,
  NodeRunState,
  RunStatus,
  ValidationIssue,
  WorkflowDocument,
  WorkflowNode,
  XY,
} from '@/domain/types'
import type { ExecutionEvent } from '@/domain/types'

/** A single undoable mutation plus the fields `applyCommand`/`invertCommand` need (ARCHITECTURE.md §7). */
export type Command =
  | { t: 'add-node'; node: WorkflowNode }
  | {
      t: 'remove-nodes'
      nodes: WorkflowNode[]
      edges: import('@/domain/types').WorkflowEdge[]
    }
  | {
      t: 'add-edge'
      edge: import('@/domain/types').WorkflowEdge
      replaced?: import('@/domain/types').WorkflowEdge
    }
  | { t: 'remove-edges'; edges: import('@/domain/types').WorkflowEdge[] }
  | { t: 'move-nodes'; moves: { id: string; from: XY; to: XY }[] }
  | { t: 'update-config'; nodeId: string; field: string; before: unknown; after: unknown }
  | { t: 'update-meta'; nodeId: string; field: 'label' | 'notes'; before: string; after: string }
  | { t: 'rename-doc'; before: string; after: string }
  | { t: 'duplicate'; nodes: WorkflowNode[]; edges: import('@/domain/types').WorkflowEdge[] }
  | {
      t: 'replace-doc'
      before: WorkflowDocument
      after: WorkflowDocument
      reason: 'import' | 'reset' | 'clear'
    }

/** `saved` = written and current; `saving` = debounce/write in flight; `error` = last write failed. */
export type PersistenceStatus = 'saved' | 'saving' | 'error'

/** Which mobile bottom-tab / drawer is currently frontmost. */
export type MobilePanel = 'canvas' | 'palette' | 'inspector' | 'run'

/** A single toast queued for `Toaster`. */
export interface ToastMessage {
  id: string
  variant: 'success' | 'error' | 'info'
  title: string
  description?: string
}

/**
 * Document + selection. This is the only slice that mutates the persisted
 * `WorkflowDocument`, and it does so exclusively through `Command`s so every
 * change is automatically undoable.
 */
export interface WorkflowSlice {
  /** The live, in-memory workflow. Never mutate this directly — go through an action below. */
  document: WorkflowDocument
  selectedNodeId: string | null
  selectedEdgeId: string | null
  /** React Flow viewport, persisted to the `ui` storage key but not undoable. */
  viewport: { x: number; y: number; zoom: number } | null

  /** Replaces the id of the currently-selected node (or `null` to clear), clearing any edge selection. */
  selectNode: (nodeId: string | null) => void
  /** Replaces the id of the currently-selected edge (or `null` to clear), clearing any node selection. */
  selectEdge: (edgeId: string | null) => void

  /** Records an `add-node` command inserting `node`. Selects the new node. */
  addNode: (node: WorkflowNode) => void
  /**
   * Records an `update-config` command setting `document.nodes[nodeId].config[field] = value`.
   * Consecutive calls with the same `nodeId`+`field` within the coalescing
   * window (see ARCHITECTURE.md §7) collapse into a single undo step; the
   * window closes on blur, on selection change, or on any other command.
   */
  updateNodeConfig: (nodeId: string, field: string, value: unknown) => void
  /** Records an `update-meta` command for `label` or `notes`. Same coalescing rule as `updateNodeConfig`. */
  updateNodeMeta: (nodeId: string, field: 'label' | 'notes', value: string) => void
  /**
   * Applies a live position change without recording history (used while a
   * drag is in progress). Call `moveNode` again with `commit: true` on drag
   * end to record the single `move-nodes` command for the whole gesture.
   */
  moveNode: (nodeId: string, position: XY, commit?: boolean) => void
  /** Records a `remove-nodes` command deleting `nodeId` and every edge touching it. */
  removeNode: (nodeId: string) => void
  /** Records a `duplicate` command cloning `nodeId` with a +32/+32 offset, and selects the copy. */
  duplicateNode: (nodeId: string) => void

  /**
   * Validates the connection with `canConnect` (ARCHITECTURE.md §7) and, if
   * legal, records an `add-edge` command. Same-source-handle edges replace
   * the previous edge (recorded via `replaced`) rather than stacking.
   * Returns `false` (and shows a toast) when the connection is rejected.
   */
  addEdge: (source: string, target: string, sourceHandle?: BranchHandle | null) => boolean
  /** Records a `remove-edges` command deleting `edgeId`. */
  removeEdge: (edgeId: string) => void

  /** Replaces the whole document via a `replace-doc` command (import, reset, clear-and-start-blank). */
  setDoc: (doc: WorkflowDocument, reason: 'import' | 'reset' | 'clear') => void
  /** Convenience wrapper around `setDoc` that loads the demo workflow. */
  resetToDemo: () => void
  /**
   * Records a `rename-doc` command setting `document.name`. Genuinely
   * missing from the original interface draft (the task brief calls this
   * `renameWorkflow`); added here rather than duplicated ad hoc so every
   * lane renames the workflow the same undoable way. No-op when `name`
   * equals the current name.
   */
  renameDoc: (name: string) => void
}

/** Undo/redo over the document slice. */
export interface HistorySlice {
  /** True when there is a command to undo. */
  canUndo: boolean
  /** True when there is a command to redo. */
  canRedo: boolean
  /** Reverts the most recent command and moves it onto the redo stack. Selects the affected nodes. */
  undo: () => void
  /** Re-applies the most recently undone command and moves it back onto the undo stack. */
  redo: () => void
  /**
   * Pushes `command` onto the undo stack (capped at `HISTORY_CAP`, FIFO
   * eviction), clears the redo stack, and applies it to the document.
   * Internal — UI code should call the semantic actions above, which call
   * this themselves.
   */
  pushCommand: (command: Command) => void
}

/** Run/playback state, driven by `simulate()` output. */
export interface RunSlice {
  status: RunStatus
  events: ExecutionEvent[]
  /** Index into `events` of the most recently applied event, -1 before a run starts. */
  currentIndex: number
  nodeStates: Record<string, NodeRunState>
  speed: 1 | 2 | 'instant'
  /** nodeId -> decision, accumulated across re-simulations after each approval (ARCHITECTURE.md §4). */
  approvalDecisions: Record<string, ApprovalDecision>
  /** Set while `status === 'awaiting-approval'`. */
  pendingApprovalNodeId: string | null
  /**
   * Wall-clock ms `start()` was called, captured once per run (not on
   * resume/approve/reject) so the UI can render `new Date(runStartedAtWallClock + event.at)`
   * for display per ARCHITECTURE.md §4. `null` before the first `start()`.
   */
  runStartedAtWallClock: number | null

  /** Runs `simulate()` against the current document + payload and starts playback from event 0. */
  start: () => void
  /** Pauses playback, clearing the pending step timer; `events`/`nodeStates` are left as-is. */
  pause: () => void
  /** Resumes playback from `currentIndex`. */
  resume: () => void
  /** Applies exactly the next event and advances `currentIndex` by one, regardless of `speed`. */
  step: () => void
  /** Clears events, decisions, cursor and node states back to idle; sets `status` to `'idle'`. */
  reset: () => void
  /** Sets `speed`; takes effect on the next scheduled step. */
  setSpeed: (speed: 1 | 2 | 'instant') => void
  /** Records an `approved` decision for the pending Approval node and re-simulates (see ARCHITECTURE.md §4). */
  approve: (nodeId: string) => void
  /** Records a `rejected` decision for the pending Approval node and re-simulates; ends the run `rejected`. */
  reject: (nodeId: string) => void
}

/** The incident payload the next run will simulate against. */
export interface PayloadSlice {
  payload: IncidentPayload
  /** Replaces the whole payload (e.g. from the JSON editor once it parses). */
  setPayload: (payload: IncidentPayload) => void
  /** Patches one top-level field of the payload (form mode). */
  updatePayloadField: <K extends keyof IncidentPayload>(field: K, value: IncidentPayload[K]) => void
  /** Resets the payload to `createDemoPayload()`. */
  resetPayload: () => void
}

/** Non-persisted, non-undoable UI chrome state. */
export interface UiSlice {
  activeMobilePanel: MobilePanel
  setActiveMobilePanel: (panel: MobilePanel) => void
  /** Named dialogs currently open (import, confirm-reset, confirm-delete, shortcuts-help). */
  openDialogs: Set<string>
  openDialog: (name: string) => void
  closeDialog: (name: string) => void
  toasts: ToastMessage[]
  /** Queues a toast; auto-dismissed after 4s except `variant: 'error'`. */
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void
  dismissToast: (id: string) => void
}

/** Autosave status, surfaced in the top bar as "Saved · 19:42" / "Saving…" / a storage-full warning. */
export interface PersistenceSlice {
  persistenceStatus: PersistenceStatus
  /** Wall-clock ms of the last successful write, or `null` before the first save. */
  lastSavedAt: number | null
  /** Marks a write as failed (e.g. quota exceeded); the top bar shows a warning chip. */
  markPersistenceError: () => void
}

/** Read-only, derived facts computed from the other slices (see `selectors.ts`). */
export interface DerivedSlice {
  /** Current validation issues for `document`, memoized on a document revision counter. */
  readonly issues: ValidationIssue[]
  /** `null` when Run is enabled; otherwise the human reason shown on the disabled Run button. */
  readonly runDisabledReason: string | null
}

/** The full store shape: every slice merged into one Zustand store. */
export type OpsflowStore = WorkflowSlice &
  HistorySlice &
  RunSlice &
  PayloadSlice &
  UiSlice &
  PersistenceSlice &
  DerivedSlice
