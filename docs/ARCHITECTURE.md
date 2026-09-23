# OpsFlow — Architecture

**OpsFlow** is a local-first visual studio for designing and _simulating_ incident-response workflows.
No backend, no network at runtime, no credentials. Everything lives in the browser and in `localStorage`.

**Stack (decided, not negotiable):** Vite + React 19 + TypeScript (strict) + npm · `@xyflow/react` v12 ·
Zustand + a hand-rolled command history · zod · Tailwind CSS v4 via `@tailwindcss/vite` with CSS-variable tokens ·
self-hosted `@fontsource` (Cormorant Garamond display + Inter UI) · Vitest + Testing Library + jsdom ·
Playwright (chromium only) · ESLint flat config (typescript-eslint, react-hooks, react-refresh) + Prettier.

**Node 26**, ESM everywhere (`"type": "module"`).

---

## 1. Guiding principles

1. **The domain is pure TypeScript.** `src/domain/**` imports _nothing_ from React, Zustand or React Flow.
   It is the part that is unit-tested exhaustively and the part that can never break because a panel re-rendered.
2. **The simulator is a pure function.** `simulate(workflow, payload, options) -> ExecutionEvent[]`.
   Deterministic, no timers, no `Date.now()` inside. The UI _replays_ the event list on a clock; the
   simulator never knows what a millisecond feels like.
3. **React Flow is a rendering surface, not a source of truth.** The Zustand store owns nodes/edges.
   React Flow change callbacks are translated into store commands.
4. **Every mutation is a command.** Undo/redo is not an afterthought bolted on top of state; the store
   only mutates the document through `applyCommand`.
5. **Module lanes are file-ownership boundaries** so four workers can build in parallel without conflicts.
   Cross-lane communication happens only through the types in `src/domain/types.ts` and the store's public API.

---

## 2. Directory layout

Lane key: **[D]** domain · **[C]** canvas · **[U]** app/panels/components/styles · **[S]** store · **[T]** tests/evidence · **[R]** root config (shared, written once at scaffold time).

