/**
 * The OpsFlow zustand store — implements `OpsflowStore` (`store/types.ts`).
 *
 * This lane (store) fully implements the document/selection/history slices:
 * every document mutation goes through `pushCommand` -> `applyCommand`
 * (`commands.ts`) -> `HistoryStack` (`history.ts`), so every one of them is
 * automatically undoable. The run/payload/ui/persistence slices are typed
 * no-ops here (see the `// TODO(lane:store)` markers below) — their state
 * shape is real so components can already read from it, but their actions
 * do nothing until the owning lane fills them in.
 */
import { createStore } from 'zustand/vanilla'
import type { StoreApi } from 'zustand/vanilla'
import { useStore } from 'zustand'

import {
  applyEventToStates,
  createDemoPayload,
  createDemoWorkflow,
  createEdge,
  createId,
  duplicateNode,
  simulate,
} from '@/domain'
import type { ApprovalDecision, RunStatus, WorkflowDocument, XY } from '@/domain/types'
import { applyCommand, coalesceKey } from './commands'
import { isE2eEnabled } from './e2e'
import { HistoryStack } from './history'
import { selectRunDisabledReason, selectValidationIssues } from './selectors'
import type { Command, OpsflowStore } from './types'

/** The vanilla zustand store type `workflowStore` and every helper in this module share. */
export type WorkflowStoreApi = StoreApi<OpsflowStore>

/** One entry in the internal history stack: the command plus the whole-document snapshot either side of it. */
interface HistoryItem {
  command: Command
  before: WorkflowDocument
  after: WorkflowDocument
}

/**
 * The node ids a command touched, so `undo`/`redo` can select them without
 * moving the camera unasked (ARCHITECTURE.md §7). Mirrors
 * `commands.ts#affectedNodeIds` but returns at most one id since
 * `selectedNodeId` is singular in this store's `WorkflowSlice`.
 */
function primaryAffectedNodeId(cmd: Command): string | null {
  switch (cmd.t) {
    case 'add-node':
      return cmd.node.id
    case 'remove-nodes':
      return cmd.nodes[0]?.id ?? null
    case 'move-nodes':
      return cmd.moves[0]?.id ?? null
    case 'update-config':
    case 'update-meta':
      return cmd.nodeId
    case 'duplicate':
      return cmd.nodes[0]?.id ?? null
    case 'add-edge':
    case 'remove-edges':
    case 'rename-doc':
    case 'replace-doc':
      return null
    default: {
      const exhaustive: never = cmd
      throw new Error(`Unknown command: ${JSON.stringify(exhaustive)}`)
    }
  }
}

/**
 * Builds a fresh, fully independent store instance (its own document,
 * selection and `HistoryStack`). `workflowStore` below is the one live
 * instance the app uses; tests call this directly so each test gets an
 * isolated history stack instead of sharing module-level state.
 */
