/**
 * Grouped issue list: Errors / Warnings. Each row selects the node/edge and
 * requests focus in the inspector; a clean workflow shows the success state
 * (ARCHITECTURE.md §2, §6; CONTENT.md §4).
 */
import { ErrorIcon, WarningIcon } from '@/components/icons'
import type { ValidationIssue } from '@/domain/types'
import { useOpsflowStore } from '@/store'
import { VALIDATION_CONTENT } from './content'

function IssueRow({ issue, onSelect }: { issue: ValidationIssue; onSelect: (issue: ValidationIssue) => void }) {
  return (
    <li>
      <button
        type="button"
        data-testid={`validation-issue-${issue.code}`}
        onClick={() => onSelect(issue)}
        className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left hover:bg-navy-800 focus-visible:outline-none focus-visible:shadow-[var(--glow-focus)]"
      >
        {issue.severity === 'error' ? (
          <ErrorIcon size={16} className="mt-0.5 shrink-0 text-[var(--color-state-error)]" />
        ) : (
          <WarningIcon size={16} className="mt-0.5 shrink-0 text-[var(--color-state-warning)]" />
        )}
        <span className="text-body text-cream-200">{issue.message}</span>
      </button>
    </li>
  )
}

export function ValidationPanel() {
  const issues = useOpsflowStore((s) => s.issues)
  const selectNode = useOpsflowStore((s) => s.selectNode)
  const selectEdge = useOpsflowStore((s) => s.selectEdge)

  const errors = issues.filter((i) => i.severity === 'error')
  const warnings = issues.filter((i) => i.severity === 'warning')

  function onSelect(issue: ValidationIssue) {
    if (issue.nodeId) {
      selectNode(issue.nodeId)
    } else if (issue.edgeId) {
      selectEdge(issue.edgeId)
    }
  }

  return (
    <section
      aria-label={VALIDATION_CONTENT.panel.header}
      data-testid="validation-panel"
      className="flex h-full flex-col gap-3 overflow-y-auto p-3"
    >
      <h3 className="text-title font-semibold text-cream-50">{VALIDATION_CONTENT.panel.header}</h3>
      {issues.length === 0 ? (
        <p className="text-body text-[var(--color-state-success)]" data-testid="empty-state">
          {VALIDATION_CONTENT.panel.empty}
        </p>
      ) : (
        <>
          {errors.length > 0 ? (
            <div>
              <h4 className="text-micro font-semibold uppercase tracking-[0.08em] text-text-muted">
                Errors
              </h4>
              <ul>
                {errors.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} onSelect={onSelect} />
                ))}
              </ul>
            </div>
          ) : null}
          {warnings.length > 0 ? (
            <div>
              <h4 className="text-micro font-semibold uppercase tracking-[0.08em] text-text-muted">
                Warnings
              </h4>
              <ul>
                {warnings.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} onSelect={onSelect} />
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