```
build-day/
├── index.html                          [R] Vite entry; <html lang="en" class="dark">, meta viewport-fit=cover
├── package.json                        [R] deps + scripts (see §13)
├── vite.config.ts                      [R] react + tailwindcss plugins; vitest `test` block; base './'
├── tsconfig.json                       [R] solution file referencing app/node configs
├── tsconfig.app.json                   [R] strict, noUncheckedIndexedAccess, paths: `@/*` -> `src/*`
├── tsconfig.node.json                  [R] config files + scripts/**
├── eslint.config.js                    [R] flat config: ts-eslint recommendedTypeChecked, react-hooks, react-refresh
├── .prettierrc.json                    [R] 100 cols, single quotes, no semicolons off (semis on), trailing commas
├── .gitignore                          [R] node_modules, dist, qa/screenshots, test-results, playwright-report
├── playwright.config.ts                [T] chromium only; webServer `npm run dev -- --port 5180`; 2 projects: desktop 1440x900, mobile 390x844
├── public/
│   └── gods-plan.jpg                   [U] the painting; hero/empty-state backdrop
├── docs/
│   ├── ARCHITECTURE.md                 this file
│   └── DESIGN.md                       visual system
├── scripts/
│   └── screenshots.ts                  [T] Playwright script -> qa/screenshots/{desktop,mobile}-*.png
├── qa/
│   ├── screenshots/                    [T] generated evidence (gitignored except .gitkeep)
│   └── CHECKLIST.md                    [T] manual QA pass: states, keyboard, contrast, reduced-motion
├── e2e/
│   ├── fixtures.ts                     [T] `test` extended with `opsflow` fixture (boots app, waits for canvas, exposes store handle)
│   ├── helpers.ts                      [T] addNodeFromPalette(), connectByHandleDrag(), runInstant(), readTimeline()
│   ├── editing.spec.ts                 [T] add / connect / configure / duplicate / delete
│   ├── validation.spec.ts              [T] Run disabled + issue list + click-to-select
│   ├── run-critical.spec.ts            [T] critical branch animates to Resolution(resolved)
│   ├── run-noncritical.spec.ts         [T] false branch -> ticket -> slack -> Resolution(mitigated)
│   ├── approval.spec.ts                [T] manual approval pause/approve/reject
│   ├── persistence.spec.ts             [T] edit -> reload -> survives; Reset to demo
│   ├── history.spec.ts                 [T] undo/redo via keyboard and buttons
│   ├── import-export.spec.ts           [T] download, file upload, paste dialog, zod error
│   └── responsive.spec.ts              [T] 390x844 drawers/bottom sheet/tabs
└── src/
    ├── main.tsx                        [U] createRoot, imports styles + fonts, mounts <App/>
    ├── vite-env.d.ts                   [R] vite client types + `window.__opsflow` declaration
    │
    ├── domain/                         [D] pure TS. Zero React imports. 100% unit-tested.
    │   ├── types.ts                    All domain types: WorkflowDocument, WorkflowNode union, edges, payload, events
    │   ├── constants.ts                SCHEMA_VERSION, STORAGE_KEYS, ACTION_TYPES, OPERATORS, HISTORY_CAP, defaults
    │   ├── ids.ts                      `createId(prefix)` — crypto.randomUUID with counter fallback; test-seedable
    │   ├── schema.ts                   zod schemas for every type + `workflowDocumentSchema`; single source for parsing
    │   ├── nodeDefs.ts                 Per-type metadata: label, icon key, accent token, default config, handle spec
    │   ├── factories.ts                `createNode(type, position)`, `duplicateNode(node, offset)`, `createEdge(...)`
    │   ├── graph.ts                    adjacency, outgoers/incomers, reachableFrom(), findCycles(), topo helpers
    │   ├── conditions.ts               `getByPath`, `coerce`, `evaluateCondition(cfg, payload)` (see §5)
    │   ├── validation.ts               `validateWorkflow(doc): ValidationIssue[]` (see §6)
    │   ├── simulator.ts                `simulate(doc, payload, opts): SimulationResult` (see §4)
    │   ├── demoWorkflow.ts             `createDemoWorkflow()` — the "Critical API Incident" graph, fixed ids/positions
    │   ├── demoPayload.ts              `createDemoPayload()` — severity critical, service api-gateway, errorRate 0.42
    │   ├── io.ts                       `exportWorkflow(doc): {filename, json}` / `importWorkflow(text): Result<doc, ImportError>`
    │   ├── persistence.ts              load/save/clear localStorage; debounce lives in the store, not here
    │   ├── migrations.ts               `migrate(unknown): WorkflowDocument | MigrationFailure`; version ladder
    │   ├── format.ts                   `formatOffset(ms)`, `formatClock(base, offset)`, `formatDuration`
    │   └── __tests__/
    │       ├── conditions.test.ts      operator matrix + coercion + dot paths + missing keys
    │       ├── validation.test.ts      one case per issue code, plus a clean demo doc -> []
    │       ├── simulator.test.ts       both branches, failure toggle, approval pause/approve/reject, determinism
    │       ├── graph.test.ts           reachability, cycles, dangling branches
    │       ├── io.test.ts              round-trip, malformed JSON, wrong shape -> readable errors
    │       ├── migrations.test.ts      v0 -> current, corrupt -> failure
    │       └── demoWorkflow.test.ts    demo is valid and runs clean on both payload branches
    │
    ├── store/                          [S] Zustand. The only place the document mutates.
    │   ├── commands.ts                 Command union + `applyCommand(doc, cmd)` / `invertCommand(doc, cmd)`
    │   ├── history.ts                  `HistoryStack` — past/future arrays, cap 100, coalescing key support
    │   ├── workflowStore.ts            Main store: document, selection, history, validation cache, actions
    │   ├── runStore.ts                 Run state: events, cursor, status, speed, nodeStates, approval queue
    │   ├── uiStore.ts                  Panel/drawer/sheet/tab/dialog/toast state; not persisted, not undoable
    │   ├── selectors.ts                Memoized derived reads: `selectIssues`, `selectRunDisabledReason`, `selectNodeState`
    │   ├── autosave.ts                 debounced (600ms) localStorage writer subscribed to the document slice
    │   ├── testHandle.ts               installs `window.__opsflow` when enabled (see §11)
    │   └── __tests__/
    │       ├── history.test.ts         undo/redo ordering, cap, coalescing, future cleared on new command
    │       └── workflowStore.test.ts   add/connect/config/duplicate/delete + autosave payload shape
    │
    ├── canvas/                         [C] React Flow surface.
    │   ├── FlowCanvas.tsx              <ReactFlow> wrapper: nodeTypes, edgeTypes, handlers, Background, Panel
    │   ├── FlowProvider.tsx            <ReactFlowProvider> + resize-safe container
    │   ├── nodeTypes.ts                map type -> component (module-level constant; never inline)
    │   ├── edgeTypes.ts                map 'flow' -> FlowEdge
    │   ├── useFlowSync.ts              store doc <-> RF nodes/edges; onNodesChange/onEdgesChange -> commands (§7)
    │   ├── useCanvasShortcuts.ts       Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z, Cmd/Ctrl+D, Delete/Backspace, Esc
    │   ├── useDropToAdd.ts             HTML5 dnd from palette: dataTransfer type `application/opsflow-node`
    │   ├── CanvasControls.tsx          zoom in/out, fit view, undo/redo, lock — all real buttons with labels
    │   ├── CanvasMinimap.tsx           <MiniMap> with per-type node colors from tokens
    │   ├── RunOverlay.tsx              running-node pulse ring + branch decision chips anchored to nodes
    │   ├── nodes/
    │   │   ├── NodeShell.tsx           shared card chrome: header, accent bar, status ring, badges, handles
    │   │   ├── TriggerNode.tsx         source + filter summary; one source handle
    │   │   ├── ConditionNode.tsx       `field op value` summary; handles id 'true' / 'false' with labels
    │   │   ├── ActionNode.tsx          action icon, target, duration, "will fail" badge
    │   │   ├── ApprovalNode.tsx        role, timeout, policy chip; inline Approve/Reject when awaiting
    │   │   ├── ResolutionNode.tsx      status chip, postmortem flag; target handle only
    │   │   └── NodeIssueBadge.tsx      error/warning dot + tooltip listing that node's issues
    │   └── edges/
    │       ├── FlowEdge.tsx            bezier edge, true/false label pill, traversed/pending/skipped styling
    │       └── edgeStyles.ts           stroke tokens + dash-offset flow animation helpers
    │
    ├── app/                            [U] shell + layout + cross-cutting hooks
    │   ├── App.tsx                     providers: Toaster, ReactFlowProvider, boot gate, error boundary
    │   ├── AppShell.tsx                responsive 3-pane grid (desktop) / canvas + chrome (mobile)
    │   ├── TopBar.tsx                  name field, Run/Stop, validation chip, undo/redo, import/export, reset
    │   ├── BootGate.tsx                loads persisted doc; loading skeleton -> app | corrupt-data error state
    │   ├── AppErrorBoundary.tsx        render-crash fallback with Reset to demo + copy-error
    │   ├── MobileChrome.tsx            bottom tab bar (Canvas/Palette/Inspector/Run) + sheet host
    │   ├── useMediaQuery.ts            `useIsMobile()` at <1024px, SSR-safe, subscribes to matchMedia
    │   ├── useHotkeys.ts               global key handling with input-field guard
    │   └── useReducedMotion.ts         prefers-reduced-motion listener feeding motion tokens
    │
    ├── panels/                         [U] the three panels and their contents
    │   ├── PalettePanel.tsx            5 node cards: click-to-add, draggable, keyboard Enter/Space to add
    │   ├── InspectorPanel.tsx          routes by selected node type; empty state when nothing selected
    │   ├── inspector/
    │   │   ├── TriggerForm.tsx         source select + filter rows (field/op/value, add/remove)
    │   │   ├── ConditionForm.tsx       field path (with payload-key suggestions), operator, value
    │   │   ├── ActionForm.tsx          action type, target, duration ms, "simulate failure" toggle
    │   │   ├── ApprovalForm.tsx        approver role, timeout ms, policy radio group
    │   │   ├── ResolutionForm.tsx      status select, postmortem toggle, summary textarea
    │   │   ├── NodeMetaFields.tsx      label + notes, shared by all types
    │   │   └── useNodeField.ts         binds a config field -> debounced `updateNodeConfig` command
    │   ├── RunPanel.tsx                payload editor + player controls + validation + timeline tabs
    │   ├── PayloadEditor.tsx           form/JSON toggle; JSON textarea validated by zod on change
    │   ├── PlayerControls.tsx          play/pause, speed 1x/2x/instant, step, reset, progress bar
    │   ├── TimelineLog.tsx             virtualized-enough list of ExecutionEvent rows, click -> select node
    │   ├── ApprovalPrompt.tsx          "Awaiting <role>" card with Approve / Reject
    │   └── ValidationPanel.tsx         grouped issue list; each row clickable -> select + centre node
    │
    ├── components/                     [U] presentational primitives (no domain imports beyond types)
    │   ├── Button.tsx  IconButton.tsx  Field.tsx  TextInput.tsx  NumberInput.tsx
    │   ├── Select.tsx  Toggle.tsx  RadioGroup.tsx  Textarea.tsx  Chip.tsx  Badge.tsx
    │   ├── Dialog.tsx                  focus-trapped modal (native <dialog> + custom backdrop)
    │   ├── BottomSheet.tsx             mobile sheet with drag-to-dismiss + focus trap
    │   ├── Drawer.tsx                  mobile left drawer for palette
    │   ├── Tabs.tsx                    roving-tabindex tablist
    │   ├── Tooltip.tsx                 hover/focus tooltip, escape to close
    │   ├── Toaster.tsx                 toast host + `toast()` helper (success/error/info)
    │   ├── EmptyState.tsx  LoadingState.tsx  ErrorState.tsx
    │   ├── HeroWelcome.tsx             gods-plan.jpg backdrop + display type + "Load demo" / "Start blank"
    │   ├── ImportDialog.tsx            file picker + paste textarea + zod error list
    │   ├── ConfirmDialog.tsx           destructive confirm (reset, delete-all)
    │   ├── Icon.tsx                    inline SVG sprite: the 5 node types + 6 action types + UI glyphs
    │   └── __tests__/                  a11y smoke tests for Dialog/BottomSheet/Tabs focus behaviour
    │
    └── styles/
        ├── fonts.ts                    imports @fontsource-variable/cormorant-garamond + inter subsets
        ├── tokens.css                  @theme + :root CSS variables (see DESIGN.md)
        ├── base.css                    resets, focus-visible ring, scrollbars, selection colors
        ├── texture.css                 grain/impasto overlay utilities
        └── index.css                   `@import "tailwindcss";` + the above, imported by main.tsx
```

---

## 3. Data model

`src/domain/types.ts` (sketch — zod mirrors in `schema.ts`, and every type is `z.infer`'d from the schema so
they can never drift):

```ts
export const SCHEMA_VERSION = 2 as const

/* ---------- payload ---------- */
export type Severity = 'critical' | 'high' | 'medium' | 'low'

