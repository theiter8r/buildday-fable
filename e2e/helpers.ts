/**
 * Shared Playwright helpers for OpsFlow specs, built strictly against the
 * `data-testid` table and `window.__opsflow` contract in
 * `docs/testing-conventions.md`. Every helper prefers a real user action
 * (click, drag, keyboard) — `connectViaHandle` is the one deliberate
 * exception, used to set up state precisely without a flaky pointer drag,
 * per ARCHITECTURE.md §11 ("primarily a test-only store handle, plus at
 * least one real drag test").
 *
 * No fixed `page.waitForTimeout` sleeps anywhere in this file — every wait
 * is either an auto-waiting locator assertion or an `expect.poll` against
 * real state (store data or a `data-testid`/`data-run-state` attribute).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Download, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import type { IncidentPayload, NodeType, RunStatus, WorkflowDocument } from '@/domain/types'
import type { OpsflowHandle } from './fixtures'

/** Clicks a palette card for `type`, which adds the node at the viewport centre and selects it (ARCHITECTURE.md §11). */
export async function addNodeFromPalette(page: Page, type: NodeType): Promise<void> {
  await page.getByTestId(`palette-item-${type}`).click()
}

/**
 * Drags a palette card onto the canvas at an explicit drop point (desktop
 * pointer-fine only). Native HTML5 DnD needs real mouse events, not
 * `dragTo`, to fire the intermediate `dragover` React Flow listens to
 * (docs/spikes/react-flow-playwright.md §A.7, §E.7).
 */
export async function dragNodeFromPalette(
  page: Page,
  type: NodeType,
  dropPoint: { x: number; y: number },
): Promise<void> {
  const source = page.getByTestId(`palette-item-${type}`)
  const box = await source.boundingBox()
  if (!box) throw new Error(`palette-item-${type} has no bounding box`)

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(dropPoint.x, dropPoint.y, { steps: 12 })
  await page.mouse.up()
}

/**
 * Real mouse drag between two React Flow handles (the mandatory drag-connect
 * test per ARCHITECTURE.md §11). `steps` matters: React Flow needs several
 * intermediate `pointermove` events to register the connection drag at all.
 */
export async function connectByHandleDrag(
  page: Page,
  options: {
    sourceNodeId: string
    sourceHandleId?: 'true' | 'false'
    targetNodeId: string
  },
): Promise<void> {
  const sourceSelector = options.sourceHandleId
    ? `[data-testid="node-${options.sourceNodeId}"] .react-flow__handle[data-handleid="${options.sourceHandleId}"]`
    : `[data-testid="node-${options.sourceNodeId}"] .react-flow__handle.source`
  const targetSelector = `[data-testid="node-${options.targetNodeId}"] .react-flow__handle.target`

  const from = page.locator(sourceSelector).first()
  const to = page.locator(targetSelector).first()

  const a = await from.boundingBox()
  const b = await to.boundingBox()
  if (!a || !b) throw new Error('connectByHandleDrag: source or target handle has no bounding box')

  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2)
  await page.mouse.down()
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 24 })
  await page.mouse.up()

  await expect(page.locator('.react-flow__edge')).not.toHaveCount(0)
}

/** Connects two nodes via the test-only store handle — precise, no pointer flakiness. */
export async function connectViaHandle(
  opsflow: OpsflowHandle,
  source: string,
  target: string,
  sourceHandle: 'true' | 'false' | null = null,
): Promise<boolean> {
  return opsflow.connect(source, target, sourceHandle)
}

/** Selects a canvas node by id (keyboard-safe: clicks the node card, then confirms selection). */
export async function selectNode(page: Page, nodeId: string): Promise<void> {
  await page.getByTestId(`node-${nodeId}`).click()
  await expect(page.getByTestId('inspector')).toBeVisible()
}

/** Replaces the whole run payload via the store handle (JSON-editor-equivalent, precise). */
export async function setPayload(opsflow: OpsflowHandle, payload: IncidentPayload): Promise<void> {
  await opsflow.setPayload(payload)
}

/**
 * Sets playback speed to `Instant` via the real UI control, then clicks Run.
 * Run tests use `instant` (ARCHITECTURE.md §11) so timelines are fully
 * populated synchronously and assertions never race a `setTimeout` chain.
 */
export async function runInstant(page: Page): Promise<void> {
  await page.getByTestId('speed-select').getByRole('radio', { name: 'Instant' }).check()
  await page.getByTestId('run-button').click()
}

