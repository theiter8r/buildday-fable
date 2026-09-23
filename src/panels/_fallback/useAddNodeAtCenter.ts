/**
 * Local fallback for `src/canvas/useAddNodeAtCenter` (ARCHITECTURE.md §2,
 * owned by the canvas lane and not yet present at
 * `src/canvas/useAddNodeAtCenter.ts`). Adds a node at a fixed default
 * canvas position instead of the real React-Flow viewport center — see
 * `docs/lane-notes/panels.md` for the swap-over note once the canvas lane
 * lands the real hook (which should use `reactFlow.screenToFlowPosition`
 * per ARCHITECTURE.md §10).
 */
import { useCallback } from 'react'
import { createNode } from '@/domain'
import type { NodeType } from '@/domain/types'
import { useOpsflowStore } from '@/store'

/** Fallback "center" until the canvas lane's real viewport-aware hook exists. */
const DEFAULT_POSITION = { x: 320, y: 200 }

export function useAddNodeAtCenter(): (type: NodeType) => void {
  const addNode = useOpsflowStore((s) => s.addNode)
  return useCallback(
    (type: NodeType) => {
      addNode(createNode(type, DEFAULT_POSITION))
    },
    [addNode],
  )
}