export interface IncidentPayload {
  title: string
  severity: Severity
  service: string
  errorRate: number // 0..1
  region: string // 'us-east-1' | free text
  affectedUsers: number
  source: string // 'datadog' | 'pagerduty' | ...
  tags: string[]
  detectedAt: string // ISO string, editable
  metadata: Record<string, string | number | boolean> // free-form, dot-path addressable
}

/* ---------- nodes ---------- */
export type NodeType = 'trigger' | 'condition' | 'action' | 'approval' | 'resolution'

export type Operator =
  'equals' | 'not-equals' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'exists'

export interface FilterRule {
  id: string
  field: string
  operator: Operator
  value: string
}

export interface TriggerConfig {
  source: 'pagerduty' | 'datadog' | 'sentry' | 'cloudwatch' | 'manual' | 'webhook'
  filters: FilterRule[] // ALL must match for the run to proceed
  description: string
}

export interface ConditionConfig {
  field: string
  operator: Operator
  value: string
}

export type ActionKind =
  | 'page-oncall'
  | 'post-slack'
  | 'create-ticket'
  | 'rollback-deploy'
  | 'scale-service'
  | 'run-runbook'

export interface ActionConfig {
  action: ActionKind
  target: string // '#incidents', 'sre-primary', 'api-gateway', ...
  durationMs: number // simulated, 0..60000
  simulateFailure: boolean // forces node-failed in the simulation
  continueOnFailure: boolean // if true the run proceeds past a failure
}

export interface ApprovalConfig {
  approverRole: string // 'incident-commander'
  timeoutMs: number // simulated wait budget
  policy: 'manual' | 'auto-approve' | 'auto-reject'
  prompt: string
}

export interface ResolutionConfig {
  status: 'resolved' | 'mitigated' | 'escalated'
  postmortemRequired: boolean
  summary: string
}

interface NodeBase<T extends NodeType, C> {
  id: string
  type: T
  label: string
  notes?: string
  position: { x: number; y: number }
  config: C
}

export type WorkflowNode =
  | NodeBase<'trigger', TriggerConfig>
  | NodeBase<'condition', ConditionConfig>
  | NodeBase<'action', ActionConfig>
  | NodeBase<'approval', ApprovalConfig>
  | NodeBase<'resolution', ResolutionConfig>

export type NodeOfType<T extends NodeType> = Extract<WorkflowNode, { type: T }>
export type ConfigOfType<T extends NodeType> = NodeOfType<T>['config']

/* ---------- edges / document ---------- */
export type BranchHandle = 'true' | 'false'

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: BranchHandle | null // non-null only for condition sources
  label?: string
}

export interface WorkflowDocument {
  schemaVersion: number // === SCHEMA_VERSION when in memory
  id: string
  name: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  updatedAt: string // ISO
}

/* ---------- validation ---------- */
export type IssueSeverity = 'error' | 'warning'

export type ValidationCode =
  | 'NO_TRIGGER'
  | 'MULTIPLE_TRIGGERS'
  | 'TRIGGER_HAS_INPUT'
  | 'NO_RESOLUTION'
  | 'NO_REACHABLE_RESOLUTION'
  | 'DISCONNECTED_NODE'
  | 'UNREACHABLE_NODE'
  | 'DEAD_END_NODE'
  | 'CONDITION_MISSING_BRANCH'
  | 'CONDITION_DUPLICATE_BRANCH'
  | 'CONDITION_MISSING_FIELD'
  | 'ACTION_MISSING_TARGET'
  | 'ACTION_INVALID_DURATION'
  | 'APPROVAL_MISSING_ROLE'
  | 'APPROVAL_INVALID_TIMEOUT'
  | 'RESOLUTION_MISSING_SUMMARY'
  | 'TRIGGER_FILTER_INCOMPLETE'
  | 'CYCLE_DETECTED'
  | 'MULTIPLE_OUTPUTS'
  | 'SELF_LOOP'
  | 'EMPTY_WORKFLOW'

export interface ValidationIssue {
  id: string // stable: `${code}:${nodeId ?? edgeId ?? 'graph'}:${field ?? ''}`
  severity: IssueSeverity
  code: ValidationCode
  message: string // human, imperative: "Condition needs a field to test."
  nodeId?: string
  edgeId?: string
  field?: string // inspector field to focus when the issue row is clicked
}

/* ---------- execution ---------- */
export type NodeRunState =
  'idle' | 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'awaiting-approval'

export type RunStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'awaiting-approval'
  | 'completed'
  | 'failed'
  | 'rejected'
  | 'cancelled'

