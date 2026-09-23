/**
 * `<MiniMap>` with per-type node colors from tokens (DESIGN.md §5); hidden
 * below the 640px phone breakpoint (the fit-view control stays available
 * in the bottom-left cluster / top bar instead, per ARCHITECTURE.md §10).
 */
import { MiniMap } from '@xyflow/react'
import type { NodeType } from '@/domain/types'
import type { FlowNode } from './types'

const MINIMAP_COLOR: Record<NodeType, string> = {
  trigger: 'var(--color-node-trigger)',
  condition: 'var(--color-node-condition)',
  action: 'var(--color-node-action)',
  approval: 'var(--color-node-approval)',
  resolution: 'var(--color-node-resolution)',
}

export function CanvasMinimap() {
  return (
    <MiniMap
      data-testid="minimap"
      className="hidden sm:block"
      nodeColor={(node) => MINIMAP_COLOR[(node as FlowNode).type as NodeType] ?? '#8a93ae'}
      maskColor="rgba(5, 7, 15, 0.72)"
      pannable
      zoomable
      style={{
        backgroundColor: 'var(--color-navy-950)',
        border: '1px solid var(--color-line)',
      }}
    />
  )
}