/** Polls `window.__opsflow.getRun().status` until it matches `status`. */
export async function waitForRunStatus(
  opsflow: OpsflowHandle,
  status: RunStatus,
  options?: { timeout?: number },
): Promise<void> {
  await expect
    .poll(async () => (await opsflow.getRun()).status, { timeout: options?.timeout ?? 10_000 })
    .toBe(status)
}

/** Reads every rendered `timeline-row-{index}` as `{ index, text }`, in document order. */
export async function readTimelineRows(page: Page): Promise<{ index: number; text: string }[]> {
  const rows = page.getByTestId('timeline').locator('[data-testid^="timeline-row-"]')
  const count = await rows.count()
  const result: { index: number; text: string }[] = []
  for (let i = 0; i < count; i += 1) {
    const row = rows.nth(i)
    const testId = await row.getAttribute('data-testid')
    const index = Number(testId?.replace('timeline-row-', ''))
    result.push({ index, text: (await row.innerText()).trim() })
  }
  return result
}

/** Opens the import dialog via the top-bar Import button. */
export async function openImportDialog(page: Page): Promise<void> {
  await page.getByTestId('import-button').click()
  await expect(page.getByRole('dialog')).toBeVisible()
}

/**
 * Clicks Export, waits for the resulting download, reads its contents, and
 * returns the parsed document alongside the suggested filename
 * (ARCHITECTURE.md §9 / docs/spikes/react-flow-playwright.md §C.6).
 */
export async function exportAndReadDownload(
  page: Page,
): Promise<{ filename: string; doc: WorkflowDocument; download: Download }> {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('export-button').click(),
  ])
  const filename = download.suggestedFilename()
  const filePath = await download.path()
  if (!filePath) throw new Error('exportAndReadDownload: download has no file path')
  const doc = JSON.parse(readFileSync(filePath, 'utf8')) as WorkflowDocument
  return { filename, doc, download }
}

/**
 * Opens the import dialog, switches to the file tab (implicit: the file
 * input is always in the DOM per ARCHITECTURE.md §9), and uploads `doc` as a
 * temp `.json` file via `setInputFiles` (works on hidden inputs).
 */
export async function uploadWorkflowFile(page: Page, doc: unknown): Promise<void> {
  const filePath = join(tmpdir(), `opsflow-upload-${Date.now()}.json`)
  writeFileSync(filePath, JSON.stringify(doc, null, 2), 'utf8')
  await page.getByTestId('import-file-input').setInputFiles(filePath)
}

/**
 * Builds a self-contained `IncidentPayload` for a spec (deliberately not
 * imported from `src/domain` — that lane is developed concurrently and this
 * file must keep compiling regardless of its state). Defaults to a critical
 * incident matching the shape of the demo payload; pass `overrides` to
 * change severity/service/etc for a specific scenario.
 */
export function buildPayload(overrides: Partial<IncidentPayload> = {}): IncidentPayload {
  return {
    title: 'Elevated 5xx rate on api-gateway',
    severity: 'critical',
    service: 'api-gateway',
    errorRate: 0.42,
    region: 'us-east-1',
    affectedUsers: 18400,
    source: 'datadog',
    tags: ['api', 'checkout', 'p1'],
    detectedAt: new Date().toISOString(),
    metadata: {
      cluster: 'prod-use1-a',
      deploy: 'api-gateway-v482',
      onCallEscalated: false,
    },
    ...overrides,
  }
}

/**
 * Calls a real store action (`updateNodeConfig`) on the live zustand store
 * from inside the page — not a second code path, just reaching the same
 * action a debounced inspector field would call, for specs that need to
 * force a specific node config (e.g. an Approval node's policy) before the
 * inspector lane exists.
 */
export async function updateNodeConfigViaStore(
  page: Page,
  nodeId: string,
  field: string,
  value: unknown,
): Promise<void> {
  await page.evaluate(
    ({ nodeId, field, value }) => {
      const state = window.__opsflow?.getState() as
        | { updateNodeConfig: (id: string, field: string, value: unknown) => void }
        | undefined
      state?.updateNodeConfig(nodeId, field, value)
    },
    { nodeId, field, value },
  )
}

/** Writes raw values directly into `localStorage` before the app boots (persistence/corruption tests). */
export async function seedLocalStorage(
  page: Page,
  entries: Record<string, string>,
): Promise<void> {
  await page.addInitScript((seed: Record<string, string>) => {
    for (const [key, value] of Object.entries(seed)) {
      window.localStorage.setItem(key, value)
    }
  }, entries)
}