export type ExecutionEvent =
  | { kind: 'run-started'; at: number; nodeId?: never; payloadSummary: string }
  | { kind: 'node-started'; at: number; nodeId: string; nodeType: NodeType; label: string }
  | {
      kind: 'node-finished'
      at: number
      nodeId: string
      outcome: 'success' | 'failed'
      detail: string
    }
  | { kind: 'node-skipped'; at: number; nodeId: string; reason: string }
  | {
      kind: 'branch-decided'
      at: number
      nodeId: string
      edgeId: string
      branch: BranchHandle
      expression: string
      result: boolean
    }
  | { kind: 'approval-requested'; at: number; nodeId: string; approverRole: string; prompt: string }
  | {
      kind: 'approval-resolved'
      at: number
      nodeId: string
      decision: 'approved' | 'rejected'
      via: 'manual' | 'auto-approve' | 'auto-reject' | 'timeout'
    }
  | { kind: 'trigger-filtered'; at: number; nodeId: string; reason: string }
  | {
      kind: 'run-finished'
      at: number
      status: Exclude<RunStatus, 'idle' | 'running' | 'paused' | 'awaiting-approval'>
      summary: string
    }

export type ExecutionEventKind = ExecutionEvent['kind']

export interface SimulationResult {
  events: ExecutionEvent[]
  status: RunStatus // 'awaiting-approval' when it stopped at a manual gate
  pendingApprovalNodeId?: string
  finalNodeStates: Record<string, NodeRunState>
  totalDurationMs: number
}
```

`at` is a **simulated offset in milliseconds from run start**, never a wall clock. The UI renders
`new Date(runStartedAtWallClock + event.at)` for the timestamp column, so an "instant" run still shows a
plausible incident timeline.

---

## 4. Simulator design

```ts
export interface SimulateOptions {
  approvalDecisions?: Record<string, 'approved' | 'rejected'> // nodeId -> decision
  maxSteps?: number // default 500, hard stop against pathological graphs
}
export function simulate(
  doc: WorkflowDocument,
  payload: IncidentPayload,
  options?: SimulateOptions,
): SimulationResult
```

### Chosen pause strategy: **re-simulation with an accumulating decision map** (not a generator)

When the walker reaches an `approval` node whose policy is `manual` and whose id is **not** in
`approvalDecisions`, it emits `approval-requested`, sets `status: 'awaiting-approval'`,
`pendingApprovalNodeId`, and returns. When the user clicks Approve, the store does:

```ts
decisions[nodeId] = 'approved'
const next = simulate(doc, payload, { approvalDecisions: decisions })
runStore.adoptResult(next) // event list is a strict superset prefix-wise; cursor is kept
```

**Why re-simulation over a generator:**

- `simulate` stays a _total, pure, synchronous function of its inputs_ — trivially unit-testable and
  trivially serializable. A generator holds live closure state that can't be snapshotted, diffed or logged.
- Determinism guarantees the recomputed prefix is byte-identical to the already-played prefix, so the
  player can keep its cursor and just append. We assert this in a unit test
  (`events.slice(0, prevLength)` deep-equals the previous events).
- Undo/redo and "replay this run" become free: a run is fully described by
  `{ documentSnapshotId, payload, decisions }`.
- Cost is irrelevant — graphs are tens of nodes; re-running is microseconds.

The generator alternative was rejected because pausing mid-iteration means the _run_ becomes stateful in a
second place (the iterator) in addition to the store, and a refresh mid-approval would be unrecoverable.

### Walk algorithm

1. Resolve the single `trigger` node. Evaluate every filter rule against the payload (AND). If any fails,
   emit `trigger-filtered` + `run-finished{status:'completed', summary:'No node matched the incident'}`
   and mark all downstream nodes `skipped`.
2. Maintain `clock = 0`, `visited = Set<nodeId>` (guard against cycles; a re-visit emits
   `node-skipped{reason:'Cycle guard'}` and stops that path), and `states: Record<id, NodeRunState>`
   initialised to `idle`.
3. Per node:
   - `trigger` — `node-started`, `clock += 120`, `node-finished success`.
   - `condition` — `node-started`, `clock += 80`, evaluate via `evaluateCondition`, emit
     `branch-decided{branch, edgeId, expression:"severity equals critical", result}`, `node-finished success`.
     Follow the edge whose `sourceHandle` matches the branch. The other branch's exclusive subtree is
     marked `skipped` (computed as `reachableFrom(otherEdge.target)` minus `reachableFrom(takenEdge.target)`).
   - `action` — `node-started`, `clock += config.durationMs`, then
     `node-finished{outcome: config.simulateFailure ? 'failed' : 'success'}`. On failure: if
     `continueOnFailure` we continue, else `run-finished{status:'failed'}` and remaining reachable nodes -> `skipped`.
   - `approval` — `auto-approve`/`auto-reject`: `node-started`, `clock += 250`,
     `approval-resolved{via: policy}`, `node-finished`. `manual`: if a decision exists in the map,
     `clock += 400`, `approval-resolved{via:'manual'}`; otherwise emit `approval-requested` and **return**
     with `status:'awaiting-approval'`. A rejection ends the run: `run-finished{status:'rejected'}`.
   - `resolution` — `node-started`, `clock += 200`, `node-finished success`,
     `run-finished{status:'completed', summary: config.status}`. Terminal.
4. A node with no outgoing edge that is not a `resolution` ends the run with
   `run-finished{status:'completed', summary:'Path ended without a resolution'}` (validation already warns).
5. `maxSteps` exceeded -> `run-finished{status:'failed', summary:'Step limit reached'}`.

No `Math.random`, no `Date.now`, no `setTimeout` anywhere in `simulator.ts`. The `simulateFailure` toggle is
the only failure source, which makes every e2e assertion exact.

### Player (UI replay)

`runStore` owns `{ events, cursor, status, speed, startedAtWallClock, nodeStates, decisions }`.

- `speed: 1 | 2 | 'instant'`.
- Playback is a single `setTimeout` chain (never `setInterval`): after applying `events[cursor]`, schedule
  the next at `(events[cursor+1].at - events[cursor].at) / speedFactor`, clamped to `[16ms, 2500ms]`.
- `instant` applies all remaining events synchronously in one `flushSync`-free batch — used by e2e and by
  the "Instant" button. Node states land on their final values and the timeline is fully populated.
- Applying an event updates `nodeStates` (the reducer `applyEventToStates`, also pure and unit-tested,
  shared with `simulate`'s `finalNodeStates` so UI and domain can't disagree).
- `pause()` clears the pending timeout; `resume()` reschedules from the current cursor.
- Reaching `approval-requested` sets `status:'awaiting-approval'` and stops the chain regardless of speed —
  the Approve/Reject buttons in `ApprovalPrompt` and on the node itself are the only way forward.
- `reset()` clears events, decisions, cursor, and sets all node states to `idle`.
- `prefers-reduced-motion` forces edge-flow animation off and node pulse to a static ring, but the
  step-by-step timing is preserved (it is information, not decoration).

---

## 5. Condition evaluator

`src/domain/conditions.ts`.

```ts
export function getByPath(obj: unknown, path: string): unknown // 'metadata.cluster', 'tags.0'
export function evaluateCondition(cfg: ConditionConfig, payload: IncidentPayload): boolean
export function describeCondition(cfg: ConditionConfig): string // "severity equals critical"
```

**Path resolution** — dot path, split on `.`, numeric segments index arrays. A missing intermediate yields
`undefined` (never throws).

**Operators and semantics** (`value` is always stored as a string in config; coercion happens per operator):

| Operator              | Semantics                             | Coercion                                                                                                                       |
| --------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `equals`              | loose equality after coercion         | if left is `number` -> `Number(value)`; if `boolean` -> `'true'/'false'`; else `String(left) === value`, case-insensitive trim |
| `not-equals`          | `!equals`                             | same                                                                                                                           |
| `gt` `gte` `lt` `lte` | numeric compare                       | both sides through `toNumber`; if either is `NaN` -> `false`                                                                   |
| `contains`            | substring / membership                | `string` left -> case-insensitive `includes`; `array` left -> some element loosely equals value; otherwise `false`             |
| `in`                  | left is one of a comma-separated list | split `value` on `,`, trim, case-insensitive compare against `String(left)`                                                    |
| `exists`              | presence                              | `true` when resolved value is not `undefined` and not `null` and not `''`; `value` field ignored (hidden in the UI)            |

**Coercion rules, stated once:**

- `toNumber(x)`: `number` -> itself; `string` -> `Number(trimmed)` (`''` -> `NaN`); `boolean` -> `1/0`; else `NaN`.
- String comparisons are **trimmed and case-insensitive** — `Critical` matches `critical`. This is the
  friendly-tool choice and it is documented in the inspector helper text.
- Comparing against a missing path is always `false` (except `exists`, which returns `false` too).
- No implicit truthiness: `evaluateCondition` returns a real boolean, always.

---

## 6. Validation

`validateWorkflow(doc): ValidationIssue[]` runs on every document change (memoized on a document revision
counter). Errors block Run; warnings do not.

| Code                         | Sev     | Message                                                                       | Anchors                           |
| ---------------------------- | ------- | ----------------------------------------------------------------------------- | --------------------------------- |
| `EMPTY_WORKFLOW`             | error   | "This workflow is empty. Add a Trigger to begin."                             | graph                             |
| `NO_TRIGGER`                 | error   | "Add a Trigger node — every workflow needs exactly one entry point."          | graph                             |
| `MULTIPLE_TRIGGERS`          | error   | "Only one Trigger is allowed. Remove the extra trigger."                      | each extra `nodeId`               |
| `TRIGGER_HAS_INPUT`          | error   | "A Trigger can't have an incoming connection."                                | `edgeId`                          |
| `NO_RESOLUTION`              | error   | "Add a Resolution node so the workflow can end."                              | graph                             |
| `NO_REACHABLE_RESOLUTION`    | error   | "No Resolution is reachable from the Trigger."                                | graph                             |
| `UNREACHABLE_NODE`           | error   | "\<Label\> can't be reached from the Trigger."                                | `nodeId`                          |
| `DISCONNECTED_NODE`          | error   | "\<Label\> isn't connected to anything."                                      | `nodeId`                          |
| `DEAD_END_NODE`              | warning | "\<Label\> has no outgoing connection — this path ends without a Resolution." | `nodeId`                          |
| `CONDITION_MISSING_BRANCH`   | error   | "Condition \<Label\> is missing its \<true                                    | false\> branch."                  | `nodeId` |
| `CONDITION_DUPLICATE_BRANCH` | error   | "Condition \<Label\> has two \<true\> branches. Remove one."                  | `edgeId`                          |
| `CONDITION_MISSING_FIELD`    | error   | "Choose a payload field for \<Label\> to test."                               | `nodeId`, `field:'field'`         |
| `ACTION_MISSING_TARGET`      | error   | "\<Label\> needs a target (channel, service or rota)."                        | `nodeId`, `field:'target'`        |
| `ACTION_INVALID_DURATION`    | error   | "Duration must be between 0 and 60000 ms."                                    | `nodeId`, `field:'durationMs'`    |
| `APPROVAL_MISSING_ROLE`      | error   | "\<Label\> needs an approver role."                                           | `nodeId`, `field:'approverRole'`  |
| `APPROVAL_INVALID_TIMEOUT`   | error   | "Timeout must be a positive number of milliseconds."                          | `nodeId`, `field:'timeoutMs'`     |
| `TRIGGER_FILTER_INCOMPLETE`  | error   | "Filter \<n\> on \<Label\> is missing a field or value."                      | `nodeId`, `field:'filters'`       |
| `RESOLUTION_MISSING_SUMMARY` | warning | "Add a summary so the postmortem has context."                                | `nodeId`, `field:'summary'`       |
| `MULTIPLE_OUTPUTS`           | error   | "\<Label\> has more than one outgoing connection. Use a Condition to branch." | `nodeId`                          |
| `SELF_LOOP`                  | error   | "A node can't connect to itself."                                             | `edgeId`                          |
| `CYCLE_DETECTED`             | error   | "These nodes form a loop: \<A → B → A\>. Remove a connection."                | first `edgeId` in cycle + nodeIds |

**UI mapping (three surfaces, one source):**

1. **Issue panel** (`ValidationPanel`, always visible on desktop in the Run tab; a badge-count tab on mobile).
   Grouped "Errors" / "Warnings". Each row is a `<button>`: click selects the node, centres the canvas on it
   (`reactFlow.fitView({nodes:[{id}], duration: reducedMotion ? 0 : 400, maxZoom: 1.2})`), opens the
   inspector (bottom sheet on mobile) and focuses `issue.field` if present.
2. **Node badge** (`NodeIssueBadge`) — red dot for errors, amber for warnings, `aria-label` listing messages,
   tooltip on hover/focus.
3. **Run button** — `disabled` when any error exists, with `aria-describedby` pointing at a live region
   reading `"Can't run: 3 issues to fix"`; the tooltip lists the first three messages. Never a silent no-op.

---

## 7. Undo / redo

`src/store/commands.ts` defines the only legal mutations:

```ts
export type Command =
  | { t: 'add-node'; node: WorkflowNode }
  | { t: 'remove-nodes'; nodes: WorkflowNode[]; edges: WorkflowEdge[] } // edges = collateral, for exact inverse
  | { t: 'add-edge'; edge: WorkflowEdge; replaced?: WorkflowEdge } // replaced: same-handle edge evicted
  | { t: 'remove-edges'; edges: WorkflowEdge[] }
  | { t: 'move-nodes'; moves: { id: string; from: XY; to: XY }[] }
  | { t: 'update-config'; nodeId: string; field: string; before: unknown; after: unknown }
  | { t: 'update-meta'; nodeId: string; field: 'label' | 'notes'; before: string; after: string }
  | { t: 'rename-doc'; before: string; after: string }
  | { t: 'duplicate'; nodes: WorkflowNode[]; edges: WorkflowEdge[] }
  | {
      t: 'replace-doc'
      before: WorkflowDocument
      after: WorkflowDocument
      reason: 'import' | 'reset' | 'clear'
    }
