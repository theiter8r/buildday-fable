/**
 * Branch-decision chips anchored to Condition nodes once their branch has
 * been decided during a run (DESIGN.md §6 "Branch decision": "the chosen
 * pill scales 0.9 -> 1 and fades in"). The running-node pulse ring itself
 * lives on the node card (`NodeShell`'s `.opsflow-node-running` class) so
 * it survives the node unmounting/remounting independently of this overlay.
 *
 * Anchoring uses React Flow's `<NodeToolbar nodeId>` (spike doc §A.16)
 * rather than hand-computing screen coordinates from the viewport.
 */
import { NodeToolbar, Position } from '@xyflow/react'
import { useOpsflowStore } from '@/store'

export function RunOverlay() {
  const document = useOpsflowStore((s) => s.document)
  const nodeStates = useOpsflowStore((s) => s.nodeStates)
  const status = useOpsflowStore((s) => s.status)

  if (status === 'idle') return null

  const conditionNodes = document.nodes.filter((n) => n.type === 'condition')

  return (
    <>
      {conditionNodes.map((node) => {
        const state = nodeStates[node.id] ?? 'idle'
        const decided = state !== 'idle' && state !== 'pending' && state !== 'running'
        if (!decided) return null

        const takenEdge = document.edges.find(
          (edge) =>
            edge.source === node.id &&
            edge.sourceHandle &&
            (nodeStates[edge.target] ?? 'idle') !== 'skipped',
        )
        if (!takenEdge?.sourceHandle) return null

        const branch = takenEdge.sourceHandle
        return (
          <NodeToolbar
            key={node.id}
            nodeId={node.id}
            isVisible
            position={Position.Top}
            className="pointer-events-none"
          >
            <div
              data-testid={`branch-chip-${node.id}`}
              className="rounded-full px-2 py-0.5 font-semibold tracking-wide uppercase"
              style={{
                fontSize: 'var(--text-micro)',
                backgroundColor:
                  branch === 'true' ? 'var(--color-state-success)' : 'var(--color-navy-700)',
                color: branch === 'true' ? 'var(--color-on-gold)' : 'var(--color-cream-100)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              Branch: {branch}
            </div>
          </NodeToolbar>
        )
      })}
    </>
  )
}
