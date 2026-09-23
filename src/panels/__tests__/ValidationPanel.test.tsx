import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { workflowStore } from '@/store'
import { ValidationPanel } from '../ValidationPanel'

describe('ValidationPanel', () => {
  it('renders the success state when there are no issues', () => {
    workflowStore.setState({ issues: [] })
    render(<ValidationPanel />)
    expect(screen.getByText('No issues found. This workflow is ready to run.')).toBeInTheDocument()
  })

  it('clicking an issue row selects its node', async () => {
    workflowStore.setState({
      issues: [
        {
          id: 'ACTION_MISSING_TARGET:node-1:target',
          severity: 'error',
          code: 'ACTION_MISSING_TARGET',
          message: 'Page on-call needs a target.',
          nodeId: 'node-1',
          field: 'target',
        },
      ],
      selectedNodeId: null,
    })

    render(<ValidationPanel />)
    const user = userEvent.setup()

    await user.click(screen.getByTestId('validation-issue-ACTION_MISSING_TARGET'))

    expect(workflowStore.getState().selectedNodeId).toBe('node-1')
  })
})