```

`applyCommand(doc, cmd)` and `invertCommand(cmd)` are pure; the store keeps
`past: Command[]`, `future: Command[]`, cap **100** (drop oldest, FIFO).

**Recorded:** add node (palette click or drop), remove node(s), add edge, remove edge, node move
(**one command per drag, pushed on `onNodeDragStop`** with the pre-drag positions captured on
`onNodeDragStart`), config change (**debounced 400 ms, coalesced per `nodeId+field`** — typing a Slack
channel is one undo step, not eleven; the coalescing window closes on blur, on selection change, and on
any other command type), label/notes edits (same coalescing), doc rename, duplicate, import, reset-to-demo.

**Not recorded:** selection, hover, viewport/zoom/pan, panel open/close, tab switches, payload edits,
speed changes, run state, approval decisions. Undo never moves the camera on its own; it _does_ select the
nodes affected by the undone command so the change is visible, and calls `fitView` only if those nodes are
outside the viewport.

**Shortcuts** (`useCanvasShortcuts`, ignored while focus is in an input/textarea/contenteditable unless the
key is Escape):

| Keys                              | Action                                                                     |
| --------------------------------- | -------------------------------------------------------------------------- |
| `Cmd/Ctrl+Z`                      | undo                                                                       |
| `Shift+Cmd/Ctrl+Z` _and_ `Ctrl+Y` | redo                                                                       |
| `Delete` / `Backspace`            | delete selection (nodes + their edges, or selected edges)                  |
| `Cmd/Ctrl+D`                      | duplicate selection (+32/+32 offset, selects the copy)                     |
| `Cmd/Ctrl+A`                      | select all nodes                                                           |
| `Escape`                          | clear selection / close top-most sheet or dialog                           |
| `F`                               | fit view · `+`/`-` zoom · arrow keys nudge selection 8px (16px with Shift) |
| `Enter` on a focused palette card | add that node at viewport centre                                           |

**React Flow wiring** (`useFlowSync`):

- Store doc -> RF via a memoized adapter (`toFlowNodes(doc, nodeStates, issues, selection)`).
  Node `data` carries `{ node, runState, issues, isSelected }` so node components never read the store directly
  (keeps re-renders cheap and nodes unit-testable in isolation).
- `onNodesChange`: `position` changes with `dragging: true` are applied to a **transient** position map only
  (no history, no autosave); `dragging: false` ends the drag -> emit one `move-nodes` command.
  `select` changes -> `uiStore.setSelection` (not a command). `remove` changes -> `remove-nodes` command
  (we let RF ask, the store decides, including cascading edges). `dimensions` changes are ignored.
- `onEdgesChange`: only `remove` matters -> `remove-edges` command.
- `onConnect`: validated by `canConnect(doc, connection)` before becoming an `add-edge` command —
  rejects self-loops, edges into a trigger, out of a resolution, duplicate source-handle edges
  (those _replace_, recorded via `replaced`), and a second output on non-condition nodes. A rejected
  connection shows a toast explaining why.
- `isValidConnection` gives the same answer live, so invalid handles grey out during the drag.

---

## 8. Persistence

```ts
const STORAGE_KEYS = {
  document: 'opsflow:document:v2',
  payload: 'opsflow:payload:v2',
  ui: 'opsflow:ui:v1', // panel sizes, last tab, form/JSON mode, speed
} as const
```

- **Write**: `autosave.ts` subscribes to the document slice, debounces **600 ms** (trailing, plus a flush on
  `visibilitychange: hidden` and `pagehide`), writes `JSON.stringify({...doc, schemaVersion, updatedAt})`.
  The top bar shows "Saved · 19:42" / "Saving…" from this subscription — a real indicator, not decoration.
- **Read (boot)**: `BootGate` runs `loadDocument()` -> `migrate(raw)` -> `workflowDocumentSchema.safeParse`.
  - Missing key -> hero/welcome state (`HeroWelcome`) with **Load the demo incident** and **Start blank**.
  - Valid -> straight into the editor.
  - Parse/migrate failure -> full-panel `ErrorState`: "We couldn't read your saved workflow." + the zod
    issue list (collapsed), **Reset to demo** (clears the key, loads demo) and **Download raw data**
    (a Blob of the unparsable string so the user loses nothing). The corrupt value is _never_ silently
    discarded before the user chooses.
  - `localStorage` unavailable (private mode / quota) -> app runs in memory, a persistent warning chip
    "Changes won't be saved in this browser" appears in the top bar.
- **Migrations**: `migrations.ts` holds `migrators: Record<number, (d: any) => any>` applied in ascending
  order from `raw.schemaVersion ?? 1` to `SCHEMA_VERSION`. v1 -> v2 exists as a real example
  (v1 stored `action.kind` as a free string and had no `continueOnFailure`; the migrator maps unknown kinds
  to `run-runbook` and defaults the flag to `false`). Unknown _future_ version -> refuse, show the error state.
- Quota errors on write -> toast "Storage is full — export your workflow to keep it." and autosave backs off.

---

## 9. Import / export

**Export**: `exportWorkflow(doc)` returns `{ filename, json }` where
`filename = opsflow-${slug(doc.name)}-${yyyyMMdd-HHmm}.json` (e.g. `opsflow-critical-api-incident-20260923-1942.json`)
and `json = JSON.stringify(doc, null, 2)`. The UI creates a `Blob(['...'], {type:'application/json'})`,
`URL.createObjectURL`, a temporary `<a download>`, clicks it, then `revokeObjectURL` on the next tick.
Also offers **Copy JSON** to clipboard as a fallback.

**Import** (`ImportDialog`, one dialog, two tabs):

- _File_ — `<input type="file" accept="application/json,.json">`, always in the DOM (visually hidden but
  not `display:none`) so Playwright's `setInputFiles` can reach it; a visible "Choose file…" button labels it.
  Drag-and-drop onto the dialog also works.
- _Paste_ — a `<textarea>` plus **Import** button; validates on submit and on paste (debounced), so errors
  appear before the user commits.

`importWorkflow(text)` returns a discriminated result:

```ts
type ImportResult =
  | { ok: true; doc: WorkflowDocument; warnings: string[] }
  | { ok: false; kind: 'json'; message: string } // JSON.parse failed, with position
  | { ok: false; kind: 'schema'; issues: { path: string; message: string }[] }
  | { ok: false; kind: 'version'; message: string }
