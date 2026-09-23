/**
 * HTML5 drag-and-drop from the (desktop-only) palette. The palette sets
 * `dataTransfer` under the `application/opsflow-node` type to the node's
 * `NodeType`; this hook reads it back on drop and adds the node at the
 * cursor's flow position (spike doc §A.7 — `onDragOver` must call
 * `preventDefault()` or `onDrop` never fires).
 */
import { useCallback } from 'react'
import type { DragEvent } from 'react'
import { useReactFlow } from '@xyflow/react'
import { createNode } from '@/domain'
import { NODE_TYPES } from '@/domain/types'
import type { NodeType } from '@/domain/types'
import { useOpsflowStore } from '@/store'

export const OPSFLOW_NODE_DND_TYPE = 'application/opsflow-node'

function isNodeType(value: string): value is NodeType {
  return (NODE_TYPES as readonly string[]).includes(value)
}

export interface UseDropToAddResult {
  onDragOver: (event: DragEvent) => void
  onDrop: (event: DragEvent) => void
}

export function useDropToAdd(): UseDropToAddResult {
  const { screenToFlowPosition } = useReactFlow()
  const addNode = useOpsflowStore((s) => s.addNode)

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()
      const type = event.dataTransfer.getData(OPSFLOW_NODE_DND_TYPE)
      if (!type || !isNodeType(type)) return
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      addNode(createNode(type, position))
    },
    [screenToFlowPosition, addNode],
  )

  return { onDragOver, onDrop }
}
