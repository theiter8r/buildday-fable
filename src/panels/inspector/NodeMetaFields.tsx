/**
 * Label + notes fields shared by every node type's inspector form
 * (ARCHITECTURE.md §2). Bound through `updateNodeMeta`, same 400ms
 * coalescing as config fields.
 */
import { useCallback } from 'react'
import type { WorkflowNode } from '@/domain/types'
import { useOpsflowStore } from '@/store'
import { Field } from '@/components/Field'
import { Textarea } from '@/components/Textarea'
import { INPUT_CLASSES } from '../_fallback/inputClasses'
import { META_FIELDS } from '../content'
import { useDebouncedCommit } from './useDebouncedCommit'

export function NodeMetaFields({ node }: { node: WorkflowNode }) {
  const updateNodeMeta = useOpsflowStore((s) => s.updateNodeMeta)

  const onCommitLabel = useCallback(
    (value: string) => updateNodeMeta(node.id, 'label', value),
    [updateNodeMeta, node.id],
  )
  const onCommitNotes = useCallback(
    (value: string) => updateNodeMeta(node.id, 'notes', value),
    [updateNodeMeta, node.id],
  )
  const label = useDebouncedCommit(`${node.id}:label`, node.label, onCommitLabel)
  const notes = useDebouncedCommit(`${node.id}:notes`, node.notes ?? '', onCommitNotes)

  return (
    <>
      <Field label={META_FIELDS.label.label}>
        <input
          id="inspector-field-label"
          data-testid="inspector-field-label"
          className={INPUT_CLASSES}
          value={label.value}
          onChange={(e) => label.setValue(e.target.value)}
          onBlur={label.flush}
        />
      </Field>
      <Field label={META_FIELDS.notes.label}>
        <Textarea
          id="inspector-field-notes"
          data-testid="inspector-field-notes"
          placeholder={META_FIELDS.notes.placeholder}
          value={notes.value}
          onChange={(e) => notes.setValue(e.target.value)}
          onBlur={notes.flush}
        />
      </Field>
    </>
  )
}