```

zod errors are flattened by a `formatZodIssues` helper into `nodes[2].config.durationMs — Expected number,
received string`, rendered as a list inside the dialog with the offending path in monospace. Import applies
as a single `replace-doc` command, so **Cmd+Z undoes an import**, and shows a success toast with node/edge counts.

**Playwright**:

```ts
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: 'Export' }).click(),
])
expect(download.suggestedFilename()).toMatch(/^opsflow-.*\.json$/)
const doc = JSON.parse(await readFile(await download.path(), 'utf8'))
// upload
await page.getByRole('button', { name: 'Import' }).click()
await page.setInputFiles('input[type=file]', tmpPath)
// paste
await page.getByRole('tab', { name: 'Paste JSON' }).click()
await page.getByRole('textbox', { name: 'Workflow JSON' }).fill(JSON.stringify(doc))
```

---

## 10. Responsive strategy

Breakpoints: `<640` phone · `640–1023` tablet (two-pane: canvas + one docked panel) · `≥1024` desktop
three-pane · `≥1440` roomy (wider inspector, timeline gets its own column in the Run tab).

**Desktop 1440×900** — CSS grid `[280px] [1fr] [360px]`, full height, `min-h-0` everywhere so only the panel
bodies scroll. Palette and inspector are resizable via a keyboard-accessible splitter (`role="separator"`,
arrow keys, persisted in `ui` storage). Run panel is a bottom dock inside the centre column (collapsible,
default 260px) so the canvas and timeline are visible during a run.

**Mobile 390×844** — the canvas is the page; chrome collapses:

- **Top bar** shrinks to: workflow name (truncated), validation chip, Run button, overflow "⋯" menu
  (import, export, reset, undo, redo).
- **Palette** -> left `Drawer` opened by the "Add node" FAB. Tapping a node card **adds it at the current
  viewport centre** (`reactFlow.screenToFlowPosition(centerOfViewport)`), closes the drawer, selects the new
  node and opens the inspector sheet. Drag-to-add is desktop-only (pointer:fine); the click path is the
  primary path on every device, which is also what the e2e tests use.
- **Inspector** -> `BottomSheet` at 60% height with a drag handle, auto-opens on node select, swipe-down or
  Escape to dismiss, focus trapped, `aria-modal`. Canvas stays visible above it and pans so the selected
  node isn't behind the sheet.
- **Run panel** -> a full-height sheet opened by Run, with a `Tabs` strip: **Payload · Timeline · Issues**.
  During playback it docks to a 96px mini-player (play/pause, speed, progress, "Expand") so the animation on
  the canvas is watchable.
- **Approval** prompts surface as a sticky banner above the mini-player _and_ inline on the node.
- Touch: `panOnDrag` with two fingers off, one-finger pan on empty canvas, pinch zoom, `nodesDraggable`
  with a 8px activation threshold, minimap hidden below 640px (controls stay), 44px minimum hit targets,
  `touch-action: none` only on the canvas surface, `overscroll-behavior: none` on the shell to kill
  pull-to-refresh, `100dvh` not `100vh`, `env(safe-area-inset-bottom)` padding on the tab bar.

---

## 11. Testing strategy

### Vitest (jsdom, `src/**/__tests__`) — domain and store

`conditions`: all nine operators × (number, string, boolean, array, missing) · dot paths into `metadata` ·
case-insensitivity · `in` list parsing · `NaN` safety.
`validation`: one focused test per code above + "demo workflow has zero issues" + "warning does not block run".
`graph`: reachability from trigger, unreachable set, cycle detection incl. self loop, exclusive-subtree skip set.
`simulator`: critical path event sequence (exact `kind`/`nodeId` array), non-critical path, action failure stops
run, `continueOnFailure`, auto-approve, auto-reject, manual pause -> `awaiting-approval` -> resume produces an
**identical prefix**, determinism (two calls deep-equal), `maxSteps` guard, trigger filter rejection,
offsets monotonic non-decreasing.
`io`: round-trip equality, bad JSON message, schema issue paths, unknown version.
`migrations`: v1 fixture -> v2, corrupt -> failure.
`history`: cap 100, redo cleared on new command, config coalescing per node+field, move recorded once.
`workflowStore`: add/connect/configure/duplicate/delete produce the right doc + right history depth.
Component smoke tests (Testing Library): `Dialog`/`BottomSheet` focus trap + Escape, `ValidationPanel` row click
calls select, `ConditionForm` writes a debounced command, `TimelineLog` renders one row per event.

### Playwright (chromium, projects `desktop` 1440×900 and `mobile` 390×844)

| Spec                      | Covers                                                                                                                                                                                                                                                |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `editing.spec.ts`         | palette click adds node at centre; drag from palette adds at drop point (desktop); **real mouse drag between handles creates an edge**; configure via inspector persists to the node card; `Cmd/Ctrl+D` duplicates; `Delete` removes node + its edges |
| `validation.spec.ts`      | delete the Trigger -> Run disabled + reason text; issue row click selects and centres the node; fix it -> Run enabled                                                                                                                                 |
| `run-critical.spec.ts`    | demo + critical payload, speed **instant**, auto-approve policy: timeline shows `branch-decided true`, page-oncall -> approval -> rollback -> Resolution(resolved); node states end `success`; false-branch nodes `skipped`                           |
| `run-noncritical.spec.ts` | payload severity `low` -> `branch-decided false` -> create-ticket -> post-slack -> Resolution(mitigated)                                                                                                                                              |
| `approval.spec.ts`        | manual policy pauses with `awaiting-approval`; Approve continues; Reject ends with status `rejected`                                                                                                                                                  |
| `persistence.spec.ts`     | rename + move + configure, `page.reload()`, everything survives; Reset to demo restores                                                                                                                                                               |
| `history.spec.ts`         | add node -> `Cmd+Z` gone -> `Shift+Cmd+Z` back; typing a target is one undo step; move undo restores position                                                                                                                                         |
| `import-export.spec.ts`   | export download filename + parseable content; import via `setInputFiles`; import via paste; malformed paste shows readable zod errors; import is undoable                                                                                             |
| `responsive.spec.ts`      | mobile: FAB -> palette drawer -> tap adds; node tap opens inspector sheet; Run tab strip works; no horizontal overflow                                                                                                                                |

**How e2e adds nodes:** always **palette click** (`getByRole('button', { name: 'Add Action node' })`), which
adds at viewport centre and selects the node. Deterministic, works identically on desktop and mobile.

**How e2e connects nodes:** primarily a **test-only store handle**, plus at least one real drag test.

```ts
// src/store/testHandle.ts — installed only when enabled
const e2eEnabled =
  import.meta.env.MODE === 'test' || new URLSearchParams(location.search).has('e2e')
