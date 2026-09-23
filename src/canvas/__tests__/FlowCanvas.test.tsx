import './rfMocks'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { createDemoWorkflow } from '@/domain'
import { workflowStore } from '@/store'
import { FlowProvider } from '../FlowProvider'
import { FlowCanvas } from '../FlowCanvas'

afterEach(() => {
  cleanup()
  workflowStore.setState({ document: createDemoWorkflow(), selectedNodeId: null, selectedEdgeId: null })
})

describe('FlowCanvas smoke test (demo workflow)', () => {
  it('renders the canvas root with the right role and accessible name', () => {
    render(
      <FlowProvider>
        <FlowCanvas />
      </FlowProvider>,
    )
    const canvas = screen.getByTestId('canvas')
    expect(canvas).toHaveAttribute('role', 'application')
    expect(canvas).toHaveAccessibleName('Workflow canvas')
  })

  it('renders one node card per demo-workflow node', () => {
    render(
      <FlowProvider>
        <FlowCanvas />
      </FlowProvider>,
    )
    const demo = createDemoWorkflow()
    for (const node of demo.nodes) {
      expect(screen.getByTestId(`node-${node.id}`)).toBeInTheDocument()
    }
  })

  it('renders the canvas controls with real, labelled buttons', () => {
    render(
      <FlowProvider>
        <FlowCanvas />
      </FlowProvider>,
    )
    expect(screen.getByTestId('zoom-in-button')).toHaveAccessibleName('Zoom in')
    expect(screen.getByTestId('zoom-out-button')).toHaveAccessibleName('Zoom out')
    expect(screen.getByTestId('fit-view-button')).toBeInTheDocument()
    expect(screen.getByTestId('undo-button')).toBeDisabled()
    expect(screen.getByTestId('redo-button')).toBeDisabled()
  })

  it('renders the Condition node with labelled true/false handles', () => {
    render(
      <FlowProvider>
        <FlowCanvas />
      </FlowProvider>,
    )
    expect(screen.getByText('TRUE')).toBeInTheDocument()
    expect(screen.getByText('FALSE')).toBeInTheDocument()
  })
})
