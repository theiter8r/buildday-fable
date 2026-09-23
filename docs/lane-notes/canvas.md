# Canvas lane notes

Status: canvas lane (`src/canvas/**`) implemented per ARCHITECTURE.md §2/§7,
DESIGN.md node/edge specs, and the task brief. Builds and tests green in
isolation (see verification section of the final report). No contract files
were edited.

## Duplication / adapters that should be reconciled by integration

1. **`canConnect` duplicates a subset of `workflowStore#addEdge`'s
   validation** (`src/canvas/canConnect.ts` vs `src/store/workflowStore.ts`).
   The store lane owns `workflowStore.ts` so this lane couldn't refactor it
   to share one predicate. Request: export a `canConnect(doc, connection)`
   (or equivalent) from the store lane and have both `addEdge` and this
   lane's `isValidConnection` call it, so the self-loop / trigger-input /
   resolution-output / duplicate-edge rules live in exactly one place.

2. **`useFocusNodeRequests` uses a `window` CustomEvent adapter
   (`opsflow:focus-node`)** instead of a store field, because
   `WorkflowSlice`/`RunSlice` (`src/store/types.ts`) have no "please centre
   this node" field as of this writing. Any lane that wants to trigger a
   focus (e.g. `ValidationPanel`/`TimelineLog` row click) can either:
   - dispatch `window.dispatchEvent(new CustomEvent('opsflow:focus-node', { detail: { nodeId } }))`
     today (this hook already listens for it), or
   - wait for a store field and this file gets a one-line swap.

3. ~~`useReducedMotionPreference`~~ — resolved: the app lane's
   `src/app/useReducedMotion.ts` landed while this lane was in progress, so
   canvas code was switched to import that instead of keeping a local copy.

## Known content gaps (not this lane's file to edit)

- `docs/CONTENT.md`'s `inspector.trigger.source.option.*` only documents
  `pagerduty`/`datadog`/`manual`/`synthetic`, but the domain's
  `TriggerConfig.source` union (`src/domain/types.ts`) also allows
  `sentry`/`cloudwatch`/`webhook`. `src/canvas/nodes/labels.ts` fills the gap
  with short local labels for the node-card summary line rather than
  inventing new CONTENT.md keys.
- `src/components/icons` has one shared icon per `NodeType` but no
  per-`ActionKind` icon (pager/slack/ticket/rollback/scale/runbook) as
  DESIGN.md §5 "Action" describes ("per-action icon"). `ActionNode` uses the
  shared Action icon (via `NodeShell`) and conveys the specific action kind
  through its text summary line instead.

## Files written (all new, under `src/canvas/**`)

- `FlowCanvas.tsx`, `FlowProvider.tsx`, `nodeTypes.ts`, `edgeTypes.ts`,
  `types.ts`, `canConnect.ts`, `useFlowSync.ts`, `useCanvasShortcuts.ts`,
  `useDropToAdd.ts`, `useAddNodeAtCenter.ts`, `useFocusNodeRequests.ts`,
  `CanvasControls.tsx`, `CanvasMinimap.tsx`, `RunOverlay.tsx`, `canvas.css`
- `nodes/NodeShell.tsx`, `nodes/statusMeta.ts`, `nodes/labels.ts`,
  `nodes/NodeIssueBadge.tsx`, `nodes/TriggerNode.tsx`,
  `nodes/ConditionNode.tsx`, `nodes/ActionNode.tsx`,
  `nodes/ApprovalNode.tsx`, `nodes/ResolutionNode.tsx`
- `edges/FlowEdge.tsx`, `edges/edgeStyles.ts`
- `__tests__/rfMocks.ts`, `__tests__/nodeTypes.test.ts`,
  `__tests__/isValidConnection.test.ts`, `__tests__/FlowCanvas.test.tsx`

## Known gaps / left for integration

- `RunSlice.start/pause/resume/step/reset/approve/reject` are still
  typed no-ops in `workflowStore.ts` (store lane's own TODOs), so
  `nodeStates`/`status` stay `idle`/`{}` until that lane wires the
  simulator. The canvas already reads `nodeStates`/`issues`/`status`
  correctly and will light up once that lane lands — no canvas change
  needed.
- `RunOverlay` branch chips and `FlowEdge` traversed/skipped/failed styling
  are derived purely from `nodeStates`, not from raw `ExecutionEvent`s, to
  avoid depending on the run lane's event shape while it's still a stub.
  This is simpler and should keep working once run state is wired, but if
  a specific pixel-precise "which single edge is currently animating"
  requirement shows up in review, it may need the raw event log instead.
- Per-action icons (see above) and the exact `describeCondition`/
  `formatDuration` domain helpers (currently throwing stubs in
  `src/domain/conditions.ts` / `format.ts`) were intentionally not called
  from the canvas lane; `nodes/labels.ts` has small local equivalents so
  canvas rendering doesn't crash while those land. Once they're
  implemented, `ConditionNode`'s summary line could switch to
  `describeCondition` for one source of truth.