if (e2eEnabled) {
  window.__opsflow = {
    connect: (source, target, sourceHandle = null) =>
      workflowStore.getState().connect({ source, target, sourceHandle }),
    getDocument: () => workflowStore.getState().document,
    getRun: () => ({ status: runStore.getState().status, events: runStore.getState().events }),
    setPayload: (p) => runStore.getState().setPayload(p),
    reset: () => workflowStore.getState().resetToDemo(),
    clearStorage: () => localStorage.clear(),
  }
}
```

Tests open `/?e2e=1`. The handle is **not a second code path** — every method calls the same store action the
UI calls, so it can't mask a broken button. `vite.config.ts` does not tree-shake it out in dev/preview builds
used by Playwright, but the flag keeps it inert for normal users.

`editing.spec.ts` contains the mandatory **real drag-connect**:

```ts
const from = page.locator(
  '[data-testid="node-condition-1"] .react-flow__handle-bottom[data-handleid="true"]',
)
const to = page.locator('[data-testid="node-action-page"] .react-flow__handle-top')
const a = await from.boundingBox()
const b = await to.boundingBox()
await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
await page.mouse.down()
await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 24 }) // steps matter: RF needs pointermove events
await page.mouse.up()
await expect
  .poll(() => page.evaluate(() => window.__opsflow.getDocument().edges.length))
  .toBe(n + 1)
