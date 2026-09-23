# Spike: React Flow v12 + Playwright for OpsFlow

Stack under test: Vite + React 19 + TypeScript + `@xyflow/react` v12 (React Flow) + Zustand + Vitest/jsdom + Playwright (chromium, plus a mobile project).

This doc is implementation notes for two teams: the **app team** building the flow canvas, and the **test team** writing Vitest + Playwright coverage for it. Code samples use the exact v12 API names (`@xyflow/react`, not the old `reactflow` package).

---

## A. React Flow v12 essentials

### A.1 Required CSS import

```tsx
// main.tsx / App.tsx — must be imported once, globally
import '@xyflow/react/dist/style.css'
```

If you only need the minimal base styles (no default node/edge visuals) there's also `@xyflow/react/dist/base.css`, but for OpsFlow use the full `style.css` and override with Tailwind.

### A.2 Provider + core component

```tsx
import { ReactFlow, ReactFlowProvider } from '@xyflow/react'

function App() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  )
}
```

`ReactFlowProvider` is required whenever you need `useReactFlow()`, `useViewport()`, or any hook that reaches into the internal Zustand store from _outside_ the `<ReactFlow>` tree (e.g. a toolbar rendered as a sibling). If everything lives inside `<ReactFlow>` as children, you can skip it, but for OpsFlow (external palette, external minimap controls, external "center view" button) always wrap the whole canvas area.

### A.3 Core props

```tsx
<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  nodeTypes={nodeTypes}
  edgeTypes={edgeTypes}
  isValidConnection={isValidConnection}
  fitView
  minZoom={0.1}
  maxZoom={2}
  panOnScroll
  selectionOnDrag
  deleteKeyCode={['Backspace', 'Delete']}
  multiSelectionKeyCode={['Meta', 'Control']}
  nodesDraggable
  onNodeDragStop={onNodeDragStop}
  onNodesDelete={onNodesDelete}
  onEdgesDelete={onEdgesDelete}
  colorMode="dark"
  proOptions={{ hideAttribution: true }}
>
  <Background />
  <MiniMap />
  <Controls />
</ReactFlow>
```

Notes:

