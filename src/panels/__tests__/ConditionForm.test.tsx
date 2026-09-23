import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createNode } from '@/domain'
import type { NodeOfType } from '@/domain/types'
import { workflowStore } from '@/store'
import { ConditionForm } from '../inspector/ConditionForm'

describe('ConditionForm', () => {
  it('writes an immediate operator change through to the store', async () => {
    const node = createNode('condition', { x: 0, y: 0 })
    workflowStore.getState().addNode(node)

    render(<ConditionForm node={node as NodeOfType<'condition'>} />)
    const user = userEvent.setup()

    await user.selectOptions(screen.getByTestId('inspector-field-operator'), 'gt')

    const updated = workflowStore
      .getState()
      .document.nodes.find((n) => n.id === node.id)
    expect(updated?.type).toBe('condition')
    expect(updated && updated.type === 'condition' && updated.config.operator).toBe('gt')
  })

  it('debounces a value change and commits it after a blur flush', async () => {
    const node = createNode('condition', { x: 0, y: 0 })
    workflowStore.getState().addNode(node)

    render(<ConditionForm node={node as NodeOfType<'condition'>} />)
    const user = userEvent.setup()

    const valueInput = screen.getByTestId('inspector-field-value')
    await user.clear(valueInput)
    await user.type(valueInput, 'high')
    valueInput.blur()

    const updated = workflowStore
      .getState()
      .document.nodes.find((n) => n.id === node.id)
    expect(updated && updated.type === 'condition' && updated.config.value).toBe('high')
  })

  it('hides the value field once the operator is "Exists"', async () => {
    const node = createNode('condition', { x: 0, y: 0 }, { config: { operator: 'exists' } })
    workflowStore.getState().addNode(node)

    render(<ConditionForm node={node as NodeOfType<'condition'>} />)

    expect(screen.queryByTestId('inspector-field-value')).not.toBeInTheDocument()
  })
})
