import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Tabs } from '../Tabs'

const items = [
  { id: 'a', label: 'Payload', panel: <p>Payload panel</p> },
  { id: 'b', label: 'Timeline', panel: <p>Timeline panel</p> },
  { id: 'c', label: 'Issues', panel: <p>Issues panel</p> },
]

describe('Tabs', () => {
  it('shows the first tab selected and its panel visible by default', () => {
    render(<Tabs label="Run" items={items} />)
    expect(screen.getByRole('tab', { name: 'Payload' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Payload panel')).toBeVisible()
  })

  it('moves selection with ArrowRight/ArrowLeft and wraps at the ends (roving tabindex)', async () => {
    const user = userEvent.setup()
    render(<Tabs label="Run" items={items} />)

    const first = screen.getByRole('tab', { name: 'Payload' })
    const second = screen.getByRole('tab', { name: 'Timeline' })
    const last = screen.getByRole('tab', { name: 'Issues' })

    expect(first).toHaveAttribute('tabindex', '0')
    expect(second).toHaveAttribute('tabindex', '-1')

    first.focus()
    await user.keyboard('{ArrowRight}')
    expect(second).toHaveFocus()
    expect(second).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Timeline panel')).toBeVisible()

    await user.keyboard('{ArrowRight}')
    expect(last).toHaveFocus()

    // Wraps forward past the last tab back to the first.
    await user.keyboard('{ArrowRight}')
    expect(first).toHaveFocus()

    // Wraps backward past the first tab to the last.
    await user.keyboard('{ArrowLeft}')
    expect(last).toHaveFocus()
  })

  it('Home/End jump to the first/last tab', async () => {
    const user = userEvent.setup()
    render(<Tabs label="Run" items={items} />)
    const first = screen.getByRole('tab', { name: 'Payload' })
    const last = screen.getByRole('tab', { name: 'Issues' })

    first.focus()
    await user.keyboard('{End}')
    expect(last).toHaveFocus()

    await user.keyboard('{Home}')
    expect(first).toHaveFocus()
  })
})
