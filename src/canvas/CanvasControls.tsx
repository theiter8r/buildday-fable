/**
 * Bottom-left capsule cluster: zoom out/in, fit view, undo, redo
 * (DESIGN.md §5 "Controls / minimap"). Custom-built (not React Flow's
 * `<Controls>`) so styling matches the navy/gold theme exactly, per the
 * spike doc §A.8's recommendation.
 */
import type { ReactNode } from 'react'
import { useReactFlow } from '@xyflow/react'
import { UndoIcon, RedoIcon, FitViewIcon, ZoomInIcon, ZoomOutIcon } from '@/components/icons'
import { useOpsflowStore } from '@/store'
import { useReducedMotion } from '@/app/useReducedMotion'

interface ControlButtonProps {
  testId: string
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}

function ControlButton({ testId, label, onClick, disabled, children }: ControlButtonProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-sm transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45"
      style={{ color: 'var(--color-cream-100)' }}
    >
      {children}
    </button>
  )
}

export function CanvasControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const reducedMotion = useReducedMotion()
  const canUndo = useOpsflowStore((s) => s.canUndo)
  const canRedo = useOpsflowStore((s) => s.canRedo)
  const undo = useOpsflowStore((s) => s.undo)
  const redo = useOpsflowStore((s) => s.redo)

  const duration = reducedMotion ? 0 : 200

  return (
    <div
      data-testid="canvas-controls"
      className="pointer-events-auto flex items-center gap-1 rounded-md border p-1 backdrop-blur-md"
      style={{ backgroundColor: 'rgb(14 21 43 / 0.9)', borderColor: 'var(--color-line)' }}
    >
      <ControlButton testId="zoom-out-button" label="Zoom out" onClick={() => void zoomOut({ duration })}>
        <ZoomOutIcon size={18} />
      </ControlButton>
      <ControlButton testId="zoom-in-button" label="Zoom in" onClick={() => void zoomIn({ duration })}>
        <ZoomInIcon size={18} />
      </ControlButton>
      <ControlButton
        testId="fit-view-button"
        label="Fit workflow to view"
        onClick={() => void fitView({ duration })}
      >
        <FitViewIcon size={18} />
      </ControlButton>
      <div className="mx-0.5 h-5 w-px" style={{ backgroundColor: 'var(--color-line-soft)' }} />
      <ControlButton testId="undo-button" label="Undo" onClick={undo} disabled={!canUndo}>
        <UndoIcon size={18} />
      </ControlButton>
      <ControlButton testId="redo-button" label="Redo" onClick={redo} disabled={!canRedo}>
        <RedoIcon size={18} />
      </ControlButton>
    </div>
  )
}
