/**
 * Canvas-scoped keyboard shortcuts (ARCHITECTURE.md §7): undo/redo,
 * duplicate, delete and deselect. Ignored while focus is in a text input,
 * textarea or contenteditable element — except Escape, which always fires.
 */
import { useEffect } from 'react'
import { useOpsflowStore } from '@/store'

function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
}

export function useCanvasShortcuts(): void {
  const undo = useOpsflowStore((s) => s.undo)
  const redo = useOpsflowStore((s) => s.redo)
  const duplicateNode = useOpsflowStore((s) => s.duplicateNode)
  const removeNode = useOpsflowStore((s) => s.removeNode)
  const removeEdge = useOpsflowStore((s) => s.removeEdge)
  const selectNode = useOpsflowStore((s) => s.selectNode)
  const selectEdge = useOpsflowStore((s) => s.selectEdge)
  const selectedNodeId = useOpsflowStore((s) => s.selectedNodeId)
  const selectedEdgeId = useOpsflowStore((s) => s.selectedEdgeId)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (isTextEntryTarget(event.target) && event.key !== 'Escape') return

      const mod = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()

      if (mod && key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
        return
      }
      if ((mod && key === 'z' && event.shiftKey) || (event.ctrlKey && key === 'y')) {
        event.preventDefault()
        redo()
        return
      }
      if (mod && key === 'd') {
        event.preventDefault()
        if (selectedNodeId) duplicateNode(selectedNodeId)
        return
      }
      if (key === 'delete' || key === 'backspace') {
        if (selectedNodeId) {
          event.preventDefault()
          removeNode(selectedNodeId)
        } else if (selectedEdgeId) {
          event.preventDefault()
          removeEdge(selectedEdgeId)
        }
        return
      }
      if (key === 'escape') {
        selectNode(null)
        selectEdge(null)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    undo,
    redo,
    duplicateNode,
    removeNode,
    removeEdge,
    selectNode,
    selectEdge,
    selectedNodeId,
    selectedEdgeId,
  ])
}
