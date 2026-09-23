/**
 * Stroke/label tokens for `FlowEdge`, per DESIGN.md §5 "Edges". Kept as a
 * plain function (not CSS classes) because React Flow edges are painted via
 * inline SVG attributes, and every color here must resolve to a real
 * `--color-*` token so light/dark and contrast-mode overrides keep working.
 */
import type { CSSProperties } from 'react'

/** Visual status an edge can be in during a run (or before one has started). */
export type EdgeRunStatus = 'idle' | 'traversed' | 'skipped' | 'failed'

export interface EdgeVisual {
  stroke: string
  strokeWidth: number
  strokeDasharray?: string
  opacity?: number
}

export function edgeVisualForStatus(status: EdgeRunStatus): EdgeVisual {
  switch (status) {
    case 'traversed':
      return { stroke: 'var(--color-cobalt-500)', strokeWidth: 2.5 }
    case 'skipped':
      return {
        stroke: 'var(--color-text-subtle)',
        strokeWidth: 1.5,
        strokeDasharray: '4 4',
        opacity: 0.45,
      }
    case 'failed':
      return { stroke: 'var(--color-state-failed)', strokeWidth: 2.5 }
    case 'idle':
    default:
      return { stroke: 'rgb(155 180 255 / 0.30)', strokeWidth: 2 }
  }
}

/** Dash-flow animation style, applied only to the single currently-traversing edge while running. */
export function dashFlowStyle(animate: boolean): CSSProperties {
  if (!animate) return {}
  return {
    strokeDasharray: '6 8',
    animation: 'opsflow-edge-dash 700ms linear infinite',
  }
}
