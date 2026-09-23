/** Inspector form for a Resolution node (ARCHITECTURE.md §2). */
import { RESOLUTION_STATUSES } from '@/domain/types'
import type { NodeOfType, ResolutionStatus } from '@/domain/types'
import { Field } from '@/components/Field'
import { Select } from '@/components/Select'
import { Toggle } from '@/components/Toggle'
import { Textarea } from '@/components/Textarea'
import { RESOLUTION_FIELDS, RESOLUTION_STATUS_OPTIONS } from '../content'
import { useNodeField } from './useNodeField'

const STATUS_OPTIONS = RESOLUTION_STATUSES.map((status) => ({
  value: status,
  label: RESOLUTION_STATUS_OPTIONS[status],
}))

export function ResolutionForm({ node }: { node: NodeOfType<'resolution'> }) {
  const status = useNodeField(node.id, 'status', node.config.status, { immediate: true })
  const postmortemRequired = useNodeField(
    node.id,
    'postmortemRequired',
    node.config.postmortemRequired,
    { immediate: true },
  )
  const summary = useNodeField(node.id, 'summary', node.config.summary)

  return (
    <>
      <Field label={RESOLUTION_FIELDS.status.label}>
        <Select
          id="inspector-field-status"
          data-testid="inspector-field-status"
          options={STATUS_OPTIONS}
          value={status.value}
          onChange={(e) => status.setValue(e.target.value as ResolutionStatus)}
        />
      </Field>
      <label htmlFor="inspector-field-postmortemRequired" className="inline-flex cursor-pointer items-center gap-2">
        <Toggle
          id="inspector-field-postmortemRequired"
          checked={postmortemRequired.value}
          onChange={postmortemRequired.setValue}
        />
        <span className="text-body text-cream-200">{RESOLUTION_FIELDS.postmortemRequired.label}</span>
      </label>
      <p className="text-meta text-text-muted">{RESOLUTION_FIELDS.postmortemRequired.helper}</p>
      <Field
        label={RESOLUTION_FIELDS.summary.label}
        helper={RESOLUTION_FIELDS.summary.helper}
      >
        <Textarea
          id="inspector-field-summary"
          data-testid="inspector-field-summary"
          placeholder={RESOLUTION_FIELDS.summary.placeholder}
          value={summary.value}
          onChange={(e) => summary.setValue(e.target.value)}
          onBlur={summary.flush}
        />
      </Field>
    </>
  )
}
