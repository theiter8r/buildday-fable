/** Inspector form for a Trigger node: source select + filter rows (ARCHITECTURE.md §2). */
import { createId } from '@/domain/ids'
import type { FilterRule, NodeOfType, Operator } from '@/domain/types'
import { OPERATORS } from '@/domain/types'
import { useOpsflowStore } from '@/store'
import { Field } from '@/components/Field'
import { Select } from '@/components/Select'
import { Button } from '@/components/Button'
import { INPUT_CLASSES } from '../_fallback/inputClasses'
import { OPERATOR_OPTIONS, TRIGGER_FIELDS } from '../content'
import { useNodeField } from './useNodeField'

export function TriggerForm({ node }: { node: NodeOfType<'trigger'> }) {
  const updateNodeConfig = useOpsflowStore((s) => s.updateNodeConfig)
  const source = useNodeField(node.id, 'source', node.config.source, { immediate: true })
  const description = useNodeField(node.id, 'description', node.config.description)

  function updateFilters(next: FilterRule[]) {
    updateNodeConfig(node.id, 'filters', next)
  }

  function addFilter() {
    const next: FilterRule[] = [
      ...node.config.filters,
      { id: createId('filter'), field: '', operator: 'equals', value: '' },
    ]
    updateFilters(next)
  }

  function removeFilter(id: string) {
    updateFilters(node.config.filters.filter((f) => f.id !== id))
  }

  function patchFilter(id: string, patch: Partial<FilterRule>) {
    updateFilters(node.config.filters.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }

  return (
    <>
      <Field
        label={TRIGGER_FIELDS.source.label}
        helper={TRIGGER_FIELDS.source.helper}
      >
        <Select
          id="inspector-field-source"
          data-testid="inspector-field-source"
          options={TRIGGER_FIELDS.source.options}
          value={source.value}
          onChange={(e) =>
            source.setValue(e.target.value as NodeOfType<'trigger'>['config']['source'])
          }
        />
      </Field>
      <Field
        label={TRIGGER_FIELDS.description.label}
        helper={TRIGGER_FIELDS.description.helper}
      >
        <input
          id="inspector-field-description"
          data-testid="inspector-field-description"
          className={INPUT_CLASSES}
          placeholder={TRIGGER_FIELDS.description.placeholder}
          value={description.value}
          onChange={(e) => description.setValue(e.target.value)}
          onBlur={description.flush}
        />
      </Field>

      <fieldset className="flex flex-col gap-2" data-testid="inspector-field-filters">
        <legend className="text-label font-medium text-cream-200">
          {TRIGGER_FIELDS.filters.label}
        </legend>
        <p className="text-meta text-text-muted">{TRIGGER_FIELDS.filters.helper}</p>
        {node.config.filters.length === 0 ? (
          <p className="text-meta text-text-subtle">{TRIGGER_FIELDS.filters.empty}</p>
        ) : null}
        {node.config.filters.map((filter) => (
          <div key={filter.id} className="flex items-start gap-2 rounded-sm border border-line p-2">
            <input
              aria-label="Filter field"
              className={INPUT_CLASSES}
              placeholder="field"
              value={filter.field}
              onChange={(e) => patchFilter(filter.id, { field: e.target.value })}
            />
            <select
              aria-label="Filter operator"
              className={INPUT_CLASSES}
              value={filter.operator}
              onChange={(e) => patchFilter(filter.id, { operator: e.target.value as Operator })}
            >
              {OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {OPERATOR_OPTIONS[op]}
                </option>
              ))}
            </select>
            {filter.operator !== 'exists' ? (
              <input
                aria-label="Filter value"
                className={INPUT_CLASSES}
                value={filter.value}
                onChange={(e) => patchFilter(filter.id, { value: e.target.value })}
              />
            ) : null}
            <Button
              variant="ghost"
              size="compact"
              aria-label={TRIGGER_FIELDS.filters.removeLabel}
              onClick={() => removeFilter(filter.id)}
            >
              ✕
            </Button>
          </div>
        ))}
        <Button variant="secondary" size="compact" onClick={addFilter}>
          {TRIGGER_FIELDS.filters.addLabel}
        </Button>
      </fieldset>
    </>
  )
}
