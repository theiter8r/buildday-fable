import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BootGate } from '../BootGate'
import { STORAGE_KEYS } from '@/domain/constants'
import { workflowStore } from '@/store'

describe('BootGate', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders the hero when there is no persisted document', () => {
    render(
      <BootGate>
        <p>App content</p>
      </BootGate>,
    )
    expect(screen.getByTestId('hero')).toBeInTheDocument()
    expect(screen.queryByText('App content')).not.toBeInTheDocument()
  })

  it('renders the children straight through when the persisted document is valid', () => {
    const doc = workflowStore.getState().document
    localStorage.setItem(STORAGE_KEYS.document, JSON.stringify(doc))
    render(
      <BootGate>
        <p>App content</p>
      </BootGate>,
    )
    expect(screen.getByText('App content')).toBeInTheDocument()
    expect(screen.queryByTestId('hero')).not.toBeInTheDocument()
  })

  it('renders an error state with both recovery actions when the persisted document is corrupt', async () => {
    localStorage.setItem(STORAGE_KEYS.document, '{ not valid json')
    render(
      <BootGate>
        <p>App content</p>
      </BootGate>,
    )

    const errorState = screen.getByTestId('error-state')
    expect(errorState).toBeInTheDocument()
    expect(screen.getByText("Something's off with your saved workflow")).toBeInTheDocument()
    expect(screen.getByTestId('reset-button')).toBeInTheDocument()
    expect(screen.getByTestId('download-raw-data-button')).toBeInTheDocument()
    expect(screen.queryByText('App content')).not.toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByTestId('reset-button'))

    expect(screen.getByText('App content')).toBeInTheDocument()
    expect(screen.queryByTestId('error-state')).not.toBeInTheDocument()
  })
})
