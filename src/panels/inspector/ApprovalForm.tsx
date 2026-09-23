/** Inspector form for an Approval node (ARCHITECTURE.md §2). */
import { useCallback } from 'react'
import type { ApprovalPolicy, NodeOfType } from '@/domain/types'
import { APPROVAL_POLICIES } from '@/domain/types'
import { useOpsflowStore } from '@/store'
import { Field } from '@/components/Field'
import { Select } from '@/components/Select'
import { RadioGroup } from '@/components/RadioGroup'
import { INPUT_CLASSES } from '../_fallback/inputClasses'
import { fieldDescribedBy } from '../_fallback/fieldDescribedBy'
import { APPROVAL_FIELDS, APPROVAL_POLICY_OPTIONS, APPROVER_ROLE_OPTIONS } from '../content'
import { useNodeField } from './useNodeField'
import { useDebouncedCommit } from './useDebouncedCommit'

const MS_PER_MIN = 60000

function validateTimeout(minutes: number): string | undefined {
  if (Number.isNaN(minutes) || minutes <= 0) {
    return 'Timeout must be a positive number of minutes.'
  }
  return undefined
}

export function ApprovalForm({ node }: { node: NodeOfType<'approval'> }) {
  const approverRole = useNodeField(node.id, 'approverRole', node.config.approverRole, {
    immediate: true,
  })
  const updateNodeConfig = useOpsflowStore((s) => s.updateNodeConfig)
  const onCommitTimeout = useCallback(
    (minutes: number) => updateNodeConfig(node.id, 'timeoutMs', minutes * MS_PER_MIN),
    [updateNodeConfig, node.id],
  )
  const timeoutMinutes = useDebouncedCommit(
    `${node.id}:timeoutMs`,
    node.config.timeoutMs / MS_PER_MIN,
    onCommitTimeout,
    { validate: validateTimeout },
  )
  const policy = useNodeField(node.id, 'policy', node.config.policy, { immediate: true })
  const prompt = useNodeField(node.id, 'prompt', node.config.prompt)

  return (
    <>
      <Field label={APPROVAL_FIELDS.approverRole.label}>
        <Select
          id="inspector-field-approverRole"
          data-testid="inspector-field-approverRole"
          options={APPROVER_ROLE_OPTIONS}
          value={approverRole.value}
          onChange={(e) => approverRole.setValue(e.target.value)}
        />
      </Field>
      <Field
        label={APPROVAL_FIELDS.timeout.label}
        helper={APPROVAL_FIELDS.timeout.helper}
        error={timeoutMinutes.error}
      >
        <input
          id="inspector-field-timeoutMs"
          data-testid="inspector-field-timeoutMs"
          type="number"
          min={0}
          className={INPUT_CLASSES}
          aria-invalid={Boolean(timeoutMinutes.error)}
          aria-describedby={fieldDescribedBy(
            'inspector-field-timeoutMs',
            APPROVAL_FIELDS.timeout.helper,
            timeoutMinutes.error,
          )}
          value={timeoutMinutes.value}
          onChange={(e) => {
            const minutes = Number(e.target.value)
            timeoutMinutes.setValue(minutes)
          }}
          onBlur={timeoutMinutes.flush}
        />
      </Field>
      <RadioGroup
        name="inspector-field-policy"
        legend={APPROVAL_FIELDS.policy.label}
        value={policy.value}
        onChange={(v) => policy.setValue(v as ApprovalPolicy)}
        options={APPROVAL_POLICIES.map((p) => ({
          value: p,
          label: APPROVAL_POLICY_OPTIONS[p].label,
          helper: APPROVAL_POLICY_OPTIONS[p].helper,
        }))}
      />
      <Field
        label={APPROVAL_FIELDS.prompt.label}
        helper={APPROVAL_FIELDS.prompt.helper}
      >
        <input
          id="inspector-field-prompt"
          data-testid="inspector-field-prompt"
          className={INPUT_CLASSES}
          placeholder={APPROVAL_FIELDS.prompt.placeholder}
          value={prompt.value}
          onChange={(e) => prompt.setValue(e.target.value)}
          onBlur={prompt.flush}
        />
      </Field>
    </>
  )
}
