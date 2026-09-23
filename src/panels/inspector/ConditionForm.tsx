/** Inspector form for a Condition node: field / operator / value (ARCHITECTURE.md §2). */
import { OPERATORS } from '@/domain/types'
import type { NodeOfType, Operator } from '@/domain/types'
import { Field } from '@/components/Field'
import { Select } from '@/components/Select'
import { INPUT_CLASSES } from '../_fallback/inputClasses'
import { CONDITION_FIELDS, CONDITION_FIELD_OPTIONS, OPERATOR_OPTIONS } from '../content'
import { useNodeField } from './useNodeField'

const OPERATOR_SELECT_OPTIONS = OPERATORS.map((op) => ({ value: op, label: OPERATOR_OPTIONS[op] }))

export function ConditionForm({ node }: { node: NodeOfType<'condition'> }) {
  const field = useNodeField(node.id, 'field', node.config.field, { immediate: true })
  const operator = useNodeField(node.id, 'operator', node.config.operator, { immediate: true })
  const value = useNodeField(node.id, 'value', node.config.value)

  return (
    <>
      <Field
        label={CONDITION_FIELDS.field.label}
        helper={CONDITION_FIELDS.field.helper}
      >
        <Select
          id="inspector-field-field"
          data-testid="inspector-field-field"
          options={CONDITION_FIELD_OPTIONS}
          value={field.value}
          onChange={(e) => field.setValue(e.target.value)}
        />
      </Field>
      <Field label={CONDITION_FIELDS.operator.label}>
        <Select
          id="inspector-field-operator"
          data-testid="inspector-field-operator"
          options={OPERATOR_SELECT_OPTIONS}
          value={operator.value}
          onChange={(e) => operator.setValue(e.target.value as Operator)}
        />
      </Field>
      {operator.value !== 'exists' ? (
        <Field
          label={CONDITION_FIELDS.value.label}
          helper={CONDITION_FIELDS.value.helper}
        >
          <input
            id="inspector-field-value"
            data-testid="inspector-field-value"
            className={INPUT_CLASSES}
            placeholder={CONDITION_FIELDS.value.placeholder}
            value={value.value}
            onChange={(e) => value.setValue(e.target.value)}
            onBlur={value.flush}
          />
        </Field>
      ) : null}
      <div className="rounded-sm border border-line-soft p-2.5">
        <p className="text-label font-medium text-cream-200">{CONDITION_FIELDS.branch.true.label}</p>
        <p className="text-meta text-text-muted">{CONDITION_FIELDS.branch.true.helper}</p>
      </div>
      <div className="rounded-sm border border-line-soft p-2.5">
        <p className="text-label font-medium text-cream-200">{CONDITION_FIELDS.branch.false.label}</p>
        <p className="text-meta text-text-muted">{CONDITION_FIELDS.branch.false.helper}</p>
      </div>
    </>
  )
}