export function createWorkflowStore(): WorkflowStoreApi {
  const store = createStore<OpsflowStore>()((set, get) => {
    const history = new HistoryStack<HistoryItem>()
    // Built once so `document:` and the seed `issues:` below share the exact
    // same reference (selectValidationIssues memoizes on `doc` identity).
    const initialDocument = createDemoWorkflow()

    // Transient drag bookkeeping for `moveNode` — deliberately kept out of
    // the store's state (it is never read by the UI and must not itself be
    // undoable/persisted). Reset whenever a drag gesture commits.
    let dragBeforeDoc: WorkflowDocument | null = null
    let dragOrigins: Record<string, XY> = {}

    // ------------------------------------------------------------ Player
    // Playback is a single `setTimeout` chain (never `setInterval`,
    // ARCHITECTURE.md §4). Deliberately kept out of state — it is a live
    // handle, not a fact about the run — and cleared on every action that
    // stops/restarts/skips playback so at most one timer is ever pending.
    let playbackTimer: ReturnType<typeof setTimeout> | null = null

    function clearPlaybackTimer(): void {
      if (playbackTimer !== null) {
        clearTimeout(playbackTimer)
        playbackTimer = null
      }
    }

    function speedFactor(speed: OpsflowStore['speed']): number {
      return speed === 2 ? 2 : 1
    }

    /**
     * Applies exactly `events[currentIndex + 1]`, updating `nodeStates` via
     * the shared reducer and reacting to the three event kinds the player
     * itself must interpret (approval gates and run completion). Returns
     * whether an event was applied and whether playback should continue.
     */
    function applyNextEvent(): { applied: boolean; continueRunning: boolean } {
      const state = get()
      const nextIndex = state.currentIndex + 1
      const event = state.events[nextIndex]
      if (!event) return { applied: false, continueRunning: false }

      const nodeStates = applyEventToStates(state.nodeStates, event)
      let status: RunStatus = state.status
      let pendingApprovalNodeId = state.pendingApprovalNodeId
      if (event.kind === 'approval-requested') {
        status = 'awaiting-approval'
        pendingApprovalNodeId = event.nodeId
      } else if (event.kind === 'approval-resolved') {
        pendingApprovalNodeId = null
      } else if (event.kind === 'run-finished') {
        status = event.status
      }
      set({ currentIndex: nextIndex, nodeStates, status, pendingApprovalNodeId })
      return { applied: true, continueRunning: status === 'running' }
    }

    /** Applies every remaining event synchronously, stopping early at an approval gate (ARCHITECTURE.md §4 "instant"). */
    function flushRemaining(): void {
      let result = applyNextEvent()
      while (result.applied && result.continueRunning) {
        result = applyNextEvent()
      }
    }

    function stepOnce(): void {
      const { continueRunning } = applyNextEvent()
      if (continueRunning) scheduleNext()
    }

    /** Schedules `stepOnce` at `(nextEvent.at - currentEvent.at) / speedFactor`, clamped to `[16ms, 2500ms]`. */
    function scheduleNext(): void {
      clearPlaybackTimer()
      const state = get()
      if (state.status !== 'running') return
      const nextIndex = state.currentIndex + 1
      const nextEvent = state.events[nextIndex]
      if (!nextEvent) return
      if (state.speed === 'instant') {
        flushRemaining()
        return
      }
      const prevAt = state.currentIndex >= 0 ? (state.events[state.currentIndex]?.at ?? 0) : 0
      const delay = Math.min(2500, Math.max(16, (nextEvent.at - prevAt) / speedFactor(state.speed)))
      playbackTimer = setTimeout(() => {
        playbackTimer = null
        stepOnce()
      }, delay)
    }

    /**
     * Shared body of `approve`/`reject`: records the decision and
     * re-simulates (ARCHITECTURE.md §4's "re-simulation with an accumulating
     * decision map"). The walk never re-emits `approval-requested` for a
     * node that already has a decision (it goes straight to
     * `approval-resolved`), so the new `events` array is a genuinely
     * different array from this point on, not a strict superset — the
     * cursor (`currentIndex`) is kept as-is and playback continues into the
     * new array from there, which is what "byte-identical prefix" buys us
     * (everything *before* the approval gate cannot have changed).
     */
    function resolveApproval(nodeId: string, decision: ApprovalDecision): void {
      const state = get()
      if (state.status !== 'awaiting-approval' || state.pendingApprovalNodeId !== nodeId) return

      const approvalDecisions = { ...state.approvalDecisions, [nodeId]: decision }
      const result = simulate(state.document, state.payload, { approvalDecisions })

      set({
        events: result.events,
        approvalDecisions,
        status: 'running',
        pendingApprovalNodeId: null,
      })
      if (get().speed === 'instant') flushRemaining()
      else scheduleNext()
    }

    /** Applies `command` to `beforeDoc`, pushes it to history, and commits the result as `document`. */
    function applyAndPush(command: Command, beforeDoc: WorkflowDocument): void {
      const after = applyCommand(beforeDoc, command)
      const key = coalesceKey(command)
      history.push({ command, before: beforeDoc, after }, key, (previous, next) => ({
        command: next.command,
        before: previous.before,
        after: next.after,
      }))
      set({ document: after, canUndo: history.canUndo, canRedo: history.canRedo })
    }

    function selectAffected(cmd: Command): void {
      get().selectNode(primaryAffectedNodeId(cmd))
    }

    return {
      // ---------------------------------------------------------------- WorkflowSlice
      document: initialDocument,
      selectedNodeId: null,
      selectedEdgeId: null,
      viewport: null,

      selectNode: (nodeId) => set({ selectedNodeId: nodeId, selectedEdgeId: null }),
      selectEdge: (edgeId) => set({ selectedEdgeId: edgeId, selectedNodeId: null }),

      addNode: (node) => {
        get().pushCommand({ t: 'add-node', node })
        get().selectNode(node.id)
      },

      updateNodeConfig: (nodeId, field, value) => {
        const node = get().document.nodes.find((n) => n.id === nodeId)
        if (!node) return
        const before = (node.config as unknown as Record<string, unknown>)[field]
        if (before === value) return
        get().pushCommand({ t: 'update-config', nodeId, field, before, after: value })
      },

      updateNodeMeta: (nodeId, field, value) => {
        const node = get().document.nodes.find((n) => n.id === nodeId)
        if (!node) return
        const before = field === 'label' ? node.label : (node.notes ?? '')
        if (before === value) return
        get().pushCommand({ t: 'update-meta', nodeId, field, before, after: value })
      },

      moveNode: (nodeId, position, commit = false) => {
        const doc = get().document
        const node = doc.nodes.find((n) => n.id === nodeId)
        if (!node) return

        if (dragBeforeDoc === null) {
          dragBeforeDoc = doc
        }
        if (!(nodeId in dragOrigins)) {
          const original = dragBeforeDoc.nodes.find((n) => n.id === nodeId)
          dragOrigins[nodeId] = original ? original.position : node.position
        }

        // Live position update, applied outside history (ARCHITECTURE.md §7).
        set((state) => ({
          document: {
            ...state.document,
            nodes: state.document.nodes.map((n) => (n.id === nodeId ? { ...n, position } : n)),
          },
        }))

        if (!commit) return

        const finalDoc = get().document
        const moves = Object.entries(dragOrigins).map(([id, from]) => ({
          id,
          from,
          to: finalDoc.nodes.find((n) => n.id === id)?.position ?? from,
        }))
        const beforeDoc = dragBeforeDoc
        dragOrigins = {}
        dragBeforeDoc = null

        const actuallyMoved = moves.some((m) => m.from.x !== m.to.x || m.from.y !== m.to.y)
        if (!actuallyMoved) return
        applyAndPush({ t: 'move-nodes', moves }, beforeDoc)
      },

      removeNode: (nodeId) => {
        const doc = get().document
        const node = doc.nodes.find((n) => n.id === nodeId)
        if (!node) return
        const edges = doc.edges.filter((e) => e.source === nodeId || e.target === nodeId)
        get().pushCommand({ t: 'remove-nodes', nodes: [node], edges })
        if (get().selectedNodeId === nodeId) get().selectNode(null)
      },

      duplicateNode: (nodeId) => {
        const node = get().document.nodes.find((n) => n.id === nodeId)
        if (!node) return
        const copy = duplicateNode(node)
        get().pushCommand({ t: 'duplicate', nodes: [copy], edges: [] })
        get().selectNode(copy.id)
      },

      addEdge: (source, target, sourceHandle = null) => {
        const doc = get().document
        if (source === target) return false
        const sourceNode = doc.nodes.find((n) => n.id === source)
        const targetNode = doc.nodes.find((n) => n.id === target)
        if (!sourceNode || !targetNode) return false
        if (targetNode.type === 'trigger') return false
        if (sourceNode.type === 'resolution') return false

        const handle = sourceNode.type === 'condition' ? (sourceHandle ?? null) : null
        const replaced = doc.edges.find(
          (e) => e.source === source && (e.sourceHandle ?? null) === handle,
        )
        const edge = createEdge(source, target, handle)
        get().pushCommand({ t: 'add-edge', edge, replaced })
        return true
      },

      removeEdge: (edgeId) => {
        const edge = get().document.edges.find((e) => e.id === edgeId)
        if (!edge) return
        get().pushCommand({ t: 'remove-edges', edges: [edge] })
        if (get().selectedEdgeId === edgeId) get().selectEdge(null)
      },

      setDoc: (doc, reason) => {
        const before = get().document
        get().pushCommand({ t: 'replace-doc', before, after: doc, reason })
      },

      resetToDemo: () => {
        get().setDoc(createDemoWorkflow(), 'reset')
        get().selectNode(null)
      },

      renameDoc: (name) => {
        const before = get().document.name
        if (before === name) return
        get().pushCommand({ t: 'rename-doc', before, after: name })
      },

      // ---------------------------------------------------------------- HistorySlice
      canUndo: false,
      canRedo: false,

      pushCommand: (command) => {
        applyAndPush(command, get().document)
      },

      undo: () => {
        const entry = history.undo()
        if (!entry) return
        set({ document: entry.before, canUndo: history.canUndo, canRedo: history.canRedo })
        selectAffected(entry.command)
      },

      redo: () => {
        const entry = history.redo()
        if (!entry) return
        set({ document: entry.after, canUndo: history.canUndo, canRedo: history.canRedo })
        selectAffected(entry.command)
      },

      // ---------------------------------------------------------------- RunSlice
      status: 'idle',
      events: [],
      currentIndex: -1,
      nodeStates: {},
      speed: isE2eEnabled() ? 'instant' : 1,
      approvalDecisions: {},
      pendingApprovalNodeId: null,
      runStartedAtWallClock: null,

      start: () => {
        const state = get()
        const reason = selectRunDisabledReason(state)
        if (reason) {
          get().pushToast({ variant: 'error', title: "Can't run", description: reason })
          return
        }
        clearPlaybackTimer()
        const result = simulate(state.document, state.payload, { approvalDecisions: {} })
        set({
          status: 'running',
          events: result.events,
          currentIndex: -1,
          nodeStates: {},
          approvalDecisions: {},
          pendingApprovalNodeId: null,
          runStartedAtWallClock: Date.now(),
        })
        if (get().speed === 'instant') flushRemaining()
        else scheduleNext()
      },

      pause: () => {
        if (get().status !== 'running') return
        clearPlaybackTimer()
        set({ status: 'paused' })
      },

      resume: () => {
        if (get().status !== 'paused') return
        set({ status: 'running' })
        if (get().speed === 'instant') flushRemaining()
        else scheduleNext()
      },

      step: () => {
        clearPlaybackTimer()
        applyNextEvent()
      },

      reset: () => {
        clearPlaybackTimer()
        set({
          status: 'idle',
          events: [],
          currentIndex: -1,
          nodeStates: {},
          approvalDecisions: {},
          pendingApprovalNodeId: null,
          runStartedAtWallClock: null,
        })
      },

      setSpeed: (speed) => {
        set({ speed })
        if (speed === 'instant' && get().status === 'running') {
          clearPlaybackTimer()
          flushRemaining()
        }
      },

      approve: (nodeId) => resolveApproval(nodeId, 'approved'),
      reject: (nodeId) => resolveApproval(nodeId, 'rejected'),

      // ---------------------------------------------------------------- PayloadSlice
      payload: createDemoPayload(),
      setPayload: (payload) => set({ payload }),
      updatePayloadField: (field, value) =>
        set((state) => ({ payload: { ...state.payload, [field]: value } })),
      resetPayload: () => set({ payload: createDemoPayload() }),

      // ---------------------------------------------------------------- UiSlice
      activeMobilePanel: 'canvas',
      openDialogs: new Set<string>(),
      toasts: [],
      setActiveMobilePanel: (panel) => set({ activeMobilePanel: panel }),
      openDialog: (name) =>
        set((state) => ({ openDialogs: new Set(state.openDialogs).add(name) })),
      closeDialog: (name) =>
        set((state) => {
          if (!state.openDialogs.has(name)) return state
          const next = new Set(state.openDialogs)
          next.delete(name)
          return { openDialogs: next }
        }),
      pushToast: (toast) => {
        const id = createId('toast')
        set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
        if (toast.variant !== 'error') {
          setTimeout(() => get().dismissToast(id), 4000)
        }
      },
      dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      // ---------------------------------------------------------------- PersistenceSlice
      persistenceStatus: 'saved',
      lastSavedAt: null,
      markPersistenceError: () => set({ persistenceStatus: 'error' }),

      // ---------------------------------------------------------------- DerivedSlice
      // Seeded synchronously here (so a store built and read in the same
      // tick, e.g. in a test, already has correct values) and kept in sync
      // by the `store.subscribe` below on every `document`/`status` change.
      issues: selectValidationIssues(initialDocument),
      runDisabledReason: null,
    } satisfies OpsflowStore
  })

  /**
   * Keeps `issues`/`runDisabledReason` (`DerivedSlice`) in sync with
   * `document`/`status`. Lives outside the initializer (it needs `store`
   * itself, not just `get`/`set`) but is otherwise just "recompute on the
   * inputs that matter" — the memoization is in `selectValidationIssues`,
   * not here.
   */
  const syncDerived = (): void => {
    const state = store.getState()
    const issues = selectValidationIssues(state.document)
    const runDisabledReason = selectRunDisabledReason(state)
    if (state.issues !== issues || state.runDisabledReason !== runDisabledReason) {
      store.setState({ issues, runDisabledReason })
    }
  }
  syncDerived()
  store.subscribe((state, previous) => {
    if (state.document !== previous.document || state.status !== previous.status) {
      syncDerived()
    }
  })

  return store
}

/** The one live store instance the app uses. */
export const workflowStore = createWorkflowStore()

/** React hook binding to `workflowStore`. Prefer a selector to avoid over-rendering, e.g. `useOpsflowStore((s) => s.document)`. */
export function useOpsflowStore<T>(selector: (state: OpsflowStore) => T): T {
  return useStore(workflowStore, selector)
}
