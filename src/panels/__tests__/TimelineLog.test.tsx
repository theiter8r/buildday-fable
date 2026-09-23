import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { ExecutionEvent } from '@/domain/types'
import { workflowStore } from '@/store'
import { TimelineLog } from '../TimelineLog'

const EVENTS: ExecutionEvent[] = [
  { kind: 'run-started', at: 0, payloadSummary: 'critical incident' },
  { kind: 'node-started', at: 10, nodeId: 'node-1', nodeType: 'trigger', label: 'Checkout API alerts' },
  {
    kind: 'node-finished',
    at: 130,
    nodeId: 'node-1',
    outcome: 'success',
    detail: 'fired',
  },
]

describe('TimelineLog', () => {
  it('shows the empty state before any events have run', () => {
    workflowStore.setState({ events: [], currentIndex: -1 })
    render(<TimelineLog />)
    expect(screen.getByText('Nothing has run yet. Press Run to start.')).toBeInTheDocument()
  })

  it('renders one row per applied event using the CONTENT.md templates', () => {
    workflowStore.setState({ events: EVENTS, currentIndex: EVENTS.length - 1 })
    render(<TimelineLog />)

    expect(screen.getByTestId('timeline-row-0')).toHaveTextContent('critical incident')
    expect(screen.getByTestId('timeline-row-1')).toHaveTextContent(
      'Trigger fired — Checkout API alerts',
    )
    expect(screen.getByTestId('timeline-row-2')).toHaveTextContent('Action finished')
  })

  it('clicking a row selects that event\'s node', async () => {
    workflowStore.setState({ events: EVENTS, currentIndex: EVENTS.length - 1, selectedNodeId: null })
    render(<TimelineLog />)
    const user = userEvent.setup()

    await user.click(screen.getByTestId('timeline-row-1'))

    expect(workflowStore.getState().selectedNodeId).toBe('node-1')
  })
})
