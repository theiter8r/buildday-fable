import { beforeEach, describe, expect, it } from 'vitest'
import { createNode } from '@/domain/factories'
import type { WorkflowDocument } from '@/domain/types'
import { createWorkflowStore } from '../workflowStore'

// Each test gets its own store instance (own document, selection and
// HistoryStack) rather than sharing the module-level `workflowStore`
// singleton, so undo/redo assertions never see history left over from a
// previous test.
let workflowStore: ReturnType<typeof createWorkflowStore>
let initialDoc: WorkflowDocument

beforeEach(() => {
  workflowStore = createWorkflowStore()
  initialDoc = workflowStore.getState().document
})

describe('workflowStore document/history actions', () => {
  it('add node then undo then redo', () => {
    const before = workflowStore.getState().document
    const beforeCount = before.nodes.length

    const node = createNode('action', { x: 100, y: 100 })
    workflowStore.getState().addNode(node)

    expect(workflowStore.getState().document.nodes).toHaveLength(beforeCount + 1)
    expect(workflowStore.getState().document.nodes.some((n) => n.id === node.id)).toBe(true)
    expect(workflowStore.getState().selectedNodeId).toBe(node.id)
    expect(workflowStore.getState().canUndo).toBe(true)
    expect(workflowStore.getState().canRedo).toBe(false)

    workflowStore.getState().undo()
    expect(workflowStore.getState().document.nodes).toHaveLength(beforeCount)
    expect(workflowStore.getState().document.nodes.some((n) => n.id === node.id)).toBe(false)
    expect(workflowStore.getState().canUndo).toBe(false)
    expect(workflowStore.getState().canRedo).toBe(true)

    workflowStore.getState().redo()
    expect(workflowStore.getState().document.nodes).toHaveLength(beforeCount + 1)
    expect(workflowStore.getState().document.nodes.some((n) => n.id === node.id)).toBe(true)
    expect(workflowStore.getState().canUndo).toBe(true)
    expect(workflowStore.getState().canRedo).toBe(false)
  })

  it('duplicateNode clones the node with an offset position and selects the copy', () => {
    const original = workflowStore.getState().document.nodes[0]!
    const beforeCount = workflowStore.getState().document.nodes.length

    workflowStore.getState().duplicateNode(original.id)

    const doc = workflowStore.getState().document
    expect(doc.nodes).toHaveLength(beforeCount + 1)
    const copy = doc.nodes.find((n) => n.id !== original.id && n.label === original.label)
    expect(copy).toBeDefined()
    expect(copy!.position).toEqual({ x: original.position.x + 32, y: original.position.y + 32 })
    expect(workflowStore.getState().selectedNodeId).toBe(copy!.id)

    workflowStore.getState().undo()
    expect(workflowStore.getState().document.nodes).toHaveLength(beforeCount)
  })

  it('removeNode deletes the node and every edge touching it', () => {
    const doc = workflowStore.getState().document
    const target = doc.nodes.find((n) => n.id === 'demo-condition')!
    const touchingEdgeCount = doc.edges.filter(
      (e) => e.source === target.id || e.target === target.id,
    ).length
    expect(touchingEdgeCount).toBeGreaterThan(0)

    workflowStore.getState().removeNode(target.id)

    const after = workflowStore.getState().document
    expect(after.nodes.some((n) => n.id === target.id)).toBe(false)
    expect(after.edges.some((e) => e.source === target.id || e.target === target.id)).toBe(false)

    workflowStore.getState().undo()
    const restored = workflowStore.getState().document
    expect(restored.nodes.some((n) => n.id === target.id)).toBe(true)
    expect(
      restored.edges.filter((e) => e.source === target.id || e.target === target.id),
    ).toHaveLength(touchingEdgeCount)
  })

  it('resetToDemo replaces the document and is itself undoable', () => {
    const node = createNode('action', { x: 0, y: 0 })
    workflowStore.getState().addNode(node)
    expect(workflowStore.getState().document.nodes.some((n) => n.id === node.id)).toBe(true)

    workflowStore.getState().resetToDemo()
    const doc = workflowStore.getState().document
    expect(doc.nodes.some((n) => n.id === node.id)).toBe(false)
    expect(doc.id).toBe(initialDoc.id)
    expect(workflowStore.getState().selectedNodeId).toBeNull()

    workflowStore.getState().undo()
    expect(workflowStore.getState().document.nodes.some((n) => n.id === node.id)).toBe(true)
  })
})
