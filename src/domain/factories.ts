/**
 * Construction helpers for documents, nodes and edges. These are the only
 * places `WorkflowNode`/`WorkflowEdge`/`WorkflowDocument` literals get built
 * from scratch — every other lane should call through here rather than
 * hand-rolling an object literal, so defaults stay in one place.
 */
import { SCHEMA_VERSION } from './constants'
import { createId } from './ids'
import { DEFAULT_CONFIG, NODE_DEFS } from './nodeDefs'
import type {
  BranchHandle,
  ConfigOfType,
  NodeType,
  WorkflowDocument,
  WorkflowEdge,
  WorkflowNode,
  XY,
} from './types'

/**
 * Creates a fully-typed node of `type` at `position`, seeded with that
 * type's default config (see `nodeDefs.ts#DEFAULT_CONFIG`). `overrides` may
 * replace `label`, `notes` or part of `config`; deep-merged one level into
 * `config` so callers can tweak a single field.
 */
export function createNode<T extends NodeType>(
  type: T,
  position: XY,
  overrides?: { label?: string; notes?: string; config?: Partial<ConfigOfType<T>> },
): WorkflowNode {
  const base = {
    id: createId('node'),
    label: overrides?.label ?? NODE_DEFS[type].label,
    notes: overrides?.notes,
    position,
  }
  switch (type) {
    case 'trigger':
      return {
        ...base,
        type: 'trigger',
        config: { ...DEFAULT_CONFIG.trigger, ...(overrides?.config as object) },
      }
    case 'condition':
      return {
        ...base,
        type: 'condition',
        config: { ...DEFAULT_CONFIG.condition, ...(overrides?.config as object) },
      }
    case 'action':
      return {
        ...base,
        type: 'action',
        config: { ...DEFAULT_CONFIG.action, ...(overrides?.config as object) },
      }
    case 'approval':
      return {
        ...base,
        type: 'approval',
        config: { ...DEFAULT_CONFIG.approval, ...(overrides?.config as object) },
      }
    case 'resolution':
      return {
        ...base,
        type: 'resolution',
        config: { ...DEFAULT_CONFIG.resolution, ...(overrides?.config as object) },
      }
    default: {
      const exhaustive: never = type
      throw new Error(`Unknown node type: ${String(exhaustive)}`)
    }
  }
}

/**
 * Deep-clones `node` with a fresh id and an offset position, keeping every
 * other field (including config) identical. Used by `Cmd/Ctrl+D` duplicate.
 */
export function duplicateNode(node: WorkflowNode, offset: XY = { x: 32, y: 32 }): WorkflowNode {
  return {
    ...structuredCloneNode(node),
    id: createId('node'),
    position: { x: node.position.x + offset.x, y: node.position.y + offset.y },
  }
}

function structuredCloneNode(node: WorkflowNode): WorkflowNode {
  if (typeof structuredClone === 'function') {
    return structuredClone(node)
  }
  return JSON.parse(JSON.stringify(node)) as WorkflowNode
}

/**
 * Creates an edge from `source` to `target`. `sourceHandle` should be
 * provided (`'true'` | `'false'`) when `source` is a Condition node and
 * omitted/`null` otherwise.
 */
export function createEdge(
  source: string,
  target: string,
  sourceHandle?: BranchHandle | null,
): WorkflowEdge {
  return {
    id: createId('edge'),
    source,
    target,
    sourceHandle: sourceHandle ?? null,
  }
}

/** A brand-new, empty workflow document ready to receive a Trigger node. */
export function createEmptyWorkflow(name = 'Untitled workflow'): WorkflowDocument {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: createId('workflow'),
    name,
    nodes: [],
    edges: [],
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Factory for an empty workflow document, matching the task brief's
 * `EMPTY_WORKFLOW` naming. Prefer `createEmptyWorkflow()` directly; this
 * exists so `EMPTY_WORKFLOW()` reads naturally at call sites that expect a
 * zero-arg factory.
 */
export const EMPTY_WORKFLOW = (): WorkflowDocument => createEmptyWorkflow()
