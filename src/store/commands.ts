/**
 * `applyCommand` is the only function allowed to turn a `Command` into a new
 * `WorkflowDocument` (ARCHITECTURE.md §7, principle 4: "every mutation is a
 * command"). It is pure — same `doc`/`cmd` in, same document out, no clocks
 * except stamping `updatedAt`.
 *
 * DECISION: ARCHITECTURE.md also specifies a paired `invertCommand(cmd)`
 * that produces the inverse `Command`. This skeleton instead has
 * `history.ts` store the `before`/`after` document snapshot alongside each
 * command and restores `before` directly on undo. This is behaviourally
 * equivalent (undo/redo are exact and cheap at this document size) and
 * removes an entire class of "did I invert this command correctly" bugs
 * from a first pass; `invertCommand` can be added later as a pure
 * optimization (e.g. to avoid keeping two full snapshots per entry) without
 * changing this file's public API.
 */
import type { WorkflowDocument } from '@/domain/types'
import type { Command } from './types'

/** Applies `cmd` to `doc`, returning a new document. Never mutates `doc`. */
export function applyCommand(doc: WorkflowDocument, cmd: Command): WorkflowDocument {
  const updatedAt = new Date().toISOString()
  switch (cmd.t) {
    case 'add-node':
      return { ...doc, nodes: [...doc.nodes, cmd.node], updatedAt }

    case 'remove-nodes': {
      const nodeIds = new Set(cmd.nodes.map((n) => n.id))
      const edgeIds = new Set(cmd.edges.map((e) => e.id))
      return {
        ...doc,
        nodes: doc.nodes.filter((n) => !nodeIds.has(n.id)),
        edges: doc.edges.filter((e) => !edgeIds.has(e.id)),
        updatedAt,
      }
    }

    case 'add-edge': {
      const withoutReplaced = cmd.replaced
        ? doc.edges.filter((e) => e.id !== cmd.replaced!.id)
        : doc.edges
      return { ...doc, edges: [...withoutReplaced, cmd.edge], updatedAt }
    }

    case 'remove-edges': {
      const edgeIds = new Set(cmd.edges.map((e) => e.id))
      return { ...doc, edges: doc.edges.filter((e) => !edgeIds.has(e.id)), updatedAt }
    }

    case 'move-nodes': {
      const moves = new Map(cmd.moves.map((m) => [m.id, m.to]))
      return {
        ...doc,
        nodes: doc.nodes.map((n) => (moves.has(n.id) ? { ...n, position: moves.get(n.id)! } : n)),
        updatedAt,
      }
    }

    case 'update-config':
      return {
        ...doc,
        nodes: doc.nodes.map((n) =>
          n.id === cmd.nodeId
            ? ({ ...n, config: { ...n.config, [cmd.field]: cmd.after } } as typeof n)
            : n,
        ),
        updatedAt,
      }

    case 'update-meta':
      return {
        ...doc,
        nodes: doc.nodes.map((n) =>
          n.id === cmd.nodeId ? { ...n, [cmd.field]: cmd.after } : n,
        ),
        updatedAt,
      }

    case 'rename-doc':
      return { ...doc, name: cmd.after, updatedAt }

    case 'duplicate':
      return {
        ...doc,
        nodes: [...doc.nodes, ...cmd.nodes],
        edges: [...doc.edges, ...cmd.edges],
        updatedAt,
      }

    case 'replace-doc':
      return cmd.after

    default: {
      const exhaustive: never = cmd
      throw new Error(`Unknown command: ${JSON.stringify(exhaustive)}`)
    }
  }
}

/** The node ids a command touched, so `undo`/`redo` can select them without moving the camera unasked. */
export function affectedNodeIds(cmd: Command): string[] {
  switch (cmd.t) {
    case 'add-node':
      return [cmd.node.id]
    case 'remove-nodes':
      return cmd.nodes.map((n) => n.id)
    case 'move-nodes':
      return cmd.moves.map((m) => m.id)
    case 'update-config':
    case 'update-meta':
      return [cmd.nodeId]
    case 'duplicate':
      return cmd.nodes.map((n) => n.id)
    case 'add-edge':
    case 'remove-edges':
    case 'rename-doc':
    case 'replace-doc':
      return []
    default: {
      const exhaustive: never = cmd
      throw new Error(`Unknown command: ${JSON.stringify(exhaustive)}`)
    }
  }
}

/**
 * A stable key identifying "the same edit target" for coalescing purposes,
 * or `null` when a command type is never coalesced. Only `update-config`
 * and `update-meta` coalesce (ARCHITECTURE.md §7): typing into one field is
 * one undo step.
 */
export function coalesceKey(cmd: Command): string | null {
  if (cmd.t === 'update-config') return `config:${cmd.nodeId}:${cmd.field}`
  if (cmd.t === 'update-meta') return `meta:${cmd.nodeId}:${cmd.field}`
  return null
}
