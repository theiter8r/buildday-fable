import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../App'

describe('App', () => {
  it('renders the OpsFlow shell', () => {
    render(<App />)
    // No persisted document in jsdom's localStorage -> BootGate renders the hero.
    expect(screen.getByTestId('hero')).toBeInTheDocument()
    expect(screen.getByTestId('hero-load-demo')).toBeInTheDocument()
  })
})
