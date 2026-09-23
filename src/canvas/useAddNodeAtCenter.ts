/**
 * Public helper the palette (another lane) calls to add a node at the
 * current viewport center — the desktop palette-click path and the mobile
 * "tap to add" path both resolve to this (ARCHITECTURE.md §10). Must be
 * called from inside `FlowProvider`'s `<ReactFlowProvider>`.
 */
import { useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import { createNode } from '@/domain'
import type { NodeType } from '@/domain/types'
import { useOpsflowStore } from '@/store'

export function useAddNodeAtCenter(): (type: NodeType) => void {
  const { screenToFlowPosition } = useReactFlow()
  const addNode = useOpsflowStore((s) => s.addNode)

  return useCallback(
    (type: NodeType) => {
      const pane = document.querySelector('[data-testid="canvas"] .react-flow')
      const rect = pane?.getBoundingClientRect()
      const center = rect
        ? { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
        : { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      const position = screenToFlowPosition(center)
      addNode(createNode(type, position))
    },
    [screenToFlowPosition, addNode],
  )
}
