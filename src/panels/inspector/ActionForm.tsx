/** Inspector form for an Action node (ARCHITECTURE.md §2). */
import { ACTION_KINDS } from '@/domain/types'
import type { ActionKind, NodeOfType } from '@/domain/types'
import { Field } from '@/components/Field'
import { Select } from '@/components/Select'
import { Toggle } from '@/components/Toggle'
import { INPUT_CLASSES } from '../_fallback/inputClasses'
import { fieldDescribedBy } from '../_fallback/fieldDescribedBy'
import { ACTION_FIELDS, ACTION_TYPE_OPTIONS } from '../content'
import { useNodeField } from './useNodeField'

const ACTION_TYPE_SELECT_OPTIONS = ACTION_KINDS.map((kind) => ({
  value: kind,
  label: ACTION_TYPE_OPTIONS[kind],
}))

function validateDuration(ms: number): string | undefined {
  if (Number.isNaN(ms)) return 'Enter a number of milliseconds.'
  if (ms < 0 || ms > 60000) return 'Duration must be between 0 and 60000 ms.'
  return undefined
}

export function ActionForm({ node }: { node: NodeOfType<'action'> }) {
  const action = useNodeField(node.id, 'action', node.config.action, { immediate: true })
  const target = useNodeField(node.id, 'target', node.config.target)
  const duration = useNodeField(node.id, 'durationMs', node.config.durationMs, {
    validate: validateDuration,
  })
  const simulateFailure = useNodeField(node.id, 'simulateFailure', node.config.simulateFailure, {
    immediate: true,
  })
  const continueOnFailure = useNodeField(
    node.id,
    'continueOnFailure',
    node.config.continueOnFailure,
    { immediate: true },
  )

  return (
    <>
      <Field label={ACTION_FIELDS.type.label}>
        <Select
          id="inspector-field-action"
          data-testid="inspector-field-action"
          options={ACTION_TYPE_SELECT_OPTIONS}
          value={action.value}
          onChange={(e) => action.setValue(e.target.value as ActionKind)}
        />
      </Field>
      <Field
        label={ACTION_FIELDS.target.label}
        helper={ACTION_FIELDS.target.helper}
      >
        <input
          id="inspector-field-target"
          data-testid="inspector-field-target"
          className={INPUT_CLASSES}
          placeholder={ACTION_FIELDS.target.placeholder}
          value={target.value}
          onChange={(e) => target.setValue(e.target.value)}
          onBlur={target.flush}
        />
      </Field>
      <Field
        label={ACTION_FIELDS.duration.label}
        helper={ACTION_FIELDS.duration.helper}
        error={duration.error}
      >
        <div className="relative">
          <input
            id="inspector-field-durationMs"
            data-testid="inspector-field-durationMs"
            type="number"
            min={0}
            max={60000}
            className={`${INPUT_CLASSES} pr-9`}
            aria-invalid={Boolean(duration.error)}
            aria-describedby={fieldDescribedBy(
              'inspector-field-durationMs',
              ACTION_FIELDS.duration.helper,
              duration.error,
            )}
            value={duration.value}
            onChange={(e) => duration.setValue(Number(e.target.value))}
            onBlur={duration.flush}
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-meta text-text-subtle">
            ms
          </span>
        </div>
      </Field>
      <label htmlFor="inspector-field-simulateFailure" className="inline-flex cursor-pointer items-center gap-2">
        <Toggle
          id="inspector-field-simulateFailure"
          checked={simulateFailure.value}
          onChange={simulateFailure.setValue}
        />
        <span className="text-body text-cream-200">{ACTION_FIELDS.simulateFailure.label}</span>
      </label>
      <p className="text-meta text-text-muted">{ACTION_FIELDS.simulateFailure.helper}</p>
      <label htmlFor="inspector-field-continueOnFailure" className="inline-flex cursor-pointer items-center gap-2">
        <Toggle
          id="inspector-field-continueOnFailure"
          checked={continueOnFailure.value}
          onChange={continueOnFailure.setValue}
        />
        <span className="text-body text-cream-200">{ACTION_FIELDS.continueOnFailure.label}</span>
      </label>
      <p className="text-meta text-text-muted">{ACTION_FIELDS.continueOnFailure.helper}</p>
    </>
  )
}
