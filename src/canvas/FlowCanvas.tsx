/**
 * The `<ReactFlow>` wrapper: nodeTypes/edgeTypes, every store-wired change
 * handler from `useFlowSync`, the Background/Controls/Minimap panels, and
 * the canvas-only hooks (shortcuts, drop-to-add, focus requests). Must be
 * rendered inside `FlowProvider` (`<ReactFlowProvider>`).
 */
import '@xyflow/react/dist/style.css'
import './canvas.css'
import { Background, BackgroundVariant, Panel, ReactFlow } from '@xyflow/react'
import { nodeTypes } from './nodeTypes'
import { edgeTypes } from './edgeTypes'
import { useFlowSync } from './useFlowSync'
import { useCanvasShortcuts } from './useCanvasShortcuts'
import { useDropToAdd } from './useDropToAdd'
import { useFocusNodeRequests } from './useFocusNodeRequests'
import { CanvasControls } from './CanvasControls'
import { CanvasMinimap } from './CanvasMinimap'
import { RunOverlay } from './RunOverlay'
import { useOpsflowStore } from '@/store'

export function FlowCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodesDelete,
    onEdgesDelete,
    isValidConnection,
  } = useFlowSync()
  const { onDragOver, onDrop } = useDropToAdd()
  const selectNode = useOpsflowStore((s) => s.selectNode)
  const selectEdge = useOpsflowStore((s) => s.selectEdge)

  useCanvasShortcuts()
  useFocusNodeRequests()

  return (
    <div
      data-testid="canvas"
      role="application"
      aria-label="Workflow canvas"
      aria-describedby="canvas-instructions"
      className="relative h-full min-h-0 w-full min-w-0"
      style={{ backgroundColor: 'var(--color-navy-900)' }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <span id="canvas-instructions" className="sr-only">
        Tab moves between nodes in document order. Enter opens the selected node in the inspector.
        Arrow keys nudge a selected node. Delete or Backspace removes the selection. Escape clears
        the selection.
      </span>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        isValidConnection={isValidConnection}
        onPaneClick={() => {
          selectNode(null)
          selectEdge(null)
        }}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={2}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Meta', 'Control']}
        panOnScroll
        selectionOnDrag
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="rgb(155 180 255 / 0.12)" />
        <RunOverlay />
        <Panel position="bottom-left">
          <CanvasControls />
        </Panel>
        <CanvasMinimap />
      </ReactFlow>
    </div>
  )
}
