/**
 * "Awaiting <role>" card shown while `status === 'awaiting-approval'`
 * (ARCHITECTURE.md §2, CONTENT.md §6). Renders nothing otherwise.
 */
import { useOpsflowStore } from '@/store'
import { Button } from '@/components/Button'
import { RUN_CONTENT } from './content'

export function ApprovalPrompt() {
  const status = useOpsflowStore((s) => s.status)
  const pendingApprovalNodeId = useOpsflowStore((s) => s.pendingApprovalNodeId)
  const document = useOpsflowStore((s) => s.document)
  const approve = useOpsflowStore((s) => s.approve)
  const reject = useOpsflowStore((s) => s.reject)

  if (status !== 'awaiting-approval' || !pendingApprovalNodeId) return null

  const node = document.nodes.find((n) => n.id === pendingApprovalNodeId)
  if (!node || node.type !== 'approval') return null

  return (
    <div
      role="alert"
      data-testid="approval-prompt"
      className="flex flex-col gap-2 rounded-md border border-gold-400 bg-navy-800 p-3 shadow-[var(--glow-awaiting)]"
    >
      <p className="text-label font-semibold text-gold-300">{RUN_CONTENT.awaitingApproval.title}</p>
      <p className="text-body text-cream-200">
        {RUN_CONTENT.awaitingApproval.body(node.label, node.config.approverRole)}
      </p>
      <div className="flex gap-2">
        <Button variant="gold" data-testid="approve-button" onClick={() => approve(node.id)}>
          {RUN_CONTENT.awaitingApproval.approve}
        </Button>
        <Button variant="danger" data-testid="reject-button" onClick={() => reject(node.id)}>
          {RUN_CONTENT.awaitingApproval.reject}
        </Button>
      </div>
    </div>
  )
}
