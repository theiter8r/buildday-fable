/**
 * Playwright `test` extended with an `opsflow` fixture: navigates to
 * `/?e2e=1` (already baked into `baseURL` by `playwright.config.ts`, but the
 * explicit query string is repeated here so the fixture also works if a spec
 * overrides `baseURL` per-project), waits for the canvas testid, and exposes
 * typed helpers over `window.__opsflow` via `page.evaluate` (ARCHITECTURE.md
 * §11, `docs/testing-conventions.md`).
 *
 * The test handle is not a second code path: every method on
 * `window.__opsflow` calls the exact store action the UI calls, so using it
 * to seed state can never mask a broken button.
 */
import { test as base, expect, type Page } from '@playwright/test'
import type {
  ExecutionEvent,
  IncidentPayload,
  RunStatus,
  WorkflowDocument,
} from '@/domain/types'

/** Thrown when a spec calls a handle method before `window.__opsflow` exists. */
export class TestHandleMissingError extends Error {
  constructor() {
    super(
      'window.__opsflow is not installed. Make sure the app was loaded with ?e2e=1 ' +
        'and that src/store/testHandle.ts has been wired in (see docs/testing-conventions.md).',
    )
    this.name = 'TestHandleMissingError'
  }
}

/** Waits for `window.__opsflow` to be installed (per the `?e2e=1` boot flag). */
async function waitForHandle(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__opsflow !== undefined)
}

/** Typed wrapper around `window.__opsflow`, evaluated in-page on every call. */
export interface OpsflowHandle {
  getDocument(): Promise<WorkflowDocument>
  getRun(): Promise<{ status: RunStatus; events: ExecutionEvent[] }>
  connect(source: string, target: string, sourceHandle?: 'true' | 'false' | null): Promise<boolean>
  setPayload(payload: IncidentPayload): Promise<void>
  reset(): Promise<void>
  clearStorage(): Promise<void>
  undo(): Promise<void>
  redo(): Promise<void>
}

function buildHandle(page: Page): OpsflowHandle {
  return {
    getDocument: async () => {
      await waitForHandle(page)
      return page.evaluate(() => window.__opsflow!.getDocument())
    },
    getRun: async () => {
      await waitForHandle(page)
      return page.evaluate(() => window.__opsflow!.getRun())
    },
    connect: async (source, target, sourceHandle = null) => {
      await waitForHandle(page)
      return page.evaluate(
        ({ source, target, sourceHandle }) => window.__opsflow!.connect(source, target, sourceHandle),
        { source, target, sourceHandle },
      )
    },
    setPayload: async (payload) => {
      await waitForHandle(page)
      return page.evaluate((payload) => window.__opsflow!.setPayload(payload), payload)
    },
    reset: async () => {
      await waitForHandle(page)
      return page.evaluate(() => window.__opsflow!.reset())
    },
    clearStorage: async () => {
      await waitForHandle(page)
      return page.evaluate(() => window.__opsflow!.clearStorage())
    },
    undo: async () => {
      await waitForHandle(page)
      return page.evaluate(() => window.__opsflow!.undo())
    },
    redo: async () => {
      await waitForHandle(page)
      return page.evaluate(() => window.__opsflow!.redo())
    },
  }
}

interface OpsflowFixtures {
  /** Typed helpers over `window.__opsflow`. */
  opsflow: OpsflowHandle
}

/**
 * Navigates to `/?e2e=1` and waits for `[data-testid="canvas"]` to be
 * attached before handing control to the test. Every spec should use this
 * fixture's `page` (not a fresh `page.goto('/')`) so the test handle is
 * guaranteed to be installed before assertions run.
 */
// `use` here is Playwright's fixture-teardown callback, not a React Hook —
// `eslint-plugin-react-hooks` pattern-matches on the identifier name alone
// and has no way to tell the two apart, so its rule is disabled for this
// Playwright-fixtures file specifically.
/* eslint-disable react-hooks/rules-of-hooks */
export const test = base.extend<OpsflowFixtures>({
  page: async ({ page }, use) => {
    await page.goto('/?e2e=1')
    await expect(page.getByTestId('canvas')).toBeAttached({ timeout: 30_000 })
    await use(page)
  },
  opsflow: async ({ page }, use) => {
    await use(buildHandle(page))
  },
})
/* eslint-enable react-hooks/rules-of-hooks */

export { expect }