- `nodeTypes` / `edgeTypes` objects **must be stable references** (defined outside the component, or memoized with `useMemo`/module scope). Recreating them every render forces React Flow to remount all custom nodes/edges — a very common perf bug.
- `colorMode` is new in v12: `'light' | 'dark' | 'system'`. It sets `data-colormode`/class on the wrapper so your CSS (and Tailwind dark-only theme, see Section D) can hook into it. OpsFlow is dark-only, so hardcode `colorMode="dark"`.
- `proOptions={{ hideAttribution: true }}` removes the "React Flow" watermark. This is allowed under the MIT license as long as you're not on a paid Pro plan requirement notice — check `xyflow/xyflow` discussion #2961 if you need the exact licensing nuance, but for an internal/paid product it's standard practice to hide it.
- `deleteKeyCode` / `multiSelectionKeyCode` accept a string, an array of strings, or `null` to disable entirely. Pass `null` if you want to implement your own delete/multi-select keybinding (e.g. because you're also using Backspace for something else).
- `panOnScroll` + `selectionOnDrag` together give you "Figma-style" interaction: click-drag on empty canvas draws a selection box instead of panning, and scroll/trackpad pans. If you want scroll-to-zoom instead of pan, drop `panOnScroll` (default zoom-on-scroll behavior applies).

### A.4 Change handlers: `applyNodeChanges` / `applyEdgeChanges` / `addEdge`

```tsx
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from '@xyflow/react'
import { useCallback, useState } from 'react'

const [nodes, setNodes] = useState<Node[]>(initialNodes)
const [edges, setEdges] = useState<Edge[]>(initialEdges)

const onNodesChange: OnNodesChange = useCallback(
  (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
  [],
)

const onEdgesChange: OnEdgesChange = useCallback(
  (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
  [],
)

const onConnect: OnConnect = useCallback(
  (connection) => setEdges((eds) => addEdge(connection, eds)),
  [],
)
```

Or use the convenience hooks `useNodesState` / `useEdgesState` which wrap the above:

```tsx
import { useNodesState, useEdgesState } from '@xyflow/react'

const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
```

### A.5 `useReactFlow()`

```tsx
import { useReactFlow } from '@xyflow/react'

function Toolbar() {
  const { fitView, zoomIn, zoomOut, screenToFlowPosition, getViewport, setViewport } =
    useReactFlow()

  return (
    <div>
      <button onClick={() => fitView({ duration: 200, padding: 0.2 })}>Fit</button>
      <button onClick={() => zoomIn({ duration: 150 })}>+</button>
      <button onClick={() => zoomOut({ duration: 150 })}>-</button>
    </div>
  )
}
```

`getViewport()` returns `{ x, y, zoom }`; `setViewport({ x, y, zoom }, { duration })` animates to it. Must be called from inside `<ReactFlowProvider>`.

### A.6 Adding a node at the viewport center

Use `screenToFlowPosition` (renamed from `project`/`screenToFlowCoordinate` in earlier versions) with the wrapper's bounding rect:

```tsx
function AddNodeButton() {
  const { screenToFlowPosition } = useReactFlow()
  const wrapperRef = useRef<HTMLDivElement>(null)

  const addNodeAtCenter = () => {
    const bounds = wrapperRef.current!.getBoundingClientRect()
    const centerScreen = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    }
    const position = screenToFlowPosition(centerScreen)
    addNode({ id: crypto.randomUUID(), type: 'action', position, data: { label: 'New step' } })
  }

  return <button onClick={addNodeAtCenter}>Add node</button>
}
```

`screenToFlowPosition` already accounts for the canvas's own bounding rect internally (it reads the DOM), so you generally only need `event.clientX/clientY` directly — no manual offset subtraction needed, unlike the old `project()` API which took _relative_ coordinates. Passing absolute screen coordinates is correct.

### A.7 Drag-and-drop from an external palette

```tsx
// Palette item
;<div
  draggable
  onDragStart={(event) => {
    event.dataTransfer.setData('application/opsflow-node-type', 'condition')
    event.dataTransfer.effectAllowed = 'move'
  }}
>
  Condition
</div>

// Canvas wrapper
function FlowCanvas() {
  const { screenToFlowPosition } = useReactFlow()

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const type = event.dataTransfer.getData('application/opsflow-node-type')
      if (!type) return

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      addNode({ id: crypto.randomUUID(), type, position, data: { label: type } })
    },
    [screenToFlowPosition],
  )

  return (
    <div className="h-full w-full" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow nodes={nodes} edges={edges} /* ... */ />
    </div>
  )
}
```

`onDragOver` **must** call `preventDefault()` or `onDrop` will never fire (standard HTML5 DnD gotcha, not React-Flow-specific).

### A.8 `MiniMap`, `Controls`, `Background`

```tsx
<MiniMap
  nodeColor={(node) => (node.data?.color as string) ?? '#64748b'}
  maskColor="rgba(2, 6, 23, 0.7)"
  pannable
  zoomable
/>
<Controls showZoom showFitView showInteractive={false} />
<Background variant={BackgroundVariant.Dots} gap={16} size={1} />
{/* other variants: BackgroundVariant.Lines, BackgroundVariant.Cross */}
```

`<Controls>` gives you zoom in/out/fit/lock buttons for free. If OpsFlow needs custom-styled buttons (e.g. matching the navy dark theme with Tailwind), build your own panel using `useReactFlow()` (`zoomIn`, `zoomOut`, `fitView`) placed inside a `<Panel position="top-right">` instead of `<Controls>` — same behavior, full style control.

### A.9 Handles with multiple source handles (Condition node true/false)

```tsx
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'

type ConditionData = { label: string }
type ConditionNode = Node<ConditionData, 'condition'>

function ConditionNode({ data }: NodeProps<ConditionNode>) {
  return (
    <div className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100">
      <Handle type="target" position={Position.Top} />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: '25%' }} />
      <Handle type="source" position={Position.Bottom} id="false" style={{ left: '75%' }} />
    </div>
  )
}
```

Edges connecting to a specific handle must set `sourceHandle: 'true'` / `sourceHandle: 'false'` — `addEdge`/`onConnect` already receive this from the `Connection` object, so just pass it through unmodified. When rendering edges, `sourceHandle` on the `Edge` object determines which handle it visually attaches to.

### A.10 `isValidConnection`

```tsx
import type { IsValidConnection } from '@xyflow/react'

const isValidConnection: IsValidConnection = (connection) => {
  // Disallow connecting a node to itself
  if (connection.source === connection.target) return false
  // Disallow more than one outgoing edge per condition-handle
  const alreadyConnected = edges.some(
    (e) => e.source === connection.source && e.sourceHandle === connection.sourceHandle,
  )
  return !alreadyConnected
}
```

Pass it both to `<ReactFlow isValidConnection={...} />` (governs all handles) and/or per-`<Handle isValidConnection={...} />` for handle-specific rules.

### A.11 Custom node typing (v12 generics)

```tsx
import type { Node, NodeProps } from '@xyflow/react'

type ActionData = { label: string; status: 'idle' | 'running' | 'done' }
type ActionNodeType = Node<ActionData, 'action'>

export function ActionNode({ id, data, selected }: NodeProps<ActionNodeType>) {
  return (
    <div className={selected ? 'ring-2 ring-cyan-400' : ''}>
      <Handle type="target" position={Position.Left} />
      <span>{data.label}</span>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

const nodeTypes = { action: ActionNode, condition: ConditionNode } satisfies NodeTypes
```

Register the union of all node types as your app-wide `Node` type (`type AppNode = ActionNodeType | ConditionNode`) and use it for `useNodesState<AppNode>` / `useState<AppNode[]>` so `data` narrows correctly per `node.type`.

### A.12 Custom edges (`BaseEdge`, `getBezierPath`/`getSmoothStepPath`, `EdgeLabelRenderer`)

```tsx
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
  type Edge,
} from '@xyflow/react'

type LabeledEdge = Edge<{ label: string }, 'labeled'>

export function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style,
}: EdgeProps<LabeledEdge>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan rounded bg-slate-900 px-1.5 py-0.5 text-xs text-slate-200"
        >
          {data?.label}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
```

`EdgeLabelRenderer` renders into a portal positioned over the canvas, _outside_ the SVG — that's required because you can't put arbitrary HTML (rounded corners, flex layout) inside an SVG `<text>`. Add `nodrag nopan` classes so clicking/dragging the label doesn't move the node or pan the canvas.

### A.13 Animated edges via CSS

React Flow's built-in `animated: true` edge prop uses a CSS class (`.react-flow__edge-path` gets `stroke-dasharray` + `animation`). To customize the animated dash look:

```css
.react-flow__edge.animated path {
  stroke-dasharray: 5;
  animation: opsflow-dash 0.5s linear infinite;
}

@keyframes opsflow-dash {
  to {
    stroke-dashoffset: -10;
  }
}
```

Respect reduced motion (see Section D):

```css
@media (prefers-reduced-motion: reduce) {
  .react-flow__edge.animated path {
    animation: none;
  }
}
```

### A.14 `onNodeDragStop` for recording moves once

Use `onNodeDragStop` (fires once per drag gesture), not `onNodeDrag` (fires continuously), to persist position/undo-history:

```tsx
const onNodeDragStop: OnNodeDrag = useCallback((_event, node) => {
  recordHistory({ type: 'move', nodeId: node.id, position: node.position })
}, [])
```

For multi-select drags there's also `onSelectionDragStop` with the full array of dragged nodes.

### A.15 `onNodesDelete` / `onEdgesDelete`

```tsx
const onNodesDelete: OnNodesDelete = useCallback((deleted) => {
  // deleted: Node[] — persist / sync to backend / undo stack
}, [])

const onEdgesDelete: OnEdgesDelete = useCallback((deleted) => {
  // deleted: Edge[]
}, [])
```

These fire for both keyboard deletes (`deleteKeyCode`) and programmatic deletes via `applyNodeChanges`/`applyEdgeChanges` with a `remove` change — good single choke point for cleanup logic (e.g. also deleting edges connected to a deleted node, which React Flow already does automatically before calling `onEdgesDelete`).

### A.16 `NodeToolbar`

```tsx
import { NodeToolbar, Position } from '@xyflow/react'

function ActionNode({ selected, data, id }: NodeProps<ActionNodeType>) {
  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <button onClick={() => duplicateNode(id)}>Duplicate</button>
        <button onClick={() => deleteNode(id)}>Delete</button>
      </NodeToolbar>
      {/* node body */}
    </>
  )
}
```

`NodeResizer` is explicitly out of scope per the task brief (OpsFlow nodes are fixed-size).

### A.17 Driving nodes/edges from an external Zustand store (recommended pattern)

Per the official ["Using a State Management Library"](https://reactflow.dev/learn/advanced-use/state-management) guide, put `nodes`, `edges`, and the change handlers _inside_ the Zustand store itself, and have `<ReactFlow>` read from the store via a selector hook — rather than lifting state into a parent component's `useState`. This avoids prop-drilling and, combined with `useShallow`, keeps re-renders scoped.

```tsx
// store.ts
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from '@xyflow/react'

type FlowState = {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  addNode: (node: Node) => void
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),
  addNode: (node) => set({ nodes: [...get().nodes, node] }),
}))

// FlowCanvas.tsx
const selector = (state: FlowState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
})

function FlowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useFlowStore(
    useShallow(selector),
  )
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
    />
  )
}
```

`useShallow` (from `zustand/react/shallow`, zustand v5's supported path) is important: without it, selecting an object literal from the store causes a new reference every render and defeats memoization.

### A.18 Avoiding the "measured/width" pitfall on programmatic node adds

In v12, `node.width`/`node.height` are **no longer measured values** — they're optional style hints. The actual rendered size (needed for `fitView`, edge path calculation, minimap) lives in `node.measured.width` / `node.measured.height`, which React Flow fills in _after_ the node has mounted and been measured via `ResizeObserver`.

Pitfalls this causes:

1. **Newly added nodes have `measured === undefined` for one render.** If your custom node or edge path logic reads `node.measured.width` before it exists, guard with a fallback: `const width = node.measured?.width ?? 150;`.
2. **`fitView()` called synchronously right after adding a node may not include it**, because measurement happens asynchronously after mount. Either call `fitView` in a `useEffect` keyed on `nodes.length`, or pass `fitView` as a prop with `fitViewOptions={{ nodes: [...] }}` and let React Flow re-fit automatically, or await a microtask (`requestAnimationFrame`) before calling `fitView()` imperatively.
3. **Edges to/from an unmeasured node render at a default/incorrect path for one frame**, then "snap" once measurement completes — usually invisible to users but can cause Playwright screenshot flakiness (see Section C) if you snapshot immediately after adding a node.
4. If you need a **known size before mount** (e.g. server-persisted layout), set `node.width`/`node.height` explicitly as style hints; React Flow will still remeasure and overwrite `measured`, but this avoids layout jank.

Reference: [Migrate to React Flow v12](https://reactflow.dev/learn/troubleshooting/migrate-to-v12) — "After React Flow measures your nodes, it writes the dimensions to `node.measured.width` and `node.measured.height`."

---

## B. React 19 / Zustand 5 / jsdom test setup

### B.1 React 19 + `@xyflow/react` 12.x

- `@xyflow/react` 12.x officially supports React 19 as of recent 12.x releases (check your installed version's `peerDependencies` — 12.3+ lists `react: ">=17"` broadly, but confirm with `npm ls react @xyflow/react` since early 12.0.x releases predated React 19's stable launch and some users reported needing to bump to a later 12.x patch).
- Known friction point: React 19's stricter `<Handle>`/ref forwarding and the removal of `defaultProps` on function components — if you see console warnings about `defaultProps` from any React-Flow-internal component, that's a lower-level dependency (not your code) and should be resolved by upgrading `@xyflow/react` to the latest patch.
- If using `React.StrictMode`, expect double-invocation of effects in dev — React Flow's internal `ResizeObserver` setup/teardown is idempotent and safe under this, but custom node components with side effects in `useEffect` should still clean up properly.
- No known incompatibility between `@xyflow/react` v12 and React 19 for standard usage (drag, connect, zoom, minimap) as of current releases; watch `xyflow/xyflow` GitHub issues tagged `react-19` if something breaks after an upgrade.

### B.2 Zustand 5 compatibility

- Zustand v5 dropped default (non-shallow) equality checks from some legacy APIs and requires `useShallow` from `zustand/react/shallow` explicitly (Zustand v4's `shallow` second-argument overload is removed in v5). Update any `useStore(selector, shallow)` calls to `useStore(useShallow(selector))`.
- Zustand v5 requires React 18+; React 19 is supported.
- `@xyflow/react` itself uses Zustand internally (v5-compatible) — you don't need to worry about version clashes since your app-level Zustand store and React Flow's internal one are fully separate instances.

### B.3 jsdom test setup (Vitest)

React Flow needs several browser APIs jsdom doesn't implement. Put this in a `setupFiles` file (e.g. `src/test/setup.ts`, referenced from `vitest.config.ts`'s `test.setupFiles`):

```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest'

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = global.ResizeObserver ?? ResizeObserverMock

// React Flow (and some CSS transform math) touches DOMMatrixReadOnly
class DOMMatrixReadOnlyMock {
  m22: number
  constructor(transform: string) {
    const scale = transform?.match(/scale\(([1-9.]+)\)/)?.[1]
    this.m22 = scale !== undefined ? +scale : 1
  }
}
// @ts-expect-error - partial mock is sufficient for viewport zoom reads in tests
global.DOMMatrixReadOnly = DOMMatrixReadOnlyMock

Object.defineProperties(HTMLElement.prototype, {
  offsetHeight: { get: () => 500, configurable: true },
  offsetWidth: { get: () => 500, configurable: true },
})

HTMLElement.prototype.getBoundingClientRect = () =>
  ({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 500,
    bottom: 500,
    width: 500,
    height: 500,
    toJSON: () => {},
  }) as DOMRect

// matchMedia (used by prefers-reduced-motion checks, Tailwind dark mode probes, etc.)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
```

This is the same shape the React Flow team documents/recommends as a "mock React Flow environment for testing" helper (commonly shipped as a `mockReactFlow()` utility in example repos) — the `ResizeObserver`, `DOMMatrixReadOnly`, and `getBoundingClientRect` mocks are the three that are _required_ for `<ReactFlow>` to mount in jsdom at all; without them you'll get errors like `ResizeObserver is not defined` or nodes rendering with zero dimensions and never firing `measured`.

For component tests, wrap in `ReactFlowProvider` just like production code:

```tsx
import { render, screen } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { FlowCanvas } from './FlowCanvas'

test('renders nodes', () => {
  render(
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>,
  )
  expect(screen.getByText('Start')).toBeInTheDocument()
})
```

Because `measured` dimensions depend on the (mocked) `ResizeObserver` actually firing a callback — which the simple mock above does _not_ do — tests that assert on rendered edge paths or `fitView` behavior may need to either (a) assert on data/store state instead of pixel-perfect SVG paths, or (b) use a fake `ResizeObserver` that synchronously invokes its callback with the mocked `getBoundingClientRect` size.

---

## C. Playwright patterns against React Flow

React Flow renders semantic, stable class names and `data-id` attributes, which makes it Playwright-friendly once you know the selectors.

### C.1 Selecting nodes and edges

```ts
// A specific node by its React Flow id
const node = page.locator(`.react-flow__node[data-id="${nodeId}"]`)

// A specific edge by its id
const edge = page.locator(`.react-flow__edge[data-id="${edgeId}"]`)

// All nodes of a given custom type (data-testid recommended — add your own on the node root div)
const conditionNodes = page.locator('.react-flow__node-condition')
```

Prefer adding your own `data-testid={id}` on the node's root `<div>` (inside your custom node component) for app-level assertions, and reserve `.react-flow__node[data-id=...]` for framework-level checks (position, selected state, transform).

### C.2 Connecting two nodes by mouse

```ts
async function connectNodes(page: Page, sourceNodeId: string, targetNodeId: string) {
  const sourceHandle = page
    .locator(`.react-flow__node[data-id="${sourceNodeId}"] .react-flow__handle.source`)
    .first()
  const targetHandle = page
    .locator(`.react-flow__node[data-id="${targetNodeId}"] .react-flow__handle.target`)
    .first()

  const sourceBox = await sourceHandle.boundingBox()
  const targetBox = await targetHandle.boundingBox()
  if (!sourceBox || !targetBox) throw new Error('Handle not visible')

  const sourcePoint = {
    x: sourceBox.x + sourceBox.width / 2,
    y: sourceBox.y + sourceBox.height / 2,
  }
  const targetPoint = {
    x: targetBox.x + targetBox.width / 2,
    y: targetBox.y + targetBox.height / 2,
  }

  await page.mouse.move(sourcePoint.x, sourcePoint.y)
  await page.mouse.down()
  // Move in multiple steps — React Flow listens to intermediate pointermove
  // events to compute the temporary connection line; a single jump can be
  // swallowed and never register as a drag.
  await page.mouse.move(targetPoint.x, targetPoint.y, { steps: 12 })
  await page.mouse.up()

  // Wait for the resulting edge to actually appear before asserting/continuing
  await expect(page.locator('.react-flow__edge')).toHaveCount(1)
}
```

Known flakiness fixes:

- **Always pass `steps: 8`–`15` to `mouse.move`.** React Flow's connection-line preview and final handle-hit-testing rely on receiving several `pointermove` events, not just a start/end jump. A single unstepped move frequently fails to start the connection drag at all.
- **Move to the source handle center first with a bare `mouse.move`, then `mouse.down`** — clicking through a locator's `.click()` can miscompute the handle center if the handle is small (default handles are 6-8px); doing raw `mouse.move`/`down`/`up` off a `boundingBox()` is more reliable than `dragTo`.
- **Wait for `.react-flow__edge` count/`data-id` after `mouse.up()`** rather than asserting immediately — the edge is added via React state update in the `onConnect` handler, which is async relative to the mouse event.
- If handles are visually tiny, consider (test-only) bumping handle hit-area via CSS in a test-mode stylesheet, or target the handle's larger invisible hit area if your custom node renders one.

### C.3 Dragging a node

```ts
const node = page.locator('.react-flow__node[data-id="node-1"]')
const box = await node.boundingBox()
await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
await page.mouse.down()
await page.mouse.move(box!.x + 200, box!.y + 100, { steps: 10 })
await page.mouse.up()
```

`locator.dragTo(targetLocator)` also works for simple node-to-node drags (e.g. dropping a node onto a drop-zone), but for free-form canvas repositioning the manual `mouse.down/move/up` sequence gives you control over intermediate steps, which matters because React Flow's drag threshold and snapping logic reads intermediate positions.

### C.4 Zooming via wheel with ctrl

React Flow treats `wheel` + `ctrlKey` (or pinch-gesture) as zoom, plain `wheel` as pan (when `panOnScroll` is set) or default browser scroll otherwise:

```ts
await page.mouse.move(400, 300) // position matters — zoom centers on cursor
await page.mouse.wheel(0, -200) // negative deltaY = zoom in, when ctrlKey emulated
await page.keyboard.down('Control')
await page.mouse.wheel(0, -200)
await page.keyboard.up('Control')
```

Playwright's `page.mouse.wheel(deltaX, deltaY)` doesn't take a modifiers option directly — hold the key with `page.keyboard.down('Control')` before the wheel call and release after, as shown. Confirm zoom changed via the viewport transform (C.5) rather than assuming.

### C.5 Asserting viewport transform

```ts
const viewport = page.locator('.react-flow__viewport')
const style = await viewport.getAttribute('style')
// style looks like: "transform: translate(120px, 45px) scale(1.5);"
expect(style).toContain('scale(1.5')
```

For more robust numeric assertions, parse with a regex instead of `toContain` on an exact string (zoom float precision varies):

```ts
const match = style!.match(/scale\(([\d.]+)\)/)
expect(Number(match![1])).toBeCloseTo(1.5, 1)
```

### C.6 Testing downloads (e.g. "Export flow as JSON")

```ts
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: 'Export' }).click(),
])
expect(download.suggestedFilename()).toBe('opsflow-export.json')
const path = await download.path()
// read/parse the file at `path` with Node's fs if you need to assert content
```

### C.7 Testing uploads (e.g. "Import flow from JSON")

```ts
await page.setInputFiles('input[type="file"]', {
  name: 'flow.json',
  mimeType: 'application/json',
  buffer: Buffer.from(JSON.stringify({ nodes: [], edges: [] })),
})
```

If the file input is hidden and only a styled "Import" button is visible, target the underlying `<input type="file">` by its `id`/`data-testid` — `setInputFiles` works on hidden inputs without needing them visible.

### C.8 Clipboard / paste via textarea

Since Playwright's real OS clipboard access is inconsistent across CI environments, simulate paste at the DOM event level, or — simpler for a hidden textarea-based paste target — use `.fill()` plus a manual paste-event dispatch:

```ts
// If OpsFlow copies/pastes nodes through a real textarea (e.g. a debug panel):
await page.locator('#paste-target').fill(JSON.stringify(clipboardPayload))
await page.locator('#paste-target').dispatchEvent('paste') // if app listens to 'paste' event, this alone may not carry clipboardData

// More robust: grant clipboard permissions and write directly, then dispatch a real key combo
const context = page.context()
await context.grantPermissions(['clipboard-read', 'clipboard-write'])
await page.evaluate(async (text) => {
  await navigator.clipboard.writeText(text)
}, JSON.stringify(clipboardPayload))
await page.keyboard.press('Control+V')
```

Note `dispatchEvent('paste')` does **not** automatically populate `event.clipboardData` — for code that reads `event.clipboardData.getData(...)`, prefer the `grantPermissions` + real `navigator.clipboard` + real keypress approach, or refactor the app to expose a testable "load from string" path behind a `data-testid` debug affordance.

### C.9 `page.reload()` for localStorage persistence

```ts
await addNodeViaUI(page, 'Start')
await page.reload()
await expect(page.locator('.react-flow__node[data-id="start-node"]')).toBeVisible()
```

Reload preserves `localStorage`/`sessionStorage` by default (same origin, same context) — no special setup needed, just ensure your Zustand store rehydrates from storage on mount (e.g. `zustand/middleware`'s `persist`) before `<ReactFlow>` renders, otherwise you'll get a flash of empty canvas that Playwright's auto-waiting locator assertions will tolerate anyway.

### C.10 Reduced motion emulation

```ts
await page.emulateMedia({ reducedMotion: 'reduce' })
```

Pair with the CSS from A.13 (`@media (prefers-reduced-motion: reduce)`) so animated-edge tests can assert the dash animation is disabled, and so screenshot tests aren't flaky from mid-animation frames.

### C.11 Viewport presets (desktop + mobile projects)

```ts
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 7'], // or a manual spec below
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
})
```

Or fully manual instead of a `devices[...]` preset:

```ts
use: {
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 3,
}
```

For touch-drag tests on the mobile project, prefer `page.touchscreen.tap(x, y)` / dispatch synthetic touch events over `page.mouse.*` where the app path specifically branches on touch — React Flow itself normalizes pointer/touch/mouse via Pointer Events internally, so `page.mouse.*` sequences generally still work fine even with `hasTouch: true`, but verify your own custom DnD/palette code (HTML5 `draggable` drag-and-drop has notoriously poor mobile/touch support — consider a touch-specific fallback interaction for the palette on the mobile project rather than relying on native HTML5 DnD there).

### C.12 Screenshot assertions: `toHaveScreenshot` vs `page.screenshot({ path })`

- `expect(page).toHaveScreenshot('flow-canvas.png')` — Playwright's built-in visual regression: stores a baseline, diffs on every run, fails the test on pixel drift beyond threshold (`maxDiffPixels`/`threshold` options). Use for **regression protection** on stable, low-animation UI (e.g. the empty canvas, a static node's appearance).
- `page.screenshot({ path: 'test-results/evidence/flow-after-connect.png' })` — just saves an image, no comparison, never fails the test. Use for **debugging evidence** attached to CI artifacts, or for inherently non-deterministic scenes (live animated edges, minimap with random node colors) where pixel-diffing would be flaky by design.
- For React Flow specifically, favor `toHaveScreenshot` scoped to `page.locator('.react-flow')` (element screenshot, not full page) to avoid unrelated chrome/toolbar flakiness, and always pair with `emulateMedia({ reducedMotion: 'reduce' })` plus a `mask` option over the `<MiniMap>` if it renders live/random data.

### C.13 Speeding up animation-heavy tests via a URL flag

Add an app-level debug flag that disables/shortens CSS transition durations and React Flow's animated-viewport transitions (`fitView({ duration: 0 })`, etc.) when a query param or env var is present:

```ts
// app bootstrap
const fastMode = new URLSearchParams(location.search).has('e2e-fast')
document.documentElement.classList.toggle('e2e-fast', fastMode)
```

```css
.e2e-fast * {
  animation-duration: 0.001s !important;
  transition-duration: 0.001s !important;
}
```

```ts
// test
await page.goto('/?e2e-fast=1')
```

Also thread this flag into any `useReactFlow()` call sites that pass `{ duration }` to `fitView`/`zoomIn`/`setViewport`, defaulting to `0` in fast mode, since CSS overrides don't affect React Flow's internal JS-driven viewport tween (it's computed via `requestAnimationFrame`, not a CSS transition).

---

## D. Tailwind CSS v4 with `@tailwindcss/vite`

### D.1 Setup

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

```css
/* src/index.css */
@import 'tailwindcss';
```

No `tailwind.config.js` `content` globs needed — v4 scans automatically. No PostCSS config needed when using the Vite plugin.

### D.2 `@theme` — expose design tokens as utilities

```css
@import 'tailwindcss';

@theme {
  --color-navy-900: #0a0e1a;
  --color-navy-800: #10162a;
  --color-navy-700: #1a2140;
  --color-accent-500: #38bdf8;
  --font-display: 'Inter', sans-serif;
  --radius-node: 0.5rem;
}
```

This automatically generates utilities: `bg-navy-900`, `text-navy-700`, `border-accent-500`, `font-display`, `rounded-node`, etc. — the CSS variable name after the theme-namespace prefix (`--color-*`, `--font-*`, `--radius-*`, `--spacing-*`, ...) becomes the utility suffix.

### D.3 `@custom-variant` for dark-only / state-based styling

Since OpsFlow is dark-only, you likely don't need Tailwind's `dark:` variant at all — just use base utilities against your navy palette directly. But if you need a variant for, say, a `.react-flow__node.selected` state or a data attribute React Flow sets (e.g. `[data-colormode="dark"]`), define a custom variant:

```css
@custom-variant selected (&.selected);
@custom-variant rf-dark (&[data-colormode='dark']);
```

```html
<div class="bg-navy-800 selected:ring-2 selected:ring-accent-500">...</div>
```

### D.4 `prefers-reduced-motion` utilities

Tailwind v4 ships `motion-reduce:` and `motion-safe:` variants out of the box (no custom variant needed):

```html
<div
  class="transition-transform duration-200 motion-reduce:transition-none motion-reduce:duration-0"
>
  ...
</div>
```

Use this on any custom-styled control (zoom buttons, panel slide-ins) — React Flow's own internals already respect `prefers-reduced-motion` for some things but not all, so pair with the CSS from A.13 for animated edges specifically.

### D.5 Using CSS variables defined outside `@theme`

Plain custom properties (not under `@theme`) still work as arbitrary values — they just don't get a generated utility name:

```css
:root {
  --canvas-grid-gap: 24px; /* not a Tailwind token, just a plain CSS var */
}
```

```html
<div class="[--canvas-grid-gap:24px]">...</div>
<!-- or reference an existing var as an arbitrary value: -->
<div class="gap-[var(--canvas-grid-gap)]">...</div>
```

Arbitrary-value syntax `bg-[var(--some-var)]` works for any property, letting you bridge non-`@theme` variables (e.g. ones set dynamically by JS for per-node accent colors) into Tailwind classes without needing them registered as design tokens.

---

## E. Gotchas

1. **`nodeTypes`/`edgeTypes` must be stable references** (module-level or `useMemo`) — recreating them per render remounts every custom node/edge and kills perf/animation state. [ReactFlow component docs](https://reactflow.dev/api-reference/react-flow)
2. **`node.width`/`node.height` are style hints in v12, not measured values** — read `node.measured.width/height` for actual rendered size, and guard against it being `undefined` for one render after a node is added. [Migrate to v12](https://reactflow.dev/learn/troubleshooting/migrate-to-v12)
3. **`fitView()` called synchronously right after adding a node can miss it** because measurement is async (`ResizeObserver`-driven) — defer to a `useEffect` or next animation frame.
4. **CSS import is mandatory**: forgetting `@xyflow/react/dist/style.css` gives you an unstyled, often visually-broken (zero-size) canvas that still "works" functionally, which is a confusing failure mode.
5. **jsdom has no `ResizeObserver`, `DOMMatrixReadOnly`, or real layout** — without mocking these plus `getBoundingClientRect`, `<ReactFlow>` throws or silently renders nodes with 0×0 dimensions in Vitest.
6. **Playwright mouse drags for connecting handles need `steps` on `mouse.move`** — a single jump from source to target frequently fails to register as a drag at all; use 8–15 steps and wait for `.react-flow__edge` to appear before asserting.
7. **`onDragOver` must call `preventDefault()`** for native HTML5 DnD `onDrop` to fire — easy to forget, and the failure is silent (drop handler just never runs).
8. **HTML5 native drag-and-drop has poor/inconsistent touch support** — don't rely on it unmodified for the mobile Playwright project; plan a touch-specific interaction for the palette.
9. **Zustand v5 removed the `useStore(selector, shallow)` two-arg overload** — use `useShallow` from `zustand/react/shallow` explicitly when selecting object literals out of a store.
10. **`page.mouse.wheel` has no built-in modifier param** — hold `Control` via `page.keyboard.down('Control')` around the wheel call to simulate ctrl-zoom.
11. **`dispatchEvent('paste')` in Playwright does not populate `event.clipboardData`** — for real clipboard-data-reading code paths, use `context.grantPermissions(['clipboard-read','clipboard-write'])` + `navigator.clipboard` + a real `Control+V` keypress instead.
12. **`hideAttribution` via `proOptions` removes the League watermark** but check licensing terms for your usage tier before shipping to production. [Discussion #2961](https://github.com/xyflow/xyflow/discussions/2961)
13. **React Flow's own JS-driven viewport tweens (`fitView`, `zoomIn`, `setViewport` with `duration`) are not CSS transitions** — a global "kill all CSS animation durations" test flag won't speed these up; you must also pass `duration: 0` at call sites in fast-test mode.
14. **Screenshot-testing animated or randomized elements (live edges, minimap colors) is inherently flaky** — mask them or use plain `page.screenshot({ path })` evidence capture instead of `toHaveScreenshot` pixel-diffing for those regions.
15. **The package is `@xyflow/react` (named imports), not `reactflow` (default import)** — old v10/v11 tutorials and Stack Overflow answers using `import ReactFlow from 'reactflow'` are outdated for v12 and will not compile. [Migrate to v12](https://reactflow.dev/learn/troubleshooting/migrate-to-v12)

---

### Key sources

- [The ReactFlow component — API reference](https://reactflow.dev/api-reference/react-flow)
- [Migrate to React Flow v12](https://reactflow.dev/learn/troubleshooting/migrate-to-v12)
- [Using a State Management Library](https://reactflow.dev/learn/advanced-use/state-management)
- [`useReactFlow()`](https://reactflow.dev/api-reference/hooks/use-reactflow)
- [`applyNodeChanges()`](https://reactflow.dev/api-reference/utils/apply-node-changes)
- [ProOptions / hideAttribution](https://reactflow.dev/api-reference/types/pro-options)
- [xyflow/xyflow Discussion #2961 — hideAttribution licensing](https://github.com/xyflow/xyflow/discussions/2961)
- [Playwright: Mouse](https://playwright.dev/docs/api/class-mouse)
- [Playwright: Downloads](https://playwright.dev/docs/downloads)
- [Playwright: `emulateMedia`](https://playwright.dev/docs/api/class-page#page-emulate-media)
- [Playwright: Screenshots / visual comparisons](https://playwright.dev/docs/test-snapshots)
- [Tailwind CSS v4: `@theme`](https://tailwindcss.com/docs/theme)
- [Tailwind CSS v4: Vite plugin](https://tailwindcss.com/docs/installation/using-vite)
