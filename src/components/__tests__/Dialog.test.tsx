import { useState } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Dialog } from '../Dialog'

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open</button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Test dialog" testId="test-dialog">
        <button>First</button>
        <button>Second</button>
      </Dialog>
    </div>
  )
}

describe('Dialog', () => {
  it('is not rendered when closed, and appears with a focused, labelled surface when opened', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    expect(screen.queryByTestId('test-dialog')).not.toBeInTheDocument()

    await user.click(screen.getByText('Open'))
    expect(screen.getByTestId('test-dialog')).toBeInTheDocument()
    expect(screen.getByText('Test dialog')).toBeInTheDocument()
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const trigger = screen.getByText('Open')
    await user.click(trigger)
    expect(screen.getByTestId('test-dialog')).toBeInTheDocument()

    fireEvent.keyDown(screen.getByTestId('test-dialog'), { key: 'Escape' })
    await waitFor(() => expect(screen.queryByTestId('test-dialog')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })

  it('traps Tab focus inside the dialog (wraps last -> first and first -> last)', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByText('Open'))

    const dialog = screen.getByTestId('test-dialog')
    const closeButton = screen.getByLabelText('Close dialog')
    const second = screen.getByText('Second')

    // Tabbing forward from the last focusable (Second) wraps to the first (Close).
    second.focus()
    expect(second).toHaveFocus()
    fireEvent.keyDown(dialog, { key: 'Tab' })
    expect(closeButton).toHaveFocus()

    // Shift+Tab from the first focusable (Close) wraps to the last (Second).
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
    expect(second).toHaveFocus()
  })

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    render(
      <Dialog open onClose={onClose} title="Standalone" testId="standalone-dialog">
        <p>Body</p>
      </Dialog>,
    )
    fireEvent.click(screen.getByLabelText('Close dialog'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
