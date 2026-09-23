import { describe, expect, it } from 'vitest'
import { HistoryStack } from '../history'
import type { Command } from '../types'

function addNodeCmd(id: string): Command {
  return {
    t: 'add-node',
    node: {
      id,
      type: 'action',
      label: id,
      position: { x: 0, y: 0 },
      config: {
        action: 'page-oncall',
        target: 'sre',
        durationMs: 100,
        simulateFailure: false,
        continueOnFailure: false,
      },
    },
  }
}

function configCmd(nodeId: string, after: unknown): Command {
  return { t: 'update-config', nodeId, field: 'target', before: 'x', after }
}

describe('HistoryStack', () => {
  it('starts empty: cannot undo or redo', () => {
    const history = new HistoryStack<Command>()
    expect(history.canUndo).toBe(false)
    expect(history.canRedo).toBe(false)
    expect(history.undo()).toBeUndefined()
    expect(history.redo()).toBeUndefined()
  })

  it('push then undo returns the pushed command and enables redo', () => {
    const history = new HistoryStack<Command>()
    const cmd = addNodeCmd('a')
    history.push(cmd)
    expect(history.canUndo).toBe(true)
    expect(history.canRedo).toBe(false)

    const undone = history.undo()
    expect(undone).toBe(cmd)
    expect(history.canUndo).toBe(false)
    expect(history.canRedo).toBe(true)
  })

  it('redo returns the same command and moves it back to the undo stack', () => {
    const history = new HistoryStack<Command>()
    const cmd = addNodeCmd('a')
    history.push(cmd)
    history.undo()
    const redone = history.redo()
    expect(redone).toBe(cmd)
    expect(history.canUndo).toBe(true)
    expect(history.canRedo).toBe(false)
  })

  it('a new push clears the redo stack (future)', () => {
    const history = new HistoryStack<Command>()
    history.push(addNodeCmd('a'))
    history.undo()
    expect(history.canRedo).toBe(true)

    history.push(addNodeCmd('b'))
    expect(history.canRedo).toBe(false)
    expect(history.redo()).toBeUndefined()
  })

  it('caps the undo stack at the configured size, dropping the oldest (FIFO)', () => {
    const history = new HistoryStack<Command>({ cap: 3 })
    history.push(addNodeCmd('a'))
    history.push(addNodeCmd('b'))
    history.push(addNodeCmd('c'))
    history.push(addNodeCmd('d'))
    expect(history.pastLength).toBe(3)

    // Undo everything; the oldest surviving entry should be 'b', not 'a'.
    const undone: string[] = []
    let cmd = history.undo()
    while (cmd) {
      if (cmd.t === 'add-node') undone.push(cmd.node.id)
      cmd = history.undo()
    }
    expect(undone).toEqual(['d', 'c', 'b'])
  })

  it('coalesces same-key pushes within the window into one undo step', () => {
    let now = 0
    const history = new HistoryStack<Command>({ coalesceMs: 400, now: () => now })

    history.push(configCmd('n1', 'v1'), 'config:n1:target')
    now += 100
    history.push(configCmd('n1', 'v2'), 'config:n1:target')
    now += 100
    history.push(configCmd('n1', 'v3'), 'config:n1:target')

    expect(history.pastLength).toBe(1)
    const undone = history.undo()
    expect(undone).toMatchObject({ after: 'v3' })
  })

  it('does not coalesce across a gap larger than the window', () => {
    let now = 0
    const history = new HistoryStack<Command>({ coalesceMs: 400, now: () => now })
    history.push(configCmd('n1', 'v1'), 'config:n1:target')
    now += 500
    history.push(configCmd('n1', 'v2'), 'config:n1:target')
    expect(history.pastLength).toBe(2)
  })

  it('does not coalesce across a different key', () => {
    const history = new HistoryStack<Command>()
    history.push(configCmd('n1', 'v1'), 'config:n1:target')
    history.push(configCmd('n2', 'v1'), 'config:n2:target')
    expect(history.pastLength).toBe(2)
  })

  it('does not coalesce when key is null', () => {
    const history = new HistoryStack<Command>()
    history.push(addNodeCmd('a'), null)
    history.push(addNodeCmd('b'), null)
    expect(history.pastLength).toBe(2)
  })

  it('clear() empties both stacks', () => {
    const history = new HistoryStack<Command>()
    history.push(addNodeCmd('a'))
    history.undo()
    history.clear()
    expect(history.canUndo).toBe(false)
    expect(history.canRedo).toBe(false)
  })
})
