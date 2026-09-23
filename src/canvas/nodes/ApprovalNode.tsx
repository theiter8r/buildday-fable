import type { NodeProps } from '@xyflow/react'
import type { ApprovalConfig } from '@/domain/types'
import { useOpsflowStore } from '@/store'
import type { FlowNode } from '../types'
import { NodeShell } from './NodeShell'
import { APPROVER_ROLE_LABEL, formatTimeoutMs } from './labels'

/** Role/timeout/policy summary; real inline Approve/Reject buttons when the run is waiting here. */
export function ApprovalNode({ id, data, selected }: NodeProps<FlowNode>) {
  const config = data.node.config as ApprovalConfig
  const approve = useOpsflowStore((s) => s.approve)
  const reject = useOpsflowStore((s) => s.reject)
  const roleLabel = APPROVER_ROLE_LABEL[config.approverRole] ?? config.approverRole
  const policyLabel =
    config.policy === 'manual'
      ? 'Manual'
      : config.policy === 'auto-approve'
        ? 'Auto-approve'
        : 'Auto-reject'
  const isAwaiting = data.runState === 'awaiting-approval'

  return (
    <NodeShell
      id={id}
      type="approval"
      label={data.node.label}
      selected={selected}
      runState={data.runState}
      issues={data.issues}
      summaryLines={[roleLabel || '—', `${policyLabel} · ${formatTimeoutMs(config.timeoutMs)}`]}
      extra={
        isAwaiting ? (
          <div className="nodrag flex gap-2 pt-1">
            <button
              type="button"
              data-testid="approve-button"
              aria-label="Approve"
              className="h-9 flex-1 rounded-sm text-body font-medium"
              style={{ backgroundColor: 'var(--color-gold-400)', color: 'var(--color-on-gold)' }}
              onClick={(e) => {
                e.stopPropagation()
                approve(id)
              }}
            >
              Approve
            </button>
            <button
              type="button"
              data-testid="reject-button"
              aria-label="Reject"
              className="h-9 flex-1 rounded-sm border text-body font-medium"
              style={{ borderColor: 'var(--color-state-failed)', color: 'var(--color-state-failed)' }}
              onClick={(e) => {
                e.stopPropagation()
                reject(id)
              }}
            >
              Reject
            </button>
          </div>
        ) : undefined
      }
    />
  )
}
