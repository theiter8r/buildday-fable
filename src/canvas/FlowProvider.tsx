/**
 * `<ReactFlowProvider>` plus a resize-safe container. Wrap the whole canvas
 * area (not just `<ReactFlow>`) in this so sibling UI — the palette, the
 * inspector's "centre on this node" action — can call `useReactFlow()` too
 * (spike doc §A.2).
 */
import type { ReactNode } from 'react'
import { ReactFlowProvider } from '@xyflow/react'

export function FlowProvider({ children }: { children: ReactNode }) {
  return (
    <ReactFlowProvider>
      <div className="relative h-full min-h-0 w-full min-w-0">{children}</div>
    </ReactFlowProvider>
  )
}
