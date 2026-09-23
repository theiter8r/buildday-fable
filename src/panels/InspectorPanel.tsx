/**
 * Routes to the right inspector form for the selected node, or shows the
 * edge-selected / empty states (ARCHITECTURE.md §2, CONTENT.md §3).
 */
import { useState } from 'react'
import { useOpsflowStore } from '@/store'
import { NodeTypeIcon } from '@/components/icons'
import { Button } from '@/components/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { INSPECTOR_CONTENT } from './content'
import { NodeMetaFields } from './inspector/NodeMetaFields'
import { TriggerForm } from './inspector/TriggerForm'
import { ConditionForm } from './inspector/ConditionForm'
import { ActionForm } from './inspector/ActionForm'
import { ApprovalForm } from './inspector/ApprovalForm'
import { ResolutionForm } from './inspector/ResolutionForm'

export function InspectorPanel() {
  const document = useOpsflowStore((s) => s.document)
  const selectedNodeId = useOpsflowStore((s) => s.selectedNodeId)
  const selectedEdgeId = useOpsflowStore((s) => s.selectedEdgeId)
  const removeEdge = useOpsflowStore((s) => s.removeEdge)
  const removeNode = useOpsflowStore((s) => s.removeNode)
  const duplicateNode = useOpsflowStore((s) => s.duplicateNode)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const node = selectedNodeId ? document.nodes.find((n) => n.id === selectedNodeId) : undefined
  const edge = selectedEdgeId ? document.edges.find((e) => e.id === selectedEdgeId) : undefined

  return (
    <section
      aria-label="Inspector"
      data-testid="inspector"
      className="flex h-full flex-col overflow-y-auto p-4"
    >
      {node ? (
        <div className="flex h-full flex-col gap-3">
          <header className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-sm bg-navy-700"
              style={{ color: `var(--color-node-${node.type})` }}
            >
              <NodeTypeIcon type={node.type} size={16} />
            </span>
            <h2 className="text-title font-semibold text-cream-50">{node.label}</h2>
          </header>

          <NodeMetaFields node={node} />

          {node.type === 'trigger' ? <TriggerForm node={node} /> : null}
          {node.type === 'condition' ? <ConditionForm node={node} /> : null}
          {node.type === 'action' ? <ActionForm node={node} /> : null}
          {node.type === 'approval' ? <ApprovalForm node={node} /> : null}
          {node.type === 'resolution' ? <ResolutionForm node={node} /> : null}

          <div className="mt-auto flex justify-between gap-2 border-t border-line-soft pt-3">
            <Button variant="secondary" onClick={() => duplicateNode(node.id)}>
              {INSPECTOR_CONTENT.actions.duplicate}
            </Button>
            <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
              {INSPECTOR_CONTENT.actions.delete}
            </Button>
          </div>

          <ConfirmDialog
            open={confirmingDelete}
            title={INSPECTOR_CONTENT.actions.delete}
            body={`Delete "${node.label}"? This also removes any connections to or from it.`}
            confirmLabel={INSPECTOR_CONTENT.actions.delete}
            cancelLabel="Cancel"
            onConfirm={() => {
              removeNode(node.id)
              setConfirmingDelete(false)
            }}
            onClose={() => setConfirmingDelete(false)}
          />
        </div>
      ) : edge ? (
        <div className="flex flex-col gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-display text-cream-50">
            {INSPECTOR_CONTENT.edgeSelected.title}
          </h2>
          <p className="text-body text-cream-200">{INSPECTOR_CONTENT.edgeSelected.body}</p>
          <Button variant="danger" onClick={() => removeEdge(edge.id)}>
            {INSPECTOR_CONTENT.actions.delete}
          </Button>
        </div>
      ) : (
        <div
          className="m-auto flex max-w-xs flex-col items-center gap-2 text-center"
          data-testid="empty-state"
        >
          <h2 className="font-[family-name:var(--font-display)] text-display text-cream-50">
            {INSPECTOR_CONTENT.empty.title}
          </h2>
          <p className="text-body text-text-muted">{INSPECTOR_CONTENT.empty.body}</p>
          <p className="text-meta text-text-subtle">{INSPECTOR_CONTENT.empty.hint}</p>
        </div>
      )}
    </section>
  )
}
