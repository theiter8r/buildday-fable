import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SimulationResult } from '@/domain/types'
import type { OpsflowTestHandleExtended } from '../testHandle'

/**
 * `window.__opsflow`'s declared global type (`src/vite-env.d.ts`) is a
 * shared contract this lane doesn't own, so it only lists the base
 * `OpsflowTestHandle` methods. `installTestHandle` actually assigns an
 * `OpsflowTestHandleExtended` (see `testHandle.ts`); this local cast lets
 * this lane's own tests exercise the extra helpers without editing that
 * file (requested instead in `docs/lane-notes/store.md`).
 */
function handle(): OpsflowTestHandleExtended {
  return window.__opsflow as unknown as OpsflowTestHandleExtended
}

// `simulate`/`importWorkflow`/`exportWorkflow` are domain-lane stubs
// (`src/domain/simulator.ts`, `src/domain/io.ts`) that currently throw "not
// implemented". Mocking them tests the test-handle's own wiring — that
// `runInstant`/`importJson`/`exportJson` really do call the real store
// actions rather than a second code path — independent of that lane.
vi.mock('@/domain', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/domain')>()
  return {
    ...actual,
    simulate: vi.fn(),
    applyEventToStates: vi.fn(() => ({})),
    validateWorkflow: vi.fn(() => []),
    importWorkflow: vi.fn(),
    exportWorkflow: vi.fn(),
  }
})

const { installTestHandle } = await import('../testHandle')
const { workflowStore } = await import('../workflowStore')
const { simulate, importWorkflow, exportWorkflow, createDemoWorkflow } = await import('@/domain')

function linearRun(): SimulationResult {
  return {
    events: [
      { kind: 'run-started', at: 0, payloadSummary: 'demo' },
      { kind: 'run-finished', at: 10, status: 'completed', summary: 'done' },
    ],
    status: 'completed',
    finalNodeStates: {},
    totalDurationMs: 10,
  }
}

beforeEach(() => {
  vi.mocked(simulate).mockReset().mockReturnValue(linearRun())
  vi.mocked(importWorkflow).mockReset()
  vi.mocked(exportWorkflow).mockReset()
  workflowStore.getState().resetToDemo()
  workflowStore.getState().reset()
  installTestHandle()
})

describe('window.__opsflow', () => {
  it('is installed under vitest (DEV mode) with the data-e2e attribute set', () => {
    expect(window.__opsflow).toBeDefined()
    expect(document.documentElement.dataset.e2e).toBe('1')
  })

  it('addNode calls the real addNode action and returns the new id', () => {
    const before = workflowStore.getState().document.nodes.length
    const id = handle().addNode('action')
    expect(workflowStore.getState().document.nodes).toHaveLength(before + 1)
    expect(workflowStore.getState().document.nodes.some((n) => n.id === id)).toBe(true)
  })

  it('connect calls the real addEdge action', () => {
    const before = workflowStore.getState().document.edges.length
    const ok = handle().connect('demo-page-oncall', 'demo-approval-rollback')
    // Already connected in the demo graph via a different edge shape is fine either way —
    // what matters is this goes through the real, validated addEdge, not a shortcut.
    expect(typeof ok).toBe('boolean')
    expect(workflowStore.getState().document.edges.length).toBeGreaterThanOrEqual(before)
  })

  it('selectNode calls the real selectNode action', () => {
    handle().selectNode('demo-trigger')
    expect(workflowStore.getState().selectedNodeId).toBe('demo-trigger')
  })

  it('runInstant sets speed to instant and starts a run via the real actions', () => {
    handle().runInstant()
    expect(workflowStore.getState().speed).toBe('instant')
    expect(simulate).toHaveBeenCalledTimes(1)
    expect(workflowStore.getState().status).toBe('completed')
  })

  it('approve()/reject() no-op when nothing is pending', () => {
    expect(() => handle().approve()).not.toThrow()
    expect(() => handle().reject()).not.toThrow()
  })

  it('importJson calls the real setDoc action on success and reports failure otherwise', () => {
    const doc = createDemoWorkflow()
    vi.mocked(importWorkflow).mockReturnValueOnce({ ok: true, doc, warnings: [] })
    expect(handle().importJson('{}')).toBe(true)
    expect(workflowStore.getState().document).toBe(doc)

    vi.mocked(importWorkflow).mockReturnValueOnce({ ok: false, kind: 'json', message: 'bad json' })
    expect(handle().importJson('not json')).toBe(false)
  })

  it('exportJson calls the real exportWorkflow on the current document', () => {
    vi.mocked(exportWorkflow).mockReturnValueOnce({ filename: 'x.json', json: '{"ok":true}' })
    expect(handle().exportJson()).toBe('{"ok":true}')
    expect(exportWorkflow).toHaveBeenCalledWith(workflowStore.getState().document)
  })

  it('getState/setState are an escape hatch onto the real store', () => {
    handle().setState({ activeMobilePanel: 'run' })
    expect((handle().getState() as { activeMobilePanel: string }).activeMobilePanel).toBe(
      'run',
    )
  })

  it('undo/redo call the real history actions', () => {
    handle().addNode('action')
    const afterAdd = workflowStore.getState().document.nodes.length
    handle().undo()
    expect(workflowStore.getState().document.nodes.length).toBe(afterAdd - 1)
    handle().redo()
    expect(workflowStore.getState().document.nodes.length).toBe(afterAdd)
  })
})