```

**Run tests use speed `instant`** (set via the UI control, asserted through the timeline), except one
`run-critical` case at 2× that asserts the _intermediate_ `running` state on a node — that one uses
`expect.poll` against `data-run-state`, never a fixed sleep.

Every interactive element gets a stable `data-testid` _and_ an accessible name; tests prefer
`getByRole`/`getByLabel` and fall back to testids only for canvas internals.

---

## 12. Accessibility & states (cross-cutting requirements the implementers must honour)

- Canvas nodes are focusable (`tabIndex=0`), `role="button"`, `aria-label` = "\<Type\> node: \<label\>, \<state\>",
  Tab order follows document order; Enter opens the inspector.
- An `aria-live="polite"` region announces run progress ("Page on-call running", "Branch: true",
  "Approval required from incident-commander") and a `role="alert"` region announces failures.
- Every form control has a `<label>`, `aria-describedby` for help text, `aria-invalid` + error text for issues.
- Focus is visible everywhere (2px gold ring, 2px offset), never removed.
- `prefers-reduced-motion: reduce` -> no edge dash animation, no pulse, no sheet slide (fade only), `fitView duration 0`.
- Four states designed for every async/empty surface: **empty** (no workflow / no selection / no run yet /
  no issues), **loading** (boot skeleton, import parsing), **success** (toasts, saved chip, run-complete summary),
  **error** (corrupt storage, import failure, run failed, connection rejected). No spinner-only screens.
- **No placeholder controls.** If it is on screen it does something. No "coming soon", no disabled-forever buttons.

---

## 13. package.json scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 5180",
    "lint": "eslint . --max-warnings 0",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc -b --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "screenshots": "playwright test scripts/screenshots.ts --project=desktop --reporter=line",
    "verify": "npm run typecheck && npm run lint && npm run test && npm run build"
  }
}
```

`scripts/screenshots.ts` drives both viewports itself and writes:
`qa/screenshots/desktop-{hero,editor,inspector,validation,run-running,run-complete,import}.png` at 1440×900 and
`qa/screenshots/mobile-{hero,canvas,palette-drawer,inspector-sheet,run-tab,timeline}.png` at 390×844.

---

## 14. Risks and mitigations

| Risk                                                                                              | Mitigation                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **React Flow needs `ResizeObserver` + layout in jsdom** — nodes render at 0×0 and RF warns/throws | Do **not** unit-test the canvas. `src/test/setup.ts` polyfills `ResizeObserver`, `DOMMatrixReadOnly`, `Element.prototype.getBoundingClientRect` (fixed 1440×900 box) and `matchMedia`; canvas behaviour is covered by Playwright, where it is real. Node components are tested standalone inside a `<ReactFlowProvider>` with mocked `data`. |
| **Playwright drag inside React Flow is flaky**                                                    | Use `mouse.move/down/move({steps:20+})/up` — never `dragTo` (single move, RF ignores it). Disable zoom-on-scroll during that test. Keep exactly one drag-connect and one drag-from-palette test; everything else uses the store handle or palette clicks. `expect.poll` instead of sleeps.                                                   |
| **Fonts** — CDN is forbidden and FOUT is ugly                                                     | `@fontsource-variable/cormorant-garamond` + `@fontsource-variable/inter`, imported in `styles/fonts.ts`, `font-display: swap`, `latin` subset only, with a `local()`-first system fallback stack tuned with `size-adjust` so the swap doesn't reflow.                                                                                        |
| **Tailwind v4 has no `tailwind.config.js`**                                                       | Config lives in CSS: `@import "tailwindcss";` then `@theme { --color-navy-900: #05070f; ... }` in `tokens.css`, plugged in through `@tailwindcss/vite`. No PostCSS file, no JS config. Semantic tokens are plain CSS variables so React Flow's inline styles can read them too.                                                              |
| **Node 26 / React 19 peer warnings** (`@xyflow/react`, testing-library)                           | Pin `@xyflow/react@^12`, `@testing-library/react@^16` (React 19 ready). If any transitive peer complains, resolve with `overrides` in package.json rather than `--legacy-peer-deps`, and record it here.                                                                                                                                     |
| **React 19 StrictMode double-invoke** duplicating nodes on add                                    | All mutations go through the store during event handlers (never in effects); ids come from `createId()` inside the command factory, called once per event.                                                                                                                                                                                   |
| **localStorage quota / private mode**                                                             | Feature-detect on boot with a write probe; degrade to in-memory with a visible warning chip.                                                                                                                                                                                                                                                 |
| **Re-simulation after approval diverging from the played prefix**                                 | Simulator is pure and decision-keyed; a unit test asserts prefix identity, and `adoptResult` asserts it at runtime in dev (`console.assert`) before splicing.                                                                                                                                                                                |
| **Large graphs re-rendering on every keystroke**                                                  | Config edits are debounced into commands; RF `nodes` array is rebuilt only when the doc revision or node states change (`useMemo` on revision counters); node components are `memo`'d on `data` identity.                                                                                                                                    |
| **Canvas unusable on 390px**                                                                      | Minimum zoom 0.2, `fitView` on mount and on orientation change, sheets never cover more than 60% of the height, and a `responsive.spec.ts` assertion that `document.scrollingElement.scrollWidth <= 390`.                                                                                                                                    |
