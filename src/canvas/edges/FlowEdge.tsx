/**
 * The single edge type OpsFlow renders: a bezier path, a TRUE/FALSE label
 * pill for edges leaving a Condition's branch handle, and traversed/pending
 * /skipped/failed styling driven by the run's node/edge state (DESIGN.md §5
 * "Edges"). Dash-flow animation only plays on the edge currently being
 * traversed while the run is `running`, and only when motion is allowed.
 */
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps, type Edge } from '@xyflow/react'
import { dashFlowStyle, edgeVisualForStatus, type EdgeRunStatus } from './edgeStyles'
import { useReducedMotion } from '@/app/useReducedMotion'

export interface FlowEdgeData extends Record<string, unknown> {
  /** Set only when `source` is a Condition node. */
  branch?: 'true' | 'false'
  /** Run-time visual status; `'idle'` before/absent a run. */
  status: EdgeRunStatus
  /** True while this exact edge is the one currently being traversed (run `running`). */
  isActiveTraversal: boolean
  /** Once a run has decided the branch, the other pill drops to 40% opacity. */
  branchDecided?: boolean
  /** True when this edge's branch is the one the run actually took. */
  branchTaken?: boolean
}

export type FlowEdgeType = Edge<FlowEdgeData, 'flow'>

export function FlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  selected,
  data,
}: EdgeProps<FlowEdgeType>) {
  const reducedMotion = useReducedMotion()
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const status = data?.status ?? 'idle'
  const visual = edgeVisualForStatus(status)
  const animate = Boolean(data?.isActiveTraversal) && !reducedMotion
  const style = {
    stroke: visual.stroke,
    strokeWidth: selected ? visual.strokeWidth + 0.5 : visual.strokeWidth,
    strokeDasharray: visual.strokeDasharray,
    opacity: visual.opacity,
    ...dashFlowStyle(animate),
  }

  const branch = data?.branch
  const pillFilled = Boolean(data?.branchTaken)
  const pillFaded = Boolean(data?.branchDecided) && !pillFilled

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {branch ? (
        <EdgeLabelRenderer>
          <div
            data-testid={`edge-branch-label-${id}`}
            className="nodrag nopan pointer-events-none absolute rounded-full px-2 py-0.5 text-micro font-semibold uppercase tracking-wide transition-opacity"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              fontSize: 'var(--text-micro)',
              backgroundColor: pillFilled
                ? branch === 'true'
                  ? 'var(--color-state-success)'
                  : 'var(--color-navy-700)'
                : 'var(--color-navy-900)',
              color: pillFilled
                ? 'var(--color-on-gold)'
                : branch === 'true'
                  ? 'var(--color-state-success)'
                  : 'var(--color-text-muted)',
              opacity: pillFaded ? 0.4 : 1,
              border: '1px solid var(--color-line)',
            }}
          >
            {branch === 'true' ? 'TRUE' : 'FALSE'}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}
