import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { PayloadEditor } from '../PayloadEditor'

describe('PayloadEditor', () => {
  it('shows a readable error for invalid JSON, then clears it once the JSON is valid again', async () => {
    render(<PayloadEditor />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('tab', { name: 'Edit as JSON' }))

    const textarea = screen.getByTestId('payload-json-textarea')
    fireEvent.change(textarea, { target: { value: '{ not valid json' } })

    expect(await screen.findByText(/isn't valid JSON/i)).toBeInTheDocument()

    fireEvent.change(textarea, {
      target: {
        value: JSON.stringify({
          title: 'x',
          severity: 'low',
          service: 'svc',
          errorRate: 0.1,
          region: 'us-east-1',
          affectedUsers: 1,
          source: 'manual',
          tags: [],
          detectedAt: new Date().toISOString(),
          metadata: {},
        }),
      },
    })

    expect(screen.getByText('Valid payload')).toBeInTheDocument()
  })

  it('shows a schema error when the JSON parses but does not match the payload shape', async () => {
    render(<PayloadEditor />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('tab', { name: 'Edit as JSON' }))
    const textarea = screen.getByTestId('payload-json-textarea')
    fireEvent.change(textarea, { target: { value: '{"severity":"not-a-severity"}' } })

    expect(await screen.findByText(/doesn't match the expected payload shape/i)).toBeInTheDocument()
  })
})
