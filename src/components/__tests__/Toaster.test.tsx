import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Toaster } from '../Toaster'
import { workflowStore } from '@/store'
import type { ToastMessage } from '@/store/types'

function setToasts(toasts: ToastMessage[]) {
  act(() => {
    workflowStore.setState({ toasts })
  })
}

describe('Toaster', () => {
  afterEach(() => {
    setToasts([])
  })

  it('renders one toast per queued message with the right role per variant', () => {
    render(<Toaster />)
    setToasts([
      { id: '1', variant: 'success', title: 'Workflow exported' },
      { id: '2', variant: 'error', title: 'Import failed', description: 'Bad JSON' },
    ])

    const toasts = screen.getAllByTestId('toast')
    expect(toasts).toHaveLength(2)
    expect(screen.getByText('Workflow exported').closest('[data-testid="toast"]')).toHaveAttribute(
      'role',
      'status',
    )
    expect(screen.getByText('Import failed').closest('[data-testid="toast"]')).toHaveAttribute(
      'role',
      'alert',
    )
    expect(screen.getByText('Bad JSON')).toBeInTheDocument()
  })

  it('shows at most 3 stacked toasts, keeping the most recent', () => {
    render(<Toaster />)
    setToasts([
      { id: '1', variant: 'info', title: 'First' },
      { id: '2', variant: 'info', title: 'Second' },
      { id: '3', variant: 'info', title: 'Third' },
      { id: '4', variant: 'info', title: 'Fourth' },
    ])

    expect(screen.getAllByTestId('toast')).toHaveLength(3)
    expect(screen.queryByText('First')).not.toBeInTheDocument()
    expect(screen.getByText('Fourth')).toBeInTheDocument()
  })

  it('every toast has a dismiss button labelled for assistive tech', () => {
    render(<Toaster />)
    setToasts([{ id: '1', variant: 'success', title: 'Saved' }])
    expect(screen.getByLabelText('Dismiss notification')).toBeInTheDocument()
  })
})
